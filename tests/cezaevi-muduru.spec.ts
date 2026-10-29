import {test,expect} from '@playwright/test';
import fixtures from './fixtures/dis-kaynak-cezaevi-muduru.json' with {type:'json'};
import {memurMaas} from '../src/lib/memur-maas';
import {baslangicGirdi,maasKatsayilari,donem,parametreler,dereceler} from '../src/lib/maas-veri';
import {yuvarla} from '../src/lib/vergi';
for(const f of fixtures)test(`Cezaevi müdürü ${f.kosul} ${f.derece}: kaynak bordro`,()=>{
 const r=memurMaas({...baslangicGirdi,unvan:10,unvanKosulu:f.kosul,derece:f.derece,mezuniyet:f.mezuniyet as 1|2,hizmetYili:0,bes:false,ay:10,gorevYeri:'istanbul'},maasKatsayilari(donem,'maas'),parametreler,dereceler);
 if(r.eksik)throw new Error(r.eksikNedeni);
 const source=(ad:string)=>Math.abs(Number(f.kaynakSatirlar.find(s=>s[0]===ad)![2].replace(/[^0-9.\-]/g,'')));
 for(const [local,remote] of [['Gösterge aylığı',`Gösterge Aylığı (${f.derece})`],['Ek gösterge aylığı','Ek Gösterge Aylığı'],['Taban aylığı','Taban Aylığı'],['Yan ödeme aylığı','Yan Ödeme Aylığı'],['Özel hizmet tazminatı','Özel Hizmet Tazminatı'],['Ek ödeme','Ek Ödeme'],['İl adalet hizmetleri tazminatı','İl Adalet Hizmetleri Tazminatı'],['375 SK ek madde 40 (seyyanen)','İlave Seyyanen Ödenek']])expect(r.gelirler.find(s=>s.ad===local)?.tutar??0).toBe(f.kaynakSatirlar.some(s=>s[0]===remote)?source(remote):0);
 expect(Math.abs(r.gelir-f.gelir)).toBeLessThanOrEqual(.010001);
 const prim=r.kesintiler.filter(s=>['Emekli keseneği','GSS primi'].includes(s.ad)).reduce((s,r)=>s+r.tutar,0),sourcePrim=source('M.Y.Ö. Sigortası')+source('G.S.S. Primi');
 expect(Math.abs(prim-sourcePrim)).toBeLessThanOrEqual(.020001);
 const resmiDv=yuvarla((r.gelir-33030)*.00759);expect(r.damga).toBe(resmiDv);
 expect(r.net).toBeCloseTo(f.net+(r.gelir-f.gelir)+(sourcePrim-prim)+f.damga-resmiDv,2);
});
test('Cezaevi müdüründe lise, yükseköğrenim ve doğrulanmamış özel +13 koşulu ayrılır',async({page})=>{
 await page.goto('/memur-maas-hesaplama/');await page.locator('#derece').selectOption('13/3');await page.locator('#unvan').selectOption({label:'Cezaevi Müdürü'});
 await expect(page.locator('#derece')).toHaveValue('6/1');await expect(page.locator('[data-m-hata]')).toBeHidden();
 await page.locator('#derece').selectOption('1/1');const uni=await page.locator('[data-m-net]').textContent();await page.locator('#unvanKosulu').selectOption('lise');
 await expect(page.locator('#mezuniyet')).toHaveValue('2');await expect(page.locator('[data-m-net]')).not.toHaveText(uni!);
 await page.locator('#unvan').selectOption({label:'Cezaevi Müdürü (Özel +13 P)'});await expect(page.locator('[data-m-hata]')).toBeVisible();
 await page.goto('/cezaevi-muduru-maasi-2026/');await expect(page.locator('[data-unvan-dusuk="ana"]')).toContainText('TL');
});
