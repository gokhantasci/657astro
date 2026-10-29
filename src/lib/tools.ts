import { z } from 'zod';
import raw from '../data/araclar.json' with { type: 'json' };

// Taşınmamış araçlar dizinde soluk ve bağlantısız görünür (eski siteye gönderilmez).
// Bir araç taşındığında kaydına "tasindi": true eklenir ve aynı yolla bağlantı açılır.
export const ESKI_SITE = 'https://657.com.tr';

const kategoriSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  short: z.string().min(1),
  description: z.string().min(1),
});
const aracSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  category: z.string().min(1),
  path: z.string().regex(/^\/[a-z0-9-]+\/$/).optional(),
  url: z.url().optional(),
  featured: z.boolean().optional(),
  tasindi: z.boolean().optional(),
  description: z.string().min(1),
  keywords: z.string().default(''),
}).refine(t => Boolean(t.path) !== Boolean(t.url), 'Her araçta ya path ya url bulunur.');

export const katalogSchema = z.object({
  kategoriler: z.array(kategoriSchema),
  araclar: z.array(aracSchema),
}).superRefine((data, ctx) => {
  const ids = new Set(data.kategoriler.map(k => k.id));
  const seen = new Set<string>();
  data.araclar.forEach((t, i) => {
    if (!ids.has(t.category)) ctx.addIssue({ code: 'custom', message: `Bilinmeyen kategori: ${t.category}`, path: ['araclar', i, 'category'] });
    if (seen.has(t.id)) ctx.addIssue({ code: 'custom', message: `Yinelenen araç: ${t.id}`, path: ['araclar', i, 'id'] });
    seen.add(t.id);
  });
});

export type Kategori = z.infer<typeof kategoriSchema>;
export type Arac = z.infer<typeof aracSchema>;

export const { kategoriler, araclar } = katalogSchema.parse(raw);

export const aracHref = (t: Arac): string | null => t.url ?? (t.tasindi ? t.path! : null);
export const hazir = (t: Arac) => aracHref(t) !== null;
export const kategori = (id: string) => kategoriler.find(k => k.id === id)!;
export const kategoriAraclari = (id: string) => araclar.filter(t => t.category === id);
export const oneCikanlar = araclar.filter(t => t.featured);

export { normalize } from './normalize';
