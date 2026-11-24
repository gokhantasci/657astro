import { test, expect } from '@playwright/test';

const SAYFALAR = [
  { yol: '/on-parmak/dersler/', baslik: /On Parmak/i },
  { yol: '/hizli-okuma/', baslik: /Hızlı Okuma/i },
  { yol: '/hesaplamalar/', baslik: /Hesaplamalar/i },
  { yol: '/qr-kod-olusturma/', baslik: /QR Kod/i },
  { yol: '/bulmaca/', baslik: /Bulmaca/i },
  { yol: '/tarihte-bugun/', baslik: /Tarihte Bugün/i },
  { yol: '/tekerlemeler/', baslik: /Tekerleme/i },
];

test.describe('M5 Bilişim port modülleri — temel yükleme ve taşma kontrolü', () => {
  for (const s of SAYFALAR) {
    test(`${s.yol} masaüstü ve mobilde hatasız açılır`, async ({ page }) => {
      const hatalar: string[] = [];
      page.on('pageerror', (err) => hatalar.push(err.message));

      if (s.yol === '/tarihte-bugun/') {
        await page.route('**/onthisday/**', (route) =>
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              selected: [{ year: 1923, text: 'Türkiye Cumhuriyeti ilan edildi.' }],
              births: [{ year: 1881, text: 'Mustafa Kemal Atatürk doğdu.' }],
              deaths: [],
            }),
          })
        );
      }

      await page.setViewportSize({ width: 1440, height: 900 });
      const res = await page.goto(s.yol, { waitUntil: 'domcontentloaded' });
      expect(res?.status()).toBe(200);
      await expect(page.locator('h1').first()).toContainText(s.baslik);

      const tasmaMasaustu = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(tasmaMasaustu).toBeLessThanOrEqual(2);

      await page.setViewportSize({ width: 375, height: 812 });
      const tasmaMobil = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(tasmaMobil).toBeLessThanOrEqual(2);
      expect(hatalar).toEqual([]);
    });
  }
});

test.describe('M5 Bilişim port modülleri — etkileşim testleri', () => {
  test('On Parmak Dersleri: F/Q geçişi ve harf yazma ilerlemesi', async ({ page }) => {
    await page.goto('/on-parmak/dersler/');
    await expect(page.locator('[data-d-liste] .dr-item')).toHaveCount(12);
    await page.locator('[data-d-duzen="q"]').click();
    await expect(page.locator('[data-d-liste] .dr-item')).toHaveCount(10);

    const ilkHarf = await page.locator('[data-d-hedef] .dr-ch--cur').textContent();
    expect(ilkHarf).toBeTruthy();
    const inp = page.locator('[data-d-giris]');
    await inp.click();
    await inp.fill(ilkHarf!);
    await expect(page.locator('[data-d-hedef] .dr-ch--ok')).toHaveCount(1);
  });

  test('Hızlı Okuma: sekmeler ve 5x5 Schulte tablosu', async ({ page }) => {
    await page.goto('/hizli-okuma/');
    await page.locator('[data-ho-tab="schulte"]').click();
    await expect(page.locator('[data-ho-sch-grid] button')).toHaveCount(25);
    await page.locator('[data-ho-tab="rsvp"]').click();
    await expect(page.locator('[data-ho-rsvp-ekran]')).toBeVisible();
    await page.locator('[data-ho-tab="takistoskop"]').click();
    await expect(page.locator('[data-ho-tak-ekran]')).toBeVisible();
  });

  test('QR Kod Oluşturucu: tuval üretir ve tür değişir', async ({ page }) => {
    await page.goto('/qr-kod-olusturma/');
    await expect(page.locator('[data-qr-durum]')).toContainText(/ISO\/IEC 18004/i);
    const boyut = await page.locator('[data-qr-canvas]').evaluate((c: HTMLCanvasElement) => ({
      w: c.width,
      h: c.height,
    }));
    expect(boyut.w).toBeGreaterThan(50);
    expect(boyut.h).toBeGreaterThan(50);

    await page.locator('[data-qr-tur]').selectOption('wifi');
    await expect(page.locator('[data-qr-alan="wifi"]')).toBeVisible();
  });

  test('Günlük Hesaplamalar: KDV, VKİ ve kelime sayacı canlı hesaplar', async ({ page }) => {
    await page.goto('/hesaplamalar/');
    await expect(page.locator('[data-h-kdv-out]')).toContainText('1.200');
    await expect(page.locator('[data-h-vki-out]')).toContainText(/VKİ/i);
    await page.locator('[data-h-ks-in]').fill('Adalet mülkün temelidir.');
    await expect(page.locator('[data-h-ks-out]')).toContainText('3');
  });

  test('Bulmaca: Wordle, Hukuk Terimi ve 8x8 Kelime Avı çalışır', async ({ page }) => {
    await page.goto('/bulmaca/');
    await page.locator('[data-bm-w-in]').fill('KANUN');
    await page.locator('[data-bm-w-btn]').click();
    await expect(page.locator('[data-bm-w-grid] .bm-w-row').first()).toContainText('K');

    await page.locator('[data-bm-tab="hukuk"]').click();
    await expect(page.locator('[data-bm-h-ipucu]')).not.toBeEmpty();

    await page.locator('[data-bm-tab="avi"]').click();
    await expect(page.locator('[data-bm-a-grid] button')).toHaveCount(64);
  });

  test('Tarihte Bugün: olay listesi yüklenir', async ({ page }) => {
    await page.route('**/onthisday/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [{ year: 1923, text: 'Cumhuriyet ilan edildi.' }],
          births: [{ year: 1881, text: 'Atatürk doğdu.' }],
          deaths: [],
        }),
      })
    );
    await page.goto('/tarihte-bugun/');
    await expect(page.locator('[data-tb-olaylar]')).toContainText('Cumhuriyet ilan edildi');
  });

  test('Tekerlemeler: 29 harf filtresi ve arama çalışır', async ({ page }) => {
    await page.goto('/tekerlemeler/');
    // Tümü + 29 harf = 30 buton
    await expect(page.locator('[data-tk-harf]')).toHaveCount(30);
    await page.locator('[data-tk-harf="B"]').click();
    await expect(page.locator('[data-tk-grup="B"]')).toBeVisible();
    await expect(page.locator('[data-tk-grup="A"]')).toBeHidden();
  });
});
