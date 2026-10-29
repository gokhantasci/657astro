import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { tatiller, tatilGunleri } from '../src/lib/tatil-veri';
import { kesinlesme } from '../src/lib/kesinlesme';
import { adliKayitlar, adliSlug, bulunma } from '../src/lib/adlicevre';
import { muhtarDonemleri } from '../src/lib/muhtar-arsivi';
import { gun, donemAraligi } from '../src/lib/bicim';
import { ayristir, baslikDuzelt, tarihOku, KAYNAKLAR } from '../scripts/haberler.mjs';

test('tarihler gg.aa.yyyy biçiminde', () => {
  expect(gun('2026-07-01')).toBe('01.07.2026');
  expect(donemAraligi({ baslangic: '2026-07-01', bitis: '2026-12-31' })).toBe('01.07.2026 – 31.12.2026');
});

test('resmî tatiller Diyanet listeleriyle 2024–2035, çakışan günler hesapta tek gün', () => {
  const yil = (y: string) => tatiller.filter(t => t.tarih.startsWith(y));
  // 2027: 19 Mayıs, Kurban Bayramı 4. günüyle aynı gün; Diyanet ikisini ayrı satırda sayar (17 tatil, 16 gün).
  expect(yil('2027')).toHaveLength(17);
  expect(new Set(yil('2027').map(t => t.tarih)).size).toBe(16);
  // Eski veride 2028 Kurban Bayramı Haziran'daydı; Diyanet'e göre 5–8 Mayıs, arefe 4 Mayıs.
  expect(yil('2028').filter(t => t.ad.startsWith('Kurban')).map(t => t.tarih)).toEqual(['2028-05-04', '2028-05-05', '2028-05-06', '2028-05-07', '2028-05-08']);
  expect(Math.max(...tatiller.map(t => Number(t.tarih.slice(0, 4))))).toBe(2035);
  // Yılbaşıyla çakışan arefe tam gün sayılır.
  expect(tatilGunleri.find(t => t.tarih === '2033-01-01')).toMatchObject({ yarim: false });
  expect(new Set(tatilGunleri.map(t => t.tarih)).size).toBe(tatilGunleri.length);
});

test('kesinleşme: 28 Ekim yarım gün tatil Yargıtay kararıyla uzar ve karar sitede', () => {
  // Tebliğ 21.10.2026 + 1 hafta = 28.10.2026 (yarım gün) → süre 30.10.2026 Cuma biter, kesinleşme 31.10.2026.
  const r = kesinlesme('2026-10-21', 1, 'hafta', tatilGunleri);
  const not = r.notlar.find(n => n.baglanti);
  expect(not?.baglanti?.href).toBe('/tebligin-son-gunu-yarim-gun-tatile-denk-gelirse-surenin-uzayacagi-karari/');
});

test('adli çevre sayfaları kaynak JSON ve şablondan üretilir, WordPress adresleri korunur', () => {
  expect(adliSlug('Karaisalı Adliyesi Yargı Çevresi')).toBe('karaisali-adliyesi-yargi-cevresi');
  expect(bulunma('Tarsus')).toBe("Tarsus'ta");
  expect(bulunma('Kadıköy')).toBe("Kadıköy'de");
  const kaynak = JSON.parse(readFileSync('src/data/adli-teskilat.json', 'utf8'));
  expect(adliKayitlar.filter(k => k.kaynak)).toHaveLength(kaynak.length);
  const adana = adliKayitlar.find(k => k.slug === 'adana-adliyesi-yargi-cevresi')!;
  expect(adana.icerik).toContain('<strong>Tarsus</strong> Ağır Ceza Mahkemesidir');
  expect(adana.icerik).toContain('Ağır Ceza Merkezli adliyelerdendir');
  const onDokuz = adliKayitlar.find(k => k.slug === 'ondokuz-mayis-adliyesi-yargi-cevresi')!;
  expect(onDokuz.icerik).toContain('Bafra Adliyesi ile <strong>birleştirilmiştir</strong>');
});

test('adli çevre: eski 19-may adresi güncel kayda yönlenir', async ({ page }) => {
  await page.goto('/adlicevre/19-may-adliyesi-yargi-cevresi/');
  await expect(page).toHaveURL(/\/adlicevre\/ondokuz-mayis-adliyesi-yargi-cevresi\/$/);
  await expect(page.locator('.adli-olgular')).toContainText('Bafra Adliyesi');
});

test('muhtar ödeneği: arşiv + ayarlardaki her dönem', async ({ page }) => {
  expect(muhtarDonemleri[0]).toMatchObject({ yil: 2026, ay: 7, brut: 23238.8, net: 28075.5, kaynak: 'hesap' });
  expect(muhtarDonemleri.find(d => d.yil === 2014 && d.ay === 1)?.net).toBe(1127.1);
  await page.goto('/muhtar-maasi-hesaplama/');
  await expect(page.getByRole('heading', { name: 'Dönemlere göre muhtar ödeneği' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kaynaklar ve kapsam' })).toHaveCount(0);
});

test('haber ayrıştırıcıları canlı sayfa yapılarını okur', () => {
  expect(baslikDuzelt('İSTEĞE BAĞLI ATAMA SONUÇLARI HSK')).toBe('İsteğe Bağlı Atama Sonuçları HSK');
  expect(tarihOku('4.09.2026')).toBe('2026-09-04');
  expect(KAYNAKLAR.map(k => k.ad)).toEqual(expect.arrayContaining(['Bakanlık', 'HSK', 'PGM', 'CTE', 'İİDB', 'EDB', 'Bilirkişilik']));
  const hsk = KAYNAKLAR.find(k => k.ad === 'HSK')!;
  expect(ayristir('<div class=arsivlist><a href=/x-haber target=_blank> <span>27.10.2026</span><div class=baslik>Toplantı yapıldı</div></a></div>', hsk))
    .toEqual([{ source: 'HSK', date: '2026-10-27', title: 'Toplantı yapıldı', url: 'https://hsk.gov.tr/x-haber' }]);
  const pgm = KAYNAKLAR.find(k => k.ad === 'PGM')!;
  expect(ayristir("<table><tr><td><a href='/Home/SayfaDetay/etik'> ADLİYE PERSONELİ ETİK İLKELERİ</a></td><td>20.10.2026</td></tr></table>", pgm)[0])
    .toMatchObject({ title: 'Adliye Personeli Etik İlkeleri', date: '2026-10-20' });
});

test('araç dizini: satır tıklanır, taşınmayan araç bağlantısız ve soluk', async ({ page }) => {
  await page.goto('/araclar/');
  const yakinda = page.locator('[data-row].is-yakinda').first();
  await expect(yakinda.locator('a')).toHaveCount(0);
  await expect(page.locator('a[href^="https://657.com.tr/"]')).toHaveCount(0);
  await page.locator('[data-row][data-id="kesinlesme"] td').first().click();
  await expect(page).toHaveURL(/\/kesinlesme\/$/);
});

test('sözlük araması harf ve terim sayfalarında da var', async ({ page }) => {
  for (const yol of ['/hukuk-sozlugu/harf/a/', '/kelime/abluka-ne-demek/']) {
    await page.goto(yol);
    await page.locator('[data-sozluk-input]').fill('tebligat');
    await expect(page.locator('[data-sozluk-sonuc] a').first()).toBeVisible();
  }
  await expect(page.locator('.okunma').first()).toContainText('kez okundu');
});

test('mülakat kartları okunma sayısı ve öneri formu', async ({ page }) => {
  await page.goto('/turkiyenin-en-kalabalik-sehri-hangisidir/');
  await expect(page.locator('.soru .okunma')).toHaveText(/\d+ kez okundu/);
  await page.goto('/cikmis-mulakat-sorulari/');
  await expect(page.getByRole('link', { name: 'Soru önerin', exact: true })).toHaveAttribute('href', '/oneri/?tur=mulakat');
  await page.goto('/oneri/?tur=mulakat');
  await expect(page.locator('#tur-mulakat')).toBeChecked();
  await expect(page.locator('[data-oneri-etiket="baslik"]')).toHaveText('Soru');
  await page.locator('#oneri-baslik').fill('Türkiye\'nin en kalabalık şehri hangisidir?');
  await expect(page.locator('[data-oneri-var]')).toContainText('Bu soru kartlarda var');
});

test('kurumsal sayfalar, analitik, bayrak ve site haritası', async ({ page, request }) => {
  for (const yol of ['/iletisim/', '/657-com-tr-gizlilik-politikasi-ve-kvkk-aydinlatma-metni/', '/hizmet-sartlari-ve-kullanim-kosullari-2/']) {
    const r = await request.get(yol); expect(r.status(), yol).toBe(200);
    expect(await r.text()).toContain('gokhan@657.com.tr');
  }
  await page.goto('/');
  await expect(page.locator('meta[name="google-site-verification"]')).toHaveAttribute('content', /.+/);
  expect(await page.content()).toContain('GTM-KPCCB5FP');
  await expect(page.locator('.bar__bayrak')).toBeVisible();
  const footerLogo = page.locator('.footer .wordmark');
  await footerLogo.hover();
  await expect(footerLogo).toHaveCSS('text-decoration-line', 'none');
  const dizin = await (await request.get('/sitemap.xml')).text();
  expect(dizin).toContain('<sitemapindex');
  expect(await (await request.get('/sitemap_index.xml')).text()).toBe(dizin);
});

test('uzun yazı tablosunda arama ve ayarlardaki sayfa boyu', async ({ page }) => {
  const boyu = JSON.parse(readFileSync('src/data/ayarlar.json', 'utf8')).site.tablo_sayfa_boyu;
  await page.goto('/2026-yili-tuketici-hakem-heyeti-bilirkisi-ucret-tarifesi/');
  await expect(page.locator('.prose table tbody tr:visible')).toHaveCount(boyu);
  await page.locator('.tablo-arac input').fill('yatlar');
  await expect(page.locator('.prose table tbody tr:visible')).toHaveCount(1);
});

test('çerez şeridi: analitik varsayılan kapalı, seçim hatırlanır ve değiştirilebilir', async ({ page }) => {
  await page.goto('/');
  const dl = await page.evaluate(() => JSON.stringify((window as unknown as { dataLayer: unknown[] }).dataLayer));
  expect(dl).toContain('"analytics_storage":"denied"');
  const serit = page.locator('[data-cerez]');
  await expect(serit).toBeVisible();
  await serit.getByRole('button', { name: 'Reddet' }).click();
  await expect(serit).toBeHidden();
  await page.reload();
  await expect(serit).toBeHidden();
  await page.getByRole('button', { name: 'Çerez tercihi' }).click();
  await expect(serit).toBeVisible();
  await serit.getByRole('button', { name: 'Kabul et' }).click();
  await page.reload();
  expect(await page.evaluate(() => JSON.stringify((window as unknown as { dataLayer: unknown[] }).dataLayer))).toContain('"analytics_storage":"granted"');
});

test('geri sayım: yalnızca etkin ve tarihi gelmemiş sayaçlar, Türkiye saatiyle', async () => {
  const { gelecekSayaclar } = await import('../src/lib/sayaclar');
  const liste = gelecekSayaclar(Date.parse('2026-04-30T14:00:00Z'));
  expect(liste[0]).toEqual({ baslik: 'Adalet Bakanlığı Havuz Tayin İlanı', an: Date.parse('2026-04-30T17:30:00+03:00') });
  expect(gelecekSayaclar(Date.parse('2026-10-29T00:00:00Z'))).toEqual([]);
});
