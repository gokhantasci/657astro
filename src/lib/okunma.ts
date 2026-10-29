import { z } from 'zod';
import raw from '../data/okunma.json' with { type: 'json' };

// Sayfa okunma sayıları: WordPress sayacının aktarım günündeki değeri + sonrasında GA4 görüntülemeleri (scripts/okunma.mjs).
// Yalnızca derlemede kullanılır; büyük dosya tarayıcı betiklerine girmez.
const veri = z.object({ aciklama: z.string(), aktarim: z.iso.date(), ga_baslangic: z.iso.date().nullable(), ga_guncelleme: z.string().nullable(),
  wp: z.record(z.string(), z.number().int().nonnegative()), ga: z.record(z.string(), z.number().int().nonnegative()) }).parse(raw);
export const okunma = (path: string) => (veri.wp[path] ?? 0) + (veri.ga[path] ?? 0);
export const okunmaMetni = (n: number) => `${n.toLocaleString('tr-TR')} kez okundu`;
// JSON-LD: arama motorları ve yanıt motorları için okunma istatistiği.
export const okunmaLd = (path: string) => okunma(path) > 0
  ? { interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/ReadAction', userInteractionCount: okunma(path) } }
  : {};
