// Kurum haberlerini (Bakanlık, HSK, PGM, CTE, İİDB, EDB, Bilirkişilik) çekip src/data/haberler.json'a yazar.
// Canlıdaki teftis_get_ministry_news_sources() ve ayrıştırıcılarının Node karşılığıdır. Canlıda PGM ve Bilirkişilik
// 'ab' ayrıştırıcısıyla okunuyordu ve sonuç vermiyordu; iki sayfa da tablo yapısında olduğu için burada tabloyla okunur.
// GitHub Actions'ta zamanlanmış çalışır (.github/workflows/yayin.yml); elle: node scripts/haberler.mjs
// Bir kaynak hata verirse o kaynağın önceki haberleri korunur; hiçbir kaynak okunamazsa dosya değişmez.
import { readFile, writeFile } from 'node:fs/promises';
import { parse, ELEMENT_NODE, TEXT_NODE } from 'ultrahtml';
import { querySelectorAll, querySelector } from 'ultrahtml/selector';

const HEDEF = new URL('../src/data/haberler.json', import.meta.url);
const KAYNAK_BASINA = 10;

export const KAYNAKLAR = [
  { ad: 'Bakanlık', url: 'https://adalet.gov.tr/arsiv?type=1&text=', ayristirici: 'ab' },
  { ad: 'Bakanlık', url: 'https://adalet.gov.tr/arsiv?type=2&text=', ayristirici: 'ab' },
  { ad: 'HSK', url: 'https://hsk.gov.tr/Arsiv/tumu', ayristirici: 'hsk' },
  { ad: 'PGM', url: 'https://pgm.adalet.gov.tr/Home/TumHaberler/1', ayristirici: 'tablo' },
  { ad: 'CTE', url: 'https://cte.adalet.gov.tr/Home/TumHaberler/1', ayristirici: 'tablo' },
  { ad: 'İİDB', url: 'https://iidb.adalet.gov.tr/Home/TumHaberler/1', ayristirici: 'tablo' },
  { ad: 'EDB', url: 'https://edb.adalet.gov.tr/TumHaberler/1', ayristirici: 'tablo' },
  { ad: 'Bilirkişilik', url: 'https://bilirkisilik.adalet.gov.tr/Home/TumHaberler/1', ayristirici: 'tablo' },
];

const varlik = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const coz = s => s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, k) => k[0] === '#'
  ? String.fromCodePoint(k[1].toLowerCase() === 'x' ? parseInt(k.slice(2), 16) : Number(k.slice(1)))
  : varlik[k.toLowerCase()] ?? m);
const metin = n => {
  if (!n) return '';
  if (n.type === TEXT_NODE) return n.value;
  return (n.children ?? []).map(metin).join('');
};
const temiz = s => coz(metin(typeof s === 'string' ? { type: TEXT_NODE, value: s } : s)).replace(/\s+/g, ' ').trim();

// Tamamı büyük harfli başlıkları Türkçe kurala göre kelime başı büyük yazar; kısaltmalar korunur.
const KORU = new Set(['AB', 'ABD', 'AİHM', 'AYM', 'CTE', 'EDB', 'FETÖ', 'HSK', 'İİDB', 'PGM', 'TBMM', 'TCK', 'UYAP']);
const kucuk = s => s.replace(/I/g, 'ı').replace(/İ/g, 'i').toLocaleLowerCase('tr-TR');
const kelime = w => {
  if (!w || KORU.has(w)) return w;
  const ek = w.match(/^(.+?)(['’])(.+)$/u);
  if (ek) return kelime(ek[1]) + ek[2] + kucuk(ek[3]);
  const k = kucuk(w);
  return k.charAt(0).toLocaleUpperCase('tr-TR') + k.slice(1);
};
export const baslikDuzelt = t => /[a-zçğıöşü]/u.test(t) ? t : t.replace(/[^\s\-–—,:;.!?()[\]{}"“”]+/gu, kelime);

// "27.10.2026", "27/10/2026", "27-10-2026" → "2026-10-27"
export const tarihOku = s => {
  const m = temiz(s).match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (!m) return null;
  const [, g, a, y] = m;
  return `${y}-${a.padStart(2, '0')}-${g.padStart(2, '0')}`;
};
const mutlak = (href, taban) => { try { return new URL(coz(href), taban).href; } catch { return ''; } };
const sinif = (n, c) => ` ${n.attributes?.class ?? ''} `.replace(/\s+/g, ' ').includes(` ${c} `);

function kayit(baslik, href, tarih, kaynak) {
  const title = baslikDuzelt(temiz(baslik));
  const url = mutlak(href ?? '', kaynak.url);
  const date = tarihOku(tarih ?? '');
  return title && url && date ? { source: kaynak.ad, date, title, url } : null;
}

// HSK sayfası küçültülmüştür (class=arsivlist gibi tırnaksız öznitelikler); ultrahtml bunları okumaz, önce tırnaklanır.
const tirnakla = html => html.replace(/<[a-z][^>]*>/gi, tag => tag.replace(/(\s[\w:-]+)=([^\s"'>]+)/g, '$1="$2"'));

export function ayristir(html, kaynak) {
  const doc = parse(tirnakla(html));
  const out = [];
  if (kaynak.ayristirici === 'ab') {
    for (const a of querySelectorAll(doc, 'a.ab-announcement')) {
      const b = querySelectorAll(a, 'h3, h4, h5').find(h => sinif(h, 'text-primary') || sinif(h, 'fw-bold'));
      out.push(kayit(b ?? '', a.attributes.href, querySelector(a, '.ab-announcement--time') ?? '', kaynak));
    }
  } else if (kaynak.ayristirici === 'hsk') {
    for (const a of querySelectorAll(doc, 'div.arsivlist > a')) {
      out.push(kayit(querySelector(a, 'div.baslik') ?? '', a.attributes.href, querySelector(a, 'span') ?? '', kaynak));
    }
  } else {
    for (const tr of querySelectorAll(doc, 'tr')) {
      const hucreler = (tr.children ?? []).filter(c => c.type === ELEMENT_NODE && c.name === 'td');
      const a = hucreler[0] && querySelectorAll(hucreler[0], 'a').find(x => (x.attributes.href ?? '').includes('SayfaDetay'));
      if (a) out.push(kayit(a, a.attributes.href, hucreler[1] ?? '', kaynak));
    }
  }
  return out.filter(Boolean).slice(0, KAYNAK_BASINA);
}

// HSK arşiv sayfası büyük ve yavaştır; her kaynak bir kez yeniden denenir.
async function getir(url, deneme = 2) {
  try {
    const r = await fetch(url, { headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': 'Mozilla/5.0 (compatible; 657.com.tr haber okuyucu; +https://657.com.tr/)' }, signal: AbortSignal.timeout(60000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } catch (e) {
    if (deneme > 1) return getir(url, deneme - 1);
    throw e;
  }
}

async function main() {
  const onceki = JSON.parse(await readFile(HEDEF, 'utf8'));
  const sonuc = new Map();
  let basarili = 0;
  for (const k of KAYNAKLAR) {
    try {
      const liste = ayristir(await getir(k.url), k);
      if (!liste.length) throw new Error('haber bulunamadı (sayfa yapısı değişmiş olabilir)');
      liste.forEach(h => sonuc.set(h.url, h));
      basarili++;
      console.log(`${k.ad.padEnd(12)} ${liste.length} haber  ${k.url}`);
    } catch (e) {
      // Okunamayan kaynağın önceki haberleri listede kalır.
      onceki.filter(h => h.source === k.ad && !sonuc.has(h.url)).forEach(h => sonuc.set(h.url, h));
      console.warn(`${k.ad.padEnd(12)} OKUNAMADI: ${e.message}`);
    }
  }
  if (!basarili) { console.error('Hiçbir kaynak okunamadı; haberler.json değiştirilmedi.'); process.exitCode = 1; return; }
  const liste = [...sonuc.values()].sort((a, b) => b.date.localeCompare(a.date) || a.source.localeCompare(b.source, 'tr'));
  await writeFile(HEDEF, JSON.stringify(liste, null, 1) + '\n');
  console.log(`${liste.length} haber yazıldı.`);
}

if (import.meta.url === new URL(process.argv[1], 'file:').href || process.argv[1]?.endsWith('haberler.mjs')) await main();
