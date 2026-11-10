import {test,expect} from '@playwright/test';
import {tarifeler} from '../src/lib/tarife-arsivi';

for(const tarife of tarifeler.filter(t=>t.kayitlar[0].kalemler.length>1))test(`görünen listeden kalem seçimi: ${tarife.slug}`,async({page})=>{
 const kalem=tarife.kayitlar[0].kalemler[1].ad;
 await page.goto(`/tarifeler/${tarife.slug}/?yil=hepsi`);
 await page.locator('#tarife-kalem-ara').click();
 await page.getByRole('option',{name:kalem,exact:true}).click();
 await expect(page.locator('[data-tarife-secili]')).toHaveText('Gösterilen kalem: '+kalem);
 await expect(page.locator('[data-tarife-grafik]')).toHaveAttribute('aria-label',new RegExp(kalem.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 const cells=page.locator('[data-tarife-karsilastirma] tr td:first-of-type');
 for(let i=0;i<tarife.kayitlar.length;i++){
  const value=tarife.kayitlar[i].kalemler.find(k=>k.ad===kalem);
  await expect(cells.nth(i)).toHaveText(value?value.tutar.toLocaleString('tr-TR')+' '+value.birim:'Kayıt yok');
 }
 expect(new URL(page.url()).searchParams.get('kalem')).toBe(kalem);
});

test('uzlaştırmacı: klavye seçimi tutarları günceller ve yenilemede korunur',async({page})=>{
 await page.goto('/tarifeler/uzlastirmaci/?yil=hepsi');
 await expect(page.locator('[data-tarife-karsilastirma] td').first()).toHaveText('590 TL');
 const input=page.locator('#tarife-kalem-ara');await input.click();await input.press('ArrowDown');await input.press('Enter');
 await expect(page.locator('[data-tarife-karsilastirma] td').first()).toHaveText('885 TL');
 await expect(page.locator('[data-tarife-grafik]')).toContainText('885 TL');
 await page.reload();await expect(input).toHaveValue('Teklif aşaması olumsuz · üst sınır');
 await expect(page.locator('[data-tarife-karsilastirma] td').first()).toHaveText('885 TL');
});

test('uzlaştırmacı: bütün kalemler listeden tıklanınca kendi kayıtları gösterilir',async({page})=>{
 const tarife=tarifeler.find(t=>t.slug==='uzlastirmaci')!;
 await page.goto('/tarifeler/uzlastirmaci/?yil=hepsi');
 await expect(page.locator('[data-cerez]')).toBeVisible();
 for(const {ad} of tarife.kayitlar[0].kalemler){
  await page.locator('#tarife-kalem-ara').click();await page.getByRole('option',{name:ad,exact:true}).click();
  await expect(page.locator('[data-tarife-secili]')).toHaveText('Gösterilen kalem: '+ad);
  for(let i=0;i<tarife.kayitlar.length;i++){
   const value=tarife.kayitlar[i].kalemler.find(k=>k.ad===ad)!;
   await expect(page.locator('[data-tarife-karsilastirma] tr').nth(i).locator('td').first()).toHaveText(value.tutar.toLocaleString('tr-TR')+' '+value.birim);
  }
 }
});

test('uzlaştırmacı: dokunarak seçim grafiği ve tabloyu birlikte günceller',async({browser})=>{
 const context=await browser.newContext({baseURL:process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4321',hasTouch:true,isMobile:true,viewport:{width:375,height:812}});
 try{
  const page=await context.newPage();await page.goto('/tarifeler/uzlastirmaci/?yil=hepsi');await page.locator('#tarife-kalem-ara').tap();
  await page.getByRole('option',{name:'Olumlu sonuç · 2–3 kişi · alt sınır',exact:true}).tap();
  await expect(page.locator('[data-tarife-karsilastirma] td').first()).toHaveText('1.775 TL');
  await expect(page.locator('[data-tarife-grafik]')).toContainText('1.775 TL');
 }finally{await context.close();}
});

test('uzun kalem listesinin son seçeneği çerez şeridi açıkken seçilebilir',async({page})=>{
 const tarife=tarifeler.find(t=>t.slug==='tuketici-hakem-heyeti-bilirkisi')!,last=tarife.kayitlar[0].kalemler.at(-1)!;
 await page.goto('/tarifeler/tuketici-hakem-heyeti-bilirkisi/?yil=hepsi');
 await expect(page.locator('[data-cerez]')).toBeVisible();
 await page.locator('#tarife-kalem-ara').click();await page.getByRole('option',{name:last.ad,exact:true}).click();
 await expect(page.locator('[data-tarife-secili]')).toHaveText('Gösterilen kalem: '+last.ad);
 await expect(page.locator('[data-tarife-karsilastirma] td').first()).toHaveText(last.tutar.toLocaleString('tr-TR')+' '+last.birim);
});
