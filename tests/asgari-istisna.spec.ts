import { test, expect } from '@playwright/test';
import { asgariIstisnaCetveli } from '../src/lib/asgari-istisna';
import { vergiIstisnasi } from '../src/lib/vergi';
import t from '../src/data/vergi.json' with {type:'json'};
test('2026: temmuz dilim geçişi ve tüm ayların maaş motoruyla tutarlılığı',()=>{
 const rows=asgariIstisnaCetveli(t);
 expect(rows[0]).toMatchObject({prim:4954.5,net:28075.5,gelir:4211.33,damga:250.7});
 expect(rows[6].gelir).toBe(4537.75);expect(rows[7].gelir).toBe(5615.1);
 for(const r of rows) expect({gelir:r.gelir,damga:r.damga}).toEqual(vergiIstisnasi(r.ay,t));
});
test('ara zam: önceki aylardaki gerçek matrah korunur',()=>{
 const rows=asgariIstisnaCetveli(t,7,40000);
 expect(rows[5].kumulatif).toBe(168453);
 expect(rows[6]).toMatchObject({brut:40000,net:34000,kumulatif:202453,gelir:5722.65,damga:303.6});
 expect(()=>asgariIstisnaCetveli(t,7,NaN)).toThrow('Geçerli');
});
test('eski adres: ortak veriden açılır, ara zam yeniden hesaplanır',async({page})=>{
 await page.goto('/asgari-ucret-istisna-oranlari/');
 await expect(page.locator('#ai-rows tr')).toHaveCount(12);
 await expect(page.locator('#ai-rows tr').first()).toContainText('4.211,33 TL');
 await page.locator('#araAy').selectOption('7');await page.locator('#araBrut').fill('40.000');
 await expect(page.locator('#ai-rows tr').nth(6)).toContainText('5.722,65 TL');
});
test('iki tema ve mobil: tablo kendi alanında kayar',async({page})=>{
 for(const path of ['/asgari-ucret-istisna-oranlari/','/tapu-harci-hesaplama-2/']) {
  await page.goto(path);
  for(const theme of ['light','dark']) {
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   for(const width of [320,375,1440]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path+' '+theme+' '+width).toBe(true);
   }
   await page.setViewportSize({width:375,height:900});
   await page.screenshot({path:`artifacts/${path.includes('tapu')?'tapu':'asgari'}-${theme}-mobile.png`,fullPage:true});
  }
 }
});
