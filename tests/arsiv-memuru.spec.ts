import {test,expect} from '@playwright/test';
import fixtures from './fixtures/dis-kaynak-arsiv-memuru.json' with {type:'json'};
import {memurMaas} from '../src/lib/memur-maas';
import {baslangicGirdi,maasKatsayilari,donem,parametreler,dereceler,secenekler} from '../src/lib/maas-veri';
const hesap=(derece:string,kosul:string,mezuniyet:1|2)=>memurMaas({...baslangicGirdi,unvan:1010,derece,unvanKosulu:kosul,mezuniyet,hizmetYili:0,bes:false,ay:10},maasKatsayilari(donem,'maas'),parametreler,dereceler);
test('MAHEP 10/1: M65 +10 puan dahil gelir, SGK, damga ve net birebir',()=>{
 const r=hesap('10/1','lise',2);if(r.eksik)throw new Error(r.eksikNedeni);
 expect(r.gelir).toBeCloseTo(73530.67,2);expect(r.net).toBeCloseTo(68266.49,2);expect(r.damga).toBe(307.40);
 expect(r.kesintiler.find(s=>s.ad==='Emekli keseneği')!.tutar).toBe(3186.50);expect(r.kesintiler.find(s=>s.ad==='GSS primi')!.tutar).toBe(1770.28);
});
for(const f of fixtures)test(`Arşiv ${f.kosul} ${f.derece}: taban kalemleri ve M65 farkı`,()=>{
 const r=hesap(f.derece,f.kosul,f.mezuniyet as 1|2);if(r.eksik)throw new Error(r.eksikNedeni);
 const source=(ad:string)=>Math.abs(Number(f.kaynakSatirlar.find(s=>s[0]===ad)![2].replace(/[^0-9.\-]/g,'')));
 for(const [local,remote] of [['Gösterge aylığı',`Gösterge Aylığı (${f.derece})`],['Ek gösterge aylığı','Ek Gösterge Aylığı'],['Taban aylığı','Taban Aylığı'],['Yan ödeme aylığı','Yan Ödeme Aylığı'],['Ek ödeme','Ek Ödeme'],['375 SK ek madde 40 (seyyanen)','İlave Seyyanen Ödenek']])expect(r.gelirler.find(s=>s.ad===local)?.tutar??0).toBe(f.kaynakSatirlar.some(s=>s[0]===remote)?source(remote):0);
 const artis=9500*maasKatsayilari(donem,'maas').aylik*.10;
 expect(Math.abs(r.gelir-f.gelir-artis)).toBeLessThanOrEqual(.020001);
 expect(Math.abs(r.gelirler.find(s=>s.ad==='Özel hizmet tazminatı')!.tutar-source('Özel Hizmet Tazminatı')-artis)).toBeLessThanOrEqual(.010001);
});
test('Arşiv başka unvanın kodundan ayrılır; koşul ve yıllık profili açıkça görünür',async({page})=>{
 expect(secenekler.unvanlar.find(u=>u.ad==='Arşiv Memuru')!.kod).toBe(1010);expect(secenekler.unvanlar.find(u=>u.ad==='Anketör')!.kod).not.toBe(1010);
 await page.goto('/memur-maas-hesaplama/');await page.locator('#unvan').selectOption({label:'Arşiv Memuru'});await expect(page.locator('[data-m-hata]')).toBeHidden();
 await expect(page.locator('[data-m-kosul-not]')).toContainText('65. madde');
 await page.goto('/arsiv-memuru-maasi-2026/');await expect(page.locator('article')).toContainText('13/3 sonucu alınamadığından');
});
