import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {dpbGorusleri} from '../src/lib/dpb';
import {genelgeler,genelgeYol} from '../src/lib/genelgeler';
import {markdownSayfalari} from '../src/lib/belge-markdown';
import {belgeSorulari,bultenSorulari} from '../src/lib/belge-sorulari';
import {bultenGorusleri,bultenGorusYolu} from '../src/lib/dpb-bulten';
import {genelgeSorusu} from '../src/lib/genelge-soru-basliklari';
const norm=(s:string)=>s.replace(/\s+/g,' ').trim();
test('Her kurum belgesinin ayrı Markdown kaynağı, kaynak kimliği ve özgün alıntıları vardır',()=>{
 for(const g of genelgeler)expect(genelgeSorusu(g.baslik),g.baslik).toBeTruthy();
 for(const [tur,rows]of [['dpb',dpbGorusleri],['genelge',genelgeler]] as const)for(const r of rows){
  const md=readFileSync(`src/content/belgeler/${tur}/${r.id}.md`,'utf8');
  expect(md,r.id).toContain(`sha256: "${r.sha256}"`);
  expect(md,r.id).not.toMatch(/<(?:iframe|embed|object|pre|details|script)\b/);
  const ps=markdownSayfalari(md);
  expect(ps.length,r.id).toBeGreaterThan(0);
  if(tur==='genelge')expect(ps.length,r.id).toBe(r.sayfa);
  const qs=r.id==='dpb_mutalaa_ozel'?bultenSorulari(ps):belgeSorulari(r.baslik,ps,tur);
  for(const q of qs){expect(ps.some(p=>p.no===q.sayfa&&norm(p.metin).includes(norm(q.cevap)))||q.cevap===r.baslik,`${r.id}: ${q.soru}`).toBe(true);}
 }
});
test('Kaynak ek tablosunun 11 sütunu ve sözleşme numaraları korunur',async({page})=>{
 const g=genelgeler.find(g=>g.id.startsWith('069-2'))!;await page.goto(genelgeYol(g));
 const rows=page.locator('#belge-sayfa-20 table tr');
 expect(await rows.first().locator('td').count()).toBe(11);
 expect(await rows.nth(1).locator('td').allTextContents()).toEqual(['SÖZLEŞME NO','24','30','70','73','90','98','99','112','141','173']);
});
test('Periyodik bakım ekindeki 30 gün ayrı tablo hücrelerinde korunur',async({page})=>{
 const g=genelgeler.find(g=>g.sha256.startsWith('956684e7'))!;await page.goto(genelgeYol(g));
 const cells=await page.locator('#belge-sayfa-5 table td').allTextContents();
 expect(cells.map(s=>s.trim()).filter(s=>/^\d+$/.test(s))).toEqual(Array.from({length:30},(_,i)=>String(30-i)));
});
test('Kaynakta 500.000,00 olan tutar yanlış OCR tutarıyla yayımlanmaz',async({page})=>{
 const g=genelgeler.find(g=>g.sha256.startsWith('8c7b3141'))!;await page.goto(genelgeYol(g));
 await expect(page.locator('#belge-sayfa-2')).toContainText('500.000,00');
 await expect(page.locator('#belge-sayfa-2')).not.toContainText('5300.000,00');
});
test('PDF karakter haritasının görünmez ek harfleri metne taşınmaz',async({page})=>{
 const g=genelgeler.find(g=>g.id.startsWith('017-1'))!;await page.goto(genelgeYol(g));
 await expect(page.locator('#belge-sayfa-2')).toContainText('İhbar veya şikâyetlerin');
 await expect(page.locator('#belge-sayfa-2')).toContainText('İçinde disiplin');
 await expect(page.locator('#belge-sayfa-2')).not.toContainText('İhb hbar');
});
test('bülten adresi 336 görüş başlığı listeler ve her başlık ayrı görüşe açılır',async({page})=>{
 await page.goto('/dpb-gorusleri/dpb_mutalaa_ozel/');
 await expect(page.locator('[data-bulten-gorusleri] tbody tr')).toHaveCount(336);
 await expect(page.locator('[data-ozgun-metin],.kaynak-sayfa')).toHaveCount(0);
 await page.locator('[data-bulten-gorusleri] tbody a').first().click();
 await expect(page).toHaveURL(bultenGorusYolu(bultenGorusleri[0].id));
 await expect(page.locator('h1')).toHaveText(bultenGorusleri[0].title);
 await expect(page.locator('[data-ozgun-metin]')).toContainText('baksa kurumun');
 await expect(page.locator('[data-ozgun-metin]')).not.toContainText('Aday memur iken istifa eden');
 await expect(page.locator('.kaynak-sayfa,.kaynak-sayfa-no')).toHaveCount(0);
 await expect(page.locator('[data-okunma-path]')).toHaveCount(1);
 expect(await page.locator('.gorus__soru').count()).toBeGreaterThan(0);
});
for(const theme of ['light','dark'])for(const width of [320,375,414,768,1440])test(`Markdown belge görünümü: ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.addInitScript(t=>{localStorage.setItem('657:tema',t);localStorage.setItem('657:cerez','ret')},theme);
 for(const url of [bultenGorusYolu(bultenGorusleri[0].id),'/dpb-gorusleri/1a/',genelgeYol(genelgeler[0])]){
  await page.goto(url);await expect(page.locator('[data-ozgun-metin]')).toBeVisible();
  await expect(page.locator('#ozgun-metin iframe')).toHaveCount(0);
  expect(await page.locator('main').evaluate(e=>e.scrollWidth<=e.clientWidth),url).toBe(true);
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  if(!url.includes('dpb_mutalaa_ozel/'))expect(await page.locator('[data-ozgun-metin]').evaluate(e=>getComputedStyle(e).fontFamily)).toContain('Times New Roman');
 }
});
