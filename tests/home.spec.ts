import { tumSiteHaritasi } from './site-haritasi';
import { test, expect } from '@playwright/test';
import {araclar} from '../src/lib/tools';

test('anasayfa: uygulamalar ve duyurular solda, haberler sağda', async ({ page }) => {
 const errors: string[] = [];
 page.on('pageerror', error => errors.push(error.message));
 await page.goto('/');
 await expect(page.locator('.apps .app')).toHaveCount(3);
 await expect(page.locator('.apps').getByRole('link',{name:/İKM boy ve kilo hesabı/})).toHaveAttribute('href','/infaz-ve-koruma-memuru-boy-kilo-hesaplama/');
 await expect(page.locator('#duyurular .notice')).toHaveCount(3);
 const left = await page.locator('.home__left').boundingBox();
 const right = await page.locator('.home__right').boundingBox();
 expect(left!.x).toBeLessThan(right!.x);
 const news = page.locator('.news li:visible');
 await expect(news).toHaveCount(5);
 const ilk=await news.first().textContent();
 await page.locator('[data-news-next]').click();
 await expect(news).toHaveCount(5);
 expect(await news.first().textContent()).not.toBe(ilk);
 await expect(page.locator('[data-news-status]')).toContainText('2 /');
 await page.locator('label[for="kaynak-cte"]').click();
 for (const chip of await news.locator('.chip').allTextContents()) expect(chip).toBe('CTE');
 await expect(page.locator('.posts__list li')).toHaveCount(4);
 expect(errors).toEqual([]);
});

test('"/" kısayolu araç dizinindeki aramaya götürür', async ({ page }) => {
 await page.goto('/');
 await page.locator('body').click({ position: { x: 5, y: 600 } });
 await page.keyboard.press('/');
 await expect(page).toHaveURL(/\/araclar\/#ara$/);
 await expect(page.locator('[data-dir-input]')).toBeFocused();
});

test('masaya eklenen araç Masam sekmesinde kalır', async ({ page }) => {
 await page.goto('/araclar/');
 await page.locator('[data-pin="tensip"]').click();
 await expect(page.locator('[data-pin="tensip"]')).toHaveAttribute('aria-pressed', 'true');
 await expect(page.locator('[data-masa-count]')).toHaveText('1');
 await page.reload();
 await page.locator('label[for="alan-masa"]').click();
 await expect(page.locator('[data-row]:visible')).toHaveCount(1);
 await expect(page.locator('[data-row]:visible')).toHaveAttribute('data-id', 'tensip');
});

test('tema seçimi kalıcıdır', async ({ page }) => {
 await page.emulateMedia({ colorScheme: 'light' });
 await page.goto('/');
 await page.locator('[data-tema]').click();
 await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
 await expect(page.locator('[data-tema]')).toHaveAttribute('aria-label', 'Açık temaya geç');
});

test('araç dizini: alan filtresi, arama ve adres çubuğu', async ({ page }) => {
 await page.goto('/araclar/');
 const rows = page.locator('[data-row]:visible');
 await expect(rows).toHaveCount(araclar.length);
 await page.locator('label[for="alan-teftis"]').click();
 await expect(rows).toHaveCount(17);
 await expect(page).toHaveURL(/alan=teftis/);
 await page.locator('[data-dir-input]').fill('kesin');
 await expect(rows).toHaveCount(2);
 await page.locator('[data-dir-input]').fill('zzzz');
 await expect(page.locator('[data-dir-empty]')).toBeVisible();
 await page.getByRole('button', { name: 'Aramayı temizle' }).click();
 await expect(rows).toHaveCount(araclar.length);
 await page.goto('/araclar/?q=harc');
 await expect(page.locator('[data-dir-input]')).toHaveValue('harc');
});

test('yazılar eski WordPress adresinde açılır', async ({ page }) => {
 await page.goto('/yazilar/');
 await expect(page.locator('.posts__list li')).toHaveCount(53);
 await page.goto('/ptt-uets-ucret-tarifesi-guncellemesi-yayimladi/');
 await expect(page.locator('h1')).toHaveText('PTT UETS Ücret Tarifesi Güncellemesi Yayımladı');
 await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
});

test('SEO: canonical, yapısal veri ve site haritası', async ({ page, request }) => {
 await page.goto('/');
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://657.com.tr/');
 await expect(page.locator('h1')).toHaveCount(1);
 const types = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(t => JSON.parse(t)['@type']);
 expect(types).toEqual(expect.arrayContaining(['Organization', 'WebSite']));
 await page.goto('/araclar/');
 const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(t => JSON.parse(t));
 expect(ld.find(x => x['@type'] === 'CollectionPage').mainEntity.numberOfItems).toBe(araclar.length);
 const sitemap = await tumSiteHaritasi(request);
 expect(sitemap).toContain('https://657.com.tr/haziran-ayi-enflasyon-rakamlari-aciklandi-2/');
 expect(await (await request.get('/llms.txt')).text()).toContain('## Teftiş kontrolleri');
});

for (const width of [320, 375, 414, 768, 1024, 1280, 1920]) {
 test(`${width}px taşma ve mobil menü`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  for (const path of ['/', '/araclar/', '/yazilar/', '/ptt-uets-ucret-tarifesi-guncellemesi-yayimladi/']) {
   await page.goto(path);
   await page.evaluate(() => document.fonts.ready);
   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
  }
  if (width < 960) {
   await page.locator('.menu summary').click();
   await expect(page.locator('.menu__panel')).toBeVisible();
  }
 });
}

test('hukuk sözlüğü: arama, harf sayfası ve eski terim adresi', async ({ page, request }) => {
 await page.goto('/hukuk-sozlugu/');
 await page.locator('[data-sozluk-input]').fill('ehlivukuf');
 const sonuc = page.locator('[data-sozluk-sonuc] li');
 await expect(sonuc.first()).toContainText(/ehlivukuf/i);
 await expect(page).toHaveURL(/\?q=ehlivukuf/);
 await page.locator('[data-sozluk-input]').fill('zzzqqq');
 await expect(page.locator('[data-sozluk-status]')).toContainText('bulunamadı');
 await page.goto('/hukuk-sozlugu/harf/c/');
 await expect(page.locator('h1')).toHaveText('C, Ç ile başlayan hukuk terimleri');
 await page.goto('/kelime/adati-ticariye-ne-demek/');
 await expect(page.locator('h1')).toHaveText('ÂDATI TİCARİYE ne demek?');
 const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(t => JSON.parse(t));
 expect(ld.some(x => x['@type'] === 'DefinedTerm')).toBe(true);
 expect((await request.get('/kelime/tuzuk-ne-demek/')).ok()).toBe(true);
});

test('yazı görseli ve paylaşım görseli', async ({ page }) => {
 await page.goto('/adalet-bakanligi-kadrolu-personelin-istege-bagli-nakil-sonuclari-yayimlandi/');
 await expect(page.locator('.article__gorsel img')).toHaveAttribute('alt', /İsteğe bağlı nakil/);
 // Derlenmiş sitede /_astro/...jpeg, geliştirme sunucusunda /_image/ uç noktası döner.
 await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/657\.com\.tr\/(_astro\/.+\.jpe?g|_image\/)/);
 const article = await page.locator('.article').boundingBox();
 // Makale menüyle aynı genişlikte: sol kenarı logoyla, sağ kenarı menünün en sağındaki bayrakla hizalı.
 const logo = await page.locator('.bar .wordmark').boundingBox();
 const tema = await page.locator('.bar__bayrak').boundingBox();
 expect(Math.round(article!.x)).toBe(Math.round(logo!.x));
 expect(Math.round(article!.x + article!.width)).toBe(Math.round(tema!.x + tema!.width));
});

test('mülakat kartları: yükleme, çevirme, klavye, süzgeç ve okunan sayısı', async ({ page }) => {
 const errors: string[] = [];
 page.on('pageerror', e => errors.push(e.message));
 await page.goto('/cikmis-mulakat-sorulari/?kart=davanin-baska-sehirde-tayin-edilmesi-neden-olur');
 const cevir = page.locator('[data-kart-cevir]');
 await expect(cevir).toBeEnabled();
 await expect(page.locator('[data-kart-soru]')).toHaveText('Davanın başka şehirde tayin edilmesi neden olur?');
 await page.keyboard.press('Space');
 await expect(cevir).toHaveAttribute('aria-pressed', 'true');
 await expect(page.locator('[data-kart-okunan]')).toHaveText('1');
 await page.keyboard.press('ArrowRight');
 await expect(cevir).toHaveAttribute('aria-pressed', 'false');
 await expect(page).not.toHaveURL(/kart=davanin-baska/);
 await expect(page.locator('[data-kart-sayfa]')).toHaveAttribute('href', /^\/[^/]+\/$/);
 await page.locator('label[for="kf-mulakat"]').click();
 await expect(page.locator('[data-kart-soru]')).not.toHaveText('Kartlar yükleniyor…');
 await page.locator('[data-kart-buyut]').click();
 await expect(page.locator('[data-kart-boyut]')).toHaveText('110%');
 await expect(page.locator('.terimler li')).toHaveCount(100);
 expect(errors).toEqual([]);
});

test('mülakat sorusu eski adresinde ve sayfalı liste', async ({ page, request }) => {
 await page.goto('/davanin-baska-sehirde-tayin-edilmesi-neden-olur/');
 await expect(page.locator('h1')).toHaveText('Davanın başka şehirde tayin edilmesi neden olur?');
 await expect(page.locator('.soru__cevap p')).toHaveCount(3);
 const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(t => JSON.parse(t));
 expect(ld.some(x => x['@type'] === 'FAQPage')).toBe(true);
 await page.getByRole('link', { name: 'Kartlarla çalış' }).click();
 await expect(page.locator('[data-kart-soru]')).toHaveText('Davanın başka şehirde tayin edilmesi neden olur?');
 expect((await request.get('/' + encodeURIComponent('200₺-uzerinde-kimin-resmi-bulunmaktadir') + '/')).ok()).toBe(true);
 await page.goto('/cikmis-mulakat-sorulari/sayfa/23/');
 await expect(page.locator('.sayfalar a[aria-current="page"]')).toHaveText('23');
});
