import {test,expect} from '@playwright/test';
import {guncelYayin,unvanlar,maasYazilari} from '../src/lib/maas-yazilari';
import {secenekler} from '../src/lib/maas-veri';
import {katsayiGecmisi,katsayiBilesenleri} from '../src/lib/katsayi-gecmisi';
import {tl} from '../src/lib/bicim';
import {ogrenimBaslangici} from '../src/lib/maas-profilleri';

test('başlangıç örneğinde öğrenimin genel giriş derece/kademesi korunur',()=>{
 expect(ogrenimBaslangici(2,'Lise Mezunu')).toEqual({derece:13,kademe:3});expect(ogrenimBaslangici(1,'Lisans Mezunu')).toEqual({derece:9,kademe:1});expect(ogrenimBaslangici(1,'2 Yıllık Yüksek Öğrenim')).toEqual({derece:10,kademe:2});
 for(const r of guncelYayin.kayitlar){const g=r.girdiler?.dusuk;if(!g)continue;expect(Number(g.derece.split('/')[0])).toBeLessThanOrEqual(g.mezuniyet===1?10:15);if(g.derece.startsWith('13/'))expect(g.derece).toBe('13/3');}
});

test('tüm form unvanları yayın envanterinde; standart profillerde özel artırım yok',()=>{
 expect(unvanlar.map(u=>u.ad).sort()).toEqual(secenekler.unvanlar.map(u=>u.ad).sort());
 for(const row of guncelYayin.kayitlar){
  if(!row.girdiler)continue;
  const {dusuk:d,yuksek:y}=row.girdiler;
  expect(d.hizmetYili).toBe(0);expect(d.esCalismiyor).toBe(false);expect(d.cocuk.kucuk+d.cocuk.buyuk).toBe(0);
  expect(y.hizmetYili).toBe(30);expect(y.esCalismiyor).toBe(true);expect(y.cocuk.kucuk+y.cocuk.buyuk).toBe(2);
  for(const g of [d,y]){expect(g.bes).toBe(false);expect(g.yabanciDil).toBe('');expect(g.tasinirYetkili).toBe(false);expect(g.cocuk.engelliKucuk+g.cocuk.engelliBuyuk).toBe(0);}
  expect(row.dusuk).not.toBeNull();expect(row.yuksek).not.toBeNull();
 }
 expect(maasYazilari.filter(m=>m.yil===guncelYayin.yil)).toHaveLength(unvanlar.length);
});
test('2017–2026 resmî katsayılar: 20 dönem, kaynak ve kritik yuvarlamalar',()=>{
 expect(katsayiGecmisi).toHaveLength(20);
 expect(katsayiGecmisi[0].baslangic).toBe('2017-01-01');
 expect(katsayiGecmisi.find(d=>d.baslangic==='2018-07-01')?.aylik).toBe(.11794);
 expect(katsayiGecmisi.find(d=>d.baslangic==='2020-01-01')?.taban).toBe(2.28624);
 const r=katsayiBilesenleri(katsayiGecmisi[0],{gosterge:1020,ekGosterge:2200,hizmet:16,yanOdeme:1600,ozelHizmet:140,ekOdeme:170});
 expect(r.satirlar.find(s=>s.ad==='Taban aylığı')?.tutar).toBe(1503.60);
 expect(()=>katsayiBilesenleri(katsayiGecmisi[0],{gosterge:NaN,ekGosterge:0,hizmet:0,yanOdeme:0,ozelHizmet:0,ekOdeme:0})).toThrow();
});
test('hızlı seçim ve otomatik yazı aynı profili kullanır; arşiv/grafik görünür',async({page})=>{
 await page.goto('/memur-maas-hesaplama/');await page.locator('details.maas-bolum--hesap summary').click();await expect(page.locator('#sablon option').first()).toHaveText('Seçiniz');
 await expect(page.locator('#sablon option')).toHaveCount(1+unvanlar.length*2);
 const u=unvanlar.find(u=>u.ad==='Ambar Memuru')!,r=guncelYayin.kayitlar.find(r=>r.unvanId===u.id)!;
 for(const key of ['dusuk','yuksek'] as const){await page.locator('#sablon').selectOption(`u-${u.id}-${key}`);await expect(page.locator('[data-m-net]')).toHaveText(tl(r[key]!));}
 await page.goto(`/${u.id}-maasi-2026/`);await expect(page.locator('[data-unvan-dusuk="ana"]')).toHaveText(tl(r.dusuk!));await expect(page.locator('[data-maas-grafik]')).toBeVisible();
 await page.goto('/zabit-katibi-maasi-2026/');await expect(page.locator('[data-eski-maas]')).not.toHaveCount(0);
 for(const theme of ['light','dark']){await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.setViewportSize({width:375,height:850});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
test('sözlük ana okunma sayısı yenilemede artar, kaynak açıklaması görünür',async({page})=>{
 let sayi=0;await page.route('**/api/okunma',r=>r.fulfill({json:{sayi:++sayi,bugun:sayi,baslangic:'2026-11-06T00:00:00+03:00'}}));
 await page.goto('/kelime/tuzuk-ne-demek/');await expect(page.locator('[data-okunma-bugun]')).toHaveText('Bugün: 1');
 const el=page.locator('[data-okunma-toplam]'),first=await el.textContent();await page.reload();
 await expect(page.locator('[data-okunma-bugun]')).toHaveText('Bugün: 2');await expect(el).not.toHaveText(first!);
 await expect(page.locator('[data-okunma-path]')).toHaveAttribute('title',/arşiv tabanı/i);
});
