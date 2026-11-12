import {test,expect} from '@playwright/test';
import {hukukiSure,sureTurleri} from '../src/lib/hukuki-sure';
import {iso} from '../src/lib/kesinlesme';
import {tatilGunleri} from '../src/lib/tatil-veri';
const g=(teblig:string,id:string,ek={})=>{const s=sureTurleri.find(x=>x.id===id)!;return hukukiSure({teblig,sayi:s.sayi,birim:s.birim,yargi:s.yargi,adliTatil:s.adliTatil,tebligTuru:'normal',...ek},tatilGunleri);};
test('İdari dava 60 gün: tebliğ günü sayılmaz, hafta sonu ilk iş gününe uzar',()=>{
 // 02.03.2026 + 60 gün = 01.05.2026 Cuma (Emek ve Dayanışma Günü) → 04.05.2026 Pazartesi
 const r=g('2026-03-02','idari-dava');expect(iso(r.son)).toBe('2026-05-04');
});
test('Hukukta iki haftalık süre adli tatile denk gelirse 7 Eylül, cezada 3 Eylül',()=>{
 // 14.07.2026 + 2 hafta = 28.07.2026 (adli tatil)
 expect(iso(g('2026-07-14','hukuk-kanun-yolu').son)).toBe('2026-09-07');
 expect(iso(g('2026-07-14','ceza-kanun-yolu').son)).toBe('2026-09-03');
 // icra: adli tatilde uzama yok (7 gün: 20.07 + 7 = 27.07.2026 Pazartesi)
 expect(iso(g('2026-07-20','odeme-emri-itiraz').son)).toBe('2026-07-27');
});
test('ay süresi son güne yaslanır; e-tebligat beş gün, ilanen yedi gün sonra yapılmış sayılır',()=>{
 expect(iso(hukukiSure({teblig:'2026-01-31',sayi:1,birim:'ay',yargi:'hukuk',adliTatil:true,tebligTuru:'normal'},tatilGunleri).son)).toBe('2026-03-02');
 const e=g('2026-03-02','tuketici-cayma',{tebligTuru:'e-tebligat'});expect(iso(e.teblig)).toBe('2026-03-07');
 const i=g('2026-03-02','tuketici-cayma',{tebligTuru:'ilanen'});expect(iso(i.teblig)).toBe('2026-03-09');
});

test('sayfa: tebliğ ve işlem seçilince son gün, açıklama ve kesinleşme görünür',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('657:cerez','ret'));
 await page.goto('/hukuki-sure-hesaplama/');
 await page.locator('[data-hs-turu]').selectOption('hukuk-kanun-yolu');
 await page.locator('[data-hs-teblig]').fill('2026-07-14');
 await expect(page.locator('[data-hs-tarih]')).toHaveText('07.09.2026');
 await expect(page.locator('[data-hs-notlar]')).toContainText('HMK m.104');
 await expect(page.locator('[data-hs-kesin]')).toHaveText('08.09.2026');
 await page.locator('[data-hs-turu]').selectOption('ceza-kanun-yolu');
 await expect(page.locator('[data-hs-tarih]')).toHaveText('03.09.2026');
});
