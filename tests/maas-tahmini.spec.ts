import {test,expect} from '@playwright/test';
import {maasTahmini,tahminKatsayilari,tahminVergiGirdisi} from '../src/lib/maas-tahmini';
import {maasTahminVerisi,varsayilanMaasTahmini as t} from '../src/lib/maas-tahmini-veri';
import {memurMaas} from '../src/lib/memur-maas';
import {formGirdisi,maasKatsayilari,donem,parametreler,dereceler} from '../src/lib/maas-veri';

test('ortak enflasyon verisi: resmî ay değiştirilemez; senaryo pozitif farkı bileşik ekler',()=>{
 expect(t.kumulatifZam).toBe(5);expect(t.resmiAy).toBe(3);
 expect(maasTahmini(maasTahminVerisi,{'ay-0':'100'}).kumulatifZam).toBe(5);
 const yeni=maasTahmini(maasTahminVerisi,{'ay-3':'2','ay-4':'2','ay-5':'2'});
 expect(yeni.fark).toBeGreaterThan(0);expect(yeni.kumulatifZam).toBeGreaterThan(5);
 expect(yeni.kumulatifZam).not.toBeCloseTo(yeni.fark+5,2);
});
test('net maaş yeniden hesaplanır; yeni yılda matrah sıfırlanır',()=>{
 const k=maasKatsayilari(donem,'maas'),g={...formGirdisi,ay:10,oncekiMatrah:210000};
 const current=memurMaas(g,k,parametreler,dereceler);
 const nextG=tahminVergiGirdisi(g,t,2026),next=memurMaas(nextG,tahminKatsayilari(k,t),parametreler,dereceler);
 if(current.eksik||next.eksik)throw Error('Eksik hesap');
 expect(nextG.ay).toBe(1);expect(nextG.oncekiMatrah).toBe(0);
 expect(next.net).toBeGreaterThan(current.net);
 expect(Math.abs(next.net-current.net*1.05)).toBeGreaterThan(1);
});
test('enflasyon senaryosu maaş sayfasına taşınır ve kişisel form değişince yenilenir',async({page})=>{
 await page.goto('/enflasyon-farki-hesaplama-robotu/');
 for(const i of [3,4,5])await page.locator(`#ay-${i}`).fill('2');
 const zam=await page.locator('[data-e="kumulatif"]').textContent();
 await page.goto('/memur-maas-hesaplama/');
 await expect(page.locator('[data-mt-zam]')).toHaveText(zam!);
 const first=await page.locator('[data-mt-net]').textContent();
 await page.locator('#hizmetYili').fill('20');
 await expect(page.locator('[data-mt-net]')).not.toHaveText(first!);
});
for(const path of ['/sozlesmeli-memur-maas-hesaplama/','/emekli-memur-maas-hesaplama/','/asker-emekli-maasi-hesaplama/','/ucretli-ogretmen-maas-hesaplama/','/belediye-baskani-maasi-hesaplama/','/muhtar-maasi-hesaplama/'])test(`sonraki dönem: ${path}`,async({page})=>{
 await page.goto(path);await expect(page.locator('[data-maas-tahmini]')).toBeVisible();
 await expect(page.locator('[data-mt-net]')).toContainText('TL');
 for(const theme of ['light','dark']){await page.evaluate(v=>document.documentElement.dataset.theme=v,theme);await page.setViewportSize({width:375,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
test('4/D: memur zammı yerine ayrıca TİS oranı girilir',async({page})=>{
 await page.goto('/4d-isci-maas-hesaplama/');await expect(page.locator('[data-mt-net]')).toHaveText('—');
 await page.locator('#mt-tis').fill('10');await expect(page.locator('[data-mt-net]')).toContainText('TL');
});
test('güncel unvan sayfası aynı senaryoyu iki profile uygular; arşiv korunur',async({page})=>{
 await page.goto('/zabit-katibi-maasi-2026/');
 await expect(page.locator('[data-mt-net]')).toContainText('TL');
 await expect(page.locator('[data-mt-kidemli]')).toContainText('TL');
 const initial=await page.locator('[data-mt-net]').textContent();
 await page.goto('/enflasyon-farki-hesaplama-robotu/');
 for(const i of [3,4,5])await page.locator(`#ay-${i}`).fill('2');
 await page.goto('/zabit-katibi-maasi-2026/');
 await expect(page.locator('[data-mt-net]')).not.toHaveText(initial!);
 await page.goto('/zabit-katibi-maasi-2025/');
 await expect(page.locator('[data-maas-tahmini]')).toHaveCount(0);
});
