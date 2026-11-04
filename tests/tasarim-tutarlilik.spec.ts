import { test, expect } from '@playwright/test';

// Her sayfa şablonundan bir örnek: ortak kabuk (başlık bandı), yatay taşma, tek h1 ve iki tema.
// Şablon eklenince buraya bir örnek adres eklenir.
const SABLONLAR: [string, string][] = [
  ['anasayfa', '/'],
  ['araç dizini', '/araclar/'],
  ['bölüm', '/bolum/teftis/'],
  ['kadrolu maaş', '/memur-maas-hesaplama/'],
  ['diğer maaş', '/sozlesmeli-memur-maas-hesaplama/'],
  ['asker emekli', '/asker-emekli-maasi-hesaplama/'],
  ['kamu hesabı', '/ogretmen-ek-ders-hesaplama/'],
  ['enflasyon', '/enflasyon-farki-hesaplama-robotu/'],
  ['yargılama gideri', '/yargilamagideri/'],
  ['kesinleşme', '/kesinlesme/'],
  ['hukuk kararı', '/tam-kabul-hesaplama/'],
  ['hukuk yardımcı', '/miras-payi-hesaplama/'],
  ['teftiş süre', '/iddianame/'],
  ['teftiş aktarım', '/karar/'],
  ['konsolosluk', '/konsolosluk-sorgulama-2/'],
  ['udf', '/udf-donusturucu/'],
  ['sözlük dizini', '/hukuk-sozlugu/'],
  ['sözlük terimi', '/kelime/adati-ticariye-ne-demek/'],
  ['mülakat dizini', '/cikmis-mulakat-sorulari/'],
  ['mülakat sorusu', '/turist-omeri-canlandiran-oyuncu-kimdir/'],
  ['adli çevre dizini', '/adlicevre/'],
  ['adli çevre kaydı', '/adlicevre/abana-adliyesi-yargi-cevresi/'],
  ['unvan maaşları', '/unvan-maaslari/'],
  ['unvan maaşı', '/zabit-katibi-maasi-2026/'],
  ['yazı dizini', '/yazilar/'],
  ['yazı', '/2026-ekim-ayi-enflasyon-verileri/'],
  ['asistan', '/asistan/'],
  ['profil', '/gokhan-tasci-profil/'],
  ['öneri', '/oneri/'],
];
// Başlık bandı yerine kendi başlangıç alanını kullanan şablonlar.
const KENDI_BASLIGI = new Set(['/', '/araclar/', '/yazilar/', '/2026-ekim-ayi-enflasyon-verileri/', '/zabit-katibi-maasi-2026/', '/adlicevre/abana-adliyesi-yargi-cevresi/', '/karar/']);

for (const [ad, yol] of SABLONLAR) {
  test(`tasarım tutarlılığı: ${ad} (${yol})`, async ({ page }) => {
    const hatalar: string[] = [];
    page.on('pageerror', e => hatalar.push(e.message));
    for (const tema of ['light', 'dark'] as const) {
      await page.addInitScript(t => { try { localStorage.setItem('657:tema', t); localStorage.setItem('657:cerez', 'ret'); } catch { /* yok */ } }, tema);
      for (const genislik of [375, 1440]) {
        await page.setViewportSize({ width: genislik, height: 900 });
        const yanit = await page.goto(yol);
        expect(yanit?.status(), `${yol} durum kodu`).toBe(200);
        await expect(page.locator('h1')).toHaveCount(1);
        const tasma = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(tasma, `${yol} ${genislik}px ${tema}: yatay taşma`).toBeLessThanOrEqual(1);
        if (!KENDI_BASLIGI.has(yol)) await expect(page.locator('.portal-sayfa-basligi'), `${yol}: ortak başlık bandı`).toHaveCount(1);
        expect(await page.evaluate(() => document.documentElement.dataset.theme ?? 'light')).toBe(tema);
        const icKaydirma = await page.locator('.maas-ozet-grubu').evaluateAll(l => l.filter(e => e.scrollHeight > e.clientHeight + 1 && getComputedStyle(e).overflowY !== 'visible').length);
        expect(icKaydirma, `${yol}: sonuç grubunda iç kaydırma`).toBe(0);
      }
    }
    expect(hatalar, `${yol}: sayfa hataları`).toEqual([]);
  });
}
