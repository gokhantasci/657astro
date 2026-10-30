import {kamuHesapla,type HesapBaglami,type Degerler} from './kamu-hesaplari';
import type {MaasTahmini} from './maas-tahmini';
import {isciMaas,type IsciGirdi} from './isci-maas';
import rules from '../data/isci-kurallari.json' with {type:'json'};
import {yuvarla} from './vergi';
export const TAHMINLI_KAMU_ARACLARI=['ucretli-ogretmen','isci-4d','muhtar','belediye-baskani','akademik-ek-ders','ek-ders'];
export function kamuMaasTahmini(id:string,v:Degerler,k:HesapBaglami,t:MaasTahmini,tis?:number){
 const gelecek:Degerler={...v,ay:t.hedefAy,kullanilanGv:0,kullanilanDv:0};
 if(t.hedefYil!==k.vergi.yil)Object.assign(gelecek,{oncekiMatrah:0,oncekiAsgariMatrah:0,oncekiPek:0});
 if(id==='isci-4d'){
  if(tis===undefined||!Number.isFinite(tis)||tis<0||tis>100)throw new Error('Kurum/TİS zam senaryosunu girin.');
  const carpan=1+tis/100;
  for(const key of ['gunlukUcret','sosyalYardim','gunlukYemek','nakitYol','fazlaCalismaBrut','digerBrut','sendikaAidati'])gelecek[key]=yuvarla(v[key]*carpan);
  const n=isciMaas(gelecek as unknown as IsciGirdi,k.vergi,rules,true);
  return {net:n.net,not:'Kurum/TİS senaryosu kullanılır; mevcut vergi, prim ve yemek istisnası kuralları korunur. Tediye ve ikramiye günleri girdiğiniz gibi tutulur.'};
 }
 if(id==='belediye-baskani')gelecek.prim=yuvarla(v.prim*t.yeni.aylik/k.aylik);
 const yeni={...k,aylik:t.yeni.aylik};
 return {net:kamuHesapla(id,gelecek,yeni).deger,not:id==='muhtar'?'Asgari ücrete tamamlama sınırı mevcut değerde tutulur.':id==='belediye-baskani'?'Girdiğiniz çalışan prim tutarı katsayı artışıyla aynı oranda artırılır.':''};
}
