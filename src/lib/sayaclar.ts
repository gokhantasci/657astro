import { z } from 'zod';
import raw from '../data/sayaclar.json' with { type: 'json' };

// Geri sayım şeridi. WordPress'teki admin-countdown-timer eklentisinin karşılığı: yalnızca etkin ve tarihi gelmemiş sayaçlar.
const sayacSchema = z.object({ baslik: z.string().min(1), tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/), etkin: z.boolean() });
const veri = z.object({ aciklama: z.string(), sayaclar: z.array(sayacSchema) }).parse(raw);
// Türkiye saati: tarih saat dilimsiz girilir, +03:00 eklenir.
export const an = (tarih: string) => Date.parse(`${tarih}:00+03:00`);
export const gelecekSayaclar = (simdi = Date.now()) => veri.sayaclar
  .filter(s => s.etkin && an(s.tarih) > simdi)
  .sort((a, b) => an(a.tarih) - an(b.tarih))
  .map(s => ({ baslik: s.baslik, an: an(s.tarih) }));
