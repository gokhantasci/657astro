import { z } from 'zod';
import raw from '../data/enflasyon.json' with { type: 'json' };
import arsiv from '../data/enflasyon-arsivi.json' with { type: 'json' };

// Enflasyon farkı dönemi. Resmî aylarda TÜİK oranı (degisim) ve endeksi girilir; boş aylar sayfada tahmin için açık kalır.
const ay = z.object({ yil: z.number().int(), ay: z.number().int().min(1).max(12) });
export const enflasyonSchema = z.object({
  kayitTarihi:z.iso.date(),kaynakUrl:z.url(),endeksTabani:z.string().min(1),
  baslik: z.string().min(1),
  kisa: z.string().min(1),
  baz_endeks: ay.extend({ deger: z.number().positive() }),
  toplu_sozlesme: ay.extend({ ad: z.string().min(1), zam: z.number().nonnegative() }),
  sonraki_zam: ay.extend({ zam: z.number().nonnegative() }),
  aylar: z.array(ay.extend({ degisim: z.number().gt(-100).optional(), endeks: z.number().positive().optional(),endeksHesaplandi:z.boolean().optional() }))
    .length(6)
    .refine(l => l.every(a => (a.endeks === undefined) === (a.degisim === undefined)), 'Resmî ayda hem TÜFE oranı hem resmî genel endeks girilmelidir.')
    .refine(l=>l.every(a=>!a.endeksHesaplandi),'Resmî endeks yerine oranlardan türetilmiş yaklaşık değer kullanılamaz.'),
  kaynak: z.string().min(1),
}).superRefine((d,ctx)=>{
 const ilk=d.aylar[0];
 if(![1,7].includes(ilk.ay)||d.aylar.some((a,i)=>a.yil!==ilk.yil||a.ay!==ilk.ay+i))ctx.addIssue({code:'custom',message:'Dönem Ocak veya Temmuzda başlamalı ve altı ardışık ay içermeli.'});
 if(d.toplu_sozlesme.yil!==ilk.yil||d.toplu_sozlesme.ay!==ilk.ay)ctx.addIssue({code:'custom',message:'Sözleşme zammı dönemin başlangıcına ait olmalı.'});
 if(d.baz_endeks.yil!==(ilk.ay===1?ilk.yil-1:ilk.yil)||d.baz_endeks.ay!==(ilk.ay===1?12:6))ctx.addIssue({code:'custom',message:'Baz endeks dönemden önceki aya ait olmalı.'});
 let eksik=false;
 for(const a of d.aylar){if(a.degisim===undefined)eksik=true;else if(eksik)ctx.addIssue({code:'custom',message:'Aylık resmî veriler arasında boşluk olamaz.'});}
});

export const enflasyon = enflasyonSchema.parse(raw);
const donemAnahtari=(d:typeof enflasyon)=>`${d.aylar[0].yil}-${d.aylar[0].ay}`;
export const enflasyonDonemleri=[...new Map([...z.array(enflasyonSchema).parse(arsiv),enflasyon].map(d=>[donemAnahtari(d),d])).values()].sort((a,b)=>a.aylar[0].yil-b.aylar[0].yil||a.aylar[0].ay-b.aylar[0].ay);
export const AY_ADLARI = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const ayAdi = (a: { yil: number; ay: number }) => `${AY_ADLARI[a.ay - 1]} ${a.yil}`;
// Dönemin katsayıları, dönem başlangıç ayının katsayı kaydından okunur.
export const donemBaslangici = () => {
  const ilk = enflasyon.aylar[0];
  return `${ilk.yil}-${String(ilk.ay).padStart(2, '0')}-01`;
};
