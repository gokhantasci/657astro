import { test, expect } from '@playwright/test';

test.describe('Türkiye Yargı Haritası & Etik İlkeleri', () => {
  test('Yargı haritası sayfası doğru yüklenir, 81 il ve katmanlar çalışır', async ({ page }) => {
    await page.goto('/yargi-haritasi/');

    // Başlık ve yapı kontrolü
    await expect(page.locator('h1')).toHaveText('Türkiye Yargı Haritası');
    const svg = page.locator('#yargi-svg');
    await expect(svg).toBeVisible();

    // 81 il kontrolü
    const iller = page.locator('.yargi-il');
    await expect(iller).toHaveCount(81);

    // BAM / BİM Katman geçişi
    const bimBtn = page.locator('[data-yargi-layer="bim"]');
    const bamBtn = page.locator('[data-yargi-layer="bam"]');

    await expect(bamBtn).toHaveClass(/btn--primary/);
    await bimBtn.click();
    await expect(bimBtn).toHaveClass(/btn--primary/);
    await expect(bamBtn).toHaveClass(/btn--quiet/);

    // Adana iline tıklandığında detay paneli açılır
    const adana = page.locator('#il-01');
    await page.screenshot({ path: 'artifacts/yargi-haritasi-genel.png' });
    await adana.click();

    const panel = page.locator('#yargi-detay-paneli');
    await expect(panel.locator('h2')).toHaveText('Adana');
    await expect(panel).toContainText('Ağır Ceza Mahalli');
    await expect(panel).toContainText('Faal Adliye');
    await expect(panel).toContainText('Adana BİM');
    await expect(panel).toContainText('Adana İdare Mahkemesi');
    await page.screenshot({ path: 'artifacts/yargi-haritasi-detay.png' });

    // Arama kutusu testi (Alanya araması)
    const search = page.locator('#yargi-arama-input');
    await search.fill('Alanya');
    const dropdown = page.locator('#yargi-arama-sonuclar');
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toContainText('Alanya İlçesi');

    await dropdown.locator('.yargi-arama-oge').first().click();
    await expect(panel.locator('h2')).toHaveText('Antalya');
    await expect(panel).toContainText('Alanya ACM');
  });

  test('Kocaeli ilçe ve ACM bağlılıkları doğrulanır (Darıca, Çayırova, Dilovası -> Gebze ACM)', async ({ page }) => {
    await page.goto('/yargi-haritasi/');

    const kocaeli = page.locator('#il-41');
    await kocaeli.click();

    const panel = page.locator('#yargi-detay-paneli');
    await expect(panel.locator('h2')).toHaveText('Kocaeli');

    // Darıca satırı kontrolü (Gebze ACM & Gebze Adliyesi)
    const daricaRow = panel.locator('tr').filter({ has: page.locator('td:first-child strong', { hasText: /^Darıca$/ }) });
    await expect(daricaRow).toBeVisible();
    await expect(daricaRow).toContainText('Gebze ACM');
    await expect(daricaRow).toContainText('Gebze Adliyesi');
    await expect(daricaRow).toContainText('Adliye Yok');

    // Çayırova satırı kontrolü (Gebze ACM & Gebze Adliyesi)
    const cayirovaRow = panel.locator('tr').filter({ has: page.locator('td:first-child strong', { hasText: /^Çayırova$/ }) });
    await expect(cayirovaRow).toBeVisible();
    await expect(cayirovaRow).toContainText('Gebze ACM');
    await expect(cayirovaRow).toContainText('Gebze Adliyesi');
    await expect(cayirovaRow).toContainText('Adliye Yok');

    // Dilovası satırı kontrolü (Gebze ACM & Gebze Adliyesi)
    const dilovasiRow = panel.locator('tr').filter({ has: page.locator('td:first-child strong', { hasText: /^Dilovası$/ }) });
    await expect(dilovasiRow).toBeVisible();
    await expect(dilovasiRow).toContainText('Gebze ACM');
    await expect(dilovasiRow).toContainText('Gebze Adliyesi');
    await expect(dilovasiRow).toContainText('Adliye Yok');

    // Gebze satırı kontrolü (Faal Adliye ACM)
    const gebzeRow = panel.locator('tr').filter({ has: page.locator('td:first-child strong', { hasText: /^Gebze$/ }) });
    await expect(gebzeRow).toBeVisible();
    await expect(gebzeRow).toContainText('Faal Adliye (ACM)');
    await expect(gebzeRow).toContainText('Gebze ACM');

    // Körfez satırı kontrolü (Kocaeli ACM Mülhakatı)
    const korfezRow = panel.locator('tr').filter({ has: page.locator('td:first-child strong', { hasText: /^Körfez$/ }) });
    await expect(korfezRow).toBeVisible();
    await expect(korfezRow).toContainText('Faal Adliye (Mülhakat)');
    await expect(korfezRow).toContainText('Kocaeli ACM');

    // Derince satırı kontrolü (Kocaeli ACM & Kocaeli Adliyesi)
    const derinceRow = panel.locator('tr').filter({ has: page.locator('td:first-child strong', { hasText: /^Derince$/ }) });
    await expect(derinceRow).toBeVisible();
    await expect(derinceRow).toContainText('Kocaeli ACM');
    await expect(derinceRow).toContainText('Kocaeli Adliyesi');
    await expect(derinceRow).toContainText('Adliye Yok');

    // Screenshot alıp doğrulayalım
    await page.screenshot({ path: 'artifacts/kocaeli-acm-kontrol.png' });
  });

  test('Müstakil Başsavcılık sayısı ve Faal Adliye ayrımı doğru gösterilir (Sakarya, Karasu, Geyve)', async ({ page }) => {
    await page.goto('/yargi-haritasi/');

    const panel = page.locator('#yargi-detay-paneli');

    // Türkiye genelinde Müstakil Başsavcılık sayısı 249 olmalıdır (597 adliye sayısıdır)
    const genelCbsKutu = panel.locator('.yargi-ozet-kutu', { hasText: 'Müstakil Başsavcılık' });
    await expect(genelCbsKutu.locator('.yargi-ozet-sayi')).toHaveText('249');

    // Sakarya iline tıkla (Plaka 54)
    const sakarya = page.locator('#il-54');
    await sakarya.click();

    await expect(panel.locator('h2')).toHaveText('Sakarya');

    // Sakarya özet kutuları: 1 ACM, 5 Müstakil Başsavcılık, 10 Faal Adliye, 16 Toplam İlçe
    const acmKutu = panel.locator('.yargi-ozet-kutu', { hasText: 'Ağır Ceza Mahalli' });
    await expect(acmKutu.locator('.yargi-ozet-sayi')).toHaveText('1');

    const cbsKutu = panel.locator('.yargi-ozet-kutu', { hasText: 'Müstakil Başsavcılık' });
    await expect(cbsKutu.locator('.yargi-ozet-sayi')).toHaveText('5');

    const adliyeKutu = panel.locator('.yargi-ozet-kutu', { hasText: 'Faal Adliye' });
    await expect(adliyeKutu.locator('.yargi-ozet-sayi')).toHaveText('10');

    // Karasu ilçesi: Müstakil CBS var
    const karasuRow = panel.locator('tr').filter({ has: page.locator('td:first-child strong', { hasText: /^Karasu$/ }) });
    await expect(karasuRow).toBeVisible();
    await expect(karasuRow).toContainText('Faal Adliye');
    await expect(karasuRow).toContainText('Müstakil CBS');

    // Geyve ilçesi: Faal adliye var ama Müstakil CBS yok
    const geyveRow = panel.locator('tr').filter({ has: page.locator('td:first-child strong', { hasText: /^Geyve$/ }) });
    await expect(geyveRow).toBeVisible();
    await expect(geyveRow).toContainText('Faal Adliye');
    await expect(geyveRow).not.toContainText('Müstakil CBS');

    await page.screenshot({ path: 'artifacts/sakarya-cbs-adliye-dogrulama.png' });
  });

  test('Adliye Personeli Etik İlkeleri yazısı eksiksiz yayımlanır', async ({ page }) => {
    await page.goto('/adliye-personeli-etik-ilkeleri/');

    await expect(page.locator('h1')).toHaveText('Adliye Personeli Etik İlkeleri');
    await expect(page.locator('body')).toContainText('ÖNSÖZ');
    await expect(page.locator('body')).toContainText('Akın GÜRLEK');
    await expect(page.locator('body')).toContainText('1. DÜRÜSTLÜK VE TARAFSIZLIK');
    await expect(page.locator('body')).toContainText('2. KURUMSAL AMAÇ VE İLKELERE BAĞLILIK');
    await expect(page.locator('body')).toContainText('3. GÖREVİN YERİNE GETİRİLMESİNDE KAMU HİZMETİ VE ADALET BİLİNCİ');
    await expect(page.locator('body')).toContainText('4. SAYGINLIK, NEZAKET VE GÜVEN');
    await expect(page.locator('body')).toContainText('5. BİLGİ GÜVENLİĞİ VE GİZLİLİK');
    await expect(page.locator('body')).toContainText('6. KAMU KAYNAKLARININ ETKİN VE VERİMLİ KULLANIMI');
    await expect(page.locator('body')).toContainText('7. MENFAAT SAĞLAMA YASAĞI');
    await expect(page.locator('body')).toContainText('8. SOSYAL MEDYANIN ÖZENLİ KULLANIMI');
  });

  test('Asistan sayfasında etik ilkeleri butonu yer alır', async ({ page }) => {
    await page.goto('/asistan/');
    const etikBtn = page.locator('button[data-as-ornek]:has-text("Adliye personeli etik ilkeleri")');
    await expect(etikBtn).toBeVisible();
  });

  test('2027 Yeniden Değerleme Oranı ve Yargı Harçları haberi yayımlanır', async ({ page }) => {
    await page.goto('/2027-yeniden-degerleme-orani-yargi-harclari-parasal-sinirlar-ve-vergiler/');
    await page.screenshot({ path: 'artifacts/yeniden-degerleme-haberi.png' });
    await expect(page.locator('h1')).toContainText('2027 Yılı Yeniden Değerleme Oranı Belli Oldu');
    await expect(page.locator('body')).toContainText('%27,83');
    await expect(page.locator('body')).toContainText('HMK m. 341');
    await expect(page.locator('body')).toContainText('935,70 TL');
    await expect(page.locator('body')).toContainText('237.760 TL');
    await expect(page.locator('body')).toContainText('385,02 TL');
  });
});
