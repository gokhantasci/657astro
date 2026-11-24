import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve('src/data');
const agac = JSON.parse(fs.readFileSync(path.join(dataDir, 'gys-agac.json'), 'utf8'));
const mufredat = JSON.parse(fs.readFileSync(path.join(dataDir, 'gys-mufredat.json'), 'utf8'));

const gecerliBolumler = new Set();
for (const k of mufredat.kanunlar) {
  for (const b of k.bolumler) gecerliBolumler.add(b.id);
}
function agactanBolumTopla(node) {
  if (Array.isArray(node.bolumler)) node.bolumler.forEach((b) => gecerliBolumler.add(b));
  if (Array.isArray(node.cocuklar)) node.cocuklar.forEach(agactanBolumTopla);
}
agactanBolumTopla(agac.kok);

const soruDosyalari = fs.readdirSync(dataDir).filter((f) => /^gys-sorular.*\.json$/.test(f)).sort();
const tumSorular = [];
const idSet = new Set();
const kokSet = new Set();
const hatalar = [];

const GECERLI_SEVIYE = new Set(['kolay', 'orta', 'zor', 'akademik', 'dip']);
const GECERLI_TUR = new Set(['madde', 'capraz-madde', 'vaka-yorum', 'genelge', 'cikmis-benzeri']);

for (const dosya of soruDosyalari) {
  const liste = JSON.parse(fs.readFileSync(path.join(dataDir, dosya), 'utf8'));
  if (!Array.isArray(liste)) {
    hatalar.push(`${dosya}: Kök yapı dizi değil.`);
    continue;
  }
  for (const [idx, s] of liste.entries()) {
    const yer = `${dosya}[${idx}] (${s?.id ?? 'isimsiz'})`;
    if (!s.id || typeof s.id !== 'string') hatalar.push(`${yer}: id eksik.`);
    else if (idSet.has(s.id)) hatalar.push(`${yer}: yinelenen id.`);
    else idSet.add(s.id);

    if (!s.bolum || !gecerliBolumler.has(s.bolum)) hatalar.push(`${yer}: geçersiz bölüm (${s.bolum}).`);
    if (!GECERLI_SEVIYE.has(s.seviye)) hatalar.push(`${yer}: geçersiz seviye (${s.seviye}).`);
    if (s.tur && !GECERLI_TUR.has(s.tur)) hatalar.push(`${yer}: geçersiz tür (${s.tur}).`);
    if (!s.soru || s.soru.trim().length < 20) hatalar.push(`${yer}: soru metni çok kısa.`);
    else {
      const norm = s.soru.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
      if (kokSet.has(norm)) hatalar.push(`${yer}: mükerrer soru metni.`);
      kokSet.add(norm);
    }
    if (!Array.isArray(s.dogru) || s.dogru.length < 1) hatalar.push(`${yer}: en az 1 doğru şık gerekli.`);
    if (!Array.isArray(s.yanlis) || s.yanlis.length < 4) hatalar.push(`${yer}: en az 4 yanlış şık gerekli.`);
    if (!s.kaynak || !s.aciklama) hatalar.push(`${yer}: kaynak veya açıklama eksik.`);
    tumSorular.push(s);
  }
}

const bolumSayac = new Map();
for (const s of tumSorular) bolumSayac.set(s.bolum, (bolumSayac.get(s.bolum) ?? 0) + 1);

function dugumBolumleri(node) {
  const set = new Set(node.bolumler ?? []);
  for (const c of node.cocuklar ?? []) for (const b of dugumBolumleri(c)) set.add(b);
  return set;
}
function yazdirAgac(node, derinlik = 0) {
  const bolumler = dugumBolumleri(node);
  let toplam = 0;
  for (const b of bolumler) toplam += bolumSayac.get(b) ?? 0;
  console.log(`${'  '.repeat(derinlik)}- ${node.ad}: ${toplam} soru`);
  for (const c of node.cocuklar ?? []) yazdirAgac(c, derinlik + 1);
}

console.log(`GYS Soru Doğrulama: ${soruDosyalari.length} dosya, ${tumSorular.length} tekil soru.`);
yazdirAgac(agac.kok);

if (hatalar.length) {
  console.error(`\n${hatalar.length} HATA BULUNDU:\n` + hatalar.join('\n'));
  process.exit(1);
}
console.log('\nDoğrulama başarılı: 0 hata.');
