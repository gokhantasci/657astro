import {test,expect} from '@playwright/test';
import {donemAylari} from '../src/lib/maas-donemi';
import {vergiTarifesi,vergiSchema} from '../src/lib/vergi-veri';
import {donem} from '../src/lib/maas-veri';
test('ay listesi yıl ve yarıyıla göre üretilir; tarifesi olmayan yıl tahmin edilmez',()=>{
 expect(donemAylari({baslangic:'2027-01-01',bitis:'2027-06-30'}).map(a=>a.value)).toEqual([1,2,3,4,5,6]);
 expect(donemAylari({baslangic:'2027-07-01',bitis:'2027-12-31'})[0]).toEqual({value:7,label:'Temmuz'});
 expect(vergiTarifesi(2026).asgariBrut).toBe(33030);
 expect(()=>vergiTarifesi(2099)).toThrow('2099 yılı');
 expect(vergiSchema.safeParse({...vergiTarifesi(2026),dilimler:[{sinir:200,oran:15},{sinir:100,oran:20},{sinir:null,oran:40}]}).success).toBe(false);
});
test('maaş ve 4/B ödeme ayları güncel dönemi izler',async({page})=>{
 const aylar=donemAylari(donem).map(a=>String(a.value));
 for(const path of ['/memur-maas-hesaplama/','/sozlesmeli-memur-maas-hesaplama/','/ogretmen-ek-ders-hesaplama/']){
  await page.goto(path);expect(await page.locator('#ay option').evaluateAll(els=>els.map(e=>(e as HTMLOptionElement).value))).toEqual(aylar);
 }
});
