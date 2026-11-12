import {test,expect} from '@playwright/test';
import {sozlesmeliMaas} from '../src/lib/diger-maas';
import {donem,maasKatsayilari,parametreler} from '../src/lib/maas-veri';
const k=maasKatsayilari(donem,'maas');
// Sakarya Adliyesi, 4/B zabıt katibi, Ekim 2026 KBS bordrosu (kullanıcı belgesi):
// ücret 34.718,60 · ek taban 721 gösterge = 1.135,94 · ek ödeme %95 (%85 + büyükşehir 10 puan) = 14.218,99
// seyyanen 25.153,05 · sendika ikramiyesi 1.113,89 · çocuk 787,76 · GV 475,54 · DV 328,72 · net 70.922,63
test('4/B zabıt katibi KBS bordrosu: ek taban aylık, görev yeri artışı, matrah ve net birebir',()=>{
 const r=sozlesmeliMaas({ucret:34718.6,ekOdemeOran:85,ekOdemeArtis:10,ekTabanGosterge:721,esCalismiyor:false,sendika:true,kucuk:1,buyuk:0,engelliKucuk:0,engelliBuyuk:0,ay:10,istisnaBaslangicAyi:1,oncekiMatrah:247563.33},k,parametreler);
 const tut=(ad:string)=>Math.abs(r.satirlar.find(s=>s.ad===ad)!.tutar);
 expect(tut('Ek taban aylık')).toBeCloseTo(1135.94,2);
 expect(tut('Ek ödeme')).toBeCloseTo(14218.99,1);
 expect(tut('Sendika kesintisi')).toBeCloseTo(381.7,2);
 expect(tut('Emekli keseneği')).toBeCloseTo(3226.91,2);
 expect(tut('GSS primi')).toBeCloseTo(1792.73,2);
 expect(r.vergiMatrahi).toBeCloseTo(30453.2,2);
 expect(tut('Gelir vergisi')).toBeCloseTo(475.54,1);
 expect(tut('Damga vergisi')).toBeCloseTo(328.72,1);
 expect(Math.abs(r.net-70922.63)).toBeLessThanOrEqual(.1);
});
