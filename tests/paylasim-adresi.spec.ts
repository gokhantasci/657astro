import { test, expect } from '@playwright/test';
import { buyukHarfDuzelt } from '../src/lib/bicim';
import { maasOzeti } from '../src/lib/maas-ozeti';
import { paylasimHedefi, paylasimYollari } from '../scripts/paylasim-yollari.mjs';
import { formGirdisi } from '../src/lib/maas-veri';

test('büyük harfli başlıklar kelime başı büyük yazılır, karışık yazım korunur', () => {
  expect(buyukHarfDuzelt('ÂDATI TİCARİYE')).toBe('Âdatı Ticariye');
  expect(buyukHarfDuzelt('TURİST ÖMERİ CANLANDIRAN OYUNCU KİMDİR?')).toBe('Turist Ömeri Canlandıran Oyuncu Kimdir?');
  expect(buyukHarfDuzelt('CMK')).toBe('CMK');
  expect(buyukHarfDuzelt('İstinaf harcı nedir?')).toBe('İstinaf harcı nedir?');
});

test('maaş özeti maaşı değiştiren bilgileri sayar', () => {
  const g = { ...formGirdisi, derece: '3/1', hizmetYili: 16, esCalismiyor: true, sendika: true, bes: false, yabanciDil: '' as const, haciz: 0, cocuk: { kucuk: 1, buyuk: 1, engelliKucuk: 0, engelliBuyuk: 0 } };
  expect(maasOzeti(g)).toEqual(['3/1', '16 hizmet yılı', 'evli, eşi çalışmıyor', '2 çocuk (72 ay altı 1)', 'sendika üyesi']);
  expect(maasOzeti({ ...g, esCalismiyor: false, sendika: false, cocuk: { kucuk: 0, buyuk: 0, engelliKucuk: 0, engelliBuyuk: 0 } })).toEqual(['3/1', '16 hizmet yılı', 'eş yardımı yok', 'sendikasız']);
});

test('paylaşım alt yolu yalnız hesap araçlarında köke çözülür', () => {
  const yollar = paylasimYollari();
  expect(yollar).toContain('/memur-maas-hesaplama/');
  expect(yollar).not.toContain('/adlicevre/');
  expect(yollar).not.toContain('/iddianame/');
  expect(paylasimHedefi('/memur-maas-hesaplama/zabit-katibi/7-2/', yollar)).toBe('/memur-maas-hesaplama/');
  expect(paylasimHedefi('/memur-maas-hesaplama/', yollar)).toBeNull();
  expect(paylasimHedefi('/memur-maas-hesaplama/x.js', yollar)).toBeNull();
});

test('maaş aracı paylaşılan adresten seçimleri yükler, adresi ve başlığı günceller', async ({ page }) => {
  await page.goto('/memur-maas-hesaplama/zabit-katibi/7/2/12-yil/evli/2-cocuklu/sendika-uyesi/');
  const form = page.locator('#maas-form');
  await expect(form.locator('#hizmetYili')).toHaveValue('12');
  await expect(form.locator('#buyuk')).toHaveValue('2');
  await expect(page.locator('[data-m-aciklama]')).toHaveText('7/2 · 12 hizmet yılı · evli, eşi çalışmıyor · 2 çocuk · sendika üyesi');
  await expect(page).toHaveTitle(/^Zabıt Katibi maaşı 7\/2/);
  await expect(page).toHaveURL(/\/memur-maas-hesaplama\/zabit-katibi\/7-2\/12-yil\/evli-es-calismiyor\/2-cocuklu\/sendika-uyesi\/$/);
  // Alan kapalı bir açılır bölümde; kullanıcı seçimiyle aynı input olayı tetiklenir.
  await form.locator('#sendika').evaluate((el: HTMLSelectElement) => { el.value = '0'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page).toHaveURL(/\/sendikasiz\/$/);
  await expect(page.locator('.sonuc__paylas button')).toHaveText('Bağlantıyı kopyala');
  // Düz adreste açılışta adres çubuğu değişmez.
  await page.goto('/memur-maas-hesaplama/');
  await page.waitForTimeout(500);
  expect(new URL(page.url()).pathname).toBe('/memur-maas-hesaplama/');
});

test('sonuç ve tahmin grubu iç kaydırma çubuğu üretmez', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/memur-maas-hesaplama/');
  const grup = page.locator('.maas-ozet-grubu');
  expect(await grup.evaluate(e => getComputedStyle(e).overflowY)).toBe('visible');
  for (const yol of ['/sozlesmeli-memur-maas-hesaplama/', '/asker-emekli-maasi-hesaplama/']) {
    await page.goto(yol);
    await expect(page.locator('.maas-ozet-grubu [data-maas-tahmini]')).toHaveCount(1);
  }
});

test('araç araması adli çevre, sözlük ve mülakatta da arar', async ({ page }) => {
  await page.goto('/araclar/?q=eceabat');
  const sonuc = page.locator('[data-dir-icerik]');
  await expect(sonuc).toBeVisible();
  await expect(sonuc.getByRole('link', { name: /Eceabat Adliyesi Yargı Çevresi/ })).toBeVisible();
  await page.goto('/araclar/?q=tüzük');
  await expect(page.locator('[data-dir-icerik] .dir-icerik__grup h3', { hasText: 'Sözlük' })).toBeVisible();
});

test('sözlük terimi başlık bandında ve büyük harf düzeltilmiş görünür; Piper varsayılan sestir', async ({ page }) => {
  await page.goto('/kelime/adati-ticariye-ne-demek/');
  await expect(page.locator('.portal-sayfa-basligi h1')).toHaveText('Âdatı Ticariye ne demek?');
  await expect(page).toHaveTitle('Âdatı Ticariye ne demek? | Hukuk sözlüğü | 657.com.tr');
  await expect(page.locator('[data-sesli-motor]')).toHaveValue('piper');
});

test('mülakat sorusu sayfası açılır ve başlığı kısa sonek alır', async ({ page }) => {
  const yanit = await page.goto('/turist-omeri-canlandiran-oyuncu-kimdir/');
  expect(yanit?.status()).toBe(200);
  await expect(page).toHaveTitle(/^Turist Ömeri Canlandıran Oyuncu Kimdir\? \| (Çıkmış mülakat soruları|Mülakat) \| 657\.com\.tr$/);
});
