import {test,expect} from '@playwright/test';

async function open(page:any,path:string,key:string){
 let count=0;
 await page.route('**/_657-servis/api/hesaplama',async(route:any)=>{if(route.request().method()==='POST')count++;await route.fulfill({json:{baslangic:'2026-11-11',toplam:count,sayaclar:{[key]:{bugun:count,buHafta:count,buYil:count,toplam:count}}}});});
 await page.goto(path);await expect(page.locator('[data-sayac-toplam]')).toHaveText('1');
}

test('garameten dağıtımda kuruşların toplamı korunur',async({page})=>{
 await open(page,'/garameten-paylastirma-hesaplama/','garameten-paylastirma');
 await page.locator('#dagitilacak').fill('100.01');
 for(const id of ['alacak1','alacak2','alacak3'])await page.locator('#'+id).fill('100');
 await expect(page.locator('[data-hh-ana]')).toHaveText('100,01 TL');
 await expect(page.locator('[data-hh-satirlar] dd').nth(1)).toHaveText('33,34 TL');
 await expect(page.locator('[data-hh-satirlar] dd').nth(2)).toHaveText('33,34 TL');
 await expect(page.locator('[data-hh-satirlar] dd').nth(3)).toHaveText('33,33 TL');
});

test('aidat gecikmesinde 31 gün için aylık basit oran uygulanır',async({page})=>{
 await open(page,'/aidat-gecikme-tazminati-hesaplama/','aidat-gecikme');
 await page.locator('#anapara').fill('1000');
 await page.locator('#baslangic').fill('2026-01-01');
 await page.locator('#bitis').fill('2026-02-01');
 await expect(page.locator('[data-hh-ana]')).toHaveText('1.051,67 TL');
 await expect(page.locator('[data-hh-satirlar] dd').nth(1)).toHaveText('31 gün');
});

test('yeni hukuk araçları dar ekranda yatay taşmaz',async({page})=>{
 await page.route('**/_657-servis/api/hesaplama',async route=>route.fulfill({json:{baslangic:'2026-11-11',toplam:0,sayaclar:{}}}));
 await page.setViewportSize({width:320,height:800});
 for(const path of ['/iscilik-alacagi-hesaplama/','/brutten-nete-hesaplama/','/arabuluculuk-ucreti-hesaplama/','/icra-masrafi-hesaplama/','/infaz-yatar-hesaplama/','/garameten-paylastirma-hesaplama/','/aidat-gecikme-tazminati-hesaplama/']){
  await page.goto(path);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),path).toBe(false);
 }
});
