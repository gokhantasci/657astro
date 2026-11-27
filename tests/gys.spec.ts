import { test, expect } from '@playwright/test';
import mufredat from '../src/data/gys-mufredat.json' with { type: 'json' };
import sorular from '../src/data/gys-sorular.json' with { type: 'json' };
import konular from '../src/data/gys-konular.json' with { type: 'json' };
import sorularIcra from '../src/data/gys-sorular-icra.json' with { type: 'json' };
import sorularGenelge from '../src/data/gys-sorular-genelgeler.json' with { type: 'json' };
import { soruyuHazirla, unvanSorulari, kitapcikOlustur, hataliSorulariGetir, type GysSoru } from '../src/lib/gys-motor';

const SORULAR = sorular as unknown as GysSoru[];

test.describe('GYS Sınav Motoru birim testleri', () => {
  test('kombinatoryal soru havuzu 5 şıklı ve 2 şıklı modda doğru sayıda şık üretir', () => {
    const havuzSorusu = SORULAR.find((s) => s.id === 't7201-01')!;
    const klasik = soruyuHazirla(havuzSorusu, 'klasik');
    expect(klasik.siklar).toHaveLength(5);
    expect(klasik.siklar.filter((x) => x.dogru)).toHaveLength(1);
    expect(klasik.varyasyonSayisi).toBeGreaterThan(100);

    const ikili = soruyuHazirla(havuzSorusu, 'ikili');
    expect(ikili.siklar).toHaveLength(2);
    expect(ikili.siklar.filter((x) => x.dogru)).toHaveLength(1);
  });

  test('tek soru havuzu farklı ünvanlarda sorumlu olunan bölümlere göre paylaşılır', () => {
    const yim = mufredat.unvanlar.find((u) => u.id === 'yazi-isleri-muduru')!;
    const zk = mufredat.unvanlar.find((u) => u.id === 'zabit-katibi')!;
    const yimSorular = unvanSorulari(yim, SORULAR);
    const zkSorular = unvanSorulari(zk, SORULAR);
    expect(yimSorular.some((s) => s.bolum === '7201:cezai')).toBe(true);
    expect(zkSorular.some((s) => s.bolum === '7201:cezai')).toBe(false);
    expect(yimSorular.some((s) => s.id === 't7201-07')).toBe(true);
    expect(zkSorular.some((s) => s.id === 't7201-07')).toBe(true);
  });

  test('ağırlıklı kitapçık ve dönemsel hata filtreleri doğru çalışır', () => {
    const yim = mufredat.unvanlar[0];
    const kitap = kitapcikOlustur(yim, SORULAR, { mod: 'klasik', toplamSoru: 15, agirlikli: true });
    expect(kitap).toHaveLength(15);

    const hatalar = {
      't7201-01': { soruId: 't7201-01', tarih: '2026-11-24', hataSayisi: 3, sonDogru: false },
      't7201-07': { soruId: 't7201-07', tarih: '2026-11-10', hataSayisi: 1, sonDogru: false },
    };
    expect(hataliSorulariGetir(hatalar, SORULAR, 'gunluk', '2026-11-24').map((s) => s.id)).toEqual(['t7201-01']);
    expect(hataliSorulariGetir(hatalar, SORULAR, 'encok', '2026-11-24')[0].id).toBe('t7201-01');
  });

  test('her ders kimliğinin müfredatta okunur bir adı vardır', () => {
    const tanimli = new Set(mufredat.kanunlar.map((k) => k.id));
    const tum = [...SORULAR, ...(sorularIcra as unknown as GysSoru[]), ...(sorularGenelge as unknown as GysSoru[])];
    for (const s of tum) expect(tanimli.has(s.kanun), s.id).toBe(true);
  });
});

test.describe('gys.657.com.tr çalışma ekranı', () => {
  test('sınav seçimi ve ayarlar hatırlanır, test başlayınca sekme başlığı değişir', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/gys-app/');
    await expect(page.locator('h1')).toContainText('Görevde yükselme');
    const ilkBaslik = await page.title();

    // Bakanlık → birim → sınav türü → ünvan
    const secici = page.locator('[data-gys-secici]');
    for (const id of ['adalet-bakanligi', 'adalet-tasra', 'adalet-tasra-gys', 'yazi-isleri-muduru']) {
      await secici.locator(`[data-gys-dugum-sec="${id}"]`).click();
    }
    await expect(page.locator('[data-gys-secim-ad]')).toHaveText('Yazı İşleri Müdürü');

    // Arama ile başka bir ünvana geç ve geri dön
    await page.locator('[data-gys-secici-ara]').fill('cte idare');
    await expect(page.locator('[data-gys-ara-sec]').first()).toContainText('İdare Memuru');
    await page.locator('[data-gys-secici-ara]').press('Escape');
    await page.locator('[data-gys-secim-tamam]').click();
    await expect(secici).toBeHidden();

    await page.locator('[data-gys-adet] label', { hasText: '10' }).click();
    await page.locator('[data-gys-mod] label', { hasText: '2 şık' }).click();

    // Yenilemeden sonra seçim kapalı özet olarak, ayarlar seçili gelir
    await page.reload();
    await expect(secici).toBeHidden();
    await expect(page.locator('[data-gys-secim-ad]')).toHaveText('Yazı İşleri Müdürü');
    await expect(page.locator('input[name="gys-adet"][value="10"]')).toBeChecked();
    await expect(page.locator('input[name="gys-mod"][value="ikili"]')).toBeChecked();

    await page.locator('[data-gys-baslat]').click();
    await expect(page.locator('[data-gys-sahne]')).toBeVisible();
    await expect(page.locator('[data-gys-siklar] .gys-sik')).toHaveCount(2);
    await expect(page).toHaveTitle(/^Soru 1 \/ 10 · Yazı İşleri Müdürü testi/);

    await page.locator('[data-gys-siklar] .gys-sik').first().click();
    await expect(page.locator('[data-gys-aciklama]')).toBeVisible();
    await expect(page.locator('[data-gys-aciklama]')).toContainText('Mevzuat metni');
    await page.locator('[data-gys-sonraki]').click();
    await expect(page).toHaveTitle(/^Soru 2 \/ 10/);

    // Geri dönülen soru yeniden sayılmaz
    await page.locator('[data-gys-onceki]').click();
    await expect(page.locator('[data-gys-siklar] .gys-sik').first()).toBeDisabled();

    await page.locator('[data-gys-bitir]').click();
    await expect(page).toHaveTitle(/^Sonuç 1\/1/);
    await page.locator('[data-gys-ayarlara]').click();
    await expect(page).toHaveTitle(ilkBaslik);
  });

  test('baskı kitapçığı ve adres parametresiyle konu testi', async ({ page }) => {
    await page.goto('/gys-app/');
    await page.locator('[data-gys-tab="pdf"]').click();
    await page.locator('[data-gys-pdf-uret]').click();
    await expect(page.locator('[data-gys-pdf-onizleme]')).toContainText('657.com.tr');
    await expect(page.locator('[data-gys-pdf-onizleme]')).toContainText('Cevap Anahtarı');

    await page.goto('/gys-app/?konu=657-dmk');
    await expect(page.locator('[data-gys-sahne]')).toBeVisible();
    await expect(page).toHaveTitle(/657 Devlet Memurları Kanunu/);
    await expect(page).toHaveURL(/\/gys-app\/$/);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/gys-app/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
  });
});

test.describe('gys.657.com.tr dizin sayfaları ve site haritası', () => {
  test('konu, soru ve sınav sayfaları canonical ve yapılandırılmış veriyle derlenir', async ({ page, request }) => {
    await page.goto('/gys-app/konular/');
    await expect(page.locator('[data-gys-konu]')).toHaveCount(konular.length);
    await page.locator('[data-gys-konu-ara]').fill('tebligat');
    await expect(page.locator('[data-gys-konu]:visible')).not.toHaveCount(konular.length);

    await page.goto('/gys-app/soru/t7201-07/');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://gys.657.com.tr/soru/t7201-07/');
    await expect(page.locator('h1')).toContainText('Elektronik yolla tebligat');
    await expect(page.locator('.gys-statik-siklar li')).toHaveCount(5);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((x) => x.includes('"Quiz"') && x.includes('acceptedAnswer'))).toBe(true);

    await page.goto('/gys-app/konu/7201-tebligat-kanunu/');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://gys.657.com.tr/konu/7201-tebligat-kanunu/');
    await expect(page.locator('.gys-bag-liste a[href^="/soru/"]').first()).toBeVisible();

    await page.goto('/gys-app/sinav/yazi-isleri-muduru/');
    await expect(page.locator('h1')).toContainText('Yazı İşleri Müdürü');
    await expect(page.locator('a[href="/?secim=yazi-isleri-muduru&baslat=1"]')).toBeVisible();

    const harita = await (await request.get('/gys-app/sitemap.xml')).text();
    expect(harita).toContain('<loc>https://gys.657.com.tr/soru/t7201-01/</loc>');
    expect(harita).toContain('<loc>https://gys.657.com.tr/konu/657-dmk/</loc>');
    expect(harita).toContain('<loc>https://gys.657.com.tr/sinav/cte-ikinci-mudur/</loc>');
    expect(harita).not.toContain('/gys-app/');
    const robots = await (await request.get('/gys-app/robots.txt')).text();
    expect(robots).toContain('Sitemap: https://gys.657.com.tr/sitemap.xml');
  });
});
