import { test, expect } from '@playwright/test';
import { tapuHarci } from '../src/lib/tapu-harci';
import veri from '../src/data/tapu-tarifesi.json' with { type: 'json' };

const t = veri.donemler[0];

test('Saffet Çelik SSS örnekleri: 3.000.000 TL → 60.000 + 60.000 harç, katsayı 1 → 2.227 TL; alıcı 62.227 TL', () => {
  expect(tapuHarci({ bedel: 3000000, emlakDegeri: 0, katsayi: 1 }, t)).toMatchObject({ aliciHarc: 60000, saticiHarc: 60000, doner: 2227, aliciToplam: 62227 });
  expect(tapuHarci({ bedel: 1000000, emlakDegeri: 0, katsayi: 1 }, t)).toMatchObject({ aliciHarc: 20000, aliciToplam: 22227 });
});

test('emlak vergi değeri yüksekse esas alınır; katsayı 3 → 6.681 TL; ek taşınmaz 307 × katsayı', () => {
  const r = tapuHarci({ bedel: 1000000, emlakDegeri: 1500000, katsayi: 3, ekTasinmaz: 2 }, t);
  expect(r).toMatchObject({ esas: 1500000, emlakEsas: true, aliciHarc: 90000, doner: 6681 + 307 * 3 * 2 });
  expect(() => tapuHarci({ bedel: 1, emlakDegeri: 0, katsayi: 4 }, t)).toThrow('katsayı');
});

test('matrah kesri, asgari harç, bağımsız bölüm ve yetki dışı ayrımları', () => {
  expect(tapuHarci({bedel: 1000009.99, emlakDegeri: 0, katsayi: 1}, t).aliciHarc).toBe(20000);
  expect(tapuHarci({bedel: 1000, emlakDegeri: 0, katsayi: 1, ekTasinmaz: 2}, t).aliciHarc).toBe(1234.8);
  expect(tapuHarci({bedel: 1000000, emlakDegeri: 0, katsayi: 3, ekTasinmaz: 2, bagimsizBolum: true, yetkiDisi: true}, t).doner).toBe(40086);
  expect(() => tapuHarci({bedel: Infinity, emlakDegeri: 0, katsayi: 1}, t)).toThrow('Geçerli');
});

test('sayfa: WordPress adresinde açılır ve yeniden hesaplar', async ({ page }) => {
  await page.goto('/tapu-harci-hesaplama-2/');
  await expect(page.locator('[data-th="aliciToplam"]')).toHaveText('62.227,00 TL');
  await page.locator('#katsayi').fill('2,5');
  await expect(page.locator('[data-th="doner"]')).toHaveText('5.567,50 TL');
});
