import { z } from 'zod';
import raw from '../data/tatiller.json' with { type: 'json' };

// Resmî tatiller (yarım günler ayrı işaretli), Diyanet'in yıllık listelerinden: scripts/import-tatiller.py.
// Aynı güne denk gelen iki tatil (ör. 19 Mayıs 2027) Diyanet'teki gibi ayrı satırdır; listede ikisi de görünür.
// Süre hesaplayan araçlar (kesinleşme, teftiş süre kontrolleri) tatilGunleri'ni kullanır: her tarih bir kez.
const schema = z.object({
  kaynak: z.string().min(1),
  tatiller: z.array(z.object({ tarih: z.iso.date(), yarim: z.boolean(), ad: z.string().min(1) })).superRefine((l, ctx) => {
    const g = new Set<string>();
    l.forEach((t, i) => { const k = `${t.tarih}|${t.ad}`; if (g.has(k)) ctx.addIssue({ code: 'custom', message: `Yinelenen tatil: ${t.tarih} ${t.ad}`, path: [i] }); g.add(k); });
  }),
});
export const { tatiller, kaynak: tatilKaynagi } = schema.parse(raw);
export type Tatil = (typeof tatiller)[number];
// Tarih başına tek kayıt; çakışan adlar "ve" ile birleşir. Tam gün tatille çakışan yarım gün (ör. 01.01.2033 Yılbaşı ve
// Ramazan Bayramı arefesi) tam gün sayılır.
export const tatilGunleri: Tatil[] = [...tatiller.reduce((m, t) => {
  const v = m.get(t.tarih);
  m.set(t.tarih, v ? { ...v, ad: `${v.ad} ve ${t.ad}`, yarim: v.yarim && t.yarim } : { ...t });
  return m;
}, new Map<string, Tatil>()).values()];
const yillar = tatiller.map(t => Number(t.tarih.slice(0, 4)));
// Tatil verisinin kapsadığı yıllar; bunların dışındaki tarihlerde araç kullanıcıyı uyarır.
export const tatilAraligi = { ilk: Math.min(...yillar), son: Math.max(...yillar) };
