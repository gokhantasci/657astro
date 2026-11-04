// Sözlük terimleri ile mülakat soruları arasındaki çapraz bağlar (SEO yol haritası P2-1, ince içerik).
// Derlemede bir kez hesaplanır: terim, mülakat sorusunun ya da cevabının içinde tam kelime olarak geçiyorsa bağ kurulur.
import { terimler, type Terim } from './sozluk';
import { sorular, type Soru } from './mulakat';
import { normalize } from './normalize';

const kelimeler = (s: string) => normalize(s).replace(/[^a-z0-9çğöşü\s]/g, ' ').split(/\s+/).filter(Boolean);
// Çok genel ya da çok kısa terimler bağ üretmez (ör. "Hak", "Dava").
const ENAZ = 5;
const GENEL = new Set(['adalet', 'kanun', 'karar', 'mahkeme', 'devlet', 'hukuk', 'memur', 'madde', 'sanik', 'tanik']);

interface Dizin { terim: Terim; kelimeler: string[] }
const terimDizini: Dizin[] = terimler
  .map(t => ({ terim: t, kelimeler: kelimeler(t.terim) }))
  .filter(d => d.kelimeler.length > 0 && d.kelimeler.join(' ').length >= ENAZ && !(d.kelimeler.length === 1 && GENEL.has(d.kelimeler[0])));

const soruTerimleri = new Map<string, Terim[]>();
const terimSorulari = new Map<string, Soru[]>();
for (const s of sorular) {
  const metin = kelimeler(`${s.soru} ${s.cevap}`);
  const tek = new Set(metin), duz = ` ${metin.join(' ')} `;
  const bulunan = terimDizini.filter(d => d.kelimeler.length === 1 ? tek.has(d.kelimeler[0]) : duz.includes(` ${d.kelimeler.join(' ')} `))
    // Uzun (daha belirgin) terimler önce.
    .sort((a, b) => b.kelimeler.join(' ').length - a.kelimeler.join(' ').length)
    .map(d => d.terim);
  const tekil = [...new Map(bulunan.map(t => [normalize(t.terim), t])).values()].slice(0, 6);
  soruTerimleri.set(s.slug, tekil);
  for (const t of tekil) (terimSorulari.get(t.slug) ?? terimSorulari.set(t.slug, []).get(t.slug)!).push(s);
}

export const soruyaAitTerimler = (s: Soru) => soruTerimleri.get(s.slug) ?? [];
export const terimeAitSorular = (t: Terim, adet = 5) => (terimSorulari.get(t.slug) ?? []).slice(0, adet);

// ── Benzer kayıtlar: ince sayfalarda ilgili içeriğe geçiş (komşu kayıtlardan ayrı). ──
// Paylaşılan anlamlı kelimeler nadirlik ağırlığıyla (IDF) puanlanır; yalnız yaygın bir kelimeyi ("hakkı") paylaşan kayıt öneri olmaz.
const DOLGU = new Set(['hangi', 'nedir', 'kimdir', 'neresidir', 'nelerdir', 'kactir', 'nasil', 'zaman', 'hangisidir', 'olan', 'olarak', 'icin', 'veya', 'ayrica', 'midir', 'mudur', 'hakkinda', 'bilgi', 'veriniz', 'aciklayiniz', 'sayiniz', 'tarafindan', 'gore', 'kadar', 'sonra', 'once', 'olur', 'yapilir', 'denir', 'demek', 'hakki', 'kanunu', 'kanununa', 'madde', 'maddesi']);
const anlamli = (s: string) => [...new Set(kelimeler(s).filter(k => k.length >= 4 && !DOLGU.has(k)))];

function benzerlik<T>(kayitlar: T[], anahtar: (x: T) => string, metin: (x: T) => string) {
  const kel = new Map(kayitlar.map(x => [anahtar(x), anlamli(metin(x))]));
  const dizin = new Map<string, T[]>();
  for (const x of kayitlar) for (const k of kel.get(anahtar(x))!) (dizin.get(k) ?? dizin.set(k, []).get(k)!).push(x);
  const N = kayitlar.length;
  return (x: T, haric: T[] = [], adet = 4): T[] => {
    const disla = new Set([anahtar(x), ...haric.map(anahtar)]), puan = new Map<string, { x: T; p: number }>();
    for (const k of kel.get(anahtar(x)) ?? []) {
      const l = dizin.get(k) ?? [];
      if (l.length < 2 || l.length > 60) continue;
      const w = Math.log(N / l.length);
      for (const y of l) if (!disla.has(anahtar(y))) { const e = puan.get(anahtar(y)) ?? { x: y, p: 0 }; e.p += w; puan.set(anahtar(y), e); }
    }
    // Eşik: en az bir gerçekten nadir kelime (≈ 25 kayıttan azında geçen) ya da birden çok ortak kelime.
    const esik = Math.log(N / 25);
    return [...puan.values()].filter(e => e.p >= esik).sort((a, b) => b.p - a.p).slice(0, adet).map(e => e.x);
  };
}
export const benzerTerimler: (t: Terim, haric?: Terim[], adet?: number) => Terim[] = benzerlik(terimler, t => t.slug, t => `${t.terim} ${t.terim} ${t.anlam}`);
export const benzerSorular: (s: Soru, haric?: Soru[], adet?: number) => Soru[] = benzerlik(sorular, s => s.slug, s => `${s.soru} ${s.cevap}`);
