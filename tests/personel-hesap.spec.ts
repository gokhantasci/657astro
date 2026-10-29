import {test,expect} from '@playwright/test';
import {yillikIzin,ikmBoyKilo} from '../src/lib/personel-hesap';
import k from '../src/data/personel-kurallari.json' with {type:'json'};
const g={giris:'2020-03-15',tarih:'2026-10-30',yas:35,kullanilan:5,devreden:0,yerAlti:false};
test('izin: Saffet örneği, tam yıl eşiği, yaş ve yer altı',()=>{
 expect(yillikIzin(g,k.izin)).toMatchObject({yil:6,hak:20,kalan:15,sonraki:'2027-03-15'});
 expect(yillikIzin({...g,giris:'2021-10-30'},k.izin).hak).toBe(14);
 expect(yillikIzin({...g,giris:'2020-10-31'},k.izin).hak).toBe(14);
 expect(yillikIzin({...g,giris:'2025-10-31',yas:18,yerAlti:true},k.izin).hak).toBe(0);
 expect(yillikIzin({...g,giris:'2023-09-01',yas:50,yerAlti:true},k.izin).hak).toBe(24);
 expect(yillikIzin({...g,giris:'2011-10-30'},k.izin).hak).toBe(26);
 expect(yillikIzin({...g,kullanilan:30,devreden:5},k.izin)).toMatchObject({kalan:0,asilan:5});
});
test('izin: artık yıl dönümü ve geçersiz tarihler',()=>{
 expect(yillikIzin({...g,giris:'2024-02-29',tarih:'2025-02-28'},k.izin)).toMatchObject({yil:1,hak:14,sonraki:'2026-02-28'});
 expect(()=>yillikIzin({...g,giris:'2026-11-01'},k.izin)).toThrow('sonra');expect(()=>yillikIzin({...g,giris:'2026-02-30'},k.izin)).toThrow('takvim');
});
test('İKM: kaynak örnekleri, dahil sınırlar ve boy şartı',()=>{
 expect(ikmBoyKilo({cinsiyet:'erkek',boy:175,kilo:70},k.ikm)).toMatchObject({alt:58,ust:88,uygun:true});
 for(const kilo of [58,88])expect(ikmBoyKilo({cinsiyet:'erkek',boy:175,kilo},k.ikm).uygun).toBe(true);
 expect(ikmBoyKilo({cinsiyet:'erkek',boy:175,kilo:89},k.ikm).uygun).toBe(false);
 expect(ikmBoyKilo({cinsiyet:'erkek',boy:169,kilo:70},k.ikm)).toMatchObject({boyUygun:false,kiloUygun:true,uygun:false});
 expect(ikmBoyKilo({cinsiyet:'kadin',boy:160,kilo:43},k.ikm).uygun).toBe(true);
 expect(()=>ikmBoyKilo({cinsiyet:'erkek',boy:200,kilo:100},k.ikm)).toThrow('100–199');
});
for(const path of ['/yillik-izin-hesaplama/','/infaz-ve-koruma-memuru-boy-kilo-hesaplama/'])test(`${path} form, geçersiz girdi, sıfırla, mobil`,async({page})=>{
 await page.goto(path);await expect(page.locator('[data-ph-ana]')).not.toHaveText('—');
 if(path.startsWith('/yillik')){await page.locator('#yas').fill('50');await page.locator('#yerAlti').selectOption('1');await expect(page.locator('[data-ph-not]')).toContainText('24');await page.locator('#yas').fill('0');}
 else{await page.locator('#kilo').fill('89');await expect(page.locator('[data-ph-ana]')).toHaveText('Aralık dışında');await page.locator('#kilo').fill('0');}
 await expect(page.locator('[data-ph-hata]')).toBeVisible();await expect(page.locator('[data-ph-ana]')).toHaveText('—');await page.getByRole('button',{name:'Sıfırla',exact:true}).click();await expect(page.locator('[data-ph-hata]')).toBeHidden();
 for(const theme of ['light','dark'])for(const width of [320,375,768,1440]){await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(0);}
});
