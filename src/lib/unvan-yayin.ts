import {memurMaas,type MaasGirdi,type MaasKatsayilari,type MaasParametreleri,type DereceSatiri} from './memur-maas';
import type {Donem} from './settings';
import {yuvarla} from './vergi';
export interface UnvanProfili {id:string;ad:string;kod:number;dusuk:{derece:string;hizmetYili:number;mezuniyet:1|2};uyari?:string;}
export interface UnvanKaydi {unvanId:string;dusuk:number|null;yuksek:number|null;kaynak:string;varsayimlar:string[];uyari:string|null;girdiler?:{dusuk:MaasGirdi;yuksek:MaasGirdi};}
export interface MaasYayini {surum:1;donemId:string;yil:number;etiket:string;baslangic:string|null;bitis:string|null;tur:'hesap'|'aktarim';aciklama?:string;kayitlar:UnvanKaydi[];hesapBaglami?:unknown;}
export const maasHref=(unvanId:string,yil:number)=>`/${unvanId}-maasi-${yil}/`;
export function donemEtiketi(baslangic:string,bitis:string){
 const ay=(s:string)=>new Intl.DateTimeFormat('tr-TR',{month:'long',timeZone:'UTC'}).format(new Date(s+'T00:00:00Z'));
 return `${ay(baslangic)}–${ay(bitis)} ${baslangic.slice(0,4)}`;
}
export function guncelYayinUret(unvanlar:UnvanProfili[],d:Donem,k:MaasKatsayilari,p:MaasParametreleri,dereceler:DereceSatiri[],temel:MaasGirdi):MaasYayini{
 const ay=Number(d.baslangic.slice(5,7));
 return {surum:1,donemId:d.baslangic,yil:Number(d.baslangic.slice(0,4)),etiket:donemEtiketi(d.baslangic,d.bitis),baslangic:d.baslangic,bitis:d.bitis,tur:'hesap',
  hesapBaglami:{motor:'657-memur-v3',katsayilar:k,parametreler:p,dereceler},
  kayitlar:unvanlar.map(u=>{
   const dusuk:MaasGirdi={...temel,...u.dusuk,unvan:u.kod,ay,oncekiMatrah:0,kullanilanGvIstisna:0,kullanilanDvIstisna:0};
   const yuksek:MaasGirdi={...dusuk,derece:'1/4',hizmetYili:30,mezuniyet:1,kanun:5434,esCalismiyor:true,cocuk:{kucuk:0,buyuk:0,engelliKucuk:3,engelliBuyuk:0},sendika:true,tasinirYetkili:true,bes:false,gorevYeri:'istanbul',yabanciDil:'A1',dilKurumYararlaniyor:false};
   const kosullar=p.unvanKurallari?.[u.kod]?.varyantlar;
   if(kosullar)for(const g of [dusuk,yuksek])g.unvanKosulu=Object.entries(kosullar).find(([,v])=>v.mezuniyet===g.mezuniyet)?.[0];
   const a=memurMaas(dusuk,k,p,dereceler),b=memurMaas(yuksek,k,p,dereceler);
   return {unvanId:u.id,dusuk:a.eksik?null:yuvarla(a.net),yuksek:b.eksik?null:yuvarla(b.net),kaynak:d.kaynak,girdiler:{dusuk,yuksek},
    varsayimlar:[`Düşük örnek: ${u.dusuk.mezuniyet===1?'önlisans/lisans':'lise ve diğerleri'}, ${u.dusuk.derece}, ${u.dusuk.hizmetYili} yıl, 5510; bekâr, çocuksuz, BES var, sendika yok, diğer iller.`,
     `Kıdemli örnek: yükseköğrenim, 1/4, 30 yıl, 5434; çalışmayan eş, 72 aydan küçük 3 engelli çocuk, sendika ve taşınır yetkisi var, BES yok, İstanbul/Ankara/İzmir, kurumca yararlanılmayan A düzeyi (96–100) dil.${p.unvanKurallari?.[u.kod]?.aciklama?' '+p.unvanKurallari[u.kod].aciklama:''}`,
     `${ay}. ay istisnası; önceki kümülatif matrah ve bu ay kullanılan istisnalar sıfır. Öğretmende kariyer/alan/alt görev artırımı yok.`],
    uyari:a.eksik||b.eksik?'Bu unvanın ödeme oranları tamamlanmadığından eksik hesap gösterilmez.':u.uyari??null};
  })};
}
export function yayinlariBirlestir(guncel:MaasYayini,arsiv:MaasYayini[]):MaasYayini[]{
 if(new Set(arsiv.map(a=>a.donemId)).size!==arsiv.length)throw new Error('Yinelenen maaş arşivi dönemi.');
 if(arsiv.some(a=>a.tur==='hesap'&&a.baslangic&&guncel.baslangic&&a.baslangic>guncel.baslangic))throw new Error('Yayımlanmış son dönemden eski bir dönem güncel seçilemez.');
 return [...arsiv.filter(a=>a.donemId!==guncel.donemId),guncel].sort((a,b)=>b.yil-a.yil||(b.baslangic??'').localeCompare(a.baslangic??''));
}
export function yayinSayfalari(unvanlar:UnvanProfili[],yayinlar:MaasYayini[]){
 const yillar=[...new Set(yayinlar.map(a=>a.yil))].sort((a,b)=>b-a);
 return yillar.flatMap(yil=>unvanlar.filter(u=>yayinlar.some(a=>a.yil===yil&&a.kayitlar.some(k=>k.unvanId===u.id))).map(u=>({slug:maasHref(u.id,yil).slice(1,-1),baslik:`${u.ad} Maaşı ${yil}`,yil,unvanId:u.id})));
}
