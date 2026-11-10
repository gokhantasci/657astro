import {test,expect} from '@playwright/test';
import {metaBaslik} from '../src/lib/seo-baslik';
import {haberArsivYolu,haberArsivleri} from '../src/lib/kurum-haberleri';
const yazi='/turkiye-yargi-haritasi-yayinda-bam-bim-adliye-ve-idare-mahkemeleri/';
test('meta başlık ayırt edici soru sonunu ve belge tarihini korur',()=>{
 const ortak='2021 yılı adrese dayalı nüfus kayıt sistemine göre ';
 expect(metaBaslik(ortak+'en az nüfusa sahip il nedir ve kaç kişiliktir?')).not.toBe(metaBaslik(ortak+'en fazla nüfusa sahip il nedir ve kaç kişiliktir?'));
 const long='Personelin kamu kurumları arasındaki görevlendirilmesi ve naklen atanması hakkında '.repeat(4);
 expect(metaBaslik(long+'(05/01/2011-2555) | 657.com.tr')).toContain('05/01/2011-2555');
 expect(metaBaslik('Kısa başlık | 657.com.tr')).toBe('Kısa başlık | 657.com.tr');
});
test('iki bin haber bellekte kalır; DOM yalnız beş kayıt taşır ve Personel sayfalanır',async({page})=>{
 const data={kontrolTarihi:new Date(Date.now()+60000).toISOString(),kaynaklar:[{kaynak:'Personel',basarili:true}],haberler:Array.from({length:2000},(_,i)=>({source:'Personel',institution:'Gebze Adliyesi',date:'2026-11-07',title:`Sınav sonucu ${i}`,url:`https://gebze.adalet.gov.tr/sinav-${i}`}))};
 await page.route('https://raw.githubusercontent.com/**/haber-akisi.json*',r=>r.fulfill({json:data}));
 await page.goto('/');await expect(page.locator('[data-news-status]')).toContainText('2000 haber');
 await page.locator('label[for="kaynak-personel"]').click();await expect(page.locator('.news li')).toHaveCount(5);
 await expect(page.locator('a[data-news-arsiv]')).toHaveAttribute('href',haberArsivYolu('Personel'));
 await page.locator('[data-news-next]').click();await expect(page.locator('[data-news-status]')).toHaveText('2 / 400 · 2000 haber');
 await expect(page.locator('.news li').first()).toContainText('Sınav sonucu 5');await expect(page.locator('.news li')).toHaveCount(5);
});
test('ilk HTML hafiftir ve bütün kurum haberlerinin taranabilir arşivi vardır',async({request,browser})=>{
 const response=await request.get('/'),html=await response.text();const main=html.match(/<main\b[\s\S]*?<\/main>/)?.[0]??'';expect(main.length).toBeLessThan(100000);expect((html.match(/data-kaynak=/g)??[]).length).toBeLessThanOrEqual(55);
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 try{await page.goto('/kurum-haberleri/personel/');await expect(page.locator('.news li')).toHaveCount(30);await expect(page.locator('.news .chip')).toHaveText(Array(30).fill('Personel'));
 await page.getByRole('link',{name:'Sonraki',exact:true}).click();await expect(page).toHaveURL(/\/personel\/2\/$/);await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',/\/personel\/2\/$/);
 }finally{await context.close();}
 const sitemap=await(await request.get('/sitemap-sayfalar.xml')).text();for(const a of haberArsivleri)expect(sitemap).toContain(a.path);
});
test('görünen kısa cevaplar şemayla eşleşir; yazıda yayıncı ve kısa giriş bulunur',async({page})=>{
 await page.goto('/');const ld=await page.locator('script[type="application/ld+json"]').allTextContents(),schema=ld.flatMap(t=>JSON.parse(t));
 const faq=schema.find(s=>s['@type']==='FAQPage');expect(faq.mainEntity).toHaveLength(3);
 for(const q of faq.mainEntity){const d=page.locator('.home-bilgi details').filter({hasText:q.name});await d.locator('summary').click();await expect(d.locator('p')).toContainText(q.acceptedAnswer.text);}
 await page.goto(yazi);await expect(page.locator('.article__ozet')).toBeVisible();await expect(page.locator('.article__yayin')).toContainText('Yayıncı:');await expect(page.locator('.article__head [data-okunma-path]')).toHaveCount(1);
});
for(const theme of ['light','dark'])for(const width of [320,375,414,768,1440])test(`${theme} ${width}: temel sayfa ailelerinde taşma ve tekrar yok`,async({page})=>{
 await page.addInitScript(t=>{localStorage.setItem('657:tema',t);localStorage.setItem('657:cerez','ret');},theme);await page.setViewportSize({width,height:900});
 for(const path of ['/',yazi,'/araclar/','/memur-maas-hesaplama/','/kurum-haberleri/personel/','/dpb-gorusleri/dpb_mutalaa_ozel/']){
  await page.goto(path);await expect(page.locator('h1')).toHaveCount(1);await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),path).toBeLessThanOrEqual(1);
  if(path==='/'){await expect(page.locator('#duyurular')).toHaveCount(1);await expect(page.locator('.home-duyuru')).toHaveCount(4);expect(await page.locator('.news li').count()).toBeLessThanOrEqual(5);await expect(page.locator('.yazi-slider__kapak-yok')).toHaveCount(0);}
 }
});
