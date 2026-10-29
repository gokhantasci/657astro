import { z } from 'zod';
import raw from '../data/ayarlar.json' with { type: 'json' };

// Bütün hesaplayıcılar ve gelecekteki yerel yönetim paneli bu şemayı kullanır.
// Katsayı kopyası tutulmaz: araçlar değeri her zaman getKatsayilar(tarih) ya da guncelKatsayilar() ile okur.
const farkKatsayiSchema = z.object({
  aylik_katsayi: z.number().nonnegative(), taban_ayligi_katsayi: z.number().nonnegative(),
  yan_odeme_katsayi: z.number().nonnegative(), gelir_vergisi_istisna: z.number().nonnegative(),
  damga_vergisi_istisna: z.number().nonnegative(),
});
export const donemSchema = z.object({
  baslangic: z.iso.date(),
  bitis: z.iso.date(),
  memur_maas_aylik_katsayi: z.number().positive(),
  taban_aylik_katsayi: z.number().positive(),
  yan_odeme_katsayi: z.number().positive(),
  gelir_vergisi_istisna: z.number().nonnegative(),
  damga_vergisi_istisna: z.number().nonnegative(),
  asgari_ucret: z.number().positive(),
  // Resmî genelgenin bağlantısı ya da verinin nereden alındığı.
  kaynak: z.string().min(1),
  fark14: farkKatsayiSchema.optional(),
}).refine(d => d.bitis >= d.baslangic, 'Dönem bitişi başlangıçtan önce olamaz.');

// Katsayıyla çarpılan sabit göstergeler (bedelli askerlik, muhtar aylığı, seyyanen zam).
export const sabitlerSchema = z.object({
  bedelli_askerlik_gosterge: z.number().positive(),
  yeni_bedelli_askerlik_gosterge: z.number().positive(),
  muhtar_gosterge: z.number().positive(),
  seyyanen_zam_gosterge: z.number().positive(),
});

export const maasParametreSchema = z.object({
  es_yardimi_gosterge: z.number().nonnegative(), sendika_uye_gosterge: z.number().nonnegative(),
  tasinir_yetkili_gosterge: z.number().nonnegative(), taban_ayligi_gosterge: z.number().positive(),
  maas_hesaplama_gosterge: z.number().positive(), kidem_ayligi_gosterge: z.number().nonnegative(),
  cocuk_0_6_gosterge: z.number().nonnegative(), cocuk_6_ust_gosterge: z.number().nonnegative(),
  engelli_cocuk_0_6_gosterge: z.number().nonnegative(), engelli_cocuk_6_ust_gosterge: z.number().nonnegative(),
  gorev_yeri_istanbul_oran: z.number().nonnegative(), gorev_yeri_buyuksehir_oran: z.number().nonnegative(), gorev_yeri_diger_oran: z.number().nonnegative(),
  yabanci_dil_a_gosterge: z.number().nonnegative(), yabanci_dil_b_gosterge: z.number().nonnegative(), yabanci_dil_c_gosterge: z.number().nonnegative(), yabanci_dil_d_gosterge: z.number().nonnegative(),
  yabanci_dil_kurum_yararlandigi:z.object({A1:z.number().nonnegative(),A2:z.number().nonnegative(),B:z.number().nonnegative(),C:z.number().nonnegative()}),
  gelir_vergisi_oran: z.number().min(0).max(100), damga_vergisi_oran_binde: z.number().min(0).max(1000),
  sendika_kesinti_oran: z.number().min(0).max(100), bes_oran: z.number().min(0).max(100), ilksan_oran: z.number().min(0).max(100), haciz_damga_oran: z.number().min(0).max(100),
  memur_sendika_ikramiye_gosterge: z.number().nonnegative(), memur_tayin_bedeli_gosterge: z.number().nonnegative(),
  memur_fazla_mesai_icra_muduru_oran: z.number().nonnegative(), memur_fazla_mesai_icra_mudur_yardimcisi_oran: z.number().nonnegative(),
  memur_emekli_kesenek_5510_oran: z.number().min(0).max(100), memur_gss_5510_oran: z.number().min(0).max(100), memur_emekli_kesenek_5434_oran: z.number().min(0).max(100),
  sozlesmeli_sendika_ikramiye_gosterge: z.number().nonnegative(), sozlesmeli_emekli_kesenek_oran: z.number().min(0).max(100), sozlesmeli_gss_oran: z.number().min(0).max(100),
  sozlesmeli_sgk_tavan_kat:z.number().positive(),
  emekli_ozel_hizmet_dilimleri:z.array(z.object({enAz:z.number().int().nonnegative(),oran:z.number().nonnegative()})).min(1).refine(a=>a.at(-1)?.enAz===0&&a.every((d,i)=>i===0||a[i-1].enAz>d.enAz),'Emeklilik dilimleri büyükten küçüğe sıralanmalı ve sıfırla bitmeli.'),
  emekli_yolluk_tazminat_gosterge: z.number().nonnegative(), emekli_ek_odeme_oran: z.number().nonnegative(), emekli_ek_7456_oran: z.number().nonnegative(),
  asker_emekli_ek81:z.number().nonnegative(),
  asker_emekli_ek85:z.number().nonnegative(),
});
export const ayarlarSchema = z.object({
  site: z.object({
    name: z.string().min(1), url: z.url(), eposta: z.email(),
    // Site genelindeki uzun tabloların (tarifeler, listeler) bir sayfada gösterdiği satır sayısı.
    tablo_sayfa_boyu: z.number().int().min(10).max(500),
    // GTM tanımlıysa GA4 etiketi canlıdaki gibi konteynerden yüklenir; ga4 yalnızca GTM yoksa doğrudan kullanılır.
    analitik: z.object({gtm: z.string().regex(/^GTM-[A-Z0-9]+$/).optional(), ga4: z.string().regex(/^G-[A-Z0-9]+$/).optional(),
      google_dogrulama: z.string().optional(), yandex_dogrulama: z.string().optional()}),
  }),
  sabitler: sabitlerSchema,
  maas_parametreleri: maasParametreSchema,
  donemler: z.array(donemSchema),
}).superRefine((data, ctx) => {
  const periods = [...data.donemler].sort((a,b) => a.baslangic.localeCompare(b.baslangic));
  for (let i=1; i<periods.length; i++) {
    if (periods[i].baslangic <= periods[i-1].bitis) ctx.addIssue({code:'custom', message:'Katsayı dönemleri çakışamaz.', path:['donemler']});
  }
});
export type Donem = z.infer<typeof donemSchema>;
export const ayarlar = ayarlarSchema.parse(raw);
export function getKatsayilar(tarih: string) {
  z.iso.date().parse(tarih);
  const donem = ayarlar.donemler.find(d => tarih >= d.baslangic && tarih <= d.bitis);
  if (!donem) throw new Error(`${tarih} için doğrulanmış katsayı kaydı yok.`);
  return donem;
}
// Derleme günündeki dönem; o gün için kayıt yoksa açık hata verir (eski ya da tahmini katsayı kullanılmaz).
export const guncelKatsayilar = (bugun = new Date().toISOString().slice(0, 10)) => getKatsayilar(bugun);
