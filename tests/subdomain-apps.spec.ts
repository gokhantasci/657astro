import { test, expect } from '@playwright/test';

test('GYS bağımsız subdomain sitesi (/gys-app/) ayrı marka, tema ve zayıf konu analiziyle açılır', async ({ page }) => {
  await page.goto('/gys-app/');
  await expect(page.locator('html')).toHaveAttribute('data-sub-tema', 'gys');
  await expect(page.locator('.sub-brand__badge')).toHaveText('GYS · 657');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://gys.657.com.tr/');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/gys-manifest.webmanifest');
  await expect(page.locator('.bar__nav a', { hasText: 'Teftiş' })).toHaveCount(0);
  await page.locator('[data-gys-sonsuz]').click();
  await expect(page.locator('[data-gys-soru-metin]')).not.toBeEmpty();
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('On Parmak bağımsız subdomain sitesi (/on-parmak-app/) ayrı marka, tema ve 90 kelime barajıyla açılır', async ({ page }) => {
  await page.goto('/on-parmak-app/');
  await expect(page.locator('html')).toHaveAttribute('data-sub-tema', 'onparmak');
  await expect(page.locator('.sub-brand__badge')).toHaveText('KLAVYE · 657');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://onparmak.657.com.tr/');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/onparmak-manifest.webmanifest');
  await expect(page.locator('[data-op-baraj-metin]')).toContainText('90');
  await expect(page.locator('.bar__nav a', { hasText: 'Teftiş' })).toHaveCount(0);
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
