import type {MaasGirdi,MaasKatsayilari,MaasParametreleri,DereceSatiri} from './memur-maas';
import type {Donem} from './settings';
import {PROFIL_SURUMU,unvanMaasOrnekleri} from './maas-profilleri';
export interface UnvanProfili {id:string;ad:string;kod:number;dusuk:{derece:string;hizmetYili:number;mezuniyet:1|2};uyari?:string;}
export interface UnvanKaydi {unvanId:string;dusuk:number|null;yuksek:number|null;kaynak:string;varsayimlar:string[];uyari:string|null;girdiler?:{dusuk:MaasGirdi;yuksek:MaasGirdi};}
export interface MaasYayini {surum:1;profilSurumu?:string;donemId:string;yil:number;etiket:string;baslangic:string|null;bitis:string|null;tur:'hesap'|'aktarim';aciklama?:string;aktarimTarihi?:string;kayitlar:UnvanKaydi[];hesapBaglami?:unknown;}
/** Yayının tarihi: dönem başlangıcı; dönemi belirsiz aktarımda kaynak kaydındaki aktarım tarihi. Derleme tarihi kullanılmaz. */
export const yayinTarihi=(a:Pick<MaasYayini,'baslangic'|'aktarimTarihi'>)=>a.baslangic??a.aktarimTarihi??null;
export const maasHref=(unvanId:string,yil:number)=>`/${unvanId}-maasi-${yil}/`;
export function donemEtiketi(baslangic:string,bitis:string){
 const ay=(s:string)=>new Intl.DateTimeFormat('tr-TR',{month:'long',timeZone:'UTC'}).format(new Date(s+'T00:00:00Z'));
 return `${ay(baslangic)}–${ay(bitis)} ${baslangic.slice(0,4)}`;
}
export function guncelYayinUret(unvanlar:UnvanProfili[],d:Donem,k:MaasKatsayilari,p:MaasParametreleri,dereceler:DereceSatiri[],temel:MaasGirdi):MaasYayini{
 const ay=Number(d.baslangic.slice(5,7));
 return {surum:1,profilSurumu:PROFIL_SURUMU,donemId:d.baslangic,yil:Number(d.baslangic.slice(0,4)),etiket:donemEtiketi(d.baslangic,d.bitis),baslangic:d.baslangic,bitis:d.bitis,tur:'hesap',
  hesapBaglami:{motor:'657-memur-v3',katsayilar:k,parametreler:p,dereceler},
  kayitlar:unvanlar.map(u=>{
   const r=unvanMaasOrnekleri(u,k,p,dereceler,temel,ay),low=r.dusuk?.girdi,high=r.yuksek?.girdi;
   const profil=(g:MaasGirdi|undefined)=>g?`${g.derece}, ${g.mezuniyet===1?'önlisans/lisans':'lise ve diğerleri'}, ${g.hizmetYili} yıl, ${g.kanun}${g.unvanKosulu?' · '+p.unvanKurallari?.[u.kod]?.varyantlar?.[g.unvanKosulu]?.ad:''}`:'Doğrulanmış profil bulunamadı';
   return {unvanId:u.id,dusuk:r.dusuk?.net??null,yuksek:r.yuksek?.net??null,kaynak:d.kaynak,...(low&&high?{girdiler:{dusuk:low,yuksek:high}}:{}),
    varsayimlar:[`Düşük örnek: ${profil(low)}; bekâr, çocuksuz, sendika yok.`,
     `Yüksek örnek: ${profil(high)}; çalışmayan eş, biri 72 ay altında iki çocuk, sendika var.`,
     `BES, yabancı dil, taşınır yetkisi, engellilik ve diğer özel görev artırımları yok. Düşük örnekte genel öğrenim giriş derece/kademesi, kadronun doğrulanmış derece aralığıyla birlikte değerlendirilir. Özel meslek intibakı ve kadroya ilk atama koşulları belirlenmez; yasal maaş sınırı değildir.`,
     `${ay}. ay istisnası; önceki kümülatif matrah ve bu ay kullanılan istisnalar sıfır.`],
    uyari:!low||!high?'Bu unvanın ödeme oranları tamamlanmadığından eksik hesap gösterilmez.':u.uyari??null};
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
