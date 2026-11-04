import {test,expect} from '@playwright/test';
import source from './fixtures/adliyeci-canli-20261103.json' with {type:'json'};
import {kararHesap,islahHarci,istinafHarci,paylastir,type KararGirdi} from '../src/lib/hukuk-hesap';
import {hukukTarifeSec} from '../src/lib/hukuk-veri';
import {kesinlesme,iso} from '../src/lib/kesinlesme';
import {tatilGunleri} from '../src/lib/tatil-veri';
import metinler from './fixtures/adliyeci-hukum-metinleri.json' with {type:'json'};
const {h,v}=hukukTarifeSec('2026-10-30');
const g:KararGirdi={tur:'tam-kabul',tarih:'2026-10-30',mahkeme:'asliye',parasal:true,dava:100000,kabul:60000,davaciVekil:true,davaliVekil:true,onIncelemeOnce:false,ilkCelse:false,pesin:732,tamamlama:0,islah:0,basvuru:732,kesifHarci:0,kesif:0,bilirkisi:1000,posta:100,davaliGider:0,arabuluculuk:0,harcMuaf:false,giderDavacida:false,sulhDavaliPay:50};
const row=(id:string)=>source.find(r=>r.id===id)!;
const nums=(id:string,field:string)=>(row(id).sayilar as Record<string,number[]>)[field];
test('hüküm metni: tam/kısmi kabul, düşük ve yüksek dava değerinde kaynakla aynı sözlük',()=>{
 for(const m of metinler){const r=kararHesap({...g,tur:m.tur as KararGirdi['tur'],dava:m.dava,...(m.tur==='acilmamis'?{pesin:1000,onIncelemeOnce:m.id.endsWith('once')}:{})},h,v);expect(r.taslak.replace(/\s+/g,' ').trim(),m.id).toBe(m.metin);}
});

test('Adliyeci canlı WebForms: karar ve yardımcı araçların aynı girdili örnekleri',()=>{
 expect(source).toHaveLength(17);
 const tam=kararHesap(g,h,v);expect([tam.harc,g.pesin,tam.bakiye]).toEqual(nums('tam-kabul','lblhar'));expect(tam.davaci).toBe(nums('tam-kabul','lblvek')[0]);expect(tam.davaciyaGider).toBe(nums('tam-kabul','lblyar').at(-1));
 const partial=kararHesap({...g,tur:'kismen-kabul'},h,v);expect([partial.harc,g.pesin,partial.bakiye]).toEqual(nums('kismen-kabul','lblhar'));expect(partial.davali).toBe(nums('kismen-kabul','lbldavvek')[0]);expect(partial.davaciyaDiger).toBe(nums('kismen-kabul','lblyar2').at(-1));
 expect(kararHesap({...g,tur:'red'},h,v).davali).toBe(nums('red','lblvek')[0]);
 for(const once of [true,false]){const id=once?'acilmamis-once':'acilmamis-sonra',r=kararHesap({...g,tur:'acilmamis',onIncelemeOnce:once,pesin:1000},h,v);expect(r.davali).toBe(nums(id,'lblvek')[0]);expect([r.harc,r.iade]).toEqual(nums(id,'lblhar'));}
 const nafaka=kararHesap({...g,tur:'nafaka-tam',mahkeme:'aile',dava:500},h,v);expect(nafaka.davaci).toBe(nums('nafaka-tam','lblvek')[0]);
 const maddi=kararHesap({...g,tur:'maddi-tazminat',dava:1000000,kabul:50000},h,v);expect(maddi.davaci).toBe(nums('maddi','lblvek')[0]);expect(maddi.davali).toBe(nums('maddi','lbldavvek')[0]);
 expect(islahHarci(10000,100000,h).harc).toBe(nums('islah','lblhar')[0]);expect(istinafHarci(100000,h).karar).toBe(nums('istinaf','lblhar')[0]);expect(istinafHarci(1000000,h,true,false,false,true).karar).toBe(nums('istinaf-cismani','lblhar')[0]);expect(istinafHarci(100000,h,true,true).karar).toBe(nums('aile-istinaf','lblhar')[0]);
 const shares=paylastir(2000,[{ad:'Kurgu A',pay:75},{ad:'Kurgu B',pay:25}]);expect(shares.map(x=>x.tutar)).toEqual([nums('paylasim','Label28')[0],nums('paylasim','Label29')[0]]);
 expect(iso(kesinlesme('2026-01-28',2,'hafta',tatilGunleri).kesin)).toBe('2026-02-12');
});

test('Adliyeci farkları: feragatte nispi harç, nafakada sıfır keşif, güncel manevi ret ücreti',()=>{
 for(const once of [true,false]){
  const id=once?'feragat-once':'feragat-sonra',r=kararHesap({...g,tur:'feragat',ilkCelse:once,onIncelemeOnce:once},h,v);
  expect(r.davali).toBe(nums(id,'lblvek')[0]);
  expect(nums(id,'lblhar')[0]).toBe(once?244:488);expect(r.harc).toBe(once?2277:4554);
 }
 const n=kararHesap({...g,tur:'nafaka-kismen',mahkeme:'aile',dava:10000,kabul:6000},h,v);
 expect(n.harc).toBe(nums('nafaka-kismen','lblhar')[0]);expect(n.davaci).toBe(nums('nafaka-kismen','lblvek')[0]);expect(nums('nafaka-kismen','Label20')[0]).toBe(732);expect(n.davaciyaGider).toBe(2124);
 const m=kararHesap({...g,tur:'manevi-tazminat',dava:1000000,kabul:50000},h,v);expect(nums('manevi','lbldavvek')[0]).toBe(45000);expect(m.davali).toBe(148500);
});
