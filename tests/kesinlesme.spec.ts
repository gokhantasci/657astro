import { test, expect } from '@playwright/test';
import { kesinlesme, noktali } from '../src/lib/kesinlesme';
import veri from '../src/data/tatiller.json' with { type: 'json' };

const T = veri.tatiller;
const k = (teblig: string, n: number, tur: 'gun' | 'hafta' | 'ay') => kesinlesme(teblig, n, tur, T);

test('düz iş günü: 2 hafta sonrası, ertesi gün kesinleşir', () => {
 const r = k('2026-10-05', 2, 'hafta'); // Pazartesi
 expect(noktali(r.son)).toBe('19.10.2026');
 expect(noktali(r.kesin)).toBe('20.10.2026');
 expect(r.notlar).toHaveLength(0);
});

test('son gün Cumartesi ise Pazartesiye kayar', () => {
 const r = k('2026-10-03', 1, 'hafta'); // 10.10.2026 Cumartesi
 expect(noktali(r.son)).toBe('12.10.2026');
 expect(r.notlar[0].metin).toContain('Cumartesi');
});

test('yarım gün tatil: süre ertesi güne uzar ve Yargıtay kararı bağlanır', () => {
 const r = k('2026-10-21', 1, 'hafta'); // 28.10.2026 yarım gün, 29.10 tatil
 expect(noktali(r.son)).toBe('30.10.2026');
 expect(r.notlar[0].baglanti?.href).toContain('yarim-gun-tatile');
});

test('dört günlük bayram ve hafta sonu sonunda iş gününe ulaşılır (canlıdaki 3 tur sınırı düzeltildi)', () => {
 const r = k('2026-05-20', 1, 'hafta'); // 27.05.2026 Kurban Bayramı 1. gün; 28-30 bayram, 31 Pazar
 expect(noktali(r.son)).toBe('01.06.2026');
 expect(noktali(r.kesin)).toBe('02.06.2026');
});

test('adli tatilde tebliğ 1 Eylül sayılır; adli tatile düşen son gün 3 Eylüle uzar', () => {
 expect(noktali(k('2026-08-10', 1, 'hafta').teblig)).toBe('01.09.2026');
 const r = k('2026-07-10', 2, 'hafta'); // 24.07.2026 adli tatil
 expect(noktali(r.son)).toBe('03.09.2026');
});

test('ay süresinde karşılık gün yoksa ayın son günü biter (canlıdaki taşma düzeltildi)', () => {
 expect(noktali(k('2026-01-31', 1, 'ay').son)).toBe('02.03.2026'); // 28.02.2026 Cumartesi → Pazartesi 02.03
 expect(noktali(k('2027-01-29', 1, 'ay').son)).toBe('01.03.2027'); // 28.02.2027 Pazar → 01.03
 expect(noktali(k('2026-03-31', 1, 'ay').son)).toBe('30.04.2026');
});

test('sayfa: bağlantıyla gelen tarih hesaplanır, kaydırma düğmeleri çalışır', async ({ page }) => {
 await page.goto('/kesinlesme/?teblig=2026-05-20&sure=1&tur=hafta');
 await expect(page.locator('[data-k-tarih]')).toHaveText('02.06.2026');
 await expect(page.locator('[data-k-gun]')).toHaveText('Salı');
 await expect(page.locator('[data-k-notlar] li')).not.toHaveCount(0);
 await page.getByRole('button', { name: '1 gün ileri' }).click();
 await expect(page.locator('#teblig')).toHaveValue('2026-05-21');
 await page.locator('#teblig').fill('2023-03-01');
 await expect(page.locator('[data-k-uyari]')).toBeVisible();
 // Diyanet listeleri 2024–2035 yıllarını kapsar.
 await expect(page.locator('.tatiller__yil')).toHaveCount(12);
});

test('tebliğ tarihi tarayıcı dilinden bağımsız gg-aa-yyyy görünür ve yazılabilir', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en-US' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/kesinlesme/?teblig=2026-10-26&sure=1&tur=hafta');
  const gun = page.locator('#teblig-gun');
  await expect(gun).toHaveValue('26-10-2026');
  await gun.fill('');
  await gun.pressSequentially('01092026');
  await expect(gun).toHaveValue('01-09-2026');
  await expect(page.locator('#teblig')).toHaveValue('2026-09-01');
  await page.getByRole('button', { name: '1 gün ileri' }).click();
  await expect(gun).toHaveValue('02-09-2026');
  await context.close();
});
