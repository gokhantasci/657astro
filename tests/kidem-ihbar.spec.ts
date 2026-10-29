import { test, expect } from '@playwright/test';
import { kidemIhbar, sure, ihbarHaftasi } from '../src/lib/kidem-ihbar';
import veri from '../src/data/kidem-tavanlari.json' with { type: 'json' };
import vergi from '../src/data/vergi.json' with { type: 'json' };

const T = veri.tavanlar;

test('Saffet Çelik SSS örneği: 60.000 TL, 10 yıl → brüt 600.000, damga 4.554, net 595.446', () => {
  const r = kidemIhbar({ giris: '2016-07-01', cikis: '2026-06-30', ucret: 60000, ihbar: false }, T, vergi);
  expect(r.sure).toMatchObject({ yil: 10, ay: 0, gun: 0 });
  expect([r.brutKidem, r.damgaKidem, r.netKidem]).toEqual([600000, 4554, 595446]);
});

test('tavan çıkış tarihine göre: 2026/2 için 73.729,87 TL; ihbarda tavan yok', () => {
  const r = kidemIhbar({ giris: '2022-07-01', cikis: '2026-10-30', ucret: 100000, ihbar: true }, T, vergi);
  expect(r.tavanUygulandi).toBe(true);
  // Çıkış günü dahil 4 yıl 3 ay 30 gün: 73.729,87 × 4 + 73.729,87/12 × 3 + 73.729,87/365 × 30 = 319.411,94
  expect(r.sure).toMatchObject({ yil: 4, ay: 3, gun: 30 });
  expect(r.brutKidem).toBe(319411.94);
  // 3 yıldan fazla: 8 hafta; 100.000/30 × 56 = 186.666,67; önceki matrah 0 → ilk dilimler.
  expect(r.ihbarHafta).toBe(8);
  expect(r.brutIhbar).toBe(186666.67);
  expect(r.damgaIhbar).toBe(1416.8);
});

test('ihbar süreleri ve bir yıldan kısa çalışma', () => {
  expect(ihbarHaftasi(sure('2026-01-01', '2026-06-29'))).toBe(2);
  expect(ihbarHaftasi(sure('2026-01-01', '2026-06-30'))).toBe(4);
  expect(ihbarHaftasi(sure('2024-01-01', '2026-12-31'))).toBe(6);
  expect(ihbarHaftasi(sure('2023-01-01', '2026-01-01'))).toBe(8);
  const r = kidemIhbar({ giris: '2026-01-01', cikis: '2026-10-30', ucret: 40000, ihbar: true }, T, vergi);
  expect(r.kidemHakki).toBe(false);
  expect(r.brutKidem).toBe(0);
  expect(() => kidemIhbar({ giris: '2020-01-01', cikis: '2024-01-01', ucret: 1, ihbar: false }, T, vergi)).toThrow('tavanı');
});

test('sayfa: varsayılan örnek, tarih alanı gg.aa.yyyy ve yeniden hesap', async ({ page }) => {
  await page.goto('/kidem-ihbar-tazminati-hesaplama/');
  await expect(page.locator('#giris-gun')).toHaveValue('01-03-2016');
  await page.locator('#ucret').fill('80.000');
  await expect(page.locator('[data-ki="tavan"]')).toHaveText('73.729,87 TL');
  await expect(page.locator('[data-ki="sure"]')).toContainText('tavan uygulandı');
});

// Saffet Çelik canlı karşılaştırması (30.10.2026, scripts/kaynak/saffet-kidem.mjs). Süre aynı olduğunda kıdem, her
// durumda %15 dilimindeki ihbar neti birebir eşleşir. Saffet 365/30 günlük blok kullandığı için artık yıllarda süreyi
// fazla sayar (ör. 01.01.2010–31.12.2025 için 16 yıl 0 ay 3 gün); takvim yöntemi tam 16 yıl bulur.
for (const o of [
  { giris: '2024-02-29', cikis: '2026-02-28', ucret: 70000, netKidem: 128911.62, netIhbar: 82556.18 },
  { giris: '2016-07-01', cikis: '2026-06-30', ucret: 60000, netKidem: 595446, netIhbar: 94349.92 },
  { giris: '2010-01-01', cikis: '2025-12-31', ucret: 52000, netKidem: 825685.12, netIhbar: 81769.93 },
  { giris: '2025-03-10', cikis: '2026-08-05', ucret: 33030, netKidem: 46130.51, netIhbar: 25969.82 },
]) test(`Saffet karşılaştırması ${o.giris} – ${o.cikis}`, () => {
  const r = kidemIhbar({ ...o, ihbar: true }, T, vergi);
  expect(r.netKidem).toBe(o.netKidem);
  expect(r.netIhbar).toBe(o.netIhbar);
});
