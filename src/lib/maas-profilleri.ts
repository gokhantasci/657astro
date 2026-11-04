import {memurMaas,type MaasGirdi,type MaasKatsayilari,type MaasParametreleri,type DereceSatiri} from './memur-maas';
import type {UnvanProfili} from './unvan-yayin';
import {normalize} from './normalize';

export const PROFIL_SURUMU='standart-aile-2026-v2';
/** 657/36 genel öğrenim başlangıcı; özel meslek intibakı veya atama uygunluğu belirlemez. */
export function ogrenimBaslangici(mezuniyet:1|2,ad=''){
 const n=normalize(ad);
 if(mezuniyet===2){if(n.includes('ilkokul')&&!n.includes('lise'))return {derece:15,kademe:1};if(n.includes('ortaokul')&&!n.includes('lise'))return {derece:14,kademe:2};return {derece:13,kademe:3};}
 if(/2\s*(yil|yillik)|iki yil/.test(n)||/\bonlisans\b/.test(n)&&!/\blisans\b/.test(n))return {derece:10,kademe:2};
 if(/3\s*(yil|yillik)|uc yil/.test(n))return {derece:10,kademe:3};
 if(/5\s*(yil|yillik)|bes yil/.test(n))return {derece:9,kademe:2};
 if(/6\s*(yil|yillik)|alti yil/.test(n))return {derece:9,kademe:3};
 return {derece:9,kademe:1};
}
export function unvanMaasOrnekleri(u:UnvanProfili,k:MaasKatsayilari,p:MaasParametreleri,ds:DereceSatiri[],temel:MaasGirdi,ay:number){
 const rule=p.unvanKurallari?.[u.kod];
 const variants=rule?.varyantlar?Object.entries(rule.varyantlar):rule?[['',rule] as const]:[];
 const ortak:MaasGirdi={...temel,unvan:u.kod,kip:'maas',ay,oncekiMatrah:0,kullanilanGvIstisna:0,kullanilanDvIstisna:0,haciz:0,hacizHarcEkle:false,bes:false,sendika:false,ilksan:false,polsan:false,tasinirYetkili:false,yabanciDil:'',engellilikDerecesi:0,esCalismiyor:false,cocuk:{kucuk:0,buyuk:0,engelliKucuk:0,engelliBuyuk:0},ogretmen:{kariyer:1,belletici:false,altGorev:0,alan:0}};
 const sonuc=(yuksek:boolean)=>{
  let best:{girdi:MaasGirdi;net:number}|null=null;
  const adaylar:MaasGirdi[]=[];
  for(const [id,v] of variants){
   const bas=ogrenimBaslangici(v.mezuniyet,'ad' in v?String(v.ad):''),degrees=Object.keys(v.dereceler).map(Number),uygun=degrees.filter(d=>d<=bas.derece),degree=yuksek?Math.min(...degrees):Math.max(...uygun);
   const rows=ds.filter(d=>Number(d.derece.split('/')[0])===degree),d=yuksek?rows.at(-1):rows.find(d=>d.derece===`${degree}/${degree===bas.derece?bas.kademe:1}`)??rows[0];
   if(d)adaylar.push({...ortak,unvanKosulu:id||undefined,derece:d.derece,mezuniyet:v.mezuniyet,hizmetYili:yuksek?30:0,kanun:yuksek?5434:5510});
  }
  if(!variants.length||rule?.legacyDefault){const bas=ogrenimBaslangici(u.dusuk.mezuniyet),dn=Math.min(Number(u.dusuk.derece.split('/')[0]),bas.derece),dusuk={...u.dusuk,derece:dn===bas.derece?`${dn}/${bas.kademe}`:u.dusuk.derece};adaylar.push({...ortak,...(yuksek?{derece:'1/4',mezuniyet:1 as const,hizmetYili:30,kanun:5434 as const}:dusuk),unvanKosulu:undefined});}
  for(const candidate of adaylar){
   const girdi:MaasGirdi={...candidate,hizmetYili:yuksek?30:0,...(yuksek?{esCalismiyor:true,cocuk:{kucuk:1,buyuk:1,engelliKucuk:0,engelliBuyuk:0},sendika:true}:{})};
   const r=memurMaas(girdi,k,p,ds);
   if(!r.eksik&&Number.isFinite(r.net)&&(!best||(yuksek?r.net>best.net:r.net<best.net)))best={girdi,net:Math.round(r.net*100)/100};
  }
  return best;
 };
 return {dusuk:sonuc(false),yuksek:sonuc(true)};
}
