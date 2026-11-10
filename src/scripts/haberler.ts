import {tarihMetni} from '../lib/tarih-metni';
import {gun,tarihSaat} from '../lib/bicim';
import {yerelYol} from '../lib/site-yolu';
import {yayinDisi} from '../lib/yayin-filtresi';
type Haber={source:string;date:string;title:string;url:string;institution?:string};
const panel=document.querySelector<HTMLElement>('[data-news]');
if(panel){
 const radios=[...panel.querySelectorAll<HTMLInputElement>('[data-news-filter] input')];
 const prev=panel.querySelector<HTMLButtonElement>('[data-news-prev]')!,next=panel.querySelector<HTMLButtonElement>('[data-news-next]')!;
 const pager=panel.querySelector<HTMLElement>('[data-news-pager]')!,status=panel.querySelector<HTMLElement>('[data-news-status]')!;
 const kontrol=panel.querySelector<HTMLElement>('[data-news-kontrol]')!,personelBilgi=panel.querySelector<HTMLElement>('[data-news-personel-bilgi]');
 const liste=panel.querySelector<HTMLUListElement>('ul.news')!,archive=panel.querySelector<HTMLAnchorElement>('a[data-news-arsiv]');
 // Tam akış bellekte tutulur; DOM'a yalnız geçerli sayfanın satırları yazılır.
 let records:Haber[]=[...liste.querySelectorAll<HTMLElement>('[data-kaynak]')].map(li=>({source:li.dataset.kaynak!,date:li.querySelector('time')!.dateTime,title:li.querySelector('.news__title')!.textContent!,url:li.querySelector('a')!.href,...(li.querySelector('[data-news-kurum]')?{institution:li.querySelector('[data-news-kurum]')!.textContent!}:{})}));
 let sayfa=1,mesgul=false,tamAkis=false,sonKontrol=Date.parse(panel.dataset.newsKontrol||'')||0;
 const boyu=Number(panel.dataset.newsBoyu)||5;
 const gecerli=(h:unknown):h is Haber=>{
  if(!h||typeof h!=='object')return false;const x=h as Haber;
  if(typeof x.title!=='string'||!x.title.trim()||!radios.some(r=>r.value===x.source)||typeof x.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x.date)||!Number.isFinite(Date.parse(x.date))||typeof x.url!=='string'||(x.source!=='Personel'&&yayinDisi(x.title)))return false;
  if(x.source==='Personel'&&(typeof x.institution!=='string'||!x.institution.trim()))return false;
  try{const u=new URL(x.url);return u.protocol==='https:'&&['adalet.gov.tr','hsk.gov.tr','uyap.gov.tr'].some(host=>u.hostname===host||u.hostname.endsWith('.'+host));}catch{return false;}
 };
 const satir=(h:Haber)=>{
  const li=document.createElement('li');li.dataset.kaynak=h.source;
  const a=document.createElement('a');a.href=h.url;a.target='_blank';a.rel='noopener noreferrer';
  const meta=document.createElement('span');meta.className='news__meta';
  const chip=document.createElement('span');chip.className='chip';chip.textContent=h.source;
  const time=document.createElement('time');time.dateTime=h.date;time.textContent=gun(h.date);
  const title=document.createElement('span');title.className='news__title';title.textContent=tarihMetni(h.title);
  const dis=document.createElement('span');dis.className='visually-hidden';dis.textContent=' (resmî kaynak, yeni sekmede açılır)';
  meta.append(chip);if(h.institution){const kurum=document.createElement('span');kurum.textContent=h.institution;kurum.dataset.newsKurum='';meta.append(kurum);}meta.append(time);a.append(meta,title,dis);li.append(a);return li;
 };
 const uygula=()=>{
  const radio=radios.find(r=>r.checked),kaynak=radio?.value||'',secili=records.filter(h=>!kaynak||h.source===kaynak);
  if(personelBilgi)personelBilgi.hidden=kaynak!=='Personel';if(archive)archive.href=radio?.dataset.newsArsiv||'/kurum-haberleri/';
  const toplam=Math.max(1,Math.ceil(secili.length/boyu));sayfa=Math.min(sayfa,toplam);
  liste.replaceChildren(...secili.slice((sayfa-1)*boyu,sayfa*boyu).map(satir));
  status.textContent=`${sayfa} / ${toplam} · ${secili.length} haber`;prev.disabled=sayfa===1;next.disabled=sayfa===toplam;pager.hidden=toplam<=1;
 };
 radios.forEach(r=>r.addEventListener('change',()=>{sayfa=1;uygula();}));
 prev.addEventListener('click',()=>{sayfa--;uygula();});next.addEventListener('click',()=>{sayfa++;uygula();});uygula();
 async function yenile(){
  if(mesgul)return;mesgul=true;
  try{
   const tur=Math.floor(Date.now()/300000),urls=[`https://raw.githubusercontent.com/gokhantasci/657astro/main/src/data/haber-akisi.json?v=${tur}`,yerelYol(`/haber-akisi.json?v=${tur}`)];let ok=false;
   for(const url of urls)try{
    const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)continue;
    const data=await r.json(),tarih=Date.parse(data.kontrolTarihi);if(!Number.isFinite(tarih)||!Array.isArray(data.haberler)||tarih<sonKontrol)continue;
    const tekil=new Map<string,Haber>();for(const h of data.haberler.filter(gecerli).sort((a:Haber,b:Haber)=>b.date.localeCompare(a.date)) as Haber[]){const key=h.source==='Personel'?h.url:h.title;if(!tekil.has(key))tekil.set(key,h);}
    if(!tekil.size)continue;
    if(personelBilgi&&Array.isArray(data.kaynaklar)){const kaynaklar=data.kaynaklar.filter((k:{kaynak?:string})=>k.kaynak==='Personel'),basarili=kaynaklar.filter((k:{basarili:boolean})=>k.basarili).length;personelBilgi.textContent=`${kaynaklar.length} kurum izleniyor · ${basarili} kaynağa ulaşıldı${basarili<kaynaklar.length?` · ${kaynaklar.length-basarili} kaynak yeniden denenecek`:''}. Sınav, mülakat, sözlü, sonuç ve aday duyuruları.`;}
    if(tarih>sonKontrol||!tamAkis){records=[...tekil.values()];sonKontrol=tarih;tamAkis=true;uygula();}
    const eksik=Array.isArray(data.kaynaklar)&&data.kaynaklar.some((k:{basarili:boolean})=>!k.basarili);
    kontrol.textContent=`Son kaynak kontrolü: ${tarihSaat(tarih)}${eksik?' · Bazı kaynakların önceki haberleri korunuyor.':''}${Date.now()-tarih>7200000?' · Güncelleme gecikmiş olabilir.':''}`;ok=true;break;
   }catch{/* Yerel kaynağı dene; kayıtlı haberleri koru. */}
   if(!ok)kontrol.textContent='Güncel akışa ulaşılamadı; son kaydedilen haberler gösteriliyor.';
  }finally{mesgul=false;}
 }
 panel.querySelector('[data-news-yenile]')?.addEventListener('click',()=>void yenile());void yenile();
 setInterval(()=>{if(!document.hidden)void yenile();},300000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)void yenile();});
}
