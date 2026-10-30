import {aylikVergi,vergiIstisnasi,yuvarla,type VergiTarifesi} from './vergi';
import type Rules from '../data/isci-kurallari.json';
export interface IsciGirdi {gunlukUcret:number;ucretGun:number;primGun:number;hizmetPrimiOran:number;sosyalYardim:number;yemekGun:number;gunlukYemek:number;yemekIstisnaKosulu:number;nakitYol:number;tediyeGun:number;ikramiyeGun:number;fazlaCalismaBrut:number;digerBrut:number;sendikaAidati:number;besOran:number;oncekiPek:number;oncekiMatrah:number;ay:number;kullanilanGv:number;kullanilanDv:number;engellilik:number;digerKesinti:number;}
export function isciMaas(v:IsciGirdi,t:VergiTarifesi,k:typeof Rules,senaryo=false){
 if(t.yil!==k.yil)throw new Error('İşçi prim/istisna kuralları ile vergi tarifesinin yılı uyuşmuyor.');
 if(Object.values(v).some(n=>!Number.isFinite(n)||n<0))throw new Error('İşçi bordrosu alanlarına sıfır veya pozitif geçerli sayı girin.');
 for(const [key,max] of Object.entries({ucretGun:31,primGun:30,yemekGun:31,tediyeGun:52,ikramiyeGun:120,engellilik:3,ay:12}))if(!Number.isInteger(v[key as keyof IsciGirdi])||v[key as keyof IsciGirdi]>max)throw new Error('Gün, ay ve engellilik seçimlerini kontrol edin.');
 if(v.primGun<1||v.ay<1||(!senaryo&&v.ay<7)||v.besOran>100||v.hizmetPrimiOran>100||![0,1].includes(v.yemekIstisnaKosulu))throw new Error('Bu araç Temmuz–Aralık 2026 ve 1–30 prim günü içindir; oranları kontrol edin.');
 if(v.ucretGun>new Date(Date.UTC(k.yil,v.ay,0)).getUTCDate()||v.yemekGun>v.ucretGun)throw new Error('Ücret günü ayın takvim gününü, yemek günü ücret gününü aşamaz.');
 const ucret=yuvarla(v.gunlukUcret*v.ucretGun),hizmet=yuvarla(ucret*v.hizmetPrimiOran/100),yemek=yuvarla(v.gunlukYemek*v.yemekGun),tediye=yuvarla(v.gunlukUcret*v.tediyeGun),ikramiye=yuvarla(v.gunlukUcret*v.ikramiyeGun);
 const gelir=yuvarla(ucret+hizmet+v.sosyalYardim+yemek+v.nakitYol+tediye+ikramiye+v.fazlaCalismaBrut+v.digerBrut);
 const yemekSgkIstisna=v.yemekIstisnaKosulu?Math.min(yemek,v.yemekGun*k.yemekSgkGunlukIstisna):0;
 const yemekVergiIstisna=v.yemekIstisnaKosulu?Math.min(yemek,v.yemekGun*k.yemekVergiGunlukIstisna):0;
 const pekHam=Math.max(0,gelir-yemekSgkIstisna),pekTavan=yuvarla(t.asgariBrut/30*k.pekTavanKat*v.primGun),pek=yuvarla(Math.min(pekHam,Math.max(0,pekTavan-v.oncekiPek)));
 const sgk=yuvarla(pek*k.sgkCalisan/100),issizlik=yuvarla(pek*k.issizlikCalisan/100),bes=Math.floor(pek*v.besOran/100);
 if(v.sendikaAidati+v.digerKesinti>gelir)throw new Error('Aidat ve diğer kesintiler brüt gelirden fazla olamaz.');
 const matrah=yuvarla(Math.max(0,gelir-yemekVergiIstisna-sgk-issizlik-v.sendikaAidati-(t.engellilikIndirimleri[v.engellilik]??0)));
 const ist=vergiIstisnasi(v.ay,t),gv=Math.max(0,yuvarla(aylikVergi(matrah,v.oncekiMatrah,t)-Math.max(0,ist.gelir-v.kullanilanGv)));
 const dv=Math.max(0,yuvarla((gelir-yemekVergiIstisna)*t.damgaOrani/1000-Math.max(0,t.asgariBrut*t.damgaOrani/1000-v.kullanilanDv)));
 const kesinti=yuvarla(sgk+issizlik+gv+dv+v.sendikaAidati+bes+v.digerKesinti),net=yuvarla(gelir-kesinti);
 return {net,gelir,kesinti,matrah,pek,pekHam,pekTavan,yemekSgkIstisna,yemekVergiIstisna,sgk,issizlik,gv,dv,bes,ucret,hizmet,yemek,tediye,ikramiye,devredenPek:yuvarla(pekHam-pek)};
}
