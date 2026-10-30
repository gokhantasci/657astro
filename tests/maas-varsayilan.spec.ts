import {test,expect} from '@playwright/test';
import {memurMaas} from '../src/lib/memur-maas';
import {formGirdisi,maasKatsayilari,donem,parametreler,dereceler} from '../src/lib/maas-veri';
test('başlangıç: BES yok, sendika var; sentetik icra tutarı harcıyla ayrı düşülür',()=>{
 expect(formGirdisi.bes).toBe(false);expect(formGirdisi.sendika).toBe(true);
 const k=maasKatsayilari(donem,'maas'),g={...formGirdisi,ay:10,oncekiMatrah:210000},a=memurMaas(g,k,parametreler,dereceler),b=memurMaas({...g,haciz:2500,hacizHarcEkle:true},k,parametreler,dereceler),c=memurMaas({...g,haciz:2500},k,parametreler,dereceler);
 if(a.eksik||b.eksik)throw Error('Hesap eksik.');
 expect(a.net).toBeCloseTo(100417.53,2);expect(a.vergiMatrahi).toBeCloseTo(24321.76,2);
 expect(a.gvKullanilanIstisna).toBe(4864.35);
 expect(a.kesintiler.find(x=>x.ad==='Sendika kesintisi')?.tutar).toBe(524.19);
 expect(a.kesintiler.find(x=>x.ad==='BES kesintisi')).toBeUndefined();
 expect(a.net-b.net).toBeCloseTo(2613.75,2);
 if(c.eksik)throw Error('Hesap eksik.');
 expect(a.net-c.net).toBeCloseTo(2500,2);
});
test('form açılış ve sıfırlama tercihlerinde BES hayır, sendika evet',async({page})=>{
 await page.goto('/memur-maas-hesaplama/');
 await expect(page.locator('#bes')).toHaveValue('0');await expect(page.locator('#sendika')).toHaveValue('1');
 await page.locator('summary').filter({hasText:'Ek ödemeler ve kesintiler'}).click();
 await page.locator('#bes').selectOption('1');await page.locator('#sendika').selectOption('0');
 await page.locator('[data-m-sifirla]').click();
 await expect(page.locator('#bes')).toHaveValue('0');await expect(page.locator('#sendika')).toHaveValue('1');
});

test('bordrodaki toplam icra kesintisi aynen düşer; harç yalnız ayrı seçimle eklenir',async({page})=>{
 await page.goto('/memur-maas-hesaplama/');
 await page.locator('#oncekiMatrah').fill('210000');
 const initial=await page.locator('[data-m-net]').textContent();
 await page.locator('summary').filter({hasText:'Ek ödemeler ve kesintiler'}).click();
 await expect(page.locator('#hacizHarcEkle')).toHaveValue('0');
 await page.locator('#haciz').fill('2500');
 await expect(page.locator('[data-m-net]')).toHaveText('97.917,53 TL');
 await page.locator('#hacizHarcEkle').selectOption('1');
 await expect(page.locator('[data-m-net]')).toHaveText('97.803,78 TL');
 await page.locator('#haciz').fill('0');
 await expect(page.locator('[data-m-net]')).toHaveText(initial!);
});
