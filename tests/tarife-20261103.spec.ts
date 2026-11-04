import {test,expect} from '@playwright/test';
import {hukukTarifeSec} from '../src/lib/hukuk-veri';
import {vekalet,nisbiVekalet} from '../src/lib/hukuk-hesap';
import {enflasyon,enflasyonSchema} from '../src/lib/enflasyon-veri';
test('03/11/2026 AAÜT sınır günü, maktu tutarlar ve yeni nispi dilim',()=>{
 const old=hukukTarifeSec('2026-11-02'),now=hukukTarifeSec('2026-11-03');
 expect(vekalet(100000,'asliye',old.v)).toBe(45000);expect(vekalet(100000,'asliye',now.v)).toBe(62000);
 expect(nisbiVekalet(1000000,now.v).tutar).toBe(158000);
 expect(nisbiVekalet(800000,now.v).tutar).toBe(128000);
 expect(now.v.mahkemeler.find(m=>m.id==='icra-takip')!.maktu).toBe(12500);
 expect(now.h).toEqual(old.h); // Yeni AAÜT, 492 harçlarını değiştirmez.
});
test('Ekim TÜFE oranı ve genel endeks resmî tablodan alınır',()=>{
 expect(enflasyon.aylar[3].degisim).toBe(2.58);
 expect(enflasyon.aylar[3].endeksHesaplandi).not.toBe(true);
 expect(enflasyon.aylar[3].endeks).toBe(140.77);
 expect(enflasyonSchema.safeParse({...enflasyon,aylar:enflasyon.aylar.map((a,i)=>i===3?{...a,endeks:undefined}:a)}).success).toBe(false);
 expect(enflasyonSchema.parse(enflasyon).aylar[3].endeks).toBe(enflasyon.aylar[3].endeks);
});
test('yerel ekranda işlem tarihi eski/yeni tarifeyi seçer; Ekim oranı kilitlidir',async({page})=>{
 await page.goto('/nispi-vekalet-ucreti-hesaplama/');
 const tarih=async(value:string)=>page.locator('#tarih').evaluate((el:HTMLInputElement,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
 await tarih('2026-11-02');await expect(page.locator('[data-hy-ana]')).toHaveText('45.000,00 TL');
 await tarih('2026-11-03');await expect(page.locator('[data-hy-ana]')).toHaveText('62.000,00 TL');
 await page.goto('/enflasyon-farki-hesaplama-robotu/');await expect(page.locator('#ay-3')).toHaveValue('2,58');await expect(page.locator('#ay-3')).toHaveAttribute('readonly','');
 await expect(page.locator('#ay-3-not')).toContainText('Resmî, endeks');await expect(page.locator('#ay-4')).toBeEditable();
});
