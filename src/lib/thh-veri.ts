import { z } from 'zod';
import raw from '../data/thh-bilirkisi.json' with { type: 'json' };
export const thh = z.object({
  kaynak: z.url(), aciklama: z.string(), damga_binde: z.number().nonnegative(), gelir_vergisi_oran: z.number().min(0).max(100),
  urunler: z.array(z.object({ ad: z.string().min(1), gosterge: z.number().int().positive() })).min(1),
}).parse(raw);
