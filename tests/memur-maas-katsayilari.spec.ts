import { test, expect } from '@playwright/test';
test('katsayı arşivi: dönem tablosu ve grafik 320–1440 px genişlikte yatay kaydırmasız', async ({ page }) => {
  for (const w of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('/memur-maas-katsayilari/');
    const r = await page.evaluate(() => { const t = document.querySelector('.katsayi-tablo')!; const k = t.closest('.maas-tablo')!; return { kap: k.scrollWidth - k.clientWidth, sayfa: document.documentElement.scrollWidth - innerWidth, grafik: (() => { const g = document.querySelector('.grafik')!; return g.scrollWidth - g.clientWidth; })() }; });
    expect(r.kap).toBeLessThanOrEqual(0); expect(r.sayfa).toBeLessThanOrEqual(0); expect(r.grafik).toBeLessThanOrEqual(0);
  }
});

test('katsayı arşivi: dar ekranda her dönem etiketli kart', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/memur-maas-katsayilari/');
  const ilk = page.locator('.katsayi-tablo tbody tr').first();
  await expect(ilk.locator('td[data-etiket="Aylık katsayı"]')).toBeVisible();
  expect(await ilk.evaluate(tr => getComputedStyle(tr).display)).toBe('grid');
});
