// gys.657.com.tr statik sayfaları (konu, soru, sınav dizinleri ve site haritası) için derleme anı yardımcıları.
// Büyük JSON'ları içe aktardığı için tarayıcı betiklerinden çağrılmaz.
import agacVeri from '../data/gys-agac.json';
import konularVeri from '../data/gys-konular.json';
import mufredat from '../data/gys-mufredat.json';
import sorularTemel from '../data/gys-sorular.json';
import sorularIcra from '../data/gys-sorular-icra.json';
import sorularGenelge from '../data/gys-sorular-genelgeler.json';
import {
  dugumBolumleri,
  dugumSorulari,
  dugumYolu,
  soruyuHazirla,
  type GysAgacDugum,
  type GysSoru,
  type HazirSoru,
} from './gys-motor';

export const GYS_KOK = 'https://gys.657.com.tr';
export const GYS_MARKA = 'GYS Sınav Platformu';

export interface GysKonuKaydi {
  no: string;
  id: string;
  grup: 'ortak' | 'alan';
  ad: string;
  kisa: string;
  kanun: string;
  bolumler: string[];
  mevzuatUrl: string;
}

export interface KanunKaydi {
  id: string;
  ad: string;
  kisa: string;
  kaynak: string;
  bolumler?: { id: string; ad: string }[];
}

export const gysKok = (agacVeri as { kok: GysAgacDugum }).kok;
export const gysKonular = konularVeri as GysKonuKaydi[];
export const gysKanunlar = (mufredat as { kanunlar: KanunKaydi[] }).kanunlar;
export const gysSorular = [...sorularTemel, ...sorularIcra, ...sorularGenelge] as GysSoru[];

/** Üst menü: her GYS sayfası aynı listeyi kullanır. */
export const gysNav = [
  { href: '/', label: 'Çalış' },
  { href: '/sinavlar/', label: 'Sınavlar' },
  { href: '/konular/', label: 'Konular' },
  { href: '/sorular/', label: 'Soru bankası' },
  { href: '/mulakat/', label: 'Mülakat' },
  { href: '/canli-sinav/', label: 'Canlı sınav' },
  { href: '/ilanlar/', label: 'İlanlar ve mevzuat' },
];

export const gysUrl = (yol: string) => `${GYS_KOK}${yol}`;
export const konuYolu = (id: string) => `/konu/${id}/`;
export const soruYolu = (id: string) => `/soru/${id}/`;
export const sinavYolu = (id: string) => `/sinav/${id}/`;

const kanunHaritasi = new Map(gysKanunlar.map((k) => [k.id, k]));
const bolumHaritasi = new Map(gysKanunlar.flatMap((k) => (k.bolumler ?? []).map((b) => [b.id, b.ad] as const)));

export const kanunKisa = (id: string) => kanunHaritasi.get(id)?.kisa ?? id;
export const kanunAd = (id: string) => kanunHaritasi.get(id)?.ad ?? id;
export const bolumAd = (id: string) => bolumHaritasi.get(id) ?? id;
export const kanunKaynak = (id: string) => kanunHaritasi.get(id)?.kaynak ?? 'https://www.mevzuat.gov.tr/';

export const SEVIYE_AD: Record<string, string> = {
  kolay: 'Kolay',
  orta: 'Orta',
  zor: 'Zor',
  akademik: 'Akademik',
  dip: 'Ayrıntı',
};

/** Sorudaki bağlantıyı değil, okunur kaynak (madde) bilgisini verir. */
export function soruDayanak(s: GysSoru): string {
  if (s.madde) return s.madde;
  const temiz = (s.kaynak || '').replace(/https?:\/\/\S+/gi, '').trim();
  return temiz || kanunKisa(s.kanun);
}

export function soruMevzuatUrl(s: GysSoru): string {
  if (s.mevzuatUrl) return s.mevzuatUrl;
  if (/^https?:\/\//.test(s.kaynak)) return s.kaynak;
  return kanunKaynak(s.kanun);
}

/** Başlık ve açıklama için soru metnini kelime sınırında kısaltır. */
export function kisalt(metin: string, uzunluk: number): string {
  const tek = metin.replace(/\s+/g, ' ').trim();
  if (tek.length <= uzunluk) return tek;
  const kesik = tek.slice(0, uzunluk);
  const bosluk = kesik.lastIndexOf(' ');
  return `${(bosluk > uzunluk * 0.6 ? kesik.slice(0, bosluk) : kesik).replace(/[\s,;:–-]+$/, '')}…`;
}

// Statik sayfada şıklar her derlemede aynı sırada görünsün diye soru kimliğinden tohumlanan üreteç.
function tohumluRng(tohum: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < tohum.length; i++) {
    h ^= tohum.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function statikSoru(s: GysSoru): HazirSoru {
  return soruyuHazirla(s, 'klasik', tohumluRng(s.id));
}

/** Konu adındaki kanun numarası (ör. 657, 7201, 4982) soruda geçiyorsa soru doğrudan o konuya aittir. */
function konuAnahtari(k: GysKonuKaydi): RegExp | null {
  const no = `${k.kisa} ${k.ad}`.match(/\b(\d{3,4})\b/);
  return no ? new RegExp(`(^|[^\\d])${no[1]}([^\\d]|$)`) : null;
}

export interface KonuSorulari {
  dogrudan: GysSoru[];
  ayniBolum: GysSoru[];
}

export function konuSorulari(k: GysKonuKaydi): KonuSorulari {
  const bolumSet = new Set(k.bolumler);
  const bolumdekiler = gysSorular.filter((s) => bolumSet.has(s.bolum));
  const anahtar = konuAnahtari(k);
  if (!anahtar) return { dogrudan: [], ayniBolum: bolumdekiler };
  const dogrudan = bolumdekiler.filter((s) => anahtar.test(`${s.soru} ${s.madde ?? ''} ${s.kaynak}`));
  const dogruSet = new Set(dogrudan.map((s) => s.id));
  return { dogrudan, ayniBolum: bolumdekiler.filter((s) => !dogruSet.has(s.id)) };
}

/** Bir sorunun doğrudan ait olduğu konular; yoksa aynı çalışma bölümündeki konular. */
export function soruKonulari(s: GysSoru): GysKonuKaydi[] {
  const adaylar = gysKonular.filter((k) => k.bolumler.includes(s.bolum));
  const dogrudan = adaylar.filter((k) => konuSorulari(k).dogrudan.some((x) => x.id === s.id));
  return dogrudan.length ? dogrudan : adaylar;
}

export interface SinavKaydi {
  dugum: GysAgacDugum;
  yol: GysAgacDugum[];
  sorular: GysSoru[];
}

/** Soru sayısı ve süresi tanımlı (seçilebilir) sınav düğümleri; ağaç sırasıyla. */
export const gysSinavlar: SinavKaydi[] = (() => {
  const liste: SinavKaydi[] = [];
  const gez = (d: GysAgacDugum) => {
    if (d.sinavSoruSayisi) {
      liste.push({ dugum: d, yol: dugumYolu(gysKok, d.id), sorular: dugumSorulari(d, gysSorular) });
    }
    for (const c of d.cocuklar ?? []) {
      if (c.tur !== 'alan' && c.tur !== 'unite') gez(c);
    }
  };
  gez(gysKok);
  return liste;
})();

/** Yolun kök ("Tüm Bakanlıklar") dışındaki adları. */
export const yolMetni = (yol: GysAgacDugum[]) =>
  yol
    .filter((d) => d.id !== gysKok.id)
    .map((d) => d.ad)
    .join(' › ');

/** Liste satırları için kısa yol: bakanlık ve (varsa) birim. Örn. "Adalet Bakanlığı › Taşra Teşkilatı". */
export const kisaYol = (yol: GysAgacDugum[]) =>
  yol
    .filter((d) => d.id !== gysKok.id)
    .slice(0, -1)
    .slice(0, 2)
    .map((d) => d.ad.replace(/\s*\([^)]*\)\s*$/, ''))
    .join(' › ');

/** Sınav adındaki "(80 Soru: …)" gibi açıklamaları atar. */
export const sadeAd = (ad: string) => ad.replace(/\s*\([^)]*\d[^)]*\)\s*$/, '').trim();

export function soruSinavlari(s: GysSoru): SinavKaydi[] {
  return gysSinavlar.filter((x) => dugumBolumleri(x.dugum).has(s.bolum));
}

/** Sınav düğümünün dersleri (alan düğümleri) ve her dersin soru sayısı. */
export function sinavDersleri(d: GysAgacDugum): { ad: string; sayi: number }[] {
  return (d.cocuklar ?? [])
    .filter((c) => c.tur === 'alan' || c.tur === 'unite')
    .map((c) => ({ ad: c.ad, sayi: dugumSorulari(c, gysSorular).length }));
}

/** Soru bankası sırası: ders (kanun) sırası mufredattaki gibi, ders içinde veri sırası. */
export function dersGruplari(): { kanun: string; ad: string; sorular: GysSoru[] }[] {
  const sira = gysKanunlar.map((k) => k.id);
  const gruplar = new Map<string, GysSoru[]>();
  for (const s of gysSorular) gruplar.set(s.kanun, [...(gruplar.get(s.kanun) ?? []), s]);
  return [...gruplar.entries()]
    .sort((a, b) => (sira.indexOf(a[0]) + 1 || 99) - (sira.indexOf(b[0]) + 1 || 99))
    .map(([kanun, sorular]) => ({ kanun, ad: kanunAd(kanun), sorular }));
}

export function breadcrumbLd(parcalar: { ad: string; yol: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: parcalar.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.ad,
      item: gysUrl(p.yol),
    })),
  };
}
