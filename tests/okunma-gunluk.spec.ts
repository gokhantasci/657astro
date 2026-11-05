import {test,expect} from '@playwright/test';
const path='/kelime/tuzuk-ne-demek/';
test('sözlükte bugün ve arşiv dahil toplam ortak sunucudan gelir; aynı kimlikle yeniden denenir',async({page})=>{
 const ids:string[]=[];let n=0;
 await page.route('**/api/okunma',async r=>{const d=r.request().postDataJSON();expect(d.path).toBe(path);ids.push(d.istekId);await r.fulfill(++n===1?{status:503,body:''}:{json:{sayi:7,bugun:2,baslangic:'2026-11-06T00:00:00+03:00'}});});
 await page.goto(path);
 const total=Number(await page.locator('[data-okunma-path]').getAttribute('data-okunma-taban'))+7;
 await expect(page.locator('[data-okunma-bugun]')).toHaveText('Bugün: 2');
 await expect(page.locator('[data-okunma-toplam]')).toHaveText(`Toplam: ${total.toLocaleString('tr-TR')} kez okundu`);
 expect(ids).toHaveLength(2);expect(ids[0]).toBe(ids[1]);
 await expect(page.locator('[data-okunma-path]')).toHaveAttribute('title',/06\.11\.2026/);
});
test('hizmet yoksa günlük sıfır veya yerel ziyaret sayısı genel toplam olarak sunulmaz',async({page})=>{
 await page.route('**/api/okunma',r=>r.fulfill({status:503,body:''}));
 await page.goto(path);await expect(page.locator('[data-okunma-yerel]')).toContainText('arşiv değeridir');
 await expect(page.locator('[data-okunma-bugun]')).toHaveText('Bugün: —');
 const total=await page.locator('[data-okunma-toplam]').textContent();await page.reload();
 await expect(page.locator('[data-okunma-yerel]')).toContainText('arşiv değeridir');
 await expect(page.locator('[data-okunma-toplam]')).toHaveText(total!);
});
test('mülakat kartında sıfır da görünür; geçişte eski isteğin yanıtı yeni kartı ezmez',async({page})=>{
 const first='silahli-insansiz-hava-araclarinin-siha-fikir-babasi-olarak-bilinen-ozdemir-bayraktarin-ismi-hangi-universiteye-verilmistir';
 const seen:string[]=[];let release:()=>void=()=>{};const hold=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/okunma',async r=>{const p=r.request().postDataJSON().path;seen.push(p);if(p===`/${first}/`)await hold;await r.fulfill({json:{sayi:p===`/${first}/`?8:0,bugun:p===`/${first}/`?3:0,baslangic:'2026-11-06T00:00:00+03:00'}});});
 await page.goto('/cikmis-mulakat-sorulari/?kart='+first);
 await expect.poll(()=>seen.includes(`/${first}/`)).toBe(true);
 await page.locator('[data-kart-ileri]').click();
 await expect(page.locator('[data-kart-okunma] [data-okunma-bugun]')).toHaveText('Bugün: 0');
 const total=await page.locator('[data-kart-okunma] [data-okunma-toplam]').textContent();release();
 await page.waitForTimeout(150);
 await expect(page.locator('[data-kart-okunma] [data-okunma-toplam]')).toHaveText(total!);
 await page.locator('[data-kart-geri]').click();
 await expect(page.locator('[data-kart-okunma] [data-okunma-bugun]')).toHaveText('Bugün: 3');
 expect(seen.filter(p=>p===`/${first}/`)).toHaveLength(1);
 await page.locator('[data-kart-cevir]').click();expect(seen.filter(p=>p===`/${first}/`)).toHaveLength(1);
});
