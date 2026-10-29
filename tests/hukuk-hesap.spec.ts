import {test,expect} from '@playwright/test';
import {hukukTarifeSec} from '../src/lib/hukuk-veri';
import {kararHesap,nisbiVekalet,vekalet,islahHarci,istinafHarci,kasaHesabi,paylastir,type KararGirdi} from '../src/lib/hukuk-hesap';
import {kararAraclari,yardimciAraclar} from '../src/lib/hukuk-katalog';
import {eskiJson} from '../src/lib/eski-json';
const {h,v}=hukukTarifeSec('2026-10-30');
const g:KararGirdi={tur:'tam-kabul',tarih:'2026-10-30',mahkeme:'asliye',parasal:true,dava:100000,kabul:60000,davaciVekil:true,davaliVekil:true,onIncelemeOnce:false,ilkCelse:false,pesin:732,tamamlama:0,islah:0,basvuru:732,kesif:0,bilirkisi:1000,posta:100,davaliGider:0,arabuluculuk:0,harcMuaf:false,giderDavacida:false,sulhDavaliPay:50};
test('adliyeci.org tam kabul: 100.000 değer, 732 peşin, 1.100 diğer gider',()=>{
 // 30-10-2026 tarayıcı çıktısı: 6.831 harç, 6.099 bakiye, 45.000 ücret, 2.564 gider.
 const r=kararHesap(g,h,v);expect(r.harc).toBe(6831);expect(r.bakiye).toBe(6099);expect(r.davaci).toBe(45000);expect(r.davali).toBe(0);expect(r.davaciyaGider).toBe(2564);
});
test('adliyeci.org kısmi kabul: ücretler ayrı, harç gideri tam ve diğer gider %60',()=>{
 // Kaynak: 4.098,60 harç; 3.366,60 bakiye; davacı 45.000, davalı 40.000;
 // harç gideri 1.464 ve diğer gider 660. Toplam ücretin oranlanması farklı ve yanlıştır.
 const r=kararHesap({...g,tur:'kismen-kabul'},h,v);
 expect([r.harc,r.bakiye,r.davaci,r.davali,r.davaciyaHarc,r.davaciyaDiger,r.davaciyaGider]).toEqual([4098.6,3366.6,45000,40000,1464,660,2124]);
});
test('adliyeci.org usulden açılmamış sayılma: yarım maktu ücret ve fazla harç iadesi',()=>{
 const r=kararHesap({...g,tur:'acilmamis',parasal:false,onIncelemeOnce:true,pesin:1000},h,v);
 expect([r.harc,r.iade,r.davali]).toEqual([732,268,22500]);
});
test('uyumluluk JSON verisi de aynı güncel maktu ve keşif harcını kullanır',()=>{
 expect(eskiJson('data/nispivekalet.json')['2026'].mahkemeler.find((m:{key:string})=>m.key==='asliye').maktu).toBe(45000);
 expect(eskiJson('657/assets/veriler.json')[0].harclar['2026'].kesif.kesif).toBe(5188);
});
test('resmî AAÜT basamak sınırları ve alacağı aşmama',()=>{
 expect(nisbiVekalet(600000,v).tutar).toBe(96000);expect(nisbiVekalet(1200000,v).tutar).toBe(186000);
 expect(nisbiVekalet(2400000,v).tutar).toBe(354000);expect(nisbiVekalet(3600000,v).tutar).toBe(510000);
 expect(nisbiVekalet(18600000,v).tutar).toBe(1242000);expect(nisbiVekalet(19600000,v).tutar).toBe(1252000);
 expect(vekalet(10000,'asliye',v)).toBe(10000);expect(vekalet(100000,'asliye',v)).toBe(45000);
 expect(vekalet(100000,'icra-durusmali',v)).toBe(16000);expect(vekalet(1000000,'icra-durusmali',v)).toBe(18000);
});
test('husumet ve açılmamış sayılma farklı AAÜT maddeleridir',()=>{
 expect(kararHesap({...g,tur:'husumet',onIncelemeOnce:true},h,v).davali).toBe(16000);
 expect(kararHesap({...g,tur:'husumet',dava:1000000},h,v).davali).toBe(45000);
 expect(kararHesap({...g,tur:'acilmamis',onIncelemeOnce:true},h,v).davali).toBe(22500);
 expect(kararHesap({...g,tur:'acilmamis'},h,v).davali).toBe(45000);
});
test('feragatte harç celsesi ile ücretin ön incelemesi birbirinden bağımsız',()=>{
 const r=kararHesap({...g,tur:'feragat',ilkCelse:true,onIncelemeOnce:true},h,v);
 expect([r.harc,r.bakiye,r.davali,r.davaciyaGider]).toEqual([2277,1545,22500,0]);
 expect(kararHesap({...g,tur:'feragat',ilkCelse:false,onIncelemeOnce:true},h,v).harc).toBe(4554);
});
test('nafaka, maddi ve manevi tazminatın ayrı kuralları',()=>{
 const n=kararHesap({...g,tur:'nafaka-kismen',mahkeme:'aile',dava:10000,kabul:6000},h,v);
 expect(n.kabul).toBe(72000);expect(n.harc).toBe(819.36);expect(n.davaci).toBe(45000);expect(n.davali).toBe(0);
 expect(kararHesap({...g,tur:'nafaka-tam',mahkeme:'aile',dava:500},h,v).davaci).toBe(6000); // adliyeci.org düşük tutar
 const k={...g,dava:1000000,kabul:50000};
 expect(kararHesap({...k,tur:'maddi-tazminat'},h,v).davali).toBe(45000);
 expect(kararHesap({...k,tur:'manevi-tazminat'},h,v).davali).toBe(148500);
 expect(kararHesap({...k,tur:'manevi-tazminat',tarih:'2026-01-07'},h,v).davali).toBe(45000);
 expect(kararHesap({...k,tur:'maddi-tazminat',kabul:0},h,v).davali).toBe(45000);
 expect(kararHesap({...k,tur:'manevi-tazminat',kabul:0},h,v).davali).toBe(45000);
});
test('harç iadesi iki kere masraf sayılmaz; geçersiz tutar ve tarih reddedilir',()=>{
 const r=kararHesap({...g,tur:'red',pesin:2000},h,v);expect(r.iade).toBe(1268);expect(r.davaciyaGider).toBe(0);
 expect(()=>kararHesap({...g,kabul:100001,tur:'kismen-kabul'},h,v)).toThrow('geçemez');
 expect(()=>kararHesap({...g,dava:-1},h,v)).toThrow('Tutarları');
 expect(()=>hukukTarifeSec('2027-01-01')).toThrow('doğrulanmış');
 const k=kararHesap({...g,tur:'kismen-kabul',kesifHarci:500,kesif:1000},h,v);expect(k.davaciyaHarc).toBe(1964);expect(k.davaciyaDiger).toBe(1260);
 expect(k.taslak).toContain('45.000,00 TL');expect(k.taslak).toContain('davalıdan');
});
test('ıslah, istinaf ve kasa bağımsız sayısal örnekleri',()=>{
 expect(islahHarci(10000,100000,h).harc).toBe(1536.98);expect(islahHarci(10000,100000,h,true).harc).toBe(307.4);
 expect(()=>islahHarci(100000,10000,h)).toThrow('az olamaz');
 expect(istinafHarci(100000,h)).toEqual({karar:1707.75,basvuru:2002,toplam:3709.75});
 expect(istinafHarci(1000000,h,true,false,false,true).karar).toBe(3415.5); // adliyeci.org 1/20 örneği
 expect(istinafHarci(100,h).toplam).toBe(2734);
 expect(istinafHarci(100,h,false,false,true).toplam).toBe(5134.7);
 expect(kasaHesabi([100,50,0,10],[100,20,10,30])).toEqual({bankaKasa:160,yukumluluk:160,fark:0});
 expect(kasaHesabi([10],[20]).fark).toBe(-10);
});
test('paylaştırmada kuruş korunur ve küçük tutarda negatif pay çıkmaz',()=>{
 const r=paylastir(.6,Array.from({length:100},(_,i)=>({ad:String(i),pay:1})));
 expect(r.every(r=>r.tutar>=0)).toBe(true);expect(Math.round(r.reduce((a,b)=>a+b.tutar,0)*100)).toBe(60);
 expect(paylastir(100,[{ad:'A',pay:60},{ad:'B',pay:40}])).toEqual([{ad:'A',tutar:60},{ad:'B',tutar:40}]);
 expect(()=>paylastir(100,[{ad:'A',pay:40}])).toThrow('%100');
});
for(const a of [...kararAraclari,...yardimciAraclar])test(`${a.path} form, hata, sıfırlama ve mobil temalar`,async({page})=>{
 await page.goto(a.path);await expect(page.getByRole('heading',{level:1})).toBeVisible();
 const karar=kararAraclari.some(k=>k.path===a.path),ana=page.locator(karar?'[data-h-ana]':'[data-hy-ana]');await expect(ana).toContainText('TL');
 const tutar=page.locator('form input[inputmode="decimal"]').first();await tutar.fill('-1');await expect(ana).toHaveText('—');
 await page.getByRole('button',{name:'Sıfırla',exact:true}).click();await expect(ana).toContainText('TL');
 for(const theme of ['light','dark']){await page.setViewportSize({width:320,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(0);}
});
