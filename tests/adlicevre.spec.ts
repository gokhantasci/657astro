import { test, expect } from '@playwright/test';
test('adli çevre dizini Türkçe arar ve eski adres açılır',async({page})=>{
 await page.goto('/adlicevre/');await page.locator('#adli-ara').fill('adana');
 await expect(page.locator('[data-a-aranan]:visible')).toHaveCount(1);
 await page.getByRole('link',{name:'Adana Adliyesi Yargı Çevresi',exact:true}).click();
 await expect(page).toHaveURL(/\/adlicevre\/adana-adliyesi-yargi-cevresi\/$/);
 await expect(page.locator('article')).toContainText('Tarsus');
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://657.com.tr/adlicevre/adana-adliyesi-yargi-cevresi/');
});
test('unvan maaşı canlı hesap motorundan üretilir ve varsayımlar açıklanır',async({page})=>{
 await page.goto('/orman-muhafaza-memuru-maasi-2026/');
 await expect(page.locator('h1')).toHaveText('Orman Muhafaza Memuru Maaşı 2026');
 await expect(page.locator('article')).toContainText('3 engelli çocuk');
 await expect(page.locator('[data-unvan-donem="2026-07-01"]')).toContainText('Temmuz–Aralık 2026');
 await page.goto('/cezaevi-muduru-maasi-2026/');await expect(page.locator('[data-unvan-dusuk="ana"]')).toContainText('TL');
});
test('adli çevre ve maaş yazıları mobil temalarda taşmaz',async({page})=>{
 for(const path of ['/adlicevre/','/adlicevre/adana-adliyesi-yargi-cevresi/','/orman-muhafaza-memuru-maasi-2026/']){
  await page.goto(path);
  for(const theme of ['light','dark'])for(const width of [320,375,414,768]){
   await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth),`${path} ${theme} ${width}`).toBeLessThanOrEqual(0);
  }
 }
});
