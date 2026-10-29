import {test,expect} from '@playwright/test';
import {kamuHesapla} from '../src/lib/kamu-hesaplari';
import {kamuAraclari} from '../src/lib/kamu-katalog';
import {ayarlar} from '../src/lib/settings';
import kurallar from '../src/data/kamu-kurallari.json' with {type:'json'};
import vergi from '../src/data/vergi.json' with {type:'json'};
import {eskiJson,eskiJsonYollari} from '../src/lib/eski-json';
const k={aylik:1.575512,asgariNet:28075.5,muhtarGosterge:14750,seyyanenGosterge:ayarlar.sabitler.seyyanen_zam_gosterge,kurallar,vergi};
const hesap=(id:string,v:Record<string,number>={})=>kamuHesapla(id,{...Object.fromEntries(kamuAraclari.find(a=>a.id===id)!.fields.map(f=>[f.id,f.value])),...v},k);
test('YOHEP 2026: H cetveli grupları, iki gece tavanı ve damga',()=>{
 // 29.10.2026: derece 1; üç görev günü, 2 gece × 2000 TL, 500+500 TL ulaşım, diğerleri 0.
 for(const [gundelik,brut,dv,net] of [[860,6332,48.06,6283.94],[870,6394,48.53,6345.47],[880,6456,49,6407],[890,6518,49.47,6468.53]]){
  const r=hesap('gecici-yolluk',{gundelik,tamGun:3,gece:2,otel:2000,tasit:1000}),s=Object.fromEntries(r.satirlar.map(s=>[s.ad,s.deger]));
  expect(s['Toplam brüt yolluk']).toBe(brut);expect(s['Damga vergisi']).toBe(dv);expect(r.deger).toBe(net);
 }
 expect(hesap('gecici-yolluk',{tamGun:3,gece:3,otel:2000,konaklamaIlkGun:10,damgaUygula:0}).satirlar.find(s=>s.ad==='Limit dahilinde konaklama')!.deger).toBe(2236);
 expect(()=>hesap('gecici-yolluk',{tamGun:91})).toThrow('90 günlük');
});
test('UTEDESHEP: aynı 3716,24 TL brüt 16,85; net 20 saattir',()=>{
 expect(hesap('ek-ders-saat',{net:3716.24,ucretTuru:0}).deger).toBe(16.85);
 expect(hesap('ek-ders-saat',{net:3716.24,ucretTuru:1}).deger).toBe(20);
});
test('belediye başkanı: kaynak brütleri, K ilavesi ve seyyanenin GV dışı olması',()=>{
 for(const [nufus,brut,toplam] of [[10000,113878.01,139031.06],[50000,129633.13,154786.18],[200000,184776.05,209929.10],[2000001,365959.93,391112.98]]){
  const r=hesap('belediye-baskani',{nufus}),s=Object.fromEntries(r.satirlar.map(s=>[s.ad,s.deger]));
  expect(s['Brüt ödenek']).toBe(brut);expect(s['375 ek 40 ilave ödemesi']).toBe(25153.05);expect(s['Brüt gelir toplamı']).toBe(toplam);
  expect(s['Gelir vergisi matrahı']).toBeCloseTo(brut-12978.97,2);
 }
 const s=Object.fromEntries(hesap('belediye-baskani').satirlar.map(s=>[s.ad,s.deger]));
 expect(s['Gelir vergisi']).toBe(10923.53);expect(s['Damga vergisi']).toBe(804.55);
});
test('eski JSON sözleşmeleri: aynı yollar, tatiller 2035 ve ortak katsayılar',async({request})=>{
 for(const yol of eskiJsonYollari){const r=await request.get('/wp-content/themes/teftis/'+yol);expect(r.status(),yol).toBe(200);await r.json();}
 const t=eskiJson('657/tatiller.json');expect(t.data.some((t:any)=>t.tarih.endsWith('2035'))).toBe(true);
 expect(eskiJson('657/assets/katsayilar.json').find((r:any)=>r.durum==='suan').aylik_katsayi).toBe(1.575512);
 expect(()=>eskiJson('../mail_guard.json')).toThrow();
});
test('okunma yenilemede yerel ziyaret artar; genel sayı değişmez',async({page})=>{
 await page.goto('/azerbaycanin-unlu-petrol-kuyulari-nerede-bulunur/');
 const global=await page.locator('.soru .okunma > span').first().textContent();
 await expect(page.locator('[data-okunma-yerel]')).toContainText('1 ziyaret');await page.reload();
 await expect(page.locator('[data-okunma-yerel]')).toContainText('2 ziyaret');expect(await page.locator('.soru .okunma > span').first().textContent()).toBe(global);
});
test('THH gelir vergisi seçilebilir ve sıfırlanabilir',async({page})=>{
 await page.goto('/tuketici-hakem-heyeti-bilirkisi-ucret-hesaplama/');await page.locator('#gvOran').fill('20');
 await expect(page.locator('[data-thh="gv-etiket"]')).toHaveText('Gelir vergisi (%20)');await expect(page.locator('[data-thh="gv"]')).toHaveText('661,72 TL');
 await page.locator('[data-thh-sifirla]').click();await expect(page.locator('#gvOran')).toHaveValue('15');
});
