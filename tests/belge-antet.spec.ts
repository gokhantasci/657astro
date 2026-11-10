import {test,expect} from '@playwright/test';
import {readFileSync,mkdirSync} from 'node:fs';
import {belgeOkumaMetni} from '../src/lib/belge-gorunum';
const id='005-2-no-lu-genelge-kamu-duzenini-ciddi-sekilde-bozan-ve-kamuoyunda-hassasiyet-olusturan-suc-sorustu-2a594c';
const path='/adalet-bakanligi-genelgeleri/'+id+'/';

test('okuma nüshası doğrulama ve kaynak sayfa altlıklarını çıkarır; metin ve kaynak değişmez',async({page})=>{
 const md=readFileSync('src/content/belgeler/genelge/'+id+'.md','utf8'),clean=belgeOkumaMetni(md);
 expect(md).toContain('dogrulama.png');expect(clean).not.toContain('dogrulama.png');expect(clean).not.toContain('kaynak-sayfa-no');expect(clean).toContain('Bekir BOZDAC');
 await page.goto(path);await expect(page.locator('[data-ozgun-metin]')).toContainText('Devletin ülkesi ve milletiyle bölünmez bütünlüğünü');
 await expect(page.locator('[data-ozgun-metin] img[alt="Kaynak belgenin doğrulama bilgileri"],.kaynak-sayfa-no')).toHaveCount(0);
 await expect(page.locator('#ozgun-metin > .panel__head,#ozgun-metin > .belge__not')).toHaveCount(0);
 await expect(page.locator('#belge-sayfa-1,#belge-sayfa-2')).toHaveCount(2);await expect(page.getByRole('link',{name:'Özgün PDF’yi aç'})).toHaveAttribute('href',/b4ceb2a95b08645b/);
});

test('belge metni tüm alan genişliğini kullanır; mobilde sayfa taşmaz',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('657:cerez','ret'));
 for(const width of [360,1440,1920]){
  await page.setViewportSize({width,height:900});await page.goto(path);
  const bounds=await page.locator('[data-ozgun-metin]').boundingBox();expect(bounds!.width).toBeGreaterThan(width*.8);
  const paragraph=page.locator('[data-ozgun-metin] p').filter({hasText:'Devletin ülkesi ve milletiyle bölünmez bütünlüğünü'}).first();
  expect((await paragraph.boundingBox())!.width).toBeGreaterThan(width*.75);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.screenshot({path:'output/genelge-tam-genislik.png',fullPage:true});
});

test('657 antetli PDF gerçek dosya olarak indirilir',async({page})=>{
 test.setTimeout(60000);await page.addInitScript(()=>localStorage.setItem('657:cerez','ret'));await page.goto(path);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const event=page.waitForEvent('download',{timeout:45000});await page.locator('[data-antet-pdf]').click();const download=await event;
 expect(download.suggestedFilename()).toBe(id+'-657-antetli.pdf');mkdirSync('output/pdf',{recursive:true});await download.saveAs('output/pdf/657-antetli-genelge.pdf');
 const bytes=readFileSync('output/pdf/657-antetli-genelge.pdf');expect(bytes.subarray(0,5).toString()).toBe('%PDF-');expect(bytes.length).toBeGreaterThan(15000);
 await expect(page.locator('[data-antet-durum]')).toHaveText('Antetli PDF hazır.');expect(errors).toEqual([]);
});
