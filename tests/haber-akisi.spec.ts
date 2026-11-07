import {test,expect} from '@playwright/test';

type Haber={source:string;date:string;title:string;url:string;institution?:string};
const akis=(sira=0)=>({kontrolTarihi:new Date(Date.now()+60000+sira*1000).toISOString(),kaynaklar:[{basarili:true}],haberler:Array.from({length:8},(_,i):Haber=>({source:i<5?'Bakanlık':'PGM',date:'2026-11-05',title:`Güncel kurum haberi ${sira}-${i}`,url:`https://adalet.gov.tr/haber-${sira}-${i}`}))});

test('güncel akış sayfaya gelir, kaynak filtresi ve sayfalama korunur',async({page})=>{
 await page.route('https://raw.githubusercontent.com/**/haber-akisi.json*',r=>r.fulfill({json:akis()}));
 await page.goto('/');
 await expect(page.locator('.news')).toContainText('Güncel kurum haberi 0-0');
 await expect(page.locator('[data-news-status]')).toHaveText('1 / 2 · 8 haber');
 await page.locator('[data-news-next]').click();await expect(page.locator('[data-news-status]')).toHaveText('2 / 2 · 8 haber');
 await page.locator('label[for="kaynak-pgm"]').click();
 await expect(page.locator('.news li:visible')).toHaveCount(3);
 await expect(page.locator('.news li:visible').first()).toContainText('PGM');
 await expect(page.locator('span[data-news-kontrol]')).toContainText('Son kaynak kontrolü:');
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
 await expect(page.locator('span[data-news-kontrol]')).toContainText('son kaydedilen haberler');
 expect(await page.locator('.news li').count()).toBeGreaterThan(5);
 await page.locator('[data-news-next]').click();await expect(page.locator('[data-news-status]')).toContainText('2 /');
});

test('açık sayfa beş dakika sonra haberleri kendiliğinden yeniler',async({page})=>{
 await page.clock.install();let sira=0;
 await page.route('https://raw.githubusercontent.com/**/haber-akisi.json*',r=>r.fulfill({json:akis(sira++)}));
 await page.goto('/');await expect(page.locator('.news')).toContainText('Güncel kurum haberi 0-0');
 await page.clock.fastForward(300001);
 await expect(page.locator('.news')).toContainText('Güncel kurum haberi 1-0');
});

test('tek Personel filtresi farklı kurumların aynı başlıklı duyurularını ayrı gösterir',async({page})=>{
 const data=akis();data.haberler.push(...['gebze','sakarya','sakaryabam'].map(host=>({source:'Personel',institution:host==='sakaryabam'?'Sakarya Bölge Adliye Mahkemesi':`${host} Adliyesi`,date:'2026-11-07',title:'Sözlü sınav sonuçları',url:`https://${host}.adalet.gov.tr/sinav-sonuclari`})),{source:'Personel',institution:'Gebze Adliyesi',date:'2026-11-07',title:'Atama sonuçları ve aday duyurusu',url:'https://gebze.adalet.gov.tr/atama-sonuclari'});
 await page.route('https://raw.githubusercontent.com/**/haber-akisi.json*',r=>r.fulfill({json:data}));
 await page.goto('/');await expect(page.locator('[data-news-personel-bilgi]')).toBeHidden();await page.locator('label[for="kaynak-personel"]').click();
 await expect(page.locator('[data-news-personel-bilgi]')).toBeVisible();
 await expect(page.locator('.news li:visible')).toHaveCount(4);
 await expect(page.locator('.news li:visible')).toContainText(['gebze Adliyesi','sakarya Adliyesi','Sakarya Bölge Adliye Mahkemesi','Gebze Adliyesi']);
 await expect(page.locator('[data-news-status]')).toHaveText('1 / 1 · 4 haber');
 await expect(page.locator('[data-news-filter] label').filter({hasText:/^Personel$/})).toHaveCount(1);
 await page.locator('label[for="kaynak-pgm"]').click();await expect(page.locator('[data-news-personel-bilgi]')).toBeHidden();
});
