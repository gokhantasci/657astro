import { test, expect } from '@playwright/test';

test.describe('Türkiye Kamu Misafirhaneleri Haritası ve İl Sayfaları', () => {
  test('ana harita sayfası 81 il, etkileşimli seçim, arama ve sıfır taşma ile çalışır', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/kamu-misafirhaneleri/');
    await expect(page.locator('h1')).toContainText('Kamu Misafirhaneleri');
    await expect(page.locator('.km-il-chip')).toHaveCount(81);

    // Varsayılan Sakarya seçili olmalı
    await expect(page.locator('[data-km-il-baslik]')).toContainText('Sakarya');
    await expect(page.locator('[data-km-kartlar]')).toContainText('Sakarya Polisevi');

    // Haritada Ankara'ya tıklayınca yan panel güncellenir
    await page.locator('#il-06').click();
    await expect(page.locator('[data-km-il-baslik]')).toContainText('Ankara');
    await expect(page.locator('[data-km-kartlar]')).toContainText('Ankara Hakimevi');
    await expect(page.locator('[data-km-il-link]')).toHaveAttribute('href', '/kamu-misafirhaneleri/ankara/');

    // Canlı arama
    await page.locator('[data-km-ara]').fill('Hakimevi');
    await expect(page.locator('[data-km-il-baslik]')).toContainText('Arama Sonuçları');
    await expect(page.locator('[data-km-kartlar]')).toContainText('İstanbul Hakimevi');

    // Sendika filtresi
    await page.locator('[data-km-ara]').fill('');
    await page.locator('#il-06').click();
    await page.locator('[data-km-kurum="Sendika"]').click();
    await expect(page.locator('[data-km-kartlar]')).toContainText('Eğitim-Bir-Sen');

    // Mobil taşma kontrolü
    await page.setViewportSize({ width: 375, height: 812 });
    const tasma = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(tasma).toBeLessThanOrEqual(2);
  });

  test('Sakarya il sayfası SEO, fiyat, resmî web ve Google Maps bağlantılarıyla açılır', async ({ page }) => {
    await page.goto('/kamu-misafirhaneleri/sakarya/');
    await expect(page.locator('h1')).toContainText('Sakarya Kamu Misafirhaneleri');
    expect(await page.locator('.kmi-kart').count()).toBeGreaterThanOrEqual(5);
    await expect(page.locator('main')).toContainText('Sakarya Polisevi');
    await expect(page.locator('main')).toContainText('Sakarya Büyükşehir Öğretmenevi');
    await expect(page.locator('main')).toContainText('120,00 TL');

    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(schemas.join('')).toContain('ItemList');
    expect(schemas.join('')).toContain('FAQPage');
    expect(schemas.join('')).toContain('BreadcrumbList');
  });
});
