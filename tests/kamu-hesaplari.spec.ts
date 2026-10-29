import {test,expect} from '@playwright/test';
import {kamuHesapla,type Degerler} from '../src/lib/kamu-hesaplari';
import {kamuAraclari} from '../src/lib/kamu-katalog';
import kurallar from '../src/data/kamu-kurallari.json' with {type:'json'};
import vergi from '../src/data/vergi.json' with {type:'json'};
const k={aylik:1.575512,asgariNet:28075.50,muhtarGosterge:14750,vergi,kurallar};
function hesap(id:string,patch:Degerler={},baglam=k){
 const a=kamuAraclari.find(a=>a.id===id)!;
 return kamuHesapla(id,{...Object.fromEntries(a.fields.map(f=>[f.id,f.value])),...patch},baglam);
}
test('akademik: profesör, gece artırımı ve 50 kişilik sınav grubu/tavanı',()=>{
 // (10 + 5*1,6) * 300 * 1,575512 = 8.507,76; 51 kişi 2 grup = 945,31.
 const r=hesap('akademik-ek-ders',{gunduzSaat:10,geceSaat:5,ogrenci:51});
 expect(r.satirlar[0].deger).toBe(8507.76);expect(r.satirlar[1].deger).toBe(945.31);
 expect(r.satirlar[2].deger).toBe(9453.07);
 expect(hesap('akademik-ek-ders',{ogrenci:501}).satirlar[1].deger).toBe(4726.54);
});
test('ek ders: gündüz, artırımların toplanması ve tek tür ters hesap',()=>{
 // 20 * 140 * 1,575512 = 4.411,43; %15 GV 661,71; DV 33,48.
 const r=hesap('ek-ders',{saat:20});expect(r.deger).toBe(3716.24);
 expect(r.satirlar[0].deger).toBe(4411.43);
 // %7 öğrenim + %100 DYK, tabanın %207'sidir.
 const artis=hesap('ek-ders',{saat:20,egitimArtis:7,gorevArtis:100});
 expect(artis.satirlar[0].deger).toBe(9131.67);
 expect(hesap('ek-ders-saat',{net:3716.24}).deger).toBe(20);
 expect(hesap('ek-ders',{saat:20,kullanilanGv:0,kullanilanDv:0}).deger).toBe(4411.43);
});
test('İLKSAN: 120 ay şartı, 25 ve 26 yıl sınırında 2026 yöntemi',()=>{
 expect(()=>hesap('ilksan',{aylar:119})).toThrow('120 ay');
 // 25 yıl: 100.000*2,5 + 1.000*100 + 1.000*4*25 = 450.000.
 expect(hesap('ilksan',{toplamAidat:100000,sonAidat:1000,aylar:311}).deger).toBe(450000);
 // 26 yıl yeni yöntem: 255.000 + 105.000 + 117.000 = 477.000.
 expect(hesap('ilksan',{toplamAidat:100000,sonAidat:1000,aylar:312}).deger).toBe(477000);
 expect(hesap('ilksan',{toplamAidat:100000,sonAidat:1000,aylar:312,donem:2025}).deger).toBe(454000);
});
test('bileşik enflasyon: negatif ay ve yüzde yüz sınırı',()=>{
 const sifir={enf0:0,enf1:0,enf2:0,enf3:0,enf4:0,enf5:0};
 expect(hesap('enflasyon-orani',{...sifir,enf0:10,enf1:-10}).deger).toBe(-1);
 // Varsayılanlar ortak enflasyon kaydından gelir: Temmuz–Eylül 2026 resmî oranları 1,78 + 1,84 + 1,84; (1,0178·1,0184·1,0184−1) = %5,56.
 expect(hesap('enflasyon-orani').deger).toBe(5.56);
 expect(()=>hesap('enflasyon-orani',{enf0:-100})).toThrow();
});
test('muhtar: asgari ücret tabanı ve taban üstündeki ödenek',()=>{
 expect(hesap('muhtar').deger).toBe(28075.50);
 expect(hesap('muhtar',{}, {...k,aylik:3}).deger).toBe(43914.14);
});
test('68/B: özel sektör üst sınırı, 5300 ek gösterge ve kısa öğrenim',()=>{
 const r=hesap('hizmet-68b',{derece:1,ekGosterge:5300,kamuGun:1800,ozelGun:10000,askerlikGun:360});
 expect(r.deger).toBe(4320);expect(r.satirlar[1].deger).toBe(2160);expect(r.satirlar[2].deger).toBe(0);
 expect(hesap('hizmet-68b',{derece:1,ekGosterge:5299}).satirlar[0].deger).toBe(3600);
 expect(hesap('hizmet-68b',{ogrenim:2}).satirlar[0].deger).toBe(3600);
 expect(hesap('hizmet-68b',{ozelGun:10000,ustKadro:1}).deger).toBe(10000);
});
test('lojman: süre kesirleri, gelir eşiği ve konut kesintileri',()=>{
 // 10 + 52,5 - 6 + 6 + 6 + 1 - 4 + 3 - 15 - 10 = 43,5.
 const r=hesap('lojman',{basari:1,hizmetYil:10,hizmetAy:6,oturmaYil:2,es:1,cocuk:2,aile:1,digerGelir:56151,beklemeYil:3,yakinKonut:1,uzakKonut:1});
 expect(r.deger).toBe(43.5);
});
test('yolluk: aile sabit unsur tavanı, eş mesafesi ve konaklama limiti',()=>{
 // 6 kişinin taşıtı 1.200, yol gündeliği 600, sabit 6.000, mesafe 1.000.
 expect(hesap('surekli-yolluk',{gundelik:100,km:200,tasit:200,aile:5,yolGun:1}).deger).toBe(8800);
 expect(hesap('surekli-yolluk',{gundelik:100,km:200,tasit:200,aile:5,yolGun:1,esDurumu:1}).deger).toBe(8300);
 expect(hesap('gecici-yolluk',{gundelik:300,tamGun:2,ucIkiGun:1,ucBirGun:1,tasit:1000,gece:2,otel:1500,otelLimit:1200}).deger).toBe(4300);
});
test('belediye başkanı: nüfus sınırları ve il merkezi asgari göstergesi',()=>{
 for(const [nufus,g] of [[10000,70000],[10001,80000],[50001,100000],[2000001,230000]]){
  expect(hesap('belediye-baskani',{nufus}).satirlar[0].deger).toBe(g);
 }
 expect(hesap('belediye-baskani',{nufus:5000,ilMerkezi:1}).satirlar[0].deger).toBe(100000);
 expect(()=>hesap('belediye-baskani',{prim:1e8})).toThrow('brüt');
});
for(const arac of kamuAraclari)test(`${arac.id}: form, canonical, doğrulama, mobil ve iki tema`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(arac.path);
 await expect(page.locator('h1')).toHaveText(arac.title);
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://657.com.tr'+arac.path);
 await expect(page.locator('[data-kamu-deger]')).not.toHaveText('—');
 const field=arac.fields.find(f=>!f.options);
 if(field){
  await page.locator('#'+field.id).fill('');await page.locator('#'+field.id).dispatchEvent('input');
  await expect(page.locator('[data-kamu-hata]')).toBeVisible();
  await expect(page.locator('[data-kamu-deger]')).toHaveText('—');
  await page.locator('[data-kamu-sifirla]').click();await expect(page.locator('[data-kamu-hata]')).toBeHidden();
 }
 for(const theme of ['light','dark'])for(const width of [320,375,1440]){
  await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${theme} ${width}`).toBe(true);
 }
 expect(errors).toEqual([]);
});
test('ek ders: Türkçe ondalık, hesap güncelleme ve betiksiz başlangıç',async({page,browser})=>{
 await page.goto('/ogretmen-ek-ders-hesaplama/');await page.locator('#saat').fill('20,5');
 await expect(page.locator('[data-kamu-deger]')).not.toHaveText('0,00 TL');
 await expect(page.locator('[data-kamu-hata]')).toBeHidden();
 await page.setViewportSize({width:375,height:812});
 await page.screenshot({path:'artifacts/kamu-light-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>document.documentElement.dataset.theme='dark');
 await page.screenshot({path:'artifacts/kamu-dark-desktop.png',fullPage:true});
 const c=await browser.newContext({javaScriptEnabled:false});const p=await c.newPage();
 await p.goto('http://127.0.0.1:4321/muhtar-maasi-hesaplama/');
 await expect(p.locator('[data-kamu-deger]')).toHaveText('28.075,50 TL');await c.close();
});
