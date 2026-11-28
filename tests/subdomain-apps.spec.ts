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

  // Çoklu bakanlık seçici: ilk ziyarette açık, bakanlık seçilince birimler görünür
  const secici = page.locator('[data-gys-secici]');
  await expect(secici).toBeVisible();
  await expect(secici).toContainText('Millî Eğitim Bakanlığı');
  await secici.locator('[data-gys-dugum-sec="adalet-bakanligi"]').click();
  await expect(secici).toContainText('Taşra Teşkilatı');
  await expect(secici).toContainText('Merkez Teşkilatı');

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

test('eski /on-parmak/ ve /gys/ yönlendirmeleri sorgu ve # kısmını korur', async ({ page }) => {
  // Canlı alt alan adına gidilmez; hedef istek yakalanıp boş sayfa döner.
  await page.route(/https:\/\/(onparmak|gys)\.657\.com\.tr\/.*/, (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>hedef</title>' }));
  await page.goto('/on-parmak/?grup=cte-2026&metin=2');
  await expect(page).toHaveURL('https://onparmak.657.com.tr/?grup=cte-2026&metin=2');
  await page.goto('/gys/?secim=yazi-isleri-muduru#gys-takvim');
  await expect(page).toHaveURL('https://gys.657.com.tr/?secim=yazi-isleri-muduru#gys-takvim');
});
