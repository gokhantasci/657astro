import {vekalet,nisbiVekalet,islahHarci,istinafHarci,kasaHesabi,paylastir,type HarcTarifesi,type VekaletTarifesi} from './hukuk-hesap';
import {tl} from './bicim';
export type YardimciTur='nispi-vekalet'|'islah-harci'|'istinaf-harci'|'kasa'|'paylasim';
export interface HukukAlan {id:string;ad:string;deger:string|number;secenekler?:{value:string|number;label:string}[]}
const yn=[{value:0,label:'Hayır'},{value:1,label:'Evet'}];
export function yardimciAlanlar(tur:YardimciTur,v:VekaletTarifesi):HukukAlan[]{
 if(tur==='nispi-vekalet')return [{id:'deger',ad:'Dava / takip değeri (TL)',deger:100000},{id:'mahkeme',ad:'Mahkeme / iş',deger:'asliye',secenekler:v.mahkemeler.map(m=>({value:m.id,label:m.ad}))},{id:'parasal',ad:'Para ile ölçülebilen iş mi?',deger:1,secenekler:yn}];
 if(tur==='islah-harci')return [{id:'eski',ad:'Islahtan önce dava değeri (TL)',deger:10000},{id:'yeni',ad:'Islahtan sonra dava değeri (TL)',deger:100000},{id:'cismani',ad:'Ölüm / cismani zarar tazminatı mı?',deger:0,secenekler:yn}];
 if(tur==='istinaf-harci')return [{id:'deger',ad:'Başvuruya konu değer / aylık nafaka (TL)',deger:100000},{id:'temyiz',ad:'Kanun yolu',deger:0,secenekler:[{value:0,label:'İstinaf'},{value:1,label:'Temyiz'}]},{id:'nisbi',ad:'Karar harcı türü',deger:1,secenekler:[{value:1,label:'Nispi'},{value:0,label:'Maktu'}]},{id:'nafaka',ad:'Aylık nafaka tutarı mı?',deger:0,secenekler:yn},{id:'cismani',ad:'Ölüm / cismani zarar tazminatı mı?',deger:0,secenekler:yn}];
 if(tur==='kasa')return [['ziraat','Ziraat Bankası bakiyesi'],['vakifEmanet','VakıfBank emanet hesabı'],['vakifHarc','VakıfBank harç hesabı'],['nakit','Fiziki kasa'],['maliye','Maliyeye aktarılacak'],['stopaj','Stopaj yükümlülüğü'],['damga','Damga vergisi yükümlülüğü'],['kasaAyrinti','Kasa ayrıntısındaki emanet / diğer yükümlülükler']].map(([id,ad])=>({id,ad:`${ad} (TL)`,deger:0}));
 return [{id:'toplam',ad:'Dağıtılacak toplam (TL)',deger:10000},{id:'yuzde',ad:'Dağıtım yöntemi',deger:1,secenekler:[{value:1,label:'Yüzde gir'},{value:0,label:'Kişi tutarlarını gir'}]}];
}
export function yardimciHesap(tur:YardimciTur,g:Record<string,string|number>,h:HarcTarifesi,v:VekaletTarifesi,kisiler:{ad:string;pay:number}[]=[]){
 const n=(id:string)=>Number(g[id]);
 let ana=0,etiket='Tutar',satirlar:{ad:string;tutar:number}[]=[],metin='';
 if(tur==='nispi-vekalet'){
  ana=vekalet(n('deger'),String(g.mahkeme),v,n('parasal')===1);etiket='Vekâlet ücreti';
  satirlar=nisbiVekalet(n('deger'),v).dilimler.map(d=>({ad:`${tl(d.matrah)} × %${d.oran}`,tutar:d.tutar}));
 }else if(tur==='islah-harci'){
  const r=islahHarci(n('eski'),n('yeni'),h,n('cismani')===1);ana=r.harc;etiket='Ödenecek ıslah harcı';satirlar=[{ad:'Artırılan dava değeri',tutar:r.artis}];
 }else if(tur==='istinaf-harci'){
  const r=istinafHarci(n('deger'),h,n('nisbi')===1,n('nafaka')===1,n('temyiz')===1,n('cismani')===1);ana=r.toplam;etiket='Başvuru + karar harcı';satirlar=[{ad:n('temyiz')===1?'Temyiz başvuru harcı':'İstinaf başvuru harcı',tutar:r.basvuru},{ad:'Karar harcı',tutar:r.karar}];
 }else if(tur==='kasa'){
  const r=kasaHesabi(['ziraat','vakifEmanet','vakifHarc','nakit'].map(n),['maliye','stopaj','damga','kasaAyrinti'].map(n));ana=r.fark;etiket=r.fark===0?'Kasa denk':r.fark>0?'Kasa fazlası':'Kasa eksikliği';satirlar=[{ad:'Banka ve kasa toplamı',tutar:r.bankaKasa},{ad:'Yükümlülükler toplamı',tutar:r.yukumluluk}];
 }else{
  satirlar=paylastir(n('toplam'),kisiler,n('yuzde')===1).map((k,i)=>({ad:k.ad||`${i+1}. kişi`,tutar:k.tutar}));ana=satirlar.reduce((a,b)=>a+b.tutar,0);etiket='Dağıtılan toplam';
 }
 metin=[`${etiket}: ${tl(ana)}`,...satirlar.map(s=>`${s.ad}: ${tl(s.tutar)}`)].join('\n');
 return {ana,etiket,satirlar,metin};
}
