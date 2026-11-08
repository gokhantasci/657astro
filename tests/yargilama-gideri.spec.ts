import { test, expect } from '@playwright/test';
import * as XLSX from 'xlsx';
import { hesapla, excelSay, satirBul, dokumTL, birimUcretTL, tarifeTutarMetni, type Ucretler } from '../src/lib/yargilama-gideri';
import {ucretler as dogrulanan} from '../src/lib/tebligat-veri';
import { hukumMetni } from '../src/lib/paylasim';
import veri from '../src/data/tebligat-ucretleri.json' with { type: 'json' };

const u = veri.tablolar as Ucretler;
const bos = () => ({ posta: u.posta.map(() => 0), etebligat: u.etebligat.map(() => 0), eyazisma: u.eyazisma.map(() => 0), kep: u.kep.map(() => 0), kesifharci: u.kesifharci.map(() => 0) });

test('para birimi geçişleri: eski TL, YTL ve TL tarihine göre ayrılır',()=>{
 expect(dogrulanan.posta).toEqual(u.posta);
 const satir=(t:string)=>u.posta[satirBul(u.posta,new Date(t+'T12:00:00'))];
 expect(satir('2004-12-31')).toMatchObject({tutar:3500000,para:'TRL',bitis:'2004-12-31'});
 expect(satir('2005-01-01')).toMatchObject({tutar:3.5,para:'YTL',baslangic:'2005-01-01'});
 expect(satir('2006-06-24').tutar).toBe(3.5);
 expect(satir('2006-06-25')).toMatchObject({tutar:4,para:'YTL'});
 expect(satir('2008-12-31')).toMatchObject({tutar:4.5,para:'YTL'});
 expect(satir('2009-01-01')).toMatchObject({tutar:4.5,para:'TRY'});
 expect(tarifeTutarMetni(satir('2004-12-31'))).toBe('3.500.000,00 eski TL');
 expect(tarifeTutarMetni(satir('2005-01-01'))).toBe('3,50 YTL');
 expect(birimUcretTL(satir('2004-12-31'))).toBe(3.5);
});

test('eski TL milyon kat büyümez; karma dönem UYAP girdileri aynı TL biriminde toplanır',()=>{
 const rows=['2004-12-31','2005-01-01','2006-06-25','2008-12-31','2009-01-01','2026-10-01'].map(t=>({'Dosya No':'2004/1','Gönderi Tipi':'Normal Tebligat','Tebligat Oluşturma Tarihi':t}));
 const {adetler}=excelSay(rows,u);
 const r=hesapla(u,{adetler,giderler:{bilirkisi:[100]}});
 expect(r.ozet.posta.adet).toBe(6);
 expect(r.ozet.posta.tutar).toBe(320);
 expect(r.toplam).toBe(420);
 expect(r.dokum).toContain('6 adet Tebligat Gideri : ₺320.00');
});

test('eski TL önce birime dönüştürülür, birim tutar kuruşa erken yuvarlanmaz',()=>{
 const adetler=bos();
 const i=satirBul(u.posta,new Date(1984,0,1));
 expect(birimUcretTL(u.posta[i])).toBe(0.00015);
 adetler.posta[i]=10000;
 expect(hesapla(u,{adetler,giderler:{}}).toplam).toBeCloseTo(1.5,10);
});

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
 await expect(page.locator('#tablo-etebligat')).toBeVisible();
 await expect(page.locator('#tablo-posta')).toBeVisible();
 await expect(page.locator('#tablo-kep')).toBeVisible();
 await expect(page.locator('#tablo-posta [data-yg-satir]:visible')).toHaveCount(5);
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
