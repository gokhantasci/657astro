import {test,expect} from '@playwright/test';
const aileler=['/','/araclar/','/memur-maas-hesaplama/','/yazilar/','/ceza-mahkemeleri-teftislerinde-dikkat-edilecek-hususlar/','/kelime/tuzuk-ne-demek/','/cikmis-mulakat-sorulari/','/adlicevre/','/dosyalar/','/asistan/','/yargilamagideri/','/jrobot/'];
test('ortak tasarım bütün sayfa ailelerinde, dört mobil genişlik ve iki temada çalışır',async({page})=>{
 test.setTimeout(180000);
 for(const path of aileler){await page.goto(path);await expect(page.locator('h1').first()).toBeVisible();
  for(const theme of ['light','dark'])for(const width of [320,375,414,768]){
   await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   const result=await page.evaluate(()=>({body:document.body.scrollWidth,root:document.documentElement.scrollWidth,width:innerWidth,grid:getComputedStyle(document.body).backgroundImage}));
   expect(result.body,`${path} ${theme} ${width} body`).toBeLessThanOrEqual(result.width);expect(result.root,`${path} ${theme} ${width}`).toBeLessThanOrEqual(result.width);expect(result.grid).toBe('none');
  }
 }
});
test('numaralı maaş bölümleri seçimleri korur, döküm ayrı tablolarda güncellenir',async({page})=>{
 await page.goto('/memur-maas-hesaplama/');await expect(page.locator('.maas-bolum')).toHaveCount(5);
 const vergi=page.locator('.maas-bolum').nth(1);await vergi.locator('summary').click();await page.locator('#oncekiMatrah').fill('210000');await vergi.locator('summary').click();await expect(vergi.locator('summary')).toContainText('210000');await vergi.locator('summary').click();await expect(page.locator('#oncekiMatrah')).toHaveValue('210000');
 await expect(page.getByRole('table',{name:'Gelirler',exact:true})).toBeVisible();await expect(page.getByRole('table',{name:'Kesintiler',exact:true})).toBeVisible();
 const kesinti=page.locator('.maas-bolum').nth(3);await kesinti.locator('summary').click();await page.locator('#bes').selectOption('1');await page.locator('#besOran').fill('5');await expect(page.locator('[data-m-kesinti-kalemleri]')).toContainText('BES kesintisi');await expect(page.locator('[data-m-gelir-kalemleri]')).not.toContainText('BES kesintisi');
 await page.getByRole('button',{name:'Sıfırla',exact:true}).click();await expect(page.locator('#bes')).toHaveValue('0');await expect(page.locator('[data-m-kesinti-kalemleri]')).not.toContainText('BES kesintisi');await expect(page.locator('[data-m-hata]')).toBeHidden();
});
