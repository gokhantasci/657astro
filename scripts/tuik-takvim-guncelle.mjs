// Her gün bir kez çalışır: TÜİK Ulusal Veri Yayımlama Takvimi'nden bir sonraki
// Tüketici Fiyat Endeksi (TÜFE) açıklanma tarihini kontrol eder, src/data/tuik-takvim.json
// ve src/data/sayaclar.json dosyalarındaki geri sayımı günceller.
import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const TUIK_KAYNAK = 'https://www.tuik.gov.tr/Kurumsal/Veri_Takvimi';
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

// Türkiye sabit resmî tatilleri (MM-DD)
const SABIT_TATILLER = new Set(['01-01', '04-23', '05-01', '05-19', '07-15', '08-30', '10-29']);

function istanbulSimdi() {
  const f = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const s = f.format(new Date()); // "YYYY-MM-DD HH:MM"
  return { tarih: s.slice(0, 10), iso: s.replace(' ', 'T') };
}

function ilkIsGunu(yil, ay, gun = 3) {
  let d = new Date(Date.UTC(yil, ay - 1, gun));
  while (true) {
    const wd = d.getUTCDay(); // 0=Paz, 6=Cmt
    const mmdd = `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    if (wd !== 0 && wd !== 6 && !SABIT_TATILLER.has(mmdd)) break;
    d = new Date(d.getTime() + 86400000);
  }
  return d.toISOString().slice(0, 10);
}

function donemAdi(aciklamaYil, aciklamaAy) {
  // Örneğin Aralık 2026'da açıklanan veri "Kasım 2026", Ocak 2027'de açıklanan "Aralık 2026" verisidir.
  const veriAy = aciklamaAy === 1 ? 12 : aciklamaAy - 1;
  const veriYil = aciklamaAy === 1 ? aciklamaYil - 1 : aciklamaYil;
  return `${AYLAR[veriAy - 1]} ${veriYil}`;
}

async function tuikCanliTarihler(yil) {
  const bulunan = new Map(); // "YYYY-MM" -> "YYYY-MM-DD"
  const urls = [
    `https://data.tuik.gov.tr/Takvim/GetTakvimData?year=${yil}`,
    `https://www.tuik.gov.tr/Kurumsal/Veri_Takvimi`,
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': '657.com.tr-takvim-kontrol/1.0 (+https://657.com.tr)' },
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) continue;
      const text = await r.text();
      if (!/Tüketici Fiyat Endeksi|TÜFE/i.test(text)) continue;
      for (const m of text.matchAll(/Tüketici Fiyat Endeksi[\s\S]{0,240}?(\d{2})\.(\d{2})\.(\d{4})/gi)) {
        const iso = `${m[3]}-${m[2]}-${m[1]}`;
        bulunan.set(`${m[3]}-${m[2]}`, iso);
      }
      for (const m of text.matchAll(/(\d{4}-\d{2}-\d{2})[\s\S]{0,240}?Tüketici Fiyat Endeksi/gi)) {
        const iso = m[1];
        bulunan.set(iso.slice(0, 7), iso);
      }
    } catch {
      /* Ağ erişilemezse resmî takvim kuralı devreye girer */
    }
  }
  return bulunan;
}

const simdi = istanbulSimdi();
const bugunYil = Number(simdi.tarih.slice(0, 4));
const bugunAy = Number(simdi.tarih.slice(5, 7));

const canli = new Map([
  ...(await tuikCanliTarihler(bugunYil)),
  ...(await tuikCanliTarihler(bugunYil + 1)),
]);

// Bugünden sonraki en yakın 3 TÜİK TÜFE açıklama tarihini üret
const yaklasan = [];
let y = bugunYil;
let a = bugunAy;
for (let i = 0; i < 6 && yaklasan.length < 3; i++) {
  const anahtar = `${y}-${String(a).padStart(2, '0')}`;
  const gunIso = canli.get(anahtar) ?? ilkIsGunu(y, a, 3);
  const tamIso = `${gunIso}T10:00`;
  if (tamIso > simdi.iso) {
    const donem = donemAdi(y, a);
    yaklasan.push({
      donem,
      baslik: `TÜİK ${donem} Enflasyon (TÜFE) Açıklaması`,
      tarih: tamIso,
      kaynakTuru: canli.has(anahtar) ? 'tuik-canli' : 'tuik-resmi-kural',
    });
  }
  a++;
  if (a > 12) {
    a = 1;
    y++;
  }
}

const siradaki = yaklasan[0];
if (!siradaki) throw new Error('Bir sonraki TÜİK TÜFE tarihi hesaplanamadı.');

const takvimVeri = {
  kontrolTarihi: simdi.tarih,
  kaynak: TUIK_KAYNAK,
  siradaki,
  yaklasan,
};
await writeFile(new URL('src/data/tuik-takvim.json', root), JSON.stringify(takvimVeri, null, 1) + '\n', 'utf8');

// src/data/sayaclar.json içindeki TÜİK TÜFE geri sayımını güncelle (diğer sayaçları koru)
const sayaclarUrl = new URL('src/data/sayaclar.json', root);
const sayaclarVeri = JSON.parse(await readFile(sayaclarUrl, 'utf8'));
const digerSayaclar = (sayaclarVeri.sayaclar || []).filter(
  (s) => !/^TÜİK .+ Enflasyon \(TÜFE\) Açıklaması$/.test(s.baslik),
);

const yeniTuikSayac = {
  baslik: siradaki.baslik,
  tarih: siradaki.tarih,
  etkin: true,
  kaynak: TUIK_KAYNAK,
  kaynakTarihi: simdi.tarih,
};

sayaclarVeri.sayaclar = [yeniTuikSayac, ...digerSayaclar];
await writeFile(sayaclarUrl, JSON.stringify(sayaclarVeri, null, 1) + '\n', 'utf8');

console.log(`TÜİK TÜFE takvimi güncellendi: ${siradaki.baslik} -> ${siradaki.tarih} (${siradaki.kaynakTuru})`);
