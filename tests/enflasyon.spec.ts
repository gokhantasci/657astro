import { test, expect } from '@playwright/test';
import { enflasyonFarki, yukariYuvarla } from '../src/lib/enflasyon';

const k = { memur_maas_aylik_katsayi: 1.575511, taban_aylik_katsayi: 25.794915, yan_odeme_katsayi: 0.499648, asgari_ucret: 28075.5 };
const s = { bedelli_askerlik_gosterge: 240000, yeni_bedelli_askerlik_gosterge: 300000, muhtar_gosterge: 14750, seyyanen_zam_gosterge: 15965 };
const resmi = [{ degisim: 1.78, endeks: 132.31 }, { degisim: 1.84, endeks: 134.75 }, { degisim: 1.84, endeks: 137.23 }];
const girdi = (tahmin: number[]) => ({ bazEndeks: 129.99, topluSozlesmeZam: 7, sonrakiZam: 5, aylar: [...resmi, ...tahmin.map(degisim => ({ degisim }))] });

test('fark oluşmazsa gereken enflasyon hesaplanır ve katsayı yalnızca sonraki zamla artar', () => {
 const r = enflasyonFarki(girdi([0, 0, 0]), k, s);
 // Canlı sitenin formülüyle: ((137,23 / 129,99) * 100 / 107) * 100 - 100 = -1,34
 expect(r.fark).toBe(-1.34);
 expect(r.gerekenEnflasyon).toBeCloseTo((129.99 * 107) / 137.23 - 100, 10);
 expect(r.kumulatifZam).toBe(5);
 expect(r.yeni.aylik).toBeCloseTo(1.575511 * 1.05, 10);
});

test('fark oluşunca canlıdaki hesapla aynı sonuç verir', () => {
 const r = enflasyonFarki(girdi([1.5, 1.4, 1.2]), k, s);
 const son = 137.23 * 1.015 * 1.014 * 1.012;
 const fark = Number(((((son / 129.99) * 100) / 107) * 100 - 100).toFixed(2));
 expect(r.sonEndeks).toBeCloseTo(son, 10);
 expect(r.fark).toBe(fark);
 expect(fark).toBeGreaterThan(0);
 const kum = yukariYuvarla(100 * (1 + fark / 100) * 1.05 - 100, 2);
 expect(r.kumulatifZam).toBe(kum);
 expect(r.yeni.bedelli).toBeCloseTo(240000 * 1.575511 * (1 + kum / 100), 6);
 expect(r.aylikToplam).toBe(yukariYuvarla(1.78 + 1.84 + 1.84 + 1.5 + 1.4 + 1.2, 2));
});

test('negatif aylık enflasyon reddedilir', () => {
 expect(() => enflasyonFarki(girdi([-1, 0, 0]), k, s)).toThrow();
});

test('sayfa: resmî aylar kilitli, tahmin girilince sonuç yenilenir', async ({ page }) => {
 await page.goto('/enflasyon-farki-hesaplama-robotu/');
 await expect(page.locator('#ay-0')).toHaveAttribute('readonly', '');
 await expect(page.locator('[data-e-deger]')).toHaveText('%1,35 daha');
 await page.locator('#ay-3').fill('1,5');
 await page.locator('#ay-4').fill('1,4');
 await page.locator('#ay-5').fill('1,2');
 await expect(page.locator('[data-e-baslik]')).toHaveText('Beklenen enflasyon farkı');
 await page.reload();
 await expect(page.locator('#ay-3')).toHaveValue('1,5');
 await page.locator('#ay-4').fill('-2');
 await expect(page.locator('[data-e-hata]')).toBeVisible();
 await page.getByRole('button', { name: 'Tahminleri sıfırla' }).click();
 await expect(page.locator('[data-e-deger]')).toHaveText('%1,35 daha');
});
