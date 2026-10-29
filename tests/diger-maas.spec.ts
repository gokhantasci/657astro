import { test, expect } from '@playwright/test';
import { sozlesmeliMaas, emekliMaas } from '../src/lib/diger-maas';
import { parametreler, dereceler,donem,maasKatsayilari } from '../src/lib/maas-veri';
const k={aylik:1,taban:1,yanOdeme:1,gelirVergisiIstisna:0,damgaVergisiIstisna:0};
test('sözleşmeli hesap: çocuk yardımı ve damga yalnızca bir kez toplanır',()=>{
 const r=sozlesmeliMaas({ucret:10000,ekOdemeOran:0,esCalismiyor:false,sendika:false,kucuk:1,buyuk:0,engelliKucuk:0,engelliBuyuk:0},k,parametreler);
 // 10.000 + 15.965 seyyanen + 500 çocuk = 26.465; 900 + 500 + 1.290 GV + 197,07 DV.
 expect(r.gelir).toBe(26465);expect(r.kesinti).toBe(2887.07);expect(r.net).toBe(23577.93);
});

test('4/B vergi: seyyanen matrahtan ikinci kez düşülmez; dilim ay içinde bölünür',()=>{
 const r=sozlesmeliMaas({ucret:50000,ekOdemeOran:0,esCalismiyor:false,sendika:false,kucuk:0,buyuk:0,engelliKucuk:0,engelliBuyuk:0,ay:7,oncekiMatrah:180000},maasKatsayilari(donem,'maas'),parametreler);
 // Matrah 50.000 - 4.500 - 2.500 = 43.000; ham GV 1.500 + 6.600.
 // Temmuz istisnası 4.537,75; seyyanen dahil DV 319,71.
 expect(r.vergiMatrahi).toBe(43000);expect(r.net).toBe(64271.09);
});
test('4B MAHEP: 50.000 brüt, %65 ek ödeme; Ekim 2026 sendikalı ve sendikasız',()=>{
 const base={ucret:50000,ekOdemeOran:65,esCalismiyor:false,sendika:false,kucuk:0,buyuk:0,engelliKucuk:0,engelliBuyuk:0,ay:10,oncekiMatrah:0};
 const a=sozlesmeliMaas(base,maasKatsayilari(donem,'maas'),parametreler);
 expect(a.gelir).toBe(84881.84);expect(a.vergiMatrahi).toBe(43000);expect(a.net).toBe(76653.38);
 const b=sozlesmeliMaas({...base,sendika:true},maasKatsayilari(donem,'maas'),parametreler);
 expect(b.gelir).toBe(85995.73);expect(b.vergiMatrahi).toBe(42570.02);expect(b.net).toBe(77393.34);
 expect(b.satirlar.find(s=>s.ad==='Sendika kesintisi')!.tutar).toBe(-429.98);expect(b.satirlar.find(s=>s.ad==='Damga vergisi')!.tutar).toBe(-402.01);
 const c=sozlesmeliMaas({...base,sendika:true,esCalismiyor:true,besOran:3,ilksan:1},maasKatsayilari(donem,'maas'),parametreler);
 expect(c.net).toBe(78474.48);expect(c.satirlar.find(s=>s.ad==='BES kesintisi')!.tutar).toBe(-1500);expect(c.satirlar.find(s=>s.ad==='İLKSAN aidatı')!.tutar).toBe(-1000);
});
test('4/B prim tavanı ve engellilik vergi matrahı',()=>{
 const g={ucret:400000,ekOdemeOran:0,esCalismiyor:false,sendika:false,kucuk:0,buyuk:0,engelliKucuk:0,engelliBuyuk:0,ay:10};
 const a=sozlesmeliMaas(g,maasKatsayilari(donem,'maas'),parametreler);
 expect(a.pek).toBe(297270);expect(a.vergiMatrahi).toBe(358382.2);
 const b=sozlesmeliMaas({...g,engellilikDerecesi:1},maasKatsayilari(donem,'maas'),parametreler);
 expect(b.vergiMatrahi).toBe(346382.2);
});
// OzkanSoft EMIHEP, 2026 Temmuz–Aralık, öğretmen (29.10.2026 sorguları). Kalemler bağlama oranı uygulanmış hâliyle.
for(const f of [
 {ad:'KHA ve EKEA 1/4, 25 yıl',g:{kadroDerece:'1/4',derece:'1/4',hizmetYili:25,hizmetAyi:0},temel:6026.33,taban:19346.19,kidem:590.82,oh:16277.01,ek:1689.61,ilave:2785.16,net:46715.12,ikramiye:1408011.5,ikAylik:743444.72},
 {ad:'KHA 1/4, EKEA 3/1',g:{kadroDerece:'1/4',derece:'3/1',hizmetYili:25,hizmetAyi:0},temel:5459.15,taban:19346.19,kidem:590.82,oh:16277.01,ek:1666.93,ilave:2747.76,net:46087.85,ikramiye:1389105.36,ikAylik:724538.58},
 {ad:'KHA 3/1, EKEA 1/4 (ek gösterge 2200 → %55)',g:{kadroDerece:'3/1',derece:'1/4',hizmetYili:25,hizmetAyi:0},temel:4372.05,taban:19346.19,kidem:590.82,oh:6174.04,ek:1219.32,ilave:2009.93,net:33712.34,ikramiye:1016102.89,ikAylik:351536.12},
 {ad:'25 yıl 6 ay',g:{kadroDerece:'1/4',derece:'1/4',hizmetYili:25,hizmetAyi:6},temel:6066.51,taban:19475.16,kidem:594.76,oh:16385.52,ek:1700.88,ilave:2803.73,net:47026.56,ikramiye:1408011.5,ikAylik:743444.72},
 {ad:'30 yıl',g:{kadroDerece:'1/4',derece:'1/4',hizmetYili:30,hizmetAyi:0},temel:6428.09,taban:20635.93,kidem:630.2,oh:17362.14,ek:1802.25,ilave:2970.84,net:49829.46,ikramiye:1408011.5,ikAylik:743444.72},
])test(`emekli: EMIHEP öğretmen ${f.ad}`,()=>{
 const r=emekliMaas({unvan:50,mezuniyet:1,kidemYili:25,ikramiyeYili:25,...f.g},maasKatsayilari(donem,'maas'),parametreler,dereceler);
 expect(r.satirlar.map(s=>s.tutar)).toEqual([f.temel,f.taban,f.kidem,f.oh,f.ek,f.ilave]);
 expect(r.net).toBe(f.net);
 // İkramiyede tam yarım kuruşlu tutarlar (ör. 18.875 × 1,575512 × 25 = 743.444,725) kaynakta farklı yönde yuvarlanabiliyor: ±1 kuruş.
 expect(Math.abs(r.ikramiyeAylik-f.ikAylik)).toBeLessThanOrEqual(.011);expect(Math.abs(r.ikramiye-f.ikramiye)).toBeLessThanOrEqual(.011);
 // Emeklilik tazminatı 13.558 × 1,575512 = 21.360,79; damga 162,13; net 21.198,66.
 expect(r.yollukBrut).toBe(21360.79);expect(r.yolluk).toBe(21198.66);
});
for(const path of ['/sozlesmeli-memur-maas-hesaplama/','/emekli-memur-maas-hesaplama/'])test(`${path} form, hata ve mobil temalar`,async({page})=>{
 await page.goto(path);await expect(page.locator('[data-d-net]')).toContainText('TL');
 if(path.startsWith('/sozlesmeli')){
  await page.locator('#unvan').selectOption('1');await expect(page.locator('#ucret')).toHaveValue('');await expect(page.locator('[data-d-net]')).toHaveText('—');
  await page.locator('#ucret').fill('50.000,50');await expect(page.locator('[data-d-hata]')).toBeHidden();
  const before=await page.locator('[data-d-net]').textContent();await page.locator('#kucuk').selectOption('1');await expect(page.locator('[data-d-net]')).not.toHaveText(before!);
  await page.locator('#ucret').fill('-1');await expect(page.locator('[data-d-net]')).toHaveText('—');
 }else{await page.locator('#hizmetYili').fill('51');await expect(page.locator('[data-d-net]')).toHaveText('—');}
 await page.getByRole('button',{name:'Sıfırla',exact:true}).click();await expect(page.locator('[data-d-hata]')).toBeHidden();
 for(const theme of ['light','dark'])for(const width of [320,375,414,768,1440]){
  await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(0);
 }
});
