import {enflasyonFarki,type EnflasyonGirdi,type KatsayiSeti,type Sabitler} from './enflasyon';
import type {MaasKatsayilari} from './memur-maas';
import {sayiOku} from './bicim';

export interface MaasTahminVerisi {donem:string;girdi:EnflasyonGirdi;katsayi:KatsayiSeti;sabitler:Sabitler;hedefAy:number;hedefYil:number;vergiYili:number;}
export function maasTahmini(veri:MaasTahminVerisi,kayit:Record<string,unknown>={}){
 const aylar=veri.girdi.aylar.map((a,i)=>{
  if(a.endeks!==undefined)return a;
  const v=kayit[`ay-${i}`],n=typeof v==='string'?sayiOku(v):a.degisim;
  if(!Number.isFinite(n)||n<0||n>100)throw new Error('Enflasyon senaryosundaki aylık tahminleri kontrol edin.');
  return {degisim:n};
 });
 const r=enflasyonFarki({...veri.girdi,aylar},veri.katsayi,veri.sabitler);
 return {...r,hedefAy:veri.hedefAy,hedefYil:veri.hedefYil,resmiAy:veri.girdi.aylar.filter(a=>a.endeks!==undefined).length,sonrakiZam:veri.girdi.sonrakiZam,vergiYili:veri.vergiYili};
}
export type MaasTahmini=ReturnType<typeof maasTahmini>;
export function tahminKatsayilari(k:MaasKatsayilari,t:MaasTahmini):MaasKatsayilari{
 return {...k,aylik:t.yeni.aylik,taban:t.yeni.taban,yanOdeme:t.yeni.yanOdeme};
}
/** Yeni yılda matrah birikimi sıfırlanır; sonraki yarıyılda bilinen önceki matrah korunur. */
export function tahminVergiGirdisi<T extends {ay?:number;oncekiMatrah?:number}>(g:T,t:MaasTahmini,yil:number):T{
 return {...g,ay:t.hedefAy,...(t.hedefYil!==yil?{oncekiMatrah:0}:{}),kullanilanGvIstisna:0,kullanilanDvIstisna:0,kullanilanGv:0,kullanilanDv:0};
}
