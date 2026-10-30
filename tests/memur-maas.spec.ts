import { test, expect } from '@playwright/test';
import { memurMaas, type MaasGirdi } from '../src/lib/memur-maas';
import { maasKatsayilari, donem, parametreler, dereceler } from '../src/lib/maas-veri';
import { baslangicGirdi, formGirdisi, buAy } from '../src/lib/maas-veri';
import { tl } from '../src/lib/bicim';

test('BES oranı iki kanunda değişir; kuruş atılır ve yalnız net kesintiyi etkiler',()=>{
 for(const [kanun,bes5] of [[5510,1827],[5434,1745]] as const){
  const g={...baslangicGirdi,kanun,bes:true};
  const ilk=memurMaas(g,maasKatsayilari(donem,'maas'),parametreler,dereceler),son=memurMaas({...g,besOran:5},maasKatsayilari(donem,'maas'),parametreler,dereceler);
  if(ilk.eksik||son.eksik)throw Error('Hesap eksik.');
  expect(son.kesintiler.find(s=>s.ad==='BES kesintisi')).toMatchObject({oran:'%5',tutar:bes5});
  expect(son.net-ilk.net).toBeCloseTo(ilk.kesintiler.find(s=>s.ad==='BES kesintisi')!.tutar-bes5,2);
  expect(son.vergiMatrahi).toBe(ilk.vergiMatrahi);expect(son.gelirVergisi).toBe(ilk.gelirVergisi);
 }
 const k=maasKatsayilari(donem,'maas');
 expect(()=>memurMaas({...baslangicGirdi,besOran:101},k,parametreler,dereceler)).toThrow('BES');
 const yok=memurMaas({...baslangicGirdi,bes:false,besOran:5},k,parametreler,dereceler);
 if(yok.eksik)throw Error('Hesap eksik.');expect(yok.kesintiler.find(s=>s.ad==='BES kesintisi')?.tutar??0).toBe(0);
});

test('formda BES oranı değişir, virgül kabul edilir ve sıfırlamada %3 olur',async({page})=>{
 await page.goto('/memur-maas-hesaplama/');await page.locator('summary').filter({hasText:'Ek ödemeler'}).click();
 const sifirNet=await page.locator('[data-m-net]').textContent();
 await page.locator('#bes').selectOption('1');
 await expect(page.locator('#besOran')).toHaveValue('3');const ilk=await page.locator('[data-m-net]').textContent();
 await page.locator('#besOran').fill('5');await expect(page.locator('[data-m-net]')).not.toHaveText(ilk!);
 await expect(page.locator('[data-m-satirlar] tr').filter({hasText:'BES kesintisi'})).toContainText('%5');
 await page.locator('#besOran').fill('3,5');await expect(page.locator('[data-m-hata]')).toBeHidden();await expect(page.locator('[data-m-satirlar] tr').filter({hasText:'BES kesintisi'})).toContainText('%3,5');
 await page.locator('#besOran').fill('101');await expect(page.locator('[data-m-hata]')).toContainText('BES');
 await page.getByRole('button',{name:'Sıfırla',exact:true}).click();await expect(page.locator('#besOran')).toHaveValue('3');await expect(page.locator('#bes')).toHaveValue('0');await expect(page.locator('[data-m-net]')).toHaveText(sifirNet!);
});

test('dış kaynak öğretmen bordrosu: MAHEP ile kalem ve net karşılaştırması',()=>{
 const g:MaasGirdi={...baslangicGirdi,unvan:50,derece:'9/1',hizmetYili:0,mezuniyet:1,bes:false,ay:10,oncekiMatrah:0};
 const r=memurMaas(g,maasKatsayilari(donem,'maas'),parametreler,dereceler);
 if(r.eksik)throw new Error('Öğretmen hesaplanamadı.');
 // 29.10.2026 tarayıcı gözlemi: MAHEP 71.527,87; Memur Özlük 71.527,86;
 // Memurlar.net 71.527,65 (DV +0,22); Kadim 73.441,61 (ÖHT %120,56 ÖHT gösteriyor; diğer kaynaklar %105,56).
 expect(r.net).toBeCloseTo(71527.87,2);expect(r.vergiMatrahi).toBeCloseTo(21186.50,2);
 expect(r.gelirler.find(s=>s.ad==='Özel hizmet tazminatı')?.tutar).toBe(15799.55);
 expect(r.damga).toBe(340.02);
});

test('13/3 zabıt kâtibi örneğinde net ve kalem toplamları',()=>{
 const r=memurMaas(baslangicGirdi,maasKatsayilari(donem,'maas'),parametreler,dereceler);
 if(r.eksik)throw new Error('Başlangıç hesabı eksik.');
 // Gösterge 850,78; taban 25.794,92; kıdem 31,51; yan ödeme 649,54;
 // özel hizmet 9.130,09; ek ödeme 12.722,25; il adalet 748,37; seyyanen 25.153,05.
 expect(r.gelir).toBeCloseTo(75080.52,2);expect(r.kesinti).toBeCloseTo(6532.95,2);expect(r.net).toBeCloseTo(68547.57,2);
 // 36.555,67 prim matrahının %3'ü 1.096,6701: OKS kuruşları atılır.
 expect(r.kesintiler.find(s=>s.ad==='BES kesintisi')?.tutar).toBe(1096);
 expect(r.gelirler.reduce((s,x)=>s+x.tutar,0)).toBeCloseTo(r.gelir,2);
});

test('Ankara kâtibi: dış kaynakta aynı görev yeri ve BES profili',()=>{
 const r=memurMaas({...baslangicGirdi,gorevYeri:'istanbul',ay:10,oncekiMatrah:207196.33},maasKatsayilari(donem,'maas'),parametreler,dereceler);
 if(r.eksik)throw new Error('Kâtip hesaplanamadı.');
 expect(r.gelir).toBe(76577.25);expect(r.net).toBe(69778.39);
 // Memurlar.net 69.778,16: gelirler aynı, kaynak DV'si 0,23 daha yüksek.
 expect(r.net-69778.16).toBeCloseTo(.23,2);
});

test('sayfa: başlangıç, şablon, eksik unvan, öğretmen, fark ve geçersiz tutar',async({page})=>{
 await page.goto('/memur-maas-hesaplama/');
 // Form açılışı: 3/1 yazı işleri müdürü, 16 yıl, lisans, eş ve 72 ay üstü bir çocuk; ay bugünün ayıdır.
 const r=memurMaas({...formGirdisi,ay:buAy(donem)},maasKatsayilari(donem,'maas'),parametreler,dereceler);
 if(r.eksik)throw new Error('Başlangıç hesabı eksik.');
 await expect(page.locator('[data-m-net]')).toHaveText(tl(r.net));
 await page.locator('#sablon').selectOption('111y');
 await expect(page.locator('[data-m-hata]')).toBeHidden();
 await page.locator('#unvan').selectOption({label:'Cezaevi Müdürü (Özel +13 P)'});
 await expect(page.locator('[data-m-hata]')).toContainText('oranları');
 await expect(page.locator('[data-m-net]')).toHaveText('—');
 await page.locator('#unvan').selectOption({label:'Öğretmen'});
 await expect(page.locator('[data-m-ogretmen]')).toBeVisible();
 await expect(page.locator('[data-m-hata]')).toBeHidden();
 const before=await page.locator('[data-m-net]').textContent();
 await page.locator('#alan').selectOption('5');
 await expect(page.locator('[data-m-net]')).not.toHaveText(before!);
 await page.locator('#kip').selectOption('fark14');
 await expect(page.locator('[data-m-etiket]')).toHaveText('Net 14 günlük fark');
 await page.locator('summary').filter({hasText:'Ek ödemeler'}).click();
 await page.locator('#haciz').fill('geçersiz');
 await expect(page.locator('[data-m-hata]')).toContainText('pozitif');
 await page.getByRole('button',{name:'Sıfırla',exact:true}).click();
 await expect(page.locator('[data-m-net]')).toHaveText(tl(r.net));
 await expect(page.locator('[data-m-hata]')).toBeHidden();
});

test('JavaScript olmadan başlangıç bordrosu ve canonical görünür',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 await page.goto('http://127.0.0.1:4321/memur-maas-hesaplama/');
 await expect(page.locator('[data-m-net]')).toContainText('TL');
 await expect(page.locator('[data-m-satirlar] tr')).not.toHaveCount(0);
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://657.com.tr/memur-maas-hesaplama/');
 await context.close();
});

test('açık ve koyu temada dar ekranlar taşmaz',async({page})=>{
 await page.goto('/memur-maas-hesaplama/');
 for(const theme of ['light','dark']) for(const width of [320,375,414,768,1440]){
  await page.setViewportSize({width,height:900});
  await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth),`${theme} ${width}`).toBeLessThanOrEqual(0);
 }
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'artifacts/maas-dark-desktop.png',fullPage:true});
 await page.setViewportSize({width:375,height:812});await page.evaluate(()=>document.documentElement.dataset.theme='light');await page.screenshot({path:'artifacts/maas-light-mobile.png',fullPage:true});
});
