// Yazı metninde anılan resmî kaynakları bağlantıya çevirir (SEO yol haritası P1-6, GEO kaynak ve atıf).
// Yalnız metnin kendisinin andığı kaynak bağlanır; konu tahminiyle kaynak uydurulmaz.
//  - "20/12/2025 tarih ve 33113 sayılı Resmî Gazete" → o günün Resmî Gazete sayısı (resmigazete.gov.tr günlük arşiv adresi).
//  - Metinde adı geçen kurumlar → kurumun resmî sitesi.
//  - Enflasyon kategorisi → TÜİK enflasyon ve fiyat istatistikleri (yazılar TÜİK bültenini aktarır).
export interface ResmiKaynak { ad: string; url: string }

const AYLAR = ['ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık'];
const RG_SAYISAL = /(\d{1,2})[./](\d{1,2})[./](\d{4})\s*(?:tarih|tarihli)\s*(?:ve\s*)?(\d{4,5})\s*sayılı\s*Res[mȋî]i?\s*Gazete/giu;
const RG_YAZILI = new RegExp(`(\\d{1,2})\\s+(${AYLAR.join('|')})\\s+(\\d{4})\\s*(?:tarih|tarihli)\\s*(?:ve\\s*)?(\\d{4,5})\\s*sayılı\\s*Res[mȋî]i?\\s*Gazete`, 'giu');
const KURUMLAR: [RegExp, ResmiKaynak][] = [
  [/Personel Genel Müdürlüğü/u, { ad: 'Adalet Bakanlığı Personel Genel Müdürlüğü', url: 'https://personel.adalet.gov.tr/' }],
  [/Hâkimler ve Savcılar Kurulu|Hakimler ve Savcılar Kurulu|\bHSK\b/u, { ad: 'Hâkimler ve Savcılar Kurulu', url: 'https://www.hsk.gov.tr/' }],
  [/Devlet Personel Başkanlığı|\bDPB\b/u, { ad: 'Cumhurbaşkanlığı Devlet Personel Başkanlığı', url: 'https://www.dpb.gov.tr/' }],
  [/Hazine ve Maliye Bakanlığı/u, { ad: 'Hazine ve Maliye Bakanlığı', url: 'https://www.hmb.gov.tr/' }],
  [/Sosyal Güvenlik Kurumu|\bSGK\b/u, { ad: 'Sosyal Güvenlik Kurumu', url: 'https://www.sgk.gov.tr/' }],
  [/Ölçme, Seçme ve Yerleştirme Merkezi|ÖSYM/u, { ad: 'ÖSYM', url: 'https://www.osym.gov.tr/' }],
  [/Anayasa Mahkemesi|\bAYM\b/u, { ad: 'Anayasa Mahkemesi', url: 'https://www.anayasa.gov.tr/' }],
  [/Yargıtay/u, { ad: 'Yargıtay', url: 'https://www.yargitay.gov.tr/' }],
  [/Danıştay/u, { ad: 'Danıştay', url: 'https://www.danistay.gov.tr/' }],
  [/Türkiye Büyük Millet Meclisi|\bTBMM\b/u, { ad: 'Türkiye Büyük Millet Meclisi', url: 'https://www.tbmm.gov.tr/' }],
  [/\bPTT\b/u, { ad: 'PTT', url: 'https://www.ptt.gov.tr/' }],
  [/Arabuluculuk Daire Başkanlığı/u, { ad: 'Adalet Bakanlığı Arabuluculuk Daire Başkanlığı', url: 'https://adb.adalet.gov.tr/' }],
  [/Adalet Bakanlığı/u, { ad: 'Adalet Bakanlığı', url: 'https://www.adalet.gov.tr/' }],
];
const TUIK: ResmiKaynak = { ad: 'TÜİK enflasyon ve fiyat istatistikleri', url: 'https://data.tuik.gov.tr/Kategori/GetKategori?p=enflasyon-ve-fiyat-106' };

const iki = (n: number) => String(n).padStart(2, '0');
function rgKaynagi(g: number, a: number, y: number, sayi: string): ResmiKaynak | null {
  const t = new Date(Date.UTC(y, a - 1, g));
  if (y < 1990 || t.getUTCMonth() !== a - 1 || t.getUTCDate() !== g) return null;
  return { ad: `${iki(g)}.${iki(a)}.${y} tarihli ve ${sayi} sayılı Resmî Gazete`, url: `https://www.resmigazete.gov.tr/eskiler/${y}/${iki(a)}/${y}${iki(a)}${iki(g)}.htm` };
}

const OFFICIAL = /\.gov\.tr|resmigazete/i;

/** Metinde zaten resmî bağlantı varsa boş döner; aynı adres bir kez listelenir. */
export function resmiKaynaklar(govde: string, kategoriler: string[]): ResmiKaynak[] {
  const linkler = [...govde.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(m => m[1]);
  if (linkler.some(u => OFFICIAL.test(u))) return [];
  const metin = govde.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
  const out: ResmiKaynak[] = [];
  for (const m of metin.matchAll(RG_SAYISAL)) { const k = rgKaynagi(+m[1], +m[2], +m[3], m[4]); if (k) out.push(k); }
  for (const m of metin.matchAll(RG_YAZILI)) { const k = rgKaynagi(+m[1], AYLAR.indexOf(m[2].toLocaleLowerCase('tr-TR')) + 1, +m[3], m[4]); if (k) out.push(k); }
  for (const [re, k] of KURUMLAR) if (re.test(metin)) out.push(k);
  if (kategoriler.some(k => /enflasyon/i.test(k))) out.push(TUIK);
  return [...new Map(out.map(k => [k.url, k])).values()].slice(0, 4);
}
