import { z } from 'zod';
import { okunma } from './okunma';
import raw from '../data/sozluk.json' with { type: 'json' };

// Kayıtlar WordPress'teki "kelimeler" yazılarından alındı; adres (slug) aynen korunur: /kelime/<slug>/
// goruntulenme, taşıma günündeki sayaçtır; "en çok okunan" sıralaması bunu kullanır.
const terimSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  terim: z.string().min(1),
  anlam: z.string().min(1),
  tarih: z.iso.date(),
  goruntulenme: z.number().int().nonnegative().default(0),
});
export type Terim = z.infer<typeof terimSchema>;

export const terimler: Terim[] = z.array(terimSchema).superRefine((list, ctx) => {
  const seen = new Set<string>();
  list.forEach((t, i) => {
    if (seen.has(t.slug)) ctx.addIssue({ code: 'custom', message: `Yinelenen adres: ${t.slug}`, path: [i, 'slug'] });
    seen.add(t.slug);
  });
}).parse(raw);

const siralayici = new Intl.Collator('tr', { sensitivity: 'base' });
terimler.sort((a, b) => siralayici.compare(a.terim, b.terim));

// Şapkalı ve noktalı harfler temel harfin sayfasında toplanır: Â → A, Ç → C, Ö → O.
const HARF_GRUBU: Record<string, string> = { Â: 'A', Ç: 'C', Ğ: 'G', I: 'I', İ: 'I', Î: 'I', Ö: 'O', Ş: 'S', Û: 'U', Ü: 'U' };
export const harfi = (t: Terim) => {
  const ilk = t.terim.trim().charAt(0).toLocaleUpperCase('tr-TR');
  return HARF_GRUBU[ilk] ?? ilk;
};
const ETIKET: Record<string, string> = { C: 'C, Ç', G: 'G, Ğ', I: 'I, İ', O: 'O, Ö', S: 'S, Ş', U: 'U, Ü' };
export const harfEtiketi = (h: string) => ETIKET[h] ?? h;
export const harfSlug = (h: string) => h.toLocaleLowerCase('en');

export const harfler = [...new Set(terimler.map(harfi))]
  .filter(h => /^[A-Z]$/.test(h))
  .sort((a, b) => siralayici.compare(a, b))
  .map(h => ({ harf: h, slug: harfSlug(h), etiket: harfEtiketi(h), terimler: terimler.filter(t => harfi(t) === h) }));

// Güncel okunma sayısı (lib/okunma) varsa o, yoksa aktarımdaki goruntulenme kullanılır.
const okunan = (t: { slug: string; goruntulenme: number }) => okunma(`/kelime/${t.slug}/`) || t.goruntulenme;
export const enCokOkunan = [...terimler].sort((a, b) => okunan(b) - okunan(a));
export const sonEklenen = [...terimler].sort((a, b) => b.tarih.localeCompare(a.tarih));

export const terimHref = (t: Terim) => `/kelime/${t.slug}/`;
export const kisa = (s: string, n = 110) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(' ', n) > 60 ? s.lastIndexOf(' ', n) : n)}…`);

// Aynı harf grubunda alfabetik olarak önceki ve sonraki terimler.
export function komsular(t: Terim, adet = 4) {
  const grup = terimler.filter(x => harfi(x) === harfi(t));
  const i = grup.findIndex(x => x.slug === t.slug);
  return grup.slice(Math.max(0, i - adet), i).concat(grup.slice(i + 1, i + 1 + adet));
}
