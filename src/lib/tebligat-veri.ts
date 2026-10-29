import { z } from 'zod';
import raw from '../data/tebligat-ucretleri.json' with { type: 'json' };
import type { Ucretler } from './yargilama-gideri';

// Tebligat, e-tebligat, e-yazışma, KEP ve keşif harcı birim ücretleri. Her satır bir tarih aralığıdır;
// bitis null olan satır yürürlüktekidir. Aralıklar çakışmamalı; eski tarifelerde bitiş günü sonrakinin
// başlangıcıyla aynı olabilir, o gün yeni tarife uygulanır (satirBul en yeni başlangıçtan geriye arar).
const satir = z.object({ tutar: z.number().nonnegative(), baslangic: z.iso.date(), bitis: z.iso.date().nullable(), para: z.string().optional() });
const tablo = z.array(satir).min(1).superRefine((l, ctx) => {
  const s = [...l].sort((a, b) => a.baslangic.localeCompare(b.baslangic));
  if (s.filter(x => x.bitis === null).length > 1) ctx.addIssue({ code: 'custom', message: 'Birden fazla yürürlükteki ücret var.' });
  for (let i = 1; i < s.length; i++) {
    if (s[i - 1].bitis === null || s[i].baslangic < s[i - 1].bitis!) ctx.addIssue({ code: 'custom', message: `Ücret aralıkları çakışıyor: ${s[i].baslangic}` });
  }
});
const schema = z.object({
  surum: z.string(),
  kaynak: z.string().min(1),
  tablolar: z.object({ posta: tablo, etebligat: tablo, eyazisma: tablo, kep: tablo, kesifharci: tablo }),
});
export const tebligat = schema.parse(raw);
export const ucretler: Ucretler = tebligat.tablolar;
export const yururlukte = (t: keyof Ucretler) => ucretler[t].find(s => s.bitis === null)!;
