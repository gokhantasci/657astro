import {test,expect} from '@playwright/test';
import {kamuHesapla} from '../src/lib/kamu-hesaplari';
import {kamuAraclari} from '../src/lib/kamu-katalog';
import kurallar from '../src/data/kamu-kurallari.json' with {type:'json'};
import vergi from '../src/data/vergi.json' with {type:'json'};
const arac=kamuAraclari.find(a=>a.id==='ucretli-ogretmen')!;
const v=Object.fromEntries(arac.fields.map(f=>[f.id,f.value]));
const k={aylik:1.575512,asgariNet:28075.50,muhtarGosterge:14750,vergi,kurallar};
for(const c of [
 {gunduzSaat:120,geceSaat:0,destek:60,gun:24,brut:39702.90,sgk:5558.41,gv:910.34,dv:50.65,net:33183.50},
 {gunduzSaat:121,geceSaat:0,destek:60,gun:25,brut:39923.47,sgk:5589.29,gv:938.80,dv:52.32,net:33343.06},
 {gunduzSaat:100,geceSaat:20,destek:60,gun:24,brut:40018.01,sgk:5602.52,gv:950.99,dv:53.04,net:33411.46},
])test(`EDUHEP normal ücretli öğretmen ${c.gunduzSaat}+${c.geceSaat} saat`,()=>{
 // 29.10.2026, Temmuz–Aralık, %15, yalnız Ekim istisna ayı seçili, diğer kesinti yok.
 const r=kamuHesapla(arac.id,{...v,...c},k),rows=Object.fromEntries(r.satirlar.map(s=>[s.ad,s.deger]));
 expect(r.deger).toBe(c.net);expect(rows['Eğitim öğretime destek saati']).toBe(c.destek);
 expect(rows['SGK prim ödeme günü']).toBe(c.gun);expect(rows['Brüt ücret toplamı']).toBe(c.brut);
 expect(rows['Çalışan SGK primi']).toBe(c.sgk);expect(rows['Gelir vergisi']).toBe(c.gv);expect(rows['Damga vergisi']).toBe(c.dv);
});
test('ücretli öğretmen: kümülatif vergi, tüketilmiş istisna ve yıl koruması',()=>{
 const r=kamuHesapla(arac.id,{...v,oncekiMatrah:190000,oncekiAsgariMatrah:196528.5,kullanilanGv:5615.10,kullanilanDv:250.70},k);
 expect(r.satirlar.find(s=>s.ad==='Gelir vergisi')!.deger).toBe(6828.90);
 expect(()=>kamuHesapla(arac.id,{...v,gunduzSaat:1.5},k)).toThrow('tam sayı');
 expect(()=>kamuHesapla(arac.id,v,{...k,vergi:{...vergi,yil:2027}})).toThrow('doğrulanmadı');
 expect(kamuHesapla(arac.id,{...v,gunduzSaat:0},k).deger).toBe(0);
});
test('ücretli öğretmen başlangıç örneği betiksiz görünür ve düzenlenebilir',async({page,browser})=>{
 await page.goto(arac.path);await expect(page.locator('[data-kamu-deger]')).toHaveText('33.183,50 TL');
 await page.locator('#geceSaat').fill('20');await expect(page.locator('[data-kamu-hata]')).toBeHidden();
 await page.getByRole('button',{name:'Sıfırla',exact:true}).click();await expect(page.locator('[data-kamu-deger]')).toHaveText('33.183,50 TL');
 const context=await browser.newContext({javaScriptEnabled:false});const plain=await context.newPage();
 await plain.goto('http://127.0.0.1:4321'+arac.path);await expect(plain.locator('[data-kamu-deger]')).toHaveText('33.183,50 TL');await context.close();
});
