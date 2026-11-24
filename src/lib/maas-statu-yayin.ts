import raw from '../data/sozlesmeli-unvanlar.json' with {type:'json'};
import {unvanlar,guncelYayin,maasYayinlari,maasHref} from './maas-yazilari';
import {donem,parametreler,dereceler,maasKatsayilari} from './maas-veri';
import {unvanEkGostergesi} from './memur-maas';
import {sozlesmeliTarife} from './sozlesmeli-tarife';
import {sozlesmeliMaas,sozlesmeliOncekiMatrah,emekliMaas,type EmekliGirdi} from './diger-maas';
import {normalize} from './normalize';
import {ayarlar,type Donem} from './settings';

const slug=(s:string)=>normalize(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const statuYili=guncelYayin.yil;
export const statuYillari=[...new Set(maasYayinlari.filter(a=>a.tur==='hesap').map(a=>a.yil))].sort((a,b)=>b-a);
function paramDonem(tarih:string){return ayarlar.donemler.find(d=>d.baslangic<=tarih&&d.bitis>=tarih);}
export function statuDonemi(yil:number=statuYili):Donem{
 const yilDonemleri=ayarlar.donemler.filter(d=>Number(d.baslangic.slice(0,4))===yil).sort((a,b)=>b.baslangic.localeCompare(a.baslangic));
 return yilDonemleri[0]??donem;
}
function yilAyKatsayilari(yil:number){
 return Array.from({length:12},(_,i)=>{const ay=i+1,tarih=`${yil}-${String(ay).padStart(2,'0')}-15`;
  const d=paramDonem(tarih);return d?{ay,k:maasKatsayilari(d,'maas')}:null;}).filter(x=>x!==null);
}
const sozlesmeliYilYazilari=(yil:number)=>[...raw.unvanlar].sort((a,b)=>a.ad.localeCompare(b.ad,'tr-TR')).map(u=>({tur:'sozlesmeli' as const,yil,id:u.id,ad:u.ad,unvanId:unvanlar.find(a=>normalize(a.ad)===normalize(u.ad))?.id,
 slug:`sozlesmeli-${slug(u.ad)}-maasi-${yil}`,baslik:`Sözleşmeli ${u.ad} Maaşı ${yil}`}));
const emekliYilYazilari=(yil:number)=>[...unvanlar].sort((a,b)=>a.ad.localeCompare(b.ad,'tr-TR')).map(u=>({tur:'emekli' as const,yil,id:String(u.kod),ad:u.ad,unvanId:u.id,
 slug:`emekli-${u.id}-maasi-${yil}`,baslik:`Emekli ${u.ad} Maaşı ${yil}`}));
export const sozlesmeliYazilari=sozlesmeliYilYazilari(statuYili);
export const emekliYazilari=emekliYilYazilari(statuYili);
export const statuYazilari=statuYillari.flatMap(yil=>[...sozlesmeliYilYazilari(yil),...emekliYilYazilari(yil)]);
export type StatuYazisi=typeof statuYazilari[number];
if(new Set(statuYazilari.map(s=>s.slug)).size!==statuYazilari.length)throw new Error('Yinelenen statü maaşı adresi.');
export function statuBaglantilari(ad:string,yil:number=statuYili){
 const aktif=unvanlar.find(u=>normalize(u.ad)===normalize(ad));
 return [...(aktif?[{ad:'Kadrolu',href:maasHref(aktif.id,yil)}]:[]),...statuYazilari.filter(s=>s.yil===yil&&normalize(s.ad)===normalize(ad)).map(s=>({ad:s.tur==='sozlesmeli'?'Sözleşmeli':'Emekli',href:`/${s.slug}/`}))];
}
export function sozlesmeliOrnekleri(id:string,yil:number=statuYili){
 const d=statuDonemi(yil),k=maasKatsayilari(d,'maas'),ayKatsayilari=yilAyKatsayilari(yil);
 const u=raw.unvanlar.find(u=>u.id===id)!;
 return u.varyantlar.map(v=>({id:v.id,ad:v.ad,ornekler:[0,25].map(hizmetYili=>{
  if(!v.yillar[hizmetYili])return {hizmetYili,sonuc:null};
  const g={...sozlesmeliTarife(u,v.id,hizmetYili,k.aylik,raw.aylikKatsayi),...((u as {adalet?:boolean}).adalet?{ekTabanGosterge:parametreler.sozlesmeli_ek_taban_gosterge,ekOdemeArtis:parametreler.gorev_yeri_buyuksehir_oran}:{}),ay:Number(d.baslangic.slice(5,7)),esCalismiyor:false,sendika:false,kucuk:0,buyuk:0,engelliKucuk:0,engelliBuyuk:0,oncekiMatrah:0};
  g.oncekiMatrah=sozlesmeliOncekiMatrah(g,1,k,ayKatsayilari,parametreler);
  return {hizmetYili,sonuc:sozlesmeliMaas(g,k,parametreler),girdi:g};
 })}));
}
export function emekliOrnekleri(unvanId:string,yil:number=statuYili){
 const d=statuDonemi(yil),k=maasKatsayilari(d,'maas');
 const u=unvanlar.find(u=>u.id===unvanId)!;
 const kayitGirdi=guncelYayin.kayitlar.find(x=>x.unvanId===unvanId)?.girdiler?.yuksek;
 const g=kayitGirdi??(unvanEkGostergesi({unvan:u.kod,derece:'1/4',mezuniyet:1},parametreler,dereceler)!==null?{derece:'1/4',mezuniyet:1 as const,unvanKosulu:undefined}:undefined);
 if(!g)return [];
 // Doğrulanmış kıdemli profilin kadro/öğrenim koşulu korunur; tutar aktif maaştan türetilmez.
 return [25,30].map(hizmetYili=>{
  const girdi:EmekliGirdi={unvan:u.kod,unvanKosulu:g.unvanKosulu,kadroDerece:g.derece,derece:g.derece,mezuniyet:g.mezuniyet,hizmetYili,hizmetAyi:0,kidemYili:25,ikramiyeYili:hizmetYili};
  return {girdi,sonuc:emekliMaas(girdi,k,parametreler,dereceler)};
 });
}
export function statuHesapYolu(yazi:StatuYazisi,varyant?:string){
 const d=statuDonemi(yazi.yil);
 const q=new URLSearchParams({unvan:yazi.id,butceDonemi:d.baslangic});
 if(yazi.tur==='sozlesmeli'){q.set('ay',String(Number(d.baslangic.slice(5,7))));if(varyant)q.set('varyant',varyant);}
 else {const g=emekliOrnekleri(yazi.unvanId!,yazi.yil)[0]?.girdi;if(g)for(const [key,val]of Object.entries(g))if(val!==undefined)q.set(key,String(val));}
 return `/${yazi.tur==='sozlesmeli'?'sozlesmeli':'emekli'}-memur-maas-hesaplama/?${q}`;
}
export {raw as sozlesmeliKaynak};
