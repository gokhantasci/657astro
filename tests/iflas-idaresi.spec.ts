import { test, expect } from '@playwright/test';
import { iflasIdareUcreti, iflasTarifesiSec } from '../src/lib/iflas-idaresi';
import veri from '../src/data/iflas-idaresi.json' with { type: 'json' };

const t = iflasTarifesiSec(veri.tarifeler, '2026-06-30');

test('2026 tarifesi: 1.000.000 TL adi alacak elle türetilen dilimlerle', () => {
  // 75.000 × %9 = 6.750; 150.000 × %7,5 = 11.250; 300.000 × %6 = 18.000; 450.000 × %4,5 = 20.250;
  // kalan 25.000 × %3 = 750. Toplam 57.000 TL; mahkeme en çok bir katı fazlası = 114.000 TL.
  const r = iflasIdareUcreti(1_000_000, t);
  expect(r.ucret).toBe(57000);
  expect(r.mahkemeAzami).toBe(114000);
  expect(r.dilimler.map(d => d.ucret)).toEqual([6750, 11250, 18000, 20250, 750]);
  expect(r.efektifOran).toBe(5.7);
});

test('son dilim ve rehinli ek ücret', () => {
  // 6.075.000 TL'ye kadar: 6.750 + 11.250 + 18.000 + 20.250 + 18.000 + 11.250 + 16.875 + 16.875 = 119.250.
  // 7.075.000 TL: üstteki 1.000.000 × %0,5 = 5.000 → 124.250 TL.
  expect(iflasIdareUcreti(7_075_000, t).ucret).toBe(124250);
  // Rehinli 100.000 TL: 6.750 + 25.000 × %7,5 = 1.875 → 8.625; %25'i = 2.156,25 TL.
  expect(iflasIdareUcreti(50_000, t, 100_000).rehinliEkAzami).toBe(2156.25);
  expect(() => iflasIdareUcreti(0, t)).toThrow('sıfırdan büyük');
  expect(iflasIdareUcreti(1_000_000, iflasTarifesiSec(veri.tarifeler, '2025-12-31')).ucret).toBe(32000);
  expect(() => iflasTarifesiSec(veri.tarifeler, '2023-12-31')).toThrow('kayıtlı tarife yok');
});

test('sayfa: derlemedeki sonuç ve tutar değişimi', async ({ page }) => {
  await page.goto('/iflas-idare-ucreti-hesaplama/');
  await expect(page.locator('[data-iflas="ucret"]')).toHaveText('57.000,00 TL');
  await expect(page.locator('#iflas-form[data-hazir]')).toBeAttached();
  await page.locator('#adi').fill('7075000');
  await expect(page.locator('[data-iflas="ucret"]')).toHaveText('124.250,00 TL');
  await expect(page.locator('[data-iflas="dokum"] tr')).toHaveCount(9);
});
