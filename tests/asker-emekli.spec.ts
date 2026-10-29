import {test,expect} from '@playwright/test';
import {askerEmekli} from '../src/lib/asker-emekli';
import {emekliOzelHizmetOrani} from '../src/lib/memur-maas';
import {askerVeri} from '../src/lib/asker-emekli-veri';
import {dereceler,parametreler,donem,maasKatsayilari} from '../src/lib/maas-veri';
import fixtures from './fixtures/asker-emekli.json' with {type:'json'};
import ekFixtures from './fixtures/asker-emekli-ek.json' with {type:'json'};
const k=maasKatsayilari(donem,'maas');
const g={rutbe:'albay',derece:'1/1',hizmetYili:25,hizmetAyi:0,kidemYili:25,ikramiyeYili:25,makamHakki:true,kadrosuzlukHakki:true,emsalTavan:0};
for(const f of fixtures)test(`asker emekli kaynak: ${f.rutbe} ${f.derece}`,()=>{
 const r=askerEmekli({...g,rutbe:f.rutbe,derece:f.derece},k,parametreler,dereceler,askerVeri.rutbeler);
 expect(Math.abs(r.net-f.net)).toBeLessThanOrEqual(.011);expect(Math.abs(r.ikramiye-f.ikramiye)).toBeLessThanOrEqual(.011);
});
for(const f of ekFixtures)test(`asker emekli ay ve yıl: ${f.g.rutbe} ${f.g.hizmetYili}/${f.g.hizmetAyi}`,()=>{
 const r=askerEmekli({...g,...f.g},k,parametreler,dereceler,askerVeri.rutbeler);
 expect(Math.abs(r.net-f.net)).toBeLessThanOrEqual(.011);expect(Math.abs(r.ikramiye-f.ikramiye)).toBeLessThanOrEqual(.011);
});
test('5434 güncel dilim sınırları: 7417/2',()=>{
 for(const [eg,oran] of [[0,55],[2200,55],[2400,55],[2799,55],[2800,85],[3599,85],[3600,145],[5399,145],[5400,165],[6999,165],[7000,195],[7799,195],[7800,215],[8399,215],[8400,255],[9000,255]])expect(emekliOzelHizmetOrani(eg,parametreler)).toBe(oran);
});
test('tazminat hakları, emsal tavanı, ay ve farklı emeklilik derecesi',()=>{
 const calc=(extra:Partial<typeof g>&{kadroDerece?:string}={})=>askerEmekli({...g,...extra},k,parametreler,dereceler,askerVeri.rutbeler);
 const base=calc(),hakYok=calc({makamHakki:false,kadrosuzlukHakki:false});
 expect(base.net).toBe(85553.55);expect(hakYok.net).toBeLessThan(base.net);expect(hakYok.ikramiye).toBe(base.ikramiye);
 expect(hakYok.satirlar.some(s=>s.ad.includes('tazminatı'))).toBe(false);
 const tavan=calc({emsalTavan:1000});expect(tavan.tavanUygulandi).toBe(true);expect(tavan.kadrosuzluk).toBe(1000);
 const fark=calc({kadroDerece:'1/1',derece:'3/1',hizmetAyi:6});expect(fark.ekGosterge).toBe(5400);expect(fark.baglama).toBe(.755);
 expect(()=>calc({rutbe:'astegmen'})).toThrow('doğrulanmış');expect(()=>calc({hizmetAyi:12})).toThrow('0–11');
});
test('asker emekli formu: haklar, dönem, hata, sıfırla ve mobil temalar',async({page})=>{
 await page.goto('/asker-emekli-maasi-hesaplama/');await expect(page.locator('[data-ae-net]')).toContainText('85.553,55');
 await page.locator('#makamHakki').selectOption('0');await expect(page.locator('[data-ae-net]')).not.toContainText('85.553,55');
 await page.locator('#donem').selectOption('2026-01-01');await expect(page.locator('[data-ae-donem]')).toContainText('01-01-2026');
 await page.locator('#rutbe').selectOption('astegmen');await expect(page.locator('[data-ae-hata]')).toBeVisible();await expect(page.locator('[data-ae-net]')).toHaveText('—');
 await page.getByRole('button',{name:'Sıfırla',exact:true}).click();await expect(page.locator('[data-ae-net]')).toContainText('85.553,55');await expect(page.locator('[data-ae-hata]')).toBeHidden();
 for(const theme of ['light','dark'])for(const width of [320,375,768,1440]){
  await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(0);
 }
});
test('asker emekli JavaScript olmadan hesaplanmış bordro sunar',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto('http://127.0.0.1:4321/asker-emekli-maasi-hesaplama/');await expect(page.locator('[data-ae-net]')).toContainText('85.553,55');await context.close();
});
