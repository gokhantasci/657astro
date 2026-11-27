import { z } from 'zod';
import raw from '../data/sayaclar.json' with { type: 'json' };
import { tatilGunleri } from './tatil-veri';

// Geri sayım şeridi. WordPress'teki admin-countdown-timer eklentisinin karşılığı: yalnızca etkin ve tarihi gelmemiş sayaçlar.
const sayacSchema = z.object({ baslik: z.string().min(1), tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/), etkin: z.boolean(), kaynak:z.url().refine(u=>u.startsWith('https://')).optional(), kaynakTarihi:z.iso.date().optional() });
const veri = z.object({ aciklama: z.string(), sayaclar: z.array(sayacSchema) }).parse(raw);
// Türkiye saati: tarih saat dilimsiz girilir, +03:00 eklenir.
export const an = (tarih: string) => Date.parse(`${tarih}:00+03:00`);
export const gelecekSayaclar = (simdi = Date.now()) => {
  const kayitli = veri.sayaclar
    .filter(s => s.etkin && an(s.tarih) > simdi)
    .map(s => ({ baslik: s.baslik, an: an(s.tarih), kaynak: s.kaynak, kaynakTarihi: s.kaynakTarihi, kaynakEtiket: 'Resmî duyuru ↗' }));
  // /kesinlesme/ altındaki en yakın resmî tatil daima geri sayımda yer alır.
  const yakinTatil = tatilGunleri
    .map(t => ({ t, ts: an(`${t.tarih}T00:00`) }))
    .filter(x => x.ts > simdi)
    .sort((a, b) => a.ts - b.ts)[0];
  if (yakinTatil) {
    kayitli.push({
      baslik: `${yakinTatil.t.ad}${yakinTatil.t.yarim ? ' (Yarım Gün)' : ' · Resmî Tatil'}`,
      an: yakinTatil.ts,
      kaynak: '/kesinlesme/',
      kaynakTarihi: yakinTatil.t.tarih,
      kaynakEtiket: 'Kesinleşme takvimi →',
    });
  }
  return kayitli.sort((a, b) => a.an - b.an);
};
