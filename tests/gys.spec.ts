import { test, expect } from '@playwright/test';
import mufredat from '../src/data/gys-mufredat.json' with { type: 'json' };
import sorular from '../src/data/gys-sorular.json' with { type: 'json' };
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
    // Yazı İşleri Müdürü tüm 7201'den (cezai dahil), Zabıt Kâtibi ise genel/usul/elektronikten sorumlu
    expect(yimSorular.some((s) => s.bolum === '7201:cezai')).toBe(true);
    expect(zkSorular.some((s) => s.bolum === '7201:cezai')).toBe(false);
    // Ortak 7201:elektronik soruları her ikisinde de yer alır
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
});

test.describe('/gys/ arayüz ve etkileşim testleri', () => {
  test('ünvan seçimi, 5/2 şıklı sınav, konu kitapçığı ve 657.com.tr test kitapçığı çalışır', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/gys/');
    await expect(page.locator('h1')).toContainText('Görevde Yükselme Sınavı');

    // İkili modda test başlat -> 2 şık görünmeli
    await page.locator('[data-gys-mod]').selectOption('ikili');
    await page.locator('[data-gys-adet]').selectOption('10');
    await page.locator('[data-gys-baslat]').click();
    await expect(page.locator('[data-gys-sahne]')).toBeVisible();
    await expect(page.locator('[data-gys-siklar] .gys-sik')).toHaveCount(2);

    // İlk şıkkı cevapla -> açıklama ve mevzuat kaynağı açılır
    await page.locator('[data-gys-siklar] .gys-sik').first().click();
    await expect(page.locator('[data-gys-aciklama]')).toBeVisible();
    await expect(page.locator('[data-gys-aciklama]')).toContainText('Mevzuat.gov.tr');

    // Test kitapçığı oluştur -> köşede 657.com.tr damgası ve cevap anahtarı bulunur
    await page.locator('[data-gys-tab="pdf"]').click();
    await page.locator('[data-gys-pdf-uret]').click();
    await expect(page.locator('[data-gys-pdf-onizleme]')).toContainText('657.com.tr');
    await expect(page.locator('[data-gys-pdf-onizleme]')).toContainText('Cevap Anahtarı');

    // Mobil taşma kontrolü
    await page.setViewportSize({ width: 375, height: 812 });
    const tasma = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(tasma).toBeLessThanOrEqual(2);
  });
});
