import {test,expect} from '@playwright/test';
import {enflasyonDonemleri,enflasyonSchema} from '../src/lib/enflasyon-veri';
import {enflasyonFarki} from '../src/lib/enflasyon';
import {ayarlar} from '../src/lib/settings';

test('enflasyon önceki yarıyıl ve muhtar netinde damga vergisi',()=>{
 const d=enflasyonDonemleri[0],k=ayarlar.donemler[0];
 const r=enflasyonFarki({bazEndeks:d.baz_endeks.deger,topluSozlesmeZam:d.toplu_sozlesme.zam,sonrakiZam:d.sonraki_zam.zam,aylar:d.aylar.map(a=>({degisim:a.degisim??0,endeks:a.endeks}))},k,ayarlar.sabitler);
 expect(r.fark).toBe(6.09);expect(r.kumulatifZam).toBe(13.52);
 expect(enflasyonSchema.safeParse({...d,aylar:[d.aylar[0],d.aylar[0],...d.aylar.slice(2)]}).success).toBe(false);
 const n=enflasyonFarki({bazEndeks:100,topluSozlesmeZam:0,sonrakiZam:0,aylar:[]},{...k,memur_maas_aylik_katsayi:3,asgari_ucret:1,damga_orani_binde:7.59},ayarlar.sabitler);
 expect(n.mevcut.muhtar).toBe(43914.14);
});

test('sözleşmeli ve emekli hesapları seçili bütçe dönemini kullanır',async({page})=>{
 for(const path of ['/sozlesmeli-memur-maas-hesaplama/','/emekli-memur-maas-hesaplama/']){
  await page.goto(path);const first=await page.locator('[data-d-net]').textContent();
  await page.locator('#butceDonemi').selectOption('2026-01-01');
  await expect(page.locator('[data-d-hata]')).toBeHidden();await expect(page.locator('[data-d-net]')).not.toHaveText(first!);
  await expect(page.locator('[data-d-katsayi]')).toHaveText('1,387871');
  if(path.includes('sozlesmeli'))await expect(page.locator('#ay option').first()).toHaveAttribute('value','1');
 }
});

test('yolluk H cetveli otomatik derece/ek gösterge ve elle üst görev seçimi',async({page})=>{
 await page.goto('/surekli-gorev-yollugu/');
 await page.locator('#yollukDerece').selectOption('5');await page.locator('#yollukKadroDerece').selectOption('5');
 await page.locator('#yollukEkGosterge').fill('0');await expect(page.locator('#gundelik')).toHaveValue('850');
 await page.locator('#yollukEkGosterge').fill('3600');await expect(page.locator('#gundelik')).toHaveValue('870');
 await page.locator('#gundelik').selectOption('925');await expect(page.locator('#yollukYontemi')).toHaveValue('0');
 await page.locator('#yollukEkGosterge').fill('');await expect(page.locator('#gundelik')).toHaveValue('925');
});

test('yazılar kategorileri, 50 kayıt sayfalama ve tür filtresi',async({page})=>{
 await page.goto('/yazilar/');await expect(page.locator('[data-yazi-kaydi]:visible')).toHaveCount(50);
 const first=await page.locator('[data-yazi-kaydi]:visible').first().textContent();
 await page.locator('[data-yazi-sonraki]').click();expect(await page.locator('[data-yazi-kaydi]:visible').first().textContent()).not.toBe(first);
 await page.locator('#yazi-ara').fill('Yazı işleri müdürü');await expect(page.locator('[data-yazi-kaydi]:visible')).not.toHaveCount(0);
 await page.goto('/yazilar/kategori/ekonomi/');await expect(page.locator('h1')).toHaveText('Ekonomi yazıları');
 await expect(page.locator('[data-yazi-kaydi]:visible')).not.toHaveCount(0);
});

test('enflasyon açıklaması tahminle yenilenir, aylık haber ve önceki altı ay erişilir',async({page})=>{
 await page.goto('/enflasyon-farki-hesaplama-robotu/');
 await expect(page.locator('[data-e-anlatim]')).toContainText('bölme yoluyla');
 await page.locator('#ay-4').fill('4');await expect(page.locator('[data-e-anlatim]')).toContainText('pozitif enflasyon farkı');
 await page.getByRole('link',{name:'2026 Ocak - Haziran Dönemi'}).click();
 await expect(page.locator('h1')).toHaveText('2026 Ocak-Haziran enflasyon özeti');
 await page.getByRole('link',{name:'Haziran 2026 hesabı'}).click();await expect(page.locator('main')).toContainText('%13,52');
 await expect(page.locator('main')).toContainText('dosyadaki resmî değerlerdir');
});
