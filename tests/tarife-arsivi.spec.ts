import {test,expect} from '@playwright/test';
import {tarifeler,yilinKayitlari} from '../src/lib/tarife-arsivi';
import {kontrolListesi} from '../src/lib/veri-kontrol';
import {yargiHaritasiVerisi} from '../src/lib/yargi-haritasi-veri';
import {adliKayitlar} from '../src/lib/adlicevre';

test('resmî cetvellerin yılları, tutarları ve aynı mevzuat adları ayrılır',()=>{
 expect(tarifeler).toHaveLength(15);
 for(const t of tarifeler){for(const year of [2024,2025,2026])expect(yilinKayitlari(t,year).length,t.slug+' '+year).toBeGreaterThan(0);for(const r of t.kayitlar)expect(r.kalemler.length,t.slug+' '+r.baslangic).toBeGreaterThan(0);}
 const bil=tarifeler.find(t=>t.slug==='bilirkisilik-asgari')!;
 expect(bil.kayitlar.map(r=>r.kalemler.find(k=>k.ad==='Ağır ceza')!.tutar)).toEqual([2200,3200,4100]);
 expect(tarifeler.find(t=>t.slug==='satis-giderleri')!.kayitlar.map(r=>r.kalemler[0].tutar)).toEqual([25000,36000,40000]);
 expect(tarifeler.find(t=>t.slug==='taniklik')!.kayitlar).toEqual(tarifeler.find(t=>t.slug==='cmk-taniklik')!.kayitlar);
 const iflas=tarifeler.find(t=>t.slug==='iflas-idaresi')!;expect(yilinKayitlari(iflas,2025)[0].baslangic).toBe('2024-01-01');
 expect(kontrolListesi(2027,1).filter(k=>k.id.startsWith('maas-')).every(k=>!k.girildi)).toBe(true);
});
test('harita adli teşkilatın faal kayıtları ve HSK düzeltmeleriyle aynıdır',()=>{
 const d=yargiHaritasiVerisi();expect(Object.keys(d.iller)).toHaveLength(81);
 expect(d.iller['44'].bam).toBe('Malatya BAM');
 expect(d.iller['74'].bam).toBe('Ankara BAM');expect(d.iller['67'].bam).toBe('Ankara BAM');
 expect(d.iller['18'].ilceler.find(i=>i.ad==='Çerkeş')!.bagli_acm).toBe('Çankırı');
 const faal=adliKayitlar.filter(k=>k.kaynak?.durum==='Faal');
 expect(Object.values(d.iller).reduce((n,il)=>n+il.adliye_sayisi,0)).toBe(faal.length);
 for(const il of Object.values(d.iller)){expect(il.adliyeler.length).toBe(il.adliye_sayisi);for(const a of il.adliyeler){const k=faal.find(k=>k.kaynak?.il===il.ad&&k.kaynak.mahal===a.mahal);expect(k?.kaynak?.bagli_acm).toBe(a.bagli_acm);}}
});
test('tarife arama, geçmiş yıl ve grafik kalemi birlikte çalışır',async({page})=>{
 await page.goto('/bolum/tarifeler/');await page.locator('#tarife-ara').fill('HMK');await expect(page.locator('[data-tarife-ad]:visible')).toHaveCount(3);
 await page.goto('/tarifeler/satis-giderleri/');await page.locator('[data-tarife-yil]').selectOption('2025');await expect(page.locator('[data-tarife-kayit]:visible')).toHaveCount(1);await expect(page.locator('[data-tarife-karsilastirma]')).toContainText('36.000');await expect(page.locator('[data-tarife-karsilastirma]')).toContainText('+44%');
 await page.locator('[data-tarife-kalem]').selectOption('Taşınır mallar');await expect(page.locator('[data-tarife-karsilastirma]')).toContainText('3.000');
});
test('harita renkleri ortak portal tokenlarından gelir ve klavye seçimi çalışır',async({page})=>{
 await page.goto('/yargi-haritasi/');const il=page.locator('#il-01');await expect(il).toHaveAttribute('role','button');
 expect(await il.evaluate(el=>el.getAttribute('style'))).toContain('var(--color-');
 expect(await il.evaluate(el=>getComputedStyle(el.querySelector('path')!).fill)).toBe('rgb(89, 101, 122)');
 await il.focus();await page.keyboard.press('Enter');await expect(page.locator('#yargi-detay-paneli h2')).toHaveText('Adana');
});
test('dönem onayları ayrı saklanır, eski rehber ve sayaç açıklaması korunur',async({page})=>{
 await page.goto('/veri-guncelleme/');await page.locator('[data-kontrol-yil]').selectOption('2027');
 const check=page.locator('[data-kontrol-id="maas-memur_maas_aylik_katsayi"]');await check.check();await page.reload();await expect(check).toBeChecked();
 await page.locator('[data-kontrol-yari]').selectOption('2');await expect(check).not.toBeChecked();
 await page.locator('[data-kontrol-yil]').selectOption('2026');await page.locator('[data-kontrol-yari]').selectOption('1');
 const row=page.locator('tr').filter({has:page.locator('[data-kontrol-id="maas-memur_maas_aylik_katsayi"]')});await expect(row.locator('input:disabled')).toBeChecked();
 await expect(page.getByRole('heading',{name:'Enflasyon girişi neyi değiştirir?'})).toBeVisible();await expect(page.getByRole('heading',{name:'Geri sayım sayacına tarih ve kaynak girme'})).toBeVisible();
});
test('portal sayfaları mobil genişliklerde taşmaz ve iki temada okunur',async({page})=>{
 for(const path of ['/bolum/tarifeler/','/tarifeler/lisansli-yediemin/','/veri-guncelleme/','/yargi-haritasi/']){
  for(const w of [320,375,414,768]){await page.setViewportSize({width:w,height:900});await page.goto(path);await expect(page.locator('h1')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path+' '+w).toBe(true);}
  await page.setViewportSize({width:1440,height:1000});await page.goto(path);await page.screenshot({path:'artifacts/tarife-qa/'+path.split('/').filter(Boolean).join('-')+'-light.png',fullPage:false});await page.evaluate(()=>document.documentElement.dataset.theme='dark');await page.screenshot({path:'artifacts/tarife-qa/'+path.split('/').filter(Boolean).join('-')+'-dark.png',fullPage:false});
 }
});
