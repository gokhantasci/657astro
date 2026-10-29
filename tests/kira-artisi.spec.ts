import { test, expect } from '@playwright/test';
import { kiraArtisi, oncekiAy } from '../src/lib/kira-artisi';
import veri from '../src/data/tufe-12-ay-ortalama.json' with { type: 'json' };

test('Ekim 2026 yenilemesi Eylül 2026 oranıyla: %31,49 (TÜİK; Türkgün haberi ile doğrulandı)', () => {
  expect(oncekiAy('2026-10')).toBe('2026-09');
  expect(oncekiAy('2026-01')).toBe('2025-12');
  // 30.000 TL × %31,49 = 9.447 → 39.447 TL
  expect(kiraArtisi({ kira: 30000, yenileme: '2026-10' }, veri.aylar)).toMatchObject({ tufe: 31.49, artis: 9447, yeniKira: 39447 });
});

test('sözleşmedeki düşük oran uygulanır; yüksek oran yasal sınıra iner; verisiz ay hata verir', () => {
  expect(kiraArtisi({ kira: 10000, yenileme: '2026-10', sozlesmeOrani: 20 }, veri.aylar).yeniKira).toBe(12000);
  expect(kiraArtisi({ kira: 10000, yenileme: '2026-10', sozlesmeOrani: 50 }, veri.aylar)).toMatchObject({ oran: 31.49, sinirlandi: true });
  expect(() => kiraArtisi({ kira: 10000, yenileme: '2024-06' }, veri.aylar)).toThrow('açıklanmadı');
});

test('sayfa: son yenileme ayı ve yeniden hesap', async ({ page }) => {
  await page.goto('/kira-artis-hesaplama/');
  await expect(page.locator('[data-ka="tufe"]')).toHaveText('%31,49');
  await page.locator('#kira').fill('25.000');
  await expect(page.locator('[data-ka="yeniKira"]')).toHaveText('32.872,50 TL');
});
