import {test,expect} from '@playwright/test';
import {memurMaas} from '../src/lib/memur-maas';
import {baslangicGirdi,maasKatsayilari,donem,parametreler,dereceler} from '../src/lib/maas-veri';
const k=maasKatsayilari(donem,'maas');
const hesap=(patch={})=>{const r=memurMaas({...baslangicGirdi,unvan:1010,unvanKosulu:'lise',derece:'10/1',hizmetYili:0,bes:false,ay:10,...patch},k,parametreler,dereceler);if(r.eksik)throw new Error(r.eksikNedeni);return r;};
test('MAHEP sendika: aylık 707 gösterge, aidat ve net',()=>{
 const r=hesap({sendika:true});
 expect(r.gelirler.find(s=>s.ad==='Toplu sözleşme ikramiyesi')!.tutar).toBe(1113.89);
 expect(r.kesintiler.find(s=>s.ad==='Sendika kesintisi')!.tutar).toBe(373.22);
 expect(r.damga).toBe(315.85);expect(r.net).toBeCloseTo(68998.71,2);
});
test('MAHEP A96–100, kurumca yararlanılmayan: dil aidata ve damgaya dahil, GV dışında',()=>{
 const r=hesap({sendika:true,yabanciDil:'A1' as const,dilKurumYararlaniyor:false});
 expect(r.gelirler.find(s=>s.ad==='Dil tazminatı')!.tutar).toBe(1339.19);
 expect(r.kesintiler.find(s=>s.ad==='Sendika kesintisi')!.tutar).toBe(379.92);
 expect(r.vergiMatrahi).toBeCloseTo(21637.59,2);expect(r.damga).toBe(326.02);expect(r.net).toBeCloseTo(70321.03,2);
 const cocuk=hesap({sendika:true,yabanciDil:'A1' as const,dilKurumYararlaniyor:false,cocuk:{kucuk:0,buyuk:0,engelliKucuk:1,engelliBuyuk:0}});
 expect(cocuk.gelirler.find(s=>s.ad==='Aile yardımı (çocuk)')!.tutar).toBe(1260.41);expect(cocuk.net).toBeCloseTo(71581.44,2);
});
test('resmî 2026 hakları: engelli çocuk %60, dil puanı ve kurum onayı',()=>{
 const aile=hesap({cocuk:{kucuk:0,buyuk:0,engelliKucuk:1,engelliBuyuk:1}});
 expect(aile.gelirler.find(s=>s.ad==='Aile yardımı (çocuk)')!.tutar).toBe(1890.61);
 for(const [yabanciDil,standart,onayli] of [['A1',850,1300],['A2',850,1000],['B',600,700],['C',350,400]] as const){
  for(const [onay,gosterge] of [[false,standart],[true,onayli]] as const){
   const r=hesap({yabanciDil,dilKurumYararlaniyor:onay});
   expect(r.gelirler.find(s=>s.ad==='Dil tazminatı')!.tutar).toBeCloseTo(gosterge*k.aylik,2);
   expect(r.vergiMatrahi).toBeCloseTo(hesap().vergiMatrahi,2);
  }
 }
});
