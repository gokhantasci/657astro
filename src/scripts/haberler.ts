import {yerelYol} from '../lib/site-yolu';
import {yayinDisi} from '../lib/yayin-filtresi';

const panel=document.querySelector<HTMLElement>('[data-news]');
if(panel){
 const radios=[...panel.querySelectorAll<HTMLInputElement>('[data-news-filter] input')];
 const prev=panel.querySelector<HTMLButtonElement>('[data-news-prev]')!;
 const next=panel.querySelector<HTMLButtonElement>('[data-news-next]')!;
 const pager=panel.querySelector<HTMLElement>('[data-news-pager]')!;
 const status=panel.querySelector<HTMLElement>('[data-news-status]')!;
 const kontrol=panel.querySelector<HTMLElement>('[data-news-kontrol]')!;
 const liste=panel.querySelector<HTMLUListElement>('ul.news')!;
 let items=[...liste.querySelectorAll<HTMLElement>('[data-kaynak]')],sayfa=1,mesgul=false;
 let sonKontrol=Date.parse(panel.dataset.newsKontrol||'')||0;
 const boyu=Number(panel.dataset.newsBoyu)||5;
 const uygula=()=>{
  const kaynak=radios.find(r=>r.checked)?.value||'',secili=items.filter(li=>!kaynak||li.dataset.kaynak===kaynak);
  const toplam=Math.max(1,Math.ceil(secili.length/boyu));sayfa=Math.min(sayfa,toplam);
  items.forEach(li=>li.hidden=true);secili.slice((sayfa-1)*boyu,sayfa*boyu).forEach(li=>li.hidden=false);
  status.textContent=`${sayfa} / ${toplam} · ${secili.length} haber`;prev.disabled=sayfa===1;next.disabled=sayfa===toplam;pager.hidden=toplam<=1;
 };
 radios.forEach(r=>r.addEventListener('change',()=>{sayfa=1;uygula();}));
 prev.addEventListener('click',()=>{sayfa--;uygula();});next.addEventListener('click',()=>{sayfa++;uygula();});uygula();
 type Haber={source:string;date:string;title:string;url:string};
 const gecerli=(h:unknown):h is Haber=>{
  if(!h||typeof h!=='object')return false;const x=h as Haber;
  if(typeof x.title!=='string'||!x.title.trim()||typeof x.source!=='string'||!radios.some(r=>r.value===x.source)||typeof x.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x.date)||!Number.isFinite(Date.parse(x.date))||typeof x.url!=='string'||yayinDisi(x.title))return false;
  try{const u=new URL(x.url);return u.protocol==='https:'&&['adalet.gov.tr','hsk.gov.tr','uyap.gov.tr'].some(host=>u.hostname===host||u.hostname.endsWith('.'+host));}catch{return false;}
 };
 const satir=(h:Haber)=>{
  const li=document.createElement('li');li.dataset.kaynak=h.source;
  const a=document.createElement('a');a.href=h.url;a.target='_blank';a.rel='noopener noreferrer';
  const meta=document.createElement('span');meta.className='news__meta';
  const chip=document.createElement('span');chip.className='chip chip--'+h.source.toLocaleLowerCase('tr-TR').replace(/ı/g,'i').replace(/ş/g,'s').replace(/[^a-z0-9]/g,'');chip.textContent=h.source;
  const time=document.createElement('time');time.dateTime=h.date;time.textContent=h.date.split('-').reverse().join('/');
  const title=document.createElement('span');title.className='news__title';title.textContent=h.title;
  const dis=document.createElement('span');dis.className='visually-hidden';dis.textContent=' (resmî kaynak, yeni sekmede açılır)';
  meta.append(chip,time);a.append(meta,title,dis);li.append(a);return li;
 };
 async function yenile(){
  if(mesgul)return;mesgul=true;
  try{
   // Veri yenilemesi tam site derlemesini beklemez. Beş dakikalık sorgu anahtarı önceki CDN kontrolünden ayrılır.
   const tur=Math.floor(Date.now()/300000);
   const urls=[`https://raw.githubusercontent.com/gokhantasci/657astro/main/src/data/haber-akisi.json?v=${tur}`,yerelYol(`/haber-akisi.json?v=${tur}`)];
   let ok=false;
   for(const url of urls){try{
    const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)continue;
    const data=await r.json(),tarih=Date.parse(data.kontrolTarihi);
    if(!Number.isFinite(tarih)||!Array.isArray(data.haberler))continue;
    const tekil=new Map<string,Haber>();
    for(const h of data.haberler.filter(gecerli).sort((a:Haber,b:Haber)=>b.date.localeCompare(a.date)) as Haber[])if(!tekil.has(h.title))tekil.set(h.title,h);
    const haberler=[...tekil.values()];
    if(!haberler.length||tarih<sonKontrol)continue;
    if(tarih>sonKontrol){items=haberler.map(satir);liste.replaceChildren(...items);sonKontrol=tarih;uygula();}
    const zaman=new Intl.DateTimeFormat('tr-TR',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Istanbul'}).format(tarih);
    const eksik=Array.isArray(data.kaynaklar)&&data.kaynaklar.some((k:{basarili:boolean})=>!k.basarili);
    kontrol.textContent=`Son kaynak kontrolü: ${zaman}${eksik?' · Bazı kaynakların önceki haberleri korunuyor.':''}${Date.now()-tarih>7200000?' · Güncelleme gecikmiş olabilir.':''}`;
    ok=true;break;
   }catch{/* Diğer veri kaynağını dene; mevcut haberleri silme. */}}
   if(!ok)kontrol.textContent='Güncel akışa ulaşılamadı; son kaydedilen haberler gösteriliyor.';
  }finally{mesgul=false;}
 }
 panel.querySelector('[data-news-yenile]')?.addEventListener('click',()=>void yenile());
 void yenile();setInterval(()=>{if(!document.hidden)void yenile();},300000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void yenile();});
}
