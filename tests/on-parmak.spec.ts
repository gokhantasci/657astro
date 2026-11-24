import { test, expect } from '@playwright/test';
import { metinHazirla, sinavDegerlendir, hataTuruBelirle } from '../src/lib/klavye-degerlendirme';

test.describe('Resmî Adalet Bakanlığı değerlendirme motoru birim testleri', () => {
  test('imlasız, imlasız-özel ve imlalı metin dönüştürme kuralları doğru çalışır', () => {
    const ornek = 'T.C. Adalet Bakanlığı, 2026 yılında (90 kelime) sınav yapar!';
    expect(metinHazirla(ornek, 'imlasiz')).toBe('t c adalet bakanlığı 2026 yılında 90 kelime sınav yapar');
    expect(metinHazirla(ornek, 'imlali')).toBe(ornek);
  });

  test('tüm resmî hata türlerini (fazla/eksik vuruş, yer değiştirme, karakter, bölme, birleştirme, fazla boşluk) doğru sınıflandırır', () => {
    expect(hataTuruBelirle('adalet', 'adalet')).toBe('dogru');
    expect(hataTuruBelirle('adalet', 'adalett')).toBe('fazla-vurus');
    expect(hataTuruBelirle('adalet', 'adale')).toBe('eksik-vurus');
    expect(hataTuruBelirle('adalet', 'adalte')).toBe('harf-yer-degistirme');
    expect(hataTuruBelirle('adalet', '.dalet')).toBe('karakter');

    // Kelime birleştirme
    const birles = sinavDegerlendir('adalet bakanlığı personel genel', 'adaletbakanlığı personel genel', 60, 180);
    expect(birles.hataDagilimi.kelimeBirlestirme).toBe(1);
    expect(birles.dogruKelime).toBe(2);

    // Kelime bölme (doğru harflerle -> 1 hata)
    const bolme = sinavDegerlendir('adalet bakanlığı', 'ad al et bakanlığı', 60, 180);
    expect(bolme.hataDagilimi.kelimeBolme).toBe(1);
    expect(bolme.dogruKelime).toBe(1);

    // Fazla boşluk hatası (1 kelime hatası, netten düşülür)
    const bosluk = sinavDegerlendir('adalet bakanlığı', 'adalet   bakanlığı', 60, 180);
    expect(bosluk.fazlaBoslukHatasi).toBe(1);
    expect(bosluk.netKelime).toBe(1);
  });

  test('90 net barajı, %25 anlam bütünlüğü ve 22 kelime atlama sınırlarını denetler', () => {
    const yuzKelime = Array.from({ length: 100 }, (_, i) => `kelime${i}`).join(' ');
    const tamBasari = sinavDegerlendir(yuzKelime, yuzKelime, 180, 180);
    expect(tamBasari.basarili).toBe(true);
    expect(tamBasari.netKelime).toBe(100);
    expect(tamBasari.anlamButunlugu).toBe(true);

    // 22+ kelime atlama -> başarısız (her 4 kelimede 1 atlayarak lookahead içinde 25 kelime atla)
    const kelimeler = Array.from({ length: 140 }, (_, i) => `sozcuk${i}`);
    const atlamaliYazilan = kelimeler.filter((_, i) => i % 5 !== 2).join(' ');
    const atlamaSonuc = sinavDegerlendir(kelimeler.join(' '), atlamaliYazilan, 180, 180);
    expect(atlamaSonuc.atlananKelime).toBeGreaterThanOrEqual(22);
    expect(atlamaSonuc.atlamaSiniriAsildi).toBe(true);
    expect(atlamaSonuc.basarili).toBe(false);

    // %25'ten fazla hata oranı -> anlam bütünlüğü ihlali
    const yanlisli = Array.from({ length: 100 }, (_, i) => (i < 30 ? 'yanlisxyz' : `kelime${i}`)).join(' ');
    const butunluk = sinavDegerlendir(yuzKelime, yanlisli, 180, 180);
    expect(butunluk.hataOrani).toBeGreaterThan(25);
    expect(butunluk.anlamButunlugu).toBe(false);
    expect(butunluk.basarili).toBe(false);
  });
});

test.describe('On Parmak Klavye Sınavı arayüzü ve entegrasyonu', () => {
  test('sayfa yüklenir, metin arşivi gelir, F/Q klavye ve sınav akışı eksiksiz çalışır', async ({ page }) => {
    await page.goto('/on-parmak/');
    await expect(page.locator('h1')).toContainText('On Parmak');
    await expect(page.locator('[data-op-yukleniyor]')).toBeHidden({ timeout: 15000 });

    // 14 grup yüklenmiş olmalı (PGM, CTE, HSK, Daktilografi)
    const grupSayisi = await page.locator('[data-op-grup] option').count();
    expect(grupSayisi).toBeGreaterThanOrEqual(12);

    // Hedef metin dolu olmalı
    const hedef = await page.locator('[data-op-hedef]').innerText();
    expect(hedef.trim().split(/\s+/).length).toBeGreaterThan(50);

    // Sanal klavye F -> Q geçişi
    await expect(page.locator('[data-op-klavye] .op-kb__key[data-key="f"]')).toBeVisible();
    await page.locator('[data-op-klavye-duzen="q"]').click();
    await expect(page.locator('[data-op-klavye-duzen="q"]')).toHaveAttribute('aria-pressed', 'true');

    // Süre değiştirme (1:00)
    await page.locator('[data-op-sure="60"]').click();
    await expect(page.locator('[data-op-kalan]')).toHaveText('01:00');

    // Yazmaya başlayınca otomatik başlama ve canlı metrikler (1 kasıtlı hata ile)
    const ilkKelimeler = hedef.trim().split(/\s+/).slice(0, 5);
    const yazilacak = [...ilkKelimeler.slice(0, 4), ilkKelimeler[4] + 'x'].join(' ') + ' ';
    const giris = page.locator('[data-op-giris]');
    await giris.click();
    await giris.fill(yazilacak);
    await expect(page.locator('[data-op-c-dogru]')).toHaveText('4');
    await expect(page.locator('[data-op-c-yanlis]')).toHaveText('1');

    // Sınavı bitir -> Uygulama Sonuç Tutanağı açılır, benzer kelime egzersizi ve sayaç güncellenir
    await page.locator('[data-op-bitir]').click();
    await expect(page.locator('[data-op-sonuc]')).toBeVisible();
    await expect(page.locator('[data-op-sonuc]')).toContainText('Uygulama Sonuç Tutanağı');
    await expect(page.locator('[data-op-sonuc]')).toContainText('Fazla Vuruş Hatası');
    await expect(page.locator('[data-op-gecmis]')).toContainText('Toplam çalışma: 1');
    await expect(page.locator('[data-op-gecmis-indir]')).toBeVisible();
    await expect(page.locator('[data-op-metin-sayac]')).toContainText('Bugün: 1');
    await expect(page.locator('[data-op-zor] tbody tr')).toHaveCount(1);

    // Hatalı kelimelere benzer kelimelerle çalış düğmesi özel egzersiz yükler
    await page.locator('[data-op-benzer-calis]').click();
    await expect(page.locator('[data-op-kaynak-bilgi]')).toContainText('Benzer Kelime Egzersizi');

    // JSON-LD şemaları kontrolü
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(schemas.join('')).toContain('WebApplication');
    expect(schemas.join('')).toContain('FAQPage');
  });

  test('URL parametreleriyle doğrudan yıl ve metin açılır; yıllık arşiv haberleri yayındadır', async ({ page }) => {
    await page.goto('/on-parmak/?grup=cte-2026&metin=2');
    await expect(page.locator('[data-op-yukleniyor]')).toBeHidden({ timeout: 15000 });
    await expect(page.locator('[data-op-grup]')).toHaveValue('cte-2026');
    await expect(page.locator('[data-op-metin]')).toHaveValue('1');

    // 2026 yıllık arşiv haberi kontrolü
    await page.goto('/2026-yili-zabit-katibi-ve-cte-uygulamali-sinav-metinleri/');
    await expect(page.locator('h1')).toContainText('2026 Yılı Zabıt Kâtibi ve CTE');
    await expect(page.locator('article details')).toHaveCount(60);
  });

  for (const theme of ['light', 'dark']) {
    for (const width of [375, 1440]) {
      test(`${theme} ${width}px: taşma olmadan görünür`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.addInitScript((t) => {
          localStorage.setItem('657:tema', t);
          localStorage.setItem('657:cerez', 'ret');
        }, theme);
        await page.goto('/on-parmak/');
        await expect(page.locator('[data-op-yukleniyor]')).toBeHidden({ timeout: 15000 });
        expect(await page.locator('main').evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
      });
    }
  }
});
