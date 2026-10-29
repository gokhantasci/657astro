import { test, expect } from '@playwright/test';
import * as XLSX from 'xlsx';
import { hesapla, excelSay, satirBul, dokumTL, type Ucretler } from '../src/lib/yargilama-gideri';
import { hukumMetni } from '../src/lib/paylasim';
import veri from '../src/data/tebligat-ucretleri.json' with { type: 'json' };

const u = veri.tablolar as Ucretler;
const bos = () => ({ posta: u.posta.map(() => 0), etebligat: u.etebligat.map(() => 0), eyazisma: u.eyazisma.map(() => 0), kep: u.kep.map(() => 0), kesifharci: u.kesifharci.map(() => 0) });

test('ücret dönemi tarihe göre seçilir; sınır gününde yeni tarife geçerlidir', () => {
 const i = satirBul(u.posta, new Date(2026, 9, 1));
 expect(u.posta[i]).toMatchObject({ tutar: 300, bitis: null });
 expect(u.posta[satirBul(u.posta, new Date(2026, 8, 30))].tutar).toBe(265);
 expect(u.posta[satirBul(u.posta, new Date(1985, 6, 15))].tutar).toBe(300);
});

test('döküm canlıdaki biçimde oluşur', () => {
 const adetler = bos();
 adetler.posta[0] = 3;
 adetler.etebligat[0] = 2;
 const r = hesapla(u, { adetler, giderler: { bilirkisi: [1500, 500], postaGideri: [12.5] } });
 expect(r.toplam).toBe(3 * 300 + 2 * 20 + 2000 + 12.5);
 expect(r.dokum).toBe([
  '3 adet Tebligat Gideri : ₺900.00',
  '2 adet E-Tebligat Gideri : ₺40.00',
  'Posta Gideri : ₺12.50',
  'Bilirkişi Gideri : ₺2000.00',
  '--------------------------',
  'TOPLAM : ₺2952.50',
 ].join('\n'));
 expect(dokumTL(0)).toBe('₺0.00');
});

test('UYAP Excel satırları türüne ve tarihine göre sayılır, APS iki adet', () => {
 const r = excelSay([
  { 'Dosya No': '2026/123', 'Gönderi Tipi': 'APS', 'Tebligat Oluşturma Tarihi': '05.10.2026 10:00:00' },
  { 'Dosya No': '2026/123', 'Gönderi Tipi': 'Normal Tebligat', 'Tebligat Oluşturma Tarihi': '15.09.2026' },
  { 'Dosya No': '2026/123', 'Gönderi Tipi': 'Elektronik Tebligat', 'Tebligat Oluşturma Tarihi': '2026-10-02' },
  { 'Dosya No': '2026/123', 'Gönderi Tipi': 'KEP', 'Tebligat Oluşturma Tarihi': '02.10.2026' },
  { 'Dosya No': 'başlık', 'Gönderi Tipi': 'APS', 'Tebligat Oluşturma Tarihi': '02.10.2026' },
 ], u);
 expect(r.esaslar).toEqual(['2026/123']);
 expect(r.sayac).toMatchObject({ aps: 1, normal: 1, etebligat: 1, kep: 1, tarihsiz: 0 });
 const t = hesapla(u, { adetler: r.adetler, giderler: {} });
 expect(t.ozet.posta).toEqual({ adet: 3, tutar: 2 * 300 + 265 });
 expect(t.ozet.etebligat.tutar).toBe(20);
});

test('paylaşım metni canlıdaki biçimde ve oransal', () => {
 const m = hukumMetni({ yargilama: 1000, vekalet: 0, harc: 300 }, [{ ad: 'A Şirketi', miktar: 3 }, { ad: 'B', miktar: 1 }, { ad: 'Şirket 3', miktar: 0 }]);
 expect(m).toBe([
  "- Harçlar Kanunu uyarınca alınması gereken toplam 300,00 TL'nin; 225.00 TL'sinin A Şirketi'den, 75.00 TL'sinin B'den alınarak hazineye irat kaydına,",
  "- Davacı tarafından yapılan toplam 1.000,00 TL yargılama giderinin; 750.00 TL'sinin A Şirketi'den, 250.00 TL'sinin B'den alınarak davacıya verilmesine,",
 ].join('\n\n'));
});

test('sayfa: Excel yükleme, gider ekleme ve döküm', async ({ page }) => {
 const ws = XLSX.utils.json_to_sheet([
  { 'Dosya No': '2026/77', 'Gönderi Tipi': 'APS', 'Tebligat Oluşturma Tarihi': '05.10.2026' },
  { 'Dosya No': '2026/77', 'Gönderi Tipi': 'Elektronik Tebligat', 'Tebligat Oluşturma Tarihi': '05.10.2026' },
 ]);
 const wb = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb, ws, 'Sayfa1');
 const buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
 await page.goto('/yargilamagideri/');
 await page.locator('[data-yg-dosya]').setInputFiles({ name: 'tebligat.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer });
 await expect(page.locator('[data-yg-durum]')).toContainText('2026/77 esas sayılı dosyada 1 APS');
 await expect(page.locator('[data-yg-dokum]')).toContainText('2 adet Tebligat Gideri : ₺600.00');
 await page.locator('#kalem-bilirkisi').fill('1.500,50');
 await page.locator('[data-yg-kalem="bilirkisi"] [data-yg-ekle]').click();
 await expect(page.locator('[data-yg-dokum]')).toContainText('Bilirkişi Gideri : ₺1500.50');
 await page.getByRole('tab', { name: /E-Tebligat/ }).click();
 await expect(page.locator('#tablo-etebligat')).toBeVisible();
 await expect(page.locator('#tablo-posta')).toBeHidden();
 await page.locator('[data-yg-temizle]').click();
 await expect(page.locator('[data-yg-dokum]')).toHaveText('--------------------------\nTOPLAM : ₺0.00');
});

test('sayfa: paylaşım hüküm metni', async ({ page }) => {
 await page.goto('/yargilama-gideri-paylasim-hesabi/');
 await page.locator('#p-yargilama').fill('1000');
 await page.locator('#taraf-ad-1').fill('A');
 await page.locator('#taraf-miktar-1').fill('1');
 await page.locator('#taraf-miktar-2').fill('1');
 await expect(page.locator('[data-p-hukum]')).toHaveText("- Davacı tarafından yapılan toplam 1.000,00 TL yargılama giderinin; 500.00 TL'sinin A'den, 500.00 TL'sinin Şirket 2'den alınarak davacıya verilmesine,");
 await page.getByRole('button', { name: 'Taraf ekle' }).click();
 await expect(page.locator('[data-p-taraf]')).toHaveCount(4);
 await expect(page.locator('#taraf-ad-4')).toBeFocused();
});
