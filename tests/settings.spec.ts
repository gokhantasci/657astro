import { test, expect } from '@playwright/test';
import { ayarlar, ayarlarSchema, getKatsayilar } from '../src/lib/settings';

// Sentetik test verisidir; hesaplama verisine aktarılmaz.
const period = {
 baslangic:'2000-01-01', bitis:'2000-06-30',
 memur_maas_aylik_katsayi:1, taban_aylik_katsayi:1, yan_odeme_katsayi:1,
 gelir_vergisi_istisna:1, damga_vergisi_istisna:1, asgari_ucret:1,
 kaynak:'https://example.com/test-verisi',
};
const sabitler = { bedelli_askerlik_gosterge:1, yeni_bedelli_askerlik_gosterge:1, muhtar_gosterge:1, seyyanen_zam_gosterge:1 };
const settings = (donemler:unknown[])=>({site:{name:'Test',url:'https://example.com',eposta:'test@example.com',tablo_sayfa_boyu:50,analitik:{}},sabitler,donemler,maas_parametreleri:ayarlar.maas_parametreleri});
test('ortak katsayı şeması geçersiz verileri reddeder',()=>{
 expect(ayarlarSchema.safeParse(settings([period])).success).toBe(true);
 for(const patch of [
  {memur_maas_aylik_katsayi:0}, {yan_odeme_katsayi:-1}, {asgari_ucret:0},
  {baslangic:'2000-02-30'}, {bitis:'1999-12-31'}, {kaynak:''},
 ]) expect(ayarlarSchema.safeParse(settings([{...period,...patch}])).success).toBe(false);
});
test('ortak katsayı dönemleri çakışamaz',()=>{
 expect(ayarlarSchema.safeParse(settings([period,{...period,baslangic:'2000-06-30',bitis:'2000-12-31'}])).success).toBe(false);
 expect(ayarlarSchema.safeParse(settings([period,{...period,baslangic:'2000-07-01',bitis:'2000-12-31'}])).success).toBe(true);
});
test('kayıt olmayan tarihte tahmini veya eski katsayı kullanılmaz',()=>{
 expect(()=>getKatsayilar('2000-01-01')).toThrow('doğrulanmış katsayı kaydı yok');
 expect(()=>getKatsayilar('hatalı-tarih')).toThrow();
 expect(getKatsayilar('2026-10-29').memur_maas_aylik_katsayi).toBe(1.575512);
});
