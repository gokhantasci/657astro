import {yerelYol} from '../lib/site-yolu';
import {takvimTarihi} from '../lib/bicim';
type Sayac={sayi:number;bugun:number;baslangic:string};
const requests=new Map<string,Promise<Sayac>>();
const API=import.meta.env.PUBLIC_OKUNMA_API||yerelYol('/_657-servis/api/okunma');
async function kaydet(path:string,api:string):Promise<Sayac>{
 const body=JSON.stringify({path,istekId:crypto.randomUUID()});
 for(let deneme=0;deneme<2;deneme++)try{
  const r=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body,cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(!r.ok)throw Error('Sayaç erişimi yok.');const d=await r.json();
  if(!Number.isSafeInteger(d.sayi)||d.sayi<0||!Number.isSafeInteger(d.bugun)||d.bugun<0||d.bugun>d.sayi||!Number.isFinite(Date.parse(d.baslangic)))throw Error('Geçersiz sayaç.');
  return d;
 }catch(e){if(deneme===1)throw e;}
 throw Error('Sayaç erişimi yok.');
}
/** Kart ve bağımsız soru aynı kalıcı sayacı kullanır; aynı sayfada bir kez sayılır. */
export function okunmayiGoster(el:HTMLElement,path:string,taban=0){
 el.dataset.okunmaPath=path;
 taban=Number.isSafeInteger(taban)&&taban>=0?taban:0;
 const bugun=document.createElement('span');bugun.dataset.okunmaBugun='';bugun.textContent='Bugün: —';
 const toplam=document.createElement('span');toplam.dataset.okunmaToplam='';toplam.textContent=`Toplam: ${taban.toLocaleString('tr-TR')} kez okundu`;
 const durum=document.createElement('span');durum.dataset.okunmaYerel='';durum.textContent=' · Canlı sayaç yükleniyor';
 el.replaceChildren(bugun,document.createTextNode(' · '),toplam,durum);
 const api=el.dataset.okunmaApi||API;
 if(!requests.has(path))requests.set(path,kaydet(path,api));
 requests.get(path)!.then(d=>{
  if(el.dataset.okunmaPath!==path)return;
  bugun.textContent=`Bugün: ${d.bugun.toLocaleString('tr-TR')}`;
  toplam.textContent=`Toplam: ${(taban+d.sayi).toLocaleString('tr-TR')} kez okundu`;
  el.title=`Toplam: arşiv tabanı + ortak servis. Günlük ölçüm başlangıcı: ${takvimTarihi(d.baslangic)} (Türkiye saati).`;
  durum.textContent='';durum.hidden=true;
 }).catch(()=>{
  if(el.dataset.okunmaPath!==path)return;
  durum.textContent=' · Canlı sayaç okunamadı; toplam arşiv değeridir.';
 });
}
for(const el of document.querySelectorAll<HTMLElement>('[data-okunma-path]'))okunmayiGoster(el,el.dataset.okunmaPath!,Number(el.dataset.okunmaTaban||0));
