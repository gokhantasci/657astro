import { test, expect } from '@playwright/test';
import { thhUcret } from '../src/lib/thh-bilirkisi';
import thh from '../src/data/thh-bilirkisi.json' with { type: 'json' };

const o = { damgaBinde: thh.damga_binde, gelirVergisiOran: thh.gelir_vergisi_oran };

test('2026 Ocak tarifesinin satırları gösterge × 1,387871 ile kuruşu kuruşuna eşleşir', () => {
  // Vergiler yuvarlanmamış brütten: 1.110,2968 × %15 = 166,5445 → 166,54.
  // Yazıdaki tablo: 800 gösterge → brüt 1.110,30; damga 10,53; GV 166,54; net 933,23. 2500 → 3.469,68 / 32,89 / 520,45 / 2.916,33.
  expect(thhUcret(800, 1.387871, o)).toEqual({ birim: 1110.3, brut: 1110.3, damga: 10.53, gelirVergisi: 166.54, net: 933.23 });
  expect(thhUcret(2500, 1.387871, o)).toMatchObject({ brut: 3469.68, damga: 32.89, gelirVergisi: 520.45, net: 2916.33 });
});

test('Temmuz 2026 katsayısıyla televizyon ve çok dosya', () => {
  // 2100 × 1,575512 = 3.308,58; damga binde 9,48 = 31,37; GV %15 = 496,29; net 2.780,92.
  expect(thhUcret(2100, 1.575512, o)).toMatchObject({ brut: 3308.58, damga: 31.37, gelirVergisi: 496.29, net: 2780.92 });
  // 3 dosya: 2100 × 1,575512 × 3 = 9.925,7256 → 9.925,73 (tarife gibi yuvarlama en sonda).
  expect(thhUcret(2100, 1.575512, o, 3).brut).toBe(9925.73);
  expect(() => thhUcret(2100, 1.575512, o, 0)).toThrow('Dosya sayısı');
});

test('sayfa: aranabilir ürün seçimi, sonuç ve sayfalı tablo', async ({ page }) => {
  await page.goto('/tuketici-hakem-heyeti-bilirkisi-ucret-hesaplama/');
  await expect(page.locator('[data-thh="net"]')).toHaveText('2.780,92 TL');
  await page.locator('#urun-ara').click();
  await page.locator('#urun-ara').pressSequentially('yatla');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-thh="brut"]')).toHaveText('3.938,78 TL');
  await expect(page.locator('.thh-tablo tbody tr:visible')).toHaveCount(50);
  await page.locator('.tablo-arac input').fill('televizyon');
  await expect(page.locator('.thh-tablo tbody tr:visible')).toHaveCount(1);
});
