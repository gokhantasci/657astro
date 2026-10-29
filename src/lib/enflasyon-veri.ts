import { z } from 'zod';
import raw from '../data/enflasyon.json' with { type: 'json' };

// Enflasyon farkı dönemi. Resmî aylarda TÜİK oranı (degisim) ve endeksi girilir; boş aylar sayfada tahmin için açık kalır.
const ay = z.object({ yil: z.number().int(), ay: z.number().int().min(1).max(12) });
const enflasyonSchema = z.object({
  baslik: z.string().min(1),
  kisa: z.string().min(1),
  baz_endeks: ay.extend({ deger: z.number().positive() }),
  toplu_sozlesme: ay.extend({ ad: z.string().min(1), zam: z.number().nonnegative() }),
  sonraki_zam: ay.extend({ zam: z.number().nonnegative() }),
  aylar: z.array(ay.extend({ degisim: z.number().nonnegative().optional(), endeks: z.number().positive().optional() }))
    .length(6)
    .refine(l => l.every(a => (a.degisim === undefined) === (a.endeks === undefined)), 'Resmî ayda oran ve endeks birlikte girilir.'),
  kaynak: z.string().min(1),
});

export const enflasyon = enflasyonSchema.parse(raw);
export const AY_ADLARI = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const ayAdi = (a: { yil: number; ay: number }) => `${AY_ADLARI[a.ay - 1]} ${a.yil}`;
// Dönemin katsayıları, dönem başlangıç ayının katsayı kaydından okunur.
export const donemBaslangici = () => {
  const ilk = enflasyon.aylar[0];
  return `${ilk.yil}-${String(ilk.ay).padStart(2, '0')}-01`;
};
