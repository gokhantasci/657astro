import {maasTahmininiGuncelle} from './maas-tahmini';
import {tahminKatsayilari,tahminVergiGirdisi} from '../lib/maas-tahmini';
import {memurMaas,type MaasGirdi,type MaasKatsayilari,type MaasParametreleri,type DereceSatiri} from '../lib/memur-maas';
const el=document.querySelector('#unvan-tahmin-veri');
if(el){
 const v=JSON.parse(el.textContent!) as {girdiler:{dusuk:MaasGirdi;yuksek:MaasGirdi};k:MaasKatsayilari;p:MaasParametreleri;dereceler:DereceSatiri[]};
 maasTahmininiGuncelle(t=>{
  const run=(g:MaasGirdi)=>memurMaas(tahminVergiGirdisi(g,t,v.k.vergi!.yil),tahminKatsayilari(v.k,t),v.p,v.dereceler);
  const low=run(v.girdiler.dusuk),high=run(v.girdiler.yuksek);
  if(low.eksik)throw Error(low.eksikNedeni);
  return {net:low.net,kidemli:high.eksik?null:high.net,not:'Tablodaki aynı düşük ve kıdemli profiller yeniden hesaplanır.'};
 });
}
