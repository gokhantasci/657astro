import {maasTahmini,type MaasTahmini,type MaasTahminVerisi} from '../lib/maas-tahmini';
import {tl,yuzde,sayiOku} from '../lib/bicim';
type Hesap=(t:MaasTahmini,tis?:number)=>{net:number;not?:string;ikramiye?:number;kidemli?:number|null};
let hesap:Hesap|undefined;
function yenile(){
 const root=document.querySelector<HTMLElement>('[data-maas-tahmini]'),el=document.querySelector('#maas-tahmin-veri');if(!root||!el||!hesap)return;
 const out=(s:string)=>root.querySelector<HTMLElement>(`[data-mt-${s}]`)!;
 try{
  const d=JSON.parse(el.textContent!) as MaasTahminVerisi;
  let kayit:Record<string,unknown>={};try{kayit=JSON.parse(localStorage.getItem(`657:enflasyon-tahmin:${d.donem}`)??'{}')??{};}catch{/* Tarayıcı kaydı olmadan ortak resmî veri kullanılır. */}
  const t=maasTahmini(d,kayit),tisInput=root.querySelector<HTMLInputElement>('#mt-tis');
  out('fark').textContent=yuzde(Math.max(0,t.fark));out('zam').textContent=yuzde(t.kumulatifZam);
  let tis:number|undefined;
  if(tisInput){tis=tisInput.value.trim()===''?NaN:sayiOku(tisInput.value);if(!Number.isFinite(tis)||tis<0||tis>100)throw Error('Sonraki dönem için kurum/TİS zam oranını girin (0–100).');}
  const r=hesap(t,tis);if(!Number.isFinite(r.net))throw Error('Bu bilgilerle sonraki dönem tahmini hesaplanamadı.');
  out('net').textContent=tl(r.net);out('not').textContent=r.not??'';
  const ik=root.querySelector<HTMLElement>('[data-mt-ikramiye]');if(ik)ik.textContent=r.ikramiye===undefined?'—':tl(r.ikramiye);
  const kd=root.querySelector<HTMLElement>('[data-mt-kidemli]');if(kd)kd.textContent=r.kidemli===undefined||r.kidemli===null?'—':tl(r.kidemli);
 }catch(e){out('not').textContent=(e as Error).message;for(const el of root.querySelectorAll('[data-mt-net],[data-mt-ikramiye],[data-mt-kidemli]'))el.textContent='—';}
}
export function maasTahmininiGuncelle(fn:Hesap){hesap=fn;yenile();}
export function maasTahmininiTemizle(){hesap=undefined;for(const el of document.querySelectorAll('[data-mt-net],[data-mt-ikramiye],[data-mt-kidemli]'))el.textContent='—';}
window.addEventListener('storage',yenile);
document.querySelector('#mt-tis')?.addEventListener('input',yenile);
