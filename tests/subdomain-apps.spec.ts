import { test, expect } from '@playwright/test';

test('GYS bağımsız subdomain sitesi (/gys-app/): light varsayılan tema, çalışan hash sekmeleri, çoklu bakanlık ağacı ve canlı sınav', async ({ page }) => {
  await page.goto('/gys-app/');
  await expect(page.locator('html')).toHaveAttribute('data-sub-tema', 'gys');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.sub-brand__badge')).toHaveText('GYS · 657');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://gys.657.com.tr/');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/gys-manifest.webmanifest');
  await expect(page.locator('.bar__nav a', { hasText: 'Teftiş' })).toHaveCount(0);

  // Tema geçişi: light -> dark
  await page.locator('[data-sub-tema-btn]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('[data-sub-tema-btn]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  // Çoklu bakanlık + Adalet Bakanlığı Taşra/Merkez ağacı
  await expect(page.locator('[data-gys-agac]')).toContainText('Adalet Bakanlığı');
  await expect(page.locator('[data-gys-agac]')).toContainText('Taşra Teşkilatı');
  await expect(page.locator('[data-gys-agac]')).toContainText('Merkez Teşkilatı');
  await expect(page.locator('[data-gys-agac]')).toContainText('Millî Eğitim Bakanlığı');

  // Hash bağlantıları ilgili sekmeyi anında açar
  await page.goto('/gys-app/#gys-studyo');
  await expect(page.locator('#gys-studyo')).toBeVisible();
  await page.goto('/gys-app/#gys-takvim');
  await expect(page.locator('#gys-takvim')).toBeVisible();
  await expect(page.locator('#gys-takvim')).toContainText('mevzuat.gov.tr');
  await page.goto('/gys-app/#gys-performans');
  await expect(page.locator('#gys-performans')).toBeVisible();
  await page.goto('/gys-app/#gys-canli-sinav');
  await expect(page.locator('#gys-canli-sinav')).toBeVisible();

  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('On Parmak bağımsız subdomain sitesi (/on-parmak-app/): light tema, arşiv yüklemesi, 90 kelime barajı ve canlı sınav', async ({ page }) => {
  await page.goto('/on-parmak-app/');
  await expect(page.locator('html')).toHaveAttribute('data-sub-tema', 'onparmak');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.sub-brand__badge')).toHaveText('KLAVYE · 657');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://onparmak.657.com.tr/');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/onparmak-manifest.webmanifest');
  await expect(page.locator('[data-op-baraj-metin]')).toContainText('90');
  await expect(page.locator('[data-op-yukleniyor]')).toBeHidden({ timeout: 10000 });
  await expect(page.locator('#op-canli-sinav')).toBeVisible();
  await expect(page.locator('[data-op-paket-indir]')).toBeVisible();

  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
