import {test,expect} from '@playwright/test';
import {smmHesap,faizHesap,faizOrani,type FaizGirdi} from '../src/lib/mali-hesap';
import {maliKurallar} from '../src/lib/mali-veri';
import {davaAcilis} from '../src/lib/dava-acilis';
import {hukukTarifeSec} from '../src/lib/hukuk-veri';
const v=maliKurallar.faiz;
test('SMM: iki kaynakta 10.000 brüt ve 8.000 net örnekleri',()=>{
 const brut=smmHesap({tutar:10000,yon:'brut',stopaj:20,kdv:20,tevkifat:0});expect(brut).toMatchObject({brut:10000,stopaj:2000,net:8000,kdv:2000,tahsilat:10000,toplam:12000});
 expect(smmHesap({tutar:8000,yon:'net',stopaj:20,kdv:20,tevkifat:0})).toEqual(brut);
 expect(smmHesap({tutar:12000,yon:'toplam',stopaj:20,kdv:20,tevkifat:0})).toEqual(brut);
 expect(smmHesap({tutar:10000,yon:'tahsilat',stopaj:17,kdv:10,tevkifat:0})).toMatchObject({brut:10752.69,stopaj:1827.96,net:8924.73,kdv:1075.27,tahsilat:10000});
});
test('SMM: GİB yöntemi, KDV tevkifatı ve kuruş tutarlılığı',()=>{
 const r=smmHesap({tutar:10000,yon:'brut',stopaj:20,kdv:20,tevkifat:50});expect(r).toMatchObject({stopaj:2000,kdv:2000,tevkifat:1000,kalanKdv:1000,tahsilat:9000});
 expect(smmHesap({tutar:9000,yon:'tahsilat',stopaj:20,kdv:20,tevkifat:50})).toMatchObject({brut:10000,tahsilat:9000});
 const p=smmHesap({tutar:12345.67,yon:'brut',stopaj:17,kdv:10,tevkifat:70});expect(p.tahsilat).toBe(Number((p.net+p.kalanKdv).toFixed(2)));
 expect(()=>smmHesap({tutar:1,yon:'net',stopaj:100,kdv:20,tevkifat:0})).toThrow('bulunamaz');
 expect(()=>smmHesap({tutar:-1,yon:'brut',stopaj:0,kdv:0,tevkifat:0})).toThrow();
});
const base:FaizGirdi={anapara:100000,baslangic:'2026-01-01',bitis:'2026-02-01',tur:'kanuni',oran:24,yilEsasi:365};
for(const f of [
 {ad:'iki kaynak 31 gün %24',g:base,faiz:2038.36,gun:31,bolum:1},
 {ad:'31 Temmuz 2026 kanun geçişi',g:{...base,bitis:'2026-09-01'},faiz:16591.78,gun:243,bolum:2},
 {ad:'Saffet 2025 TCMB avans',g:{...base,tur:'avans' as const,baslangic:'2025-01-01',bitis:'2026-01-01'},faiz:44491.10,gun:365,bolum:4},
 {ad:'3095/2 yarıyıl kuralı',g:{...base,tur:'ticari' as const,baslangic:'2025-01-01',bitis:'2026-01-01'},faiz:46729.45,gun:365,bolum:2},
 {ad:'Saffet TTK 1530 yıl geçişi',g:{...base,tur:'ttk' as const,baslangic:'2024-07-01',bitis:'2025-07-01'},faiz:50603.42,gun:365,bolum:2},
 {ad:'artık yıl ve eski kanuni tarife',g:{...base,baslangic:'2024-01-01',bitis:'2025-01-01'},faiz:17819.18,gun:366,bolum:2},
 {ad:'manuel 360',g:{...base,tur:'elle' as const,yilEsasi:360 as const},faiz:2066.67,gun:31,bolum:1},
])test(`faiz ${f.ad}`,()=>{const r=faizHesap(f.g,v);expect(r.faiz).toBe(f.faiz);expect(r.gun).toBe(f.gun);expect(r.satirlar).toHaveLength(f.bolum);});
test('faiz: eşik günü, veri sonu, geçersiz takvim ve DST',()=>{
 expect(faizOrani('2026-07-30','kanuni',v)).toBe(24);expect(faizOrani('2026-07-31','kanuni',v)).toBe(31);expect(faizOrani('2026-10-30','ttk',v)).toBe(43);
 expect(faizHesap({...base,baslangic:'2026-07-31',bitis:'2026-08-01'},v)).toMatchObject({gun:1,faiz:84.93});
 expect(faizHesap({...base,bitis:base.baslangic},v).faiz).toBe(0);
 expect(()=>faizHesap({...base,bitis:'2026-11-01'},v)).toThrow('eksik');expect(()=>faizHesap({...base,baslangic:'2026-02-30'},v)).toThrow('Takvim');
 expect(()=>faizHesap({...base,bitis:'2025-01-01'},v)).toThrow('önce');
});
test('dava açılışı: Saffet harçları ve resmî gider avansı farkı',()=>{
 const {h}=hukukTarifeSec('2026-10-30');const t={...maliKurallar.dava,posta:300,kesif:5188};
 const g={deger:100000,parasal:true,cismani:false,sulh:false,harcMuaf:false,vekil:true,kesif:false,taraf:2,diger:530,bilirkisi:0,tanik:0,arac:0};
 const r=davaAcilis(g,h,t);expect(r).toMatchObject({harc:2543.75,pesin:1707.75,posta:3000,gider:3530,toplam:6073.75});
 // Kaynak 630 TL diğer avans ekliyor: aynı kullanıcı tutarı verilirse 6.173,75 TL.
 expect(davaAcilis({...g,diger:630},h,t).toplam).toBe(6173.75);
 expect(davaAcilis({...g,cismani:true},h,t).pesin).toBe(341.55);
 expect(davaAcilis({...g,deger:1000},h,t).pesin).toBe(183);
 expect(davaAcilis({...g,harcMuaf:true,kesif:true},h,t)).toMatchObject({harc:0,toplam:3530});
});
for(const path of ['/serbest-meslek-makbuzu-hesaplama/','/faiz-hesaplama/','/dava-acma-masraflari/'])test(`${path} form, hata, sıfırla ve mobil temalar`,async({page})=>{
 await page.goto(path);
 const dava=path.startsWith('/dava'),out=page.locator(dava?'[data-da-toplam]':'[data-mali-ana]'),hata=page.locator(dava?'[data-da-hata]':'[data-mali-hata]');await expect(out).toContainText('TL');
 if(path.startsWith('/serbest')){await page.locator('#tevkifat').selectOption('50');await expect(out).toContainText('9.000,00');await page.locator('#stopaj').fill('101');}
 else if(dava){await page.locator('#harcMuaf').selectOption('1');await expect(out).toContainText('3.530,00');await page.locator('#taraf').fill('1,5');}
 else{await page.locator('#tur').selectOption('elle');await expect(page.locator('#oran')).toBeEnabled();await page.locator('#oran').fill('12,5');await expect(hata).toBeHidden();await page.locator('#anapara').fill('-1');}
 await expect(out).toHaveText('—');await expect(hata).toBeVisible();await page.getByRole('button',{name:'Sıfırla',exact:true}).click();await expect(hata).toBeHidden();await expect(out).toContainText('TL');
 for(const theme of ['light','dark'])for(const width of [320,375,768,1440]){await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(0);}
});
