import {test,expect} from '@playwright/test';

const akis=(sira=0)=>({kontrolTarihi:new Date(Date.now()+60000+sira*1000).toISOString(),kaynaklar:[{basarili:true}],haberler:Array.from({length:8},(_,i)=>({source:i<5?'Bakanlık':'PGM',date:'2026-11-05',title:`Güncel kurum haberi ${sira}-${i}`,url:`https://adalet.gov.tr/haber-${sira}-${i}`}))});

test('güncel akış sayfaya gelir, kaynak filtresi ve sayfalama korunur',async({page})=>{
 await page.route('https://raw.githubusercontent.com/**/haber-akisi.json*',r=>r.fulfill({json:akis()}));
 await page.goto('/');
 await expect(page.locator('.news')).toContainText('Güncel kurum haberi 0-0');
 await expect(page.locator('[data-news-status]')).toHaveText('1 / 2 · 8 haber');
 await page.locator('[data-news-next]').click();await expect(page.locator('[data-news-status]')).toHaveText('2 / 2 · 8 haber');
 await page.locator('label[for="kaynak-pgm"]').click();
 await expect(page.locator('.news li:visible')).toHaveCount(3);
 await expect(page.locator('.news li:visible').first()).toContainText('PGM');
 await expect(page.locator('[data-news-kontrol]')).toContainText('Son kaynak kontrolü:');
});

test('yenile düğmesi yeni haberleri alır ve güvenilmeyen bağlantıları göstermez',async({page})=>{
 let sira=0;
 await page.route('https://raw.githubusercontent.com/**/haber-akisi.json*',r=>{
  const data=akis(sira++);data.haberler.push({source:'Bakanlık',date:'2026-11-05',title:'Güvenilmeyen haber',url:'javascript:alert(1)'});return r.fulfill({json:data});
 });
 await page.goto('/');await expect(page.locator('.news')).toContainText('Güncel kurum haberi 0-0');
 await page.locator('[data-news-yenile]').click();
 await expect(page.locator('.news')).toContainText('Güncel kurum haberi 1-0');
 await expect(page.locator('.news')).not.toContainText('Güvenilmeyen haber');
});

test('akışa erişilemezse mevcut haberler silinmez',async({page})=>{
 await page.route('https://raw.githubusercontent.com/**/haber-akisi.json*',r=>r.fulfill({status:503,body:''}));
 await page.route('**/haber-akisi.json?*',r=>r.fulfill({status:503,body:''}));
 await page.goto('/');
 await expect(page.locator('[data-news-kontrol]')).toContainText('son kaydedilen haberler');
 expect(await page.locator('.news li').count()).toBeGreaterThan(5);
 await page.locator('[data-news-next]').click();await expect(page.locator('[data-news-status]')).toContainText('2 /');
});
