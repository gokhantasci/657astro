import {takvimTarihi} from '../lib/bicim';
import {ARAC_SAYACLARI,HESAPLAMA_SAYACLARI_AKTIF,type SayacTuru} from '../lib/hesaplama-sayaclari';
export type {SayacTuru} from '../lib/hesaplama-sayaclari';
type Sayilar={bugun:number;buHafta:number;buYil:number;toplam:number};
type Ozet={sayaclar:Record<SayacTuru,Sayilar>;toplam:number;baslangic:string;baslangiclar?:Record<string,string>};
const API='/_657-servis/api/hesaplama';
const turler=ARAC_SAYACLARI.map(s=>s.anahtar);
let kullaniciBaslatti=false;
for(const name of ['input','change','click','submit'])document.addEventListener(name,event=>{if(event.isTrusted&&event.target instanceof Element&&event.target.closest('main'))kullaniciBaslatti=true;},true);
let dogrulandi=false;
const durum=(text:string)=>document.querySelectorAll('[data-sayac-durum]').forEach(el=>el.textContent=text);
function goster(data:Ozet){
 if(!data||!data.sayaclar||!Number.isSafeInteger(data.toplam)||data.toplam<0||!Number.isFinite(Date.parse(data.baslangic)))throw Error('Geçersiz sayaç yanıtı');
 for(const tur of Object.keys(data.sayaclar))for(const key of ['bugun','buHafta','buYil','toplam'] as const)if(!Number.isSafeInteger(data.sayaclar[tur]?.[key])||data.sayaclar[tur][key]<0)throw Error('Geçersiz sayaç değeri');
 for(const tur of turler){
  const s=data.sayaclar[tur],root=document.querySelector(`[data-hesap-sayaci="${tur}"]`);
  if(!s){if(root)throw Error('Araç sayacı yanıtta yok.');continue;}
  for(const [key,attr] of [['bugun','bugun'],['buHafta','hafta'],['buYil','yil'],['toplam','toplam']] as const){const el=root?.querySelector(`[data-sayac-${attr}]`);if(el)el.textContent=s[key].toLocaleString('tr-TR');}
  document.querySelectorAll(`[data-hesap-sayi="${tur}"]`).forEach(el=>el.textContent=s.toplam.toLocaleString('tr-TR'));
 }
 document.querySelectorAll('[data-home-toplam-hesaplama]').forEach(el=>el.textContent=data.toplam.toLocaleString('tr-TR'));
 dogrulandi=true;
 durum('Ölçüm başlangıcı: '+takvimTarihi(data.baslangic));
 for(const root of document.querySelectorAll<HTMLElement>('[data-hesap-sayaci]')){const start=data.baslangiclar?.[root.dataset.hesapSayaci!];const status=root.querySelector('[data-sayac-durum]');if(start&&status)status.textContent='Ölçüm başlangıcı: '+takvimTarihi(start);}
}
function baglantiHatasi(){durum(dogrulandi?'Sayaç bağlantısı yok; son doğrulanan sayılar gösteriliyor.':'Sayaç bağlantısı kurulamadı; kullanım toplamı doğrulanamıyor.');}
async function oku(){
 if(!HESAPLAMA_SAYACLARI_AKTIF)return;
 try{const r=await fetch(API,{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();goster(await r.json());}catch{baglantiHatasi();}
}
const bekleyen:Partial<Record<SayacTuru,ReturnType<typeof setTimeout>>>={};
const son:Partial<Record<SayacTuru,number>>={};
export function hesaplamaIptal(tur:SayacTuru){clearTimeout(bekleyen[tur]);}
function sonucGecerli(tur:SayacTuru){
 if(!['maas','enflasyon','kesinlesme','yargilama'].includes(tur))return true;
 const hata=document.querySelector<HTMLElement>(tur==='maas'?'[data-m-hata]':tur==='enflasyon'?'[data-e-hata]':'[data-k-durum]');
 if(tur==='yargilama')return true;
 return !!hata&&(tur==='kesinlesme'?!hata.hidden:hata.hidden);
}
export function hesaplamaArtir(tur:SayacTuru){
 if(!kullaniciBaslatti||!HESAPLAMA_SAYACLARI_AKTIF||!turler.includes(tur)||!sonucGecerli(tur))return;
 clearTimeout(bekleyen[tur]);
 bekleyen[tur]=setTimeout(async()=>{
  if(!sonucGecerli(tur)||Date.now()-(son[tur]??0)<2000)return;
  son[tur]=Date.now();
  const body=JSON.stringify({tur,istekId:crypto.randomUUID()});
  for(let deneme=0;deneme<2;deneme++)try{
   const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body,signal:AbortSignal.timeout(8000),keepalive:true});
   if(!r.ok){baglantiHatasi();return;}goster(await r.json());return;
  }catch{if(deneme===1)baglantiHatasi();}
 },500);
}
/** Yalnız tamamlanmış dosya/sorgu işlemleri çağırır; belge veya giriş değerleri gönderilmez. */
export async function aracKullanildi(tur=document.querySelector<HTMLElement>('[data-hesap-sayaci]')?.dataset.hesapSayaci){
 if(!tur||!turler.includes(tur)||!HESAPLAMA_SAYACLARI_AKTIF)return false;
 const body=JSON.stringify({tur,istekId:crypto.randomUUID()});
 for(let deneme=0;deneme<2;deneme++)try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true,signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();goster(await r.json());return true;}catch{if(deneme===1)baglantiHatasi();}
 return false;
}
if(typeof window!=='undefined'&&document.querySelector('[data-hesap-sayaci],[data-home-toplam-hesaplama]')){
 (window as unknown as {hesaplamaArtir:typeof hesaplamaArtir}).hesaplamaArtir=hesaplamaArtir;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void oku());else void oku();
 setInterval(()=>{if(!document.hidden)void oku();},60000);
}
