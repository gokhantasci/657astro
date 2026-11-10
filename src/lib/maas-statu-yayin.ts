import raw from '../data/sozlesmeli-unvanlar.json' with {type:'json'};
import {unvanlar,guncelYayin,maasHref} from './maas-yazilari';
import {donem,parametreler,dereceler,maasKatsayilari} from './maas-veri';
import {sozlesmeliTarife} from './sozlesmeli-tarife';
import {sozlesmeliMaas,sozlesmeliOncekiMatrah,emekliMaas,type EmekliGirdi} from './diger-maas';
import {normalize} from './normalize';
import {ayarlar} from './settings';

const slug=(s:string)=>normalize(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const k=maasKatsayilari(donem,'maas');
export const statuYili=guncelYayin.yil;
const ayKatsayilari=Array.from({length:12},(_,i)=>{const ay=i+1,tarih=`${statuYili}-${String(ay).padStart(2,'0')}-15`;
 const d=paramDonem(tarih);return d?{ay,k:maasKatsayilari(d,'maas')}:null;}).filter(x=>x!==null);
function paramDonem(tarih:string){return ayarlar.donemler.find(d=>d.baslangic<=tarih&&d.bitis>=tarih);}
export const sozlesmeliYazilari=raw.unvanlar.map(u=>({tur:'sozlesmeli' as const,id:u.id,ad:u.ad,unvanId:unvanlar.find(a=>normalize(a.ad)===normalize(u.ad))?.id,
 slug:`sozlesmeli-${slug(u.ad)}-maasi-${statuYili}`,baslik:`Sözleşmeli ${u.ad} Maaşı ${statuYili}`}));
export const emekliYazilari=unvanlar.map(u=>({tur:'emekli' as const,id:String(u.kod),ad:u.ad,unvanId:u.id,
 slug:`emekli-${u.id}-maasi-${statuYili}`,baslik:`Emekli ${u.ad} Maaşı ${statuYili}`}));
export const statuYazilari=[...sozlesmeliYazilari,...emekliYazilari];
export type StatuYazisi=typeof statuYazilari[number];
if(new Set(statuYazilari.map(s=>s.slug)).size!==statuYazilari.length)throw new Error('Yinelenen statü maaşı adresi.');
export function statuBaglantilari(ad:string){
 const aktif=unvanlar.find(u=>normalize(u.ad)===normalize(ad));
 return [...(aktif?[{ad:'Kadrolu',href:maasHref(aktif.id,statuYili)}]:[]),...statuYazilari.filter(s=>normalize(s.ad)===normalize(ad)).map(s=>({ad:s.tur==='sozlesmeli'?'Sözleşmeli':'Emekli',href:`/${s.slug}/`}))];
}
export function sozlesmeliOrnekleri(id:string){
 const u=raw.unvanlar.find(u=>u.id===id)!;
 return u.varyantlar.map(v=>({id:v.id,ad:v.ad,ornekler:[0,25].map(hizmetYili=>{
  if(!v.yillar[hizmetYili])return {hizmetYili,sonuc:null};
  const g={...sozlesmeliTarife(u,v.id,hizmetYili,k.aylik,raw.aylikKatsayi),ay:Number(donem.baslangic.slice(5,7)),esCalismiyor:false,sendika:false,kucuk:0,buyuk:0,engelliKucuk:0,engelliBuyuk:0,oncekiMatrah:0};
  g.oncekiMatrah=sozlesmeliOncekiMatrah(g,1,k,ayKatsayilari,parametreler);
  return {hizmetYili,sonuc:sozlesmeliMaas(g,k,parametreler),girdi:g};
 })}));
}
export function emekliOrnekleri(unvanId:string){
 const u=unvanlar.find(u=>u.id===unvanId)!;
 const g=guncelYayin.kayitlar.find(x=>x.unvanId===unvanId)?.girdiler?.yuksek;
 if(!g)return [];
 // Doğrulanmış kıdemli profilin kadro/öğrenim koşulu korunur; tutar aktif maaştan türetilmez.
 return [25,30].map(hizmetYili=>{
  const girdi:EmekliGirdi={unvan:u.kod,unvanKosulu:g.unvanKosulu,kadroDerece:g.derece,derece:g.derece,mezuniyet:g.mezuniyet,hizmetYili,hizmetAyi:0,kidemYili:25,ikramiyeYili:hizmetYili};
  return {girdi,sonuc:emekliMaas(girdi,k,parametreler,dereceler)};
 });
}
export function statuHesapYolu(yazi:StatuYazisi,varyant?:string){
 const q=new URLSearchParams({unvan:yazi.id,butceDonemi:donem.baslangic});
 if(yazi.tur==='sozlesmeli'){q.set('ay',String(Number(donem.baslangic.slice(5,7))));if(varyant)q.set('varyant',varyant);}
 else {const g=emekliOrnekleri(yazi.unvanId!)[0]?.girdi;if(g)for(const [key,val]of Object.entries(g))if(val!==undefined)q.set(key,String(val));}
 return `/${yazi.tur==='sozlesmeli'?'sozlesmeli':'emekli'}-memur-maas-hesaplama/?${q}`;
}
export {raw as sozlesmeliKaynak};
