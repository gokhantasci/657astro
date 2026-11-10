import {test,expect} from '@playwright/test';
const path='/turkiye-yargi-haritasi-yayinda-bam-bim-adliye-ve-idare-mahkemeleri/';
for(const tema of ['light','dark'])for(const width of [375,1440])test(`${tema} ${width}: yazı başlığı altında tek canlı sayaç`,async({page})=>{
 let requests=0;
 await page.addInitScript(t=>localStorage.setItem('657:tema',t),tema);
 await page.setViewportSize({width,height:900});
 await page.route('**/api/okunma',async r=>{requests++;expect(r.request().postDataJSON().path).toBe(path);await r.fulfill({json:{sayi:23,bugun:4,baslangic:'2026-11-06T00:00:00+03:00'}});});
 await page.goto(path);
 const count=page.locator('.article__head [data-sayfa-okunma]');
 await expect(count).toHaveCount(1);await expect(page.locator('[data-okunma-path]')).toHaveCount(1);
 await expect(count.locator('[data-okunma-bugun]')).toHaveText('Bugün: 4');
 const base=Number(await count.locator('[data-okunma-path]').getAttribute('data-okunma-taban'));
 await expect(count).toContainText(`Toplam: ${(base+23).toLocaleString('tr-TR')} kez okundu`);
 await expect(count).toBeVisible();expect(requests).toBe(1);
 expect(await page.locator('.article__head h1').evaluate((h)=>!!(h.compareDocumentPosition(h.parentElement!.querySelector('[data-sayfa-okunma]')!)&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});
