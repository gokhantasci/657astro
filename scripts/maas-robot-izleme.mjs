// Ozkansoft (mahep.php ve alt robotlar) ile Memurlar.net maaş robotu güncellemelerini haftalık izler;
// ayda en az 1 kez (--aylik) tüm kadrolu ve 4/B sözleşmeli ünvanları 657.com.tr ile kıyaslayıp eksik ünvanları raporlar.
// Kullanım: node scripts/maas-robot-izleme.mjs [--aylik]
import { readFile, writeFile } from 'node:fs/promises';

const HEDEF = new URL('../src/data/maas-robot-izleme.json', import.meta.url);
const KADROLU_DOSYA = new URL('../src/data/memur-maas-secenekler.json', import.meta.url);
const SOZLESMELI_DOSYA = new URL('../src/data/sozlesmeli-unvanlar.json', import.meta.url);

const AYLIK = process.argv.includes('--aylik');

const OZKANSOFT_ROBOTLAR = [
  { kod: 'MAHEP', ad: 'Memur ve Öğretmen Maaş Hesaplama', url: 'https://www.ozkansoft.com/mahep.php', bizde: '/memur-maas-hesaplama/', bizdeAd: 'Kadrolu memur maaşı' },
  { kod: '4B MAHEP', ad: '4/B Sözleşmeli Maaş Hesaplama', url: 'https://www.ozkansoft.com/4bmahep.php', bizde: '/sozlesmeli-memur-maas-hesaplama/', bizdeAd: 'Sözleşmeli memur maaşı' },
  { kod: 'EMIHEP', ad: 'Emekli Maaşı ve İkramiyesi Hesaplama', url: 'https://www.ozkansoft.com/emihep.php', bizde: '/emekli-memur-maas-hesaplama/', bizdeAd: 'Emekli memur maaşı' },
  { kod: 'YOHEP', ad: 'Yolluk Hesaplama', url: 'https://www.ozkansoft.com/yohep.php', bizde: '/gecici-gorev-yollugu-hesaplama/', bizdeAd: 'Geçici / Sürekli görev yolluğu' },
  { kod: 'ENOHEP', ad: 'Enflasyon Oranı Hesaplama', url: 'https://www.ozkansoft.com/enohep.php', bizde: '/enflasyon-farki-hesaplama-robotu/', bizdeAd: 'Enflasyon farkı robotu' },
  { kod: 'EDUHEP', ad: 'Ek Ders Ücreti Hesaplama', url: 'https://www.ozkansoft.com/eduhep.php', bizde: null, bizdeAd: null },
  { kod: 'UTEDESHEP', ad: 'Ücretten Toplam Ek Ders Saati Hesaplama', url: 'https://www.ozkansoft.com/utedeshep.php', bizde: null, bizdeAd: null },
  { kod: '4D MAHEP', ad: '4/D Kamu İşçisi Maaş Hesaplama', url: 'https://www.ozkansoft.com/4dmahep.php', bizde: null, bizdeAd: null },
  { kod: 'ILKSAN EYHEP', ad: 'İLKSAN Emekli Yardımı Hesaplama', url: 'https://www.ozkansoft.com/ilksaneyhep.php', bizde: null, bizdeAd: null },
  { kod: '4C MAHEP', ad: '4/C Maaş Hesaplama (Tarihsel)', url: 'https://www.ozkansoft.com/4cmahep.php', bizde: null, bizdeAd: null },
];

const MEMURLAR_ARAMA_URL =
  'https://www.memurlar.net/arama/?SearchText=maa%FE+robotu&SearchLocation=title&IsHeadline=&NewsCategories=&FirstDate=&LastDate=';

const VARLIK = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const coz = (s) =>
  s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, k) =>
    k[0] === '#'
      ? String.fromCodePoint(k[1].toLowerCase() === 'x' ? parseInt(k.slice(2), 16) : Number(k.slice(1)))
      : VARLIK[k.toLowerCase()] ?? m
  );

const norm = (s) =>
  coz(s || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/I/g, 'ı')
    .replace(/İ/g, 'i')
    .toLocaleLowerCase('tr-TR')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u')
    .replace(/[^a-z0-9çğıöşü]+/g, ' ')
    .trim();

async function getir(url, forceWin1254 = false) {
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const buf = new Uint8Array(await r.arrayBuffer());
  const head = new TextDecoder('ascii').decode(buf.slice(0, 1500)).toLowerCase();
  const enc = forceWin1254 || head.includes('1254') || head.includes('iso-8859-9') ? 'windows-1254' : 'utf-8';
  return new TextDecoder(enc, { fatal: false }).decode(buf);
}

function selectSecenekleri(html) {
  const selects = [...html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)];
  const gruplar = selects.map((m) => {
    const attrs = m[1];
    const nameMatch = attrs.match(/(?:name|id)=["']?([^"'\s>]+)/i);
    const opts = [...m[2].matchAll(/<option\b[^>]*>([\s\S]*?)<\/option>/gi)]
      .map((o) => coz(o[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim())
      .filter((t) => t && !/^seçiniz|lütfen/i.test(t));
    return { ad: nameMatch?.[1] ?? '', secenekler: opts };
  });
  return gruplar;
}

function enBuyukUnvanListesi(html) {
  const gruplar = selectSecenekleri(html);
  // Önce adında unvan/kadro/pozisyon geçen select varsa onu seç; yoksa sayısal/kesinti/dönem olmayan en büyük select
  const adEslesen = gruplar.find((g) => /unvan|kadro|pozisyon|meslek/i.test(g.ad) && g.secenekler.length >= 15);
  if (adEslesen) return adEslesen.secenekler;
  const adaylar = gruplar
    .filter((g) => g.secenekler.length >= 15)
    .filter(
      (g) =>
        !g.secenekler
          .slice(0, 5)
          .some((s) => /^\d+$/.test(s) || /^20\d{2}/.test(s) || /kesinti oranı|%|saat/i.test(s))
    );
  adaylar.sort((a, b) => b.secenekler.length - a.secenekler.length);
  return adaylar[0]?.secenekler ?? [];
}

function surumVeDonem(html) {
  const clean = coz(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/gi, ' '))
    .replace(/\s+/g, ' ')
    .trim();
  const surum = clean.match(/\bv\d+\.\d+[a-z0-9.-]*/i)?.[0] ?? null;
  const donemler = [...new Set(clean.match(/202[4-9]\s+(?:Ocak-Haziran|Temmuz-Aralık)(?:\s*\([^)]+\))?/gi) ?? [])].slice(0, 4);
  const tarihler = [...new Set(clean.match(/\b\d{2}\/\d{2}\/202\d\b/g) ?? [])];
  return { surum, sonDonem: donemler[0] ?? null, donemler, sonDuyuruTarihi: tarihler[0] ?? null };
}

function unvanKiyasla(bizimListe, disListe) {
  const bizimNorm = new Set(bizimListe.map(norm));
  const bizimTokenlar = bizimListe.map((u) => new Set(norm(u).split(' ').filter((w) => w.length > 2)));

  const eksik = [];
  let eslesen = 0;
  for (const dis of disListe) {
    const n = norm(dis);
    if (!n || n.length < 3) continue;
    if (bizimNorm.has(n)) {
      eslesen++;
      continue;
    }
    // Kısmi / kök eşleşmesi (ör: "Zabıt Katibi (Adliye)" vs "Zabıt Katibi")
    const disTok = n.split(' ').filter((w) => w.length > 2);
    const varMi =
      disTok.length > 0 &&
      bizimTokenlar.some((bt) => disTok.every((t) => bt.has(t)) || [...bt].every((t) => disTok.includes(t)));
    if (varMi) {
      eslesen++;
    } else {
      eksik.push(dis);
    }
  }
  return {
    bizdeToplam: bizimListe.length,
    kaynakToplam: disListe.length,
    eslesen,
    eksikSayisi: eksik.length,
    eksikUnvanlar: [...new Set(eksik)],
  };
}

async function main() {
  let onceki = null;
  try {
    onceki = JSON.parse(await readFile(HEDEF, 'utf8'));
  } catch {
    /* ilk çalıştırma */
  }

  const simdi = new Date().toISOString();
  const robotSonuclari = [];
  let mahepHtml = '';
  let soz4bHtml = '';

  for (const rob of OZKANSOFT_ROBOTLAR) {
    try {
      const html = await getir(rob.url);
      if (rob.kod === 'MAHEP') mahepHtml = html;
      if (rob.kod === '4B MAHEP') soz4bHtml = html;
      const meta = surumVeDonem(html);
      robotSonuclari.push({
        ...rob,
        erisim: true,
        durum: rob.bizde ? 'entegrasyon-var' : 'planlanabilir',
        ...meta,
      });
    } catch (e) {
      robotSonuclari.push({
        ...rob,
        erisim: false,
        hata: String(e.message || e),
        durum: rob.bizde ? 'entegrasyon-var' : 'planlanabilir',
      });
    }
  }

  // Memurlar.net Maaş Robotu haberleri
  let memurlarHaberler = onceki?.memurlarHaberler ?? [];
  let memurlarErisim = false;
  try {
    const mh = await getir(MEMURLAR_ARAMA_URL, true);
    const bulunan = [];
    const gorulen = new Set();
    for (const m of mh.matchAll(/<a[^>]+href=["']([^"']*\/haber\/\d+\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
      const href = m[1].startsWith('//') ? 'https:' + m[1] : m[1].startsWith('/') ? 'https://www.memurlar.net' + m[1] : m[1];
      const text = coz(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
      if (!text || gorulen.has(href)) continue;
      if (!/maaş|maas|robot|katsayı|bordro/i.test(text)) continue;
      if (/insansı robot/i.test(text)) continue;
      gorulen.add(href);
      const dm = text.match(/(\d{2}\/\d{2}\/\d{4})/);
      const tarih = dm ? dm[1].split('/').reverse().join('-') : null;
      const baslik = text.replace(/^\d{2}\/\d{2}\/\d{4}\s*[-–]\s*/, '').trim();
      bulunan.push({ tarih, baslik, url: href });
    }
    if (bulunan.length) {
      memurlarHaberler = bulunan.slice(0, 20);
      memurlarErisim = true;
    }
  } catch {
    /* önceki kayıt korunur */
  }

  // Aylık ünvan kıyaslaması (--aylik verildiyse, hiç yapılmadıysa veya son kıyaslamadan >= 28 gün geçtiyse)
  const sonAylikMs = Date.parse(onceki?.sonUnvanKiyaslamaTarihi ?? '') || 0;
  const aylikGerekli = AYLIK || !onceki?.unvanKiyaslama || Date.now() - sonAylikMs >= 28 * 86400000;

  let unvanKiyaslama = onceki?.unvanKiyaslama ?? null;
  let sonUnvanKiyaslamaTarihi = onceki?.sonUnvanKiyaslamaTarihi ?? null;

  if (aylikGerekli && (mahepHtml || soz4bHtml)) {
    const kadroluJson = JSON.parse(await readFile(KADROLU_DOSYA, 'utf8'));
    const sozJson = JSON.parse(await readFile(SOZLESMELI_DOSYA, 'utf8'));

    const bizimKadrolu = (kadroluJson.unvanlar ?? []).map((u) => (typeof u === 'string' ? u : u.ad || u.baslik || '')).filter(Boolean);
    const bizimSoz = (sozJson.unvanlar ?? []).map((u) => u.ad || '').filter(Boolean);

    const ozkKadrolu = mahepHtml ? enBuyukUnvanListesi(mahepHtml) : [];
    const ozkSoz = soz4bHtml ? enBuyukUnvanListesi(soz4bHtml) : [];

    unvanKiyaslama = {
      kadrolu: unvanKiyasla(bizimKadrolu, ozkKadrolu),
      sozlesmeli4b: unvanKiyasla(bizimSoz, ozkSoz),
    };
    sonUnvanKiyaslamaTarihi = simdi;
  }

  const rapor = {
    sonKontrolTarihi: simdi,
    sonUnvanKiyaslamaTarihi,
    periyot: {
      haftalik: 'Her Pazartesi 09:00 (Europe/Istanbul)',
      aylikUnvanKiyaslama: 'Her ayın 1. günü 09:30 (Europe/Istanbul)',
    },
    ozkansoftRobotlar: robotSonuclari,
    memurlarErisim,
    memurlarHaberler,
    unvanKiyaslama,
  };

  await writeFile(HEDEF, JSON.stringify(rapor, null, 2) + '\n', 'utf8');
  console.log(`Ozkansoft: ${robotSonuclari.filter((r) => r.erisim).length}/${robotSonuclari.length} robot okundu.`);
  console.log(`Memurlar.net: ${memurlarHaberler.length} maaş robotu haberi.`);
  if (unvanKiyaslama) {
    console.log(
      `Kadrolu ünvanlar: 657=${unvanKiyaslama.kadrolu.bizdeToplam}, Ozkansoft=${unvanKiyaslama.kadrolu.kaynakToplam}, eşleşen=${unvanKiyaslama.kadrolu.eslesen}, eksik=${unvanKiyaslama.kadrolu.eksikSayisi}`
    );
    console.log(
      `4/B Sözleşmeli: 657=${unvanKiyaslama.sozlesmeli4b.bizdeToplam}, Ozkansoft=${unvanKiyaslama.sozlesmeli4b.kaynakToplam}, eşleşen=${unvanKiyaslama.sozlesmeli4b.eslesen}, eksik=${unvanKiyaslama.sozlesmeli4b.eksikSayisi}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
