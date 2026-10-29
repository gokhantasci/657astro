import { z } from 'zod';
import raw from '../data/mulakat.json' with { type: 'json' };

// Kayıtlar WordPress'teki "Hatırlatma Kartı" yazılarından alındı; her soru eski kök adresinde yayımlanır: /<slug>/
// mulakat: aynı zamanda "Mülakat Soruları" kategorisinde olan kartlar.
const soruSchema = z.object({
  slug: z.string().min(1).refine(s => !/[\s/?#%]/.test(s), 'Adreste boşluk, /, ?, # ya da % olamaz.'),
  soru: z.string().min(1),
  cevap: z.string().min(1),
  tarih: z.iso.date(),
  mulakat: z.boolean(),
});
export type Soru = z.infer<typeof soruSchema>;

export const sorular: Soru[] = z.array(soruSchema).superRefine((list, ctx) => {
  const seen = new Set<string>();
  list.forEach((s, i) => {
    if (seen.has(s.slug)) ctx.addIssue({ code: 'custom', message: `Yinelenen adres: ${s.slug}`, path: [i, 'slug'] });
    seen.add(s.slug);
  });
}).parse(raw);

export const SAYFA_BOYU = 100;
export const sayfaSayisi = Math.ceil(sorular.length / SAYFA_BOYU);
export const sayfa = (n: number) => sorular.slice((n - 1) * SAYFA_BOYU, n * SAYFA_BOYU);
export const sayfaHref = (n: number) => (n === 1 ? '/cikmis-mulakat-sorulari/' : `/cikmis-mulakat-sorulari/sayfa/${n}/`);

export const soruHref = (s: Soru) => `/${s.slug}/`;
export const kisaCevap = (s: string, n = 155) => {
  const tek = s.replace(/\s+/g, ' ').trim();
  if (tek.length <= n) return tek;
  const kes = tek.lastIndexOf(' ', n);
  return `${tek.slice(0, kes > 60 ? kes : n)}…`;
};

// Kaynak sırasındaki önceki ve sonraki sorular.
export function komsuSorular(s: Soru, adet = 3) {
  const i = sorular.findIndex(x => x.slug === s.slug);
  return { onceki: sorular[i - 1], sonraki: sorular[i + 1], yakin: sorular.slice(Math.max(0, i - adet), i).concat(sorular.slice(i + 1, i + 1 + adet)) };
}
