import {test,expect} from '@playwright/test';
import fixtures from './fixtures/dis-kaynak-tekniker.json' with {type:'json'};
import programci from './fixtures/dis-kaynak-programci.json' with {type:'json'};
import {memurMaas} from '../src/lib/memur-maas';
import {baslangicGirdi,maasKatsayilari,donem,parametreler,dereceler} from '../src/lib/maas-veri';
import {yuvarla} from '../src/lib/vergi';
for(const f of [...fixtures,...programci])test(`${f.unvan} ${f.kosul} ${f.derece}: kaynak gelir, prim ve net`,()=>{
 const r=memurMaas({...baslangicGirdi,unvan:f.kod,unvanKosulu:f.kosul,derece:f.derece,mezuniyet:1,hizmetYili:0,bes:false,ay:10},maasKatsayilari(donem,'maas'),parametreler,dereceler);
 if(r.eksik)throw new Error(r.eksikNedeni);
 const source=(ad:string)=>Math.abs(Number(f.kaynakSatirlar.find(s=>s[0]===ad)![2].replace(/[^0-9.\-]/g,'')));
 const k=maasKatsayilari(donem,'maas'),rule=parametreler.unvanKurallari[f.kod].varyantlar![f.kosul].dereceler[f.derece.split('/')[0]],d=dereceler.find(d=>d.derece===f.derece)!;
 const rawBase=(d.gosterge+rule.ekGosterge)*k.aylik+1000*k.taban+9500*k.aylik*rule.ozelHizmet/100;
 // Kaynağın toplamında en çok 1 kr, priminde yuvarlanmamış matrah etkisi gözlendi.
 expect(Math.abs(yuvarla(rawBase+rule.yanOdeme*k.yanOdeme+9500*k.aylik*rule.ekOdeme/100+15965*k.aylik)-f.gelir)).toBeLessThanOrEqual(.010001);
 expect(yuvarla(rawBase*.09)).toBe(source('M.Y.Ö. Sigortası'));
 expect(yuvarla(rawBase*.05)).toBe(source('G.S.S. Primi'));
 const labels=[['Gösterge aylığı',`Gösterge Aylığı (${f.derece})`],['Ek gösterge aylığı','Ek Gösterge Aylığı'],['Taban aylığı','Taban Aylığı'],['Yan ödeme aylığı','Yan Ödeme Aylığı'],['Özel hizmet tazminatı','Özel Hizmet Tazminatı'],['Ek ödeme','Ek Ödeme'],['375 SK ek madde 40 (seyyanen)','İlave Seyyanen Ödenek']];
 for(const [local,remote] of labels)expect(r.gelirler.find(s=>s.ad===local)?.tutar??0).toBe(f.kaynakSatirlar.some(s=>s[0]===remote)?source(remote):0);
 const prim=r.kesintiler.filter(s=>['Emekli keseneği','GSS primi'].includes(s.ad)).reduce((s,r)=>s+r.tutar,0);
 const sourcePrim=source('M.Y.Ö. Sigortası')+source('G.S.S. Primi');
 const resmiDv=yuvarla((f.gelir-33030)*.00759);
 expect(r.damga).toBe(resmiDv);
 expect(r.net).toBeCloseTo(f.net+f.damga-resmiDv+(r.gelir-f.gelir)+(sourcePrim-prim),2);
 expect(Math.abs(yuvarla(r.vergiMatrahi)-f.matrah)).toBeLessThanOrEqual(.020001);
});
test('tekniker koşulları, derece geçişi ve başka unvana geçiş',async({page})=>{
 await page.goto('/memur-maas-hesaplama/');await page.locator('#unvan').selectOption({label:'Tekniker'});
 await expect(page.locator('[data-m-kosul]')).toBeVisible();await expect(page.locator('#unvanKosulu option')).toHaveCount(6);
 await page.locator('#derece').selectOption('10/1');await expect(page.locator('[data-m-hata]')).toBeHidden();
 await page.locator('#unvanKosulu').selectOption('lisans');await expect(page.locator('#derece')).toHaveValue('9/1');
 await expect(page.locator('[data-m-aciklama]')).toContainText('Lisans Mezunu');
 await page.locator('#unvan').selectOption({label:'Öğretmen'});await expect(page.locator('[data-m-kosul]')).toBeHidden();
 await expect(page.locator('[data-m-hata]')).toBeHidden();
});
