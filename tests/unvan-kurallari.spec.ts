import {test,expect} from '@playwright/test';
import fixtures from './fixtures/dis-kaynak-muhendis.json' with {type:'json'};
import istatistikci from './fixtures/dis-kaynak-istatistikci.json' with {type:'json'};
import {memurMaas} from '../src/lib/memur-maas';
import {baslangicGirdi,maasKatsayilari,donem,parametreler,dereceler} from '../src/lib/maas-veri';
import {ekUnvanVerisi} from '../src/lib/unvan-ek-veri';
import {yuvarla} from '../src/lib/vergi';
for(const f of [...fixtures.map(f=>({...f,kod:1001})),...istatistikci])test(`Memurlar.net ${f.unvan} ${f.derece}: gelir, prim, matrah ve damga ayrımı`,()=>{
 const r=memurMaas({...baslangicGirdi,unvan:f.kod,derece:f.derece,mezuniyet:1,hizmetYili:0,bes:false,ay:10},maasKatsayilari(donem,'maas'),parametreler,dereceler);
 if(r.eksik)throw new Error('Yeni unvan hesaplanamadı.');
 expect(r.gelir).toBeCloseTo(f.gelir,2);
 // Memurlar.net matrahta gelirlerin yuvarlanmamış son basamaklarını koruyor.
 // Motorumuz MAHEP örneğindeki gibi görünen kalemlerin toplamını esas alır.
 const k=maasKatsayilari(donem,'maas'),rule=parametreler.unvanKurallari[f.kod].dereceler[f.derece.split('/')[0]],d=dereceler.find(d=>d.derece===f.derece)!;
 const prim=r.kesintiler.filter(x=>['Emekli keseneği','GSS primi'].includes(x.ad)).reduce((s,x)=>s+x.tutar,0);
 const rawMatrah=(d.gosterge+rule.ekGosterge)*k.aylik+1000*k.taban+rule.yanOdeme*k.yanOdeme-prim;
 if(f.unvan==='muhendis')expect(yuvarla(rawMatrah)).toBe(f.matrah);
 else expect(Math.abs(yuvarla(rawMatrah)-f.matrah)).toBeLessThanOrEqual(.010001);
 // İstatistikçi 8/1: görünen dört gelir kaleminin toplamı ile kaynak matrahı 2 kr ayrılıyor.
 expect(Math.abs(yuvarla(r.vergiMatrahi)-f.matrah)).toBeLessThanOrEqual(f.unvan==='istatistikci'&&f.derece==='8/1'?.020001:.010001);
 // Kaynak 33.000 TL DV istisna matrahıyla uyuşuyor; resmî 2026 asgari brüt 33.030.
 expect(Math.abs(f.damga-yuvarla((f.gelir-33000)*.00759))).toBeLessThanOrEqual(.010001);
 const resmiDv=yuvarla((f.gelir-33030)*.00759);
 expect(r.damga).toBe(resmiDv);expect(r.net).toBeCloseTo(f.net+f.damga-resmiDv,2);
});
test('doğrulanmayan derece veya öğrenimde uydurma sonuç üretilmez',()=>{
 for(const patch of [{derece:'9/1',mezuniyet:1 as const},{derece:'8/1',mezuniyet:2 as const}]){
  const r=memurMaas({...baslangicGirdi,unvan:1001,...patch},maasKatsayilari(donem,'maas'),parametreler,dereceler);expect(r.eksik).toBe(true);
 }
});
test('yeni unvanlar formda çalışır; giriş profili, hata ve sıfırlama',async({page})=>{
 await page.goto('/memur-maas-hesaplama/');
 for(const u of ekUnvanVerisi.unvanlar){
  await page.locator('#unvan').selectOption({label:u.ad});
  await expect(page.locator('#mezuniyet')).toHaveValue(String(u.dusuk.mezuniyet));
  await expect(page.locator('[data-m-hata]')).toBeHidden();await expect(page.locator('[data-m-net]')).not.toHaveText('—');
 }
 await page.locator('#unvan').selectOption({label:'Mühendis'});await page.locator('#derece').selectOption('9/1');await expect(page.locator('[data-m-hata]')).toContainText('1–8');
 await page.getByRole('button',{name:'Sıfırla',exact:true}).click();await expect(page.locator('[data-m-hata]')).toBeHidden();
 await page.goto('/muhendis-maasi-2026/');await expect(page.locator('h1')).toHaveText('Mühendis Maaşı 2026');
 await expect(page.locator('[data-unvan-dusuk="ana"]')).not.toHaveText('Hesap tamamlanmadı');
 await expect(page.locator('article')).toContainText('8/1');
});
