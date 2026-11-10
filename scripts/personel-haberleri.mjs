// Resmî kurum dizinlerinden bulunan ACM/BAM/BİM arşivleri. Yalnız başlık,
// yayın tarihi ve özgün bağlantı alınır; aday listeleri/PDF içerikleri alınmaz.
import {parse} from 'parse5';

export const PERSONEL_DIZINLERI=[
 {tur:'acm',url:'https://adalet.gov.tr/Birimler/ACM'},
 {tur:'bam',url:'https://adalet.gov.tr/Birimler/BAM'},
 {tur:'bim',url:'https://adalet.gov.tr/Birimler/B%C4%B0M'},
];
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value??'';
const nodes=(n,test)=>[...(test(n)?[n]:[]),...(n.childNodes??[]).flatMap(c=>nodes(c,test))];
const text=n=>n.nodeName==='#text'?n.value:(n.childNodes??[]).map(text).join('');
const clean=n=>text(n).replace(/\s+/g,' ').trim();
const cls=(n,c)=>attr(n,'class').split(/\s+/).includes(c);
const normalized=s=>s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
export const personelBasligi=s=>/(?:^|[^\p{L}\p{N}])(?:sinav|mulakat|sozlu|sonuc|aday)/u.test(normalized(s));
export function resmiAdres(href,base){
 try{const u=new URL(href,base);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||!(u.hostname==='adalet.gov.tr'||u.hostname.endsWith('.adalet.gov.tr')))return null;u.protocol='https:';u.hash='';return u;}catch{return null;}
}
export function kurumlariAyristir(html,dizin){
 const doc=parse(html),unique=new Map();
 for(const a of nodes(doc,n=>n.tagName==='a'&&cls(n,'ab-announcement'))){
  const u=resmiAdres(attr(a,'href'),dizin.url),h=nodes(a,n=>/^h[1-6]$/.test(n.tagName??''))[0];
  const ad=clean(h??a);if(!u||u.hostname==='adalet.gov.tr'||!ad||ad.length>160)continue;
  unique.set(u.origin,{tur:dizin.tur,ad,url:u.origin,kaynak:dizin.url});
 }
 return [...unique.values()];
}
const date=s=>{const m=s.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/);if(!m)return null;const iso=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;return Number.isFinite(Date.parse(iso))&&new Date(iso).toISOString().slice(0,10)===iso?iso:null;};
export function arsiviAyristir(html,kurum,{parca=false}={}){
 const doc=parse(html),root=parca?doc:nodes(doc,n=>cls(n,'arsivlist'))[0];
 if(!root)throw new Error('Arşiv listesi bulunamadı');
 const rows=new Map();
 for(const a of nodes(root,n=>n.tagName==='a')){
  const b=nodes(a,n=>cls(n,'baslik'))[0],d=nodes(a,n=>n.tagName==='span'||n.tagName==='time').map(clean).map(date).find(Boolean);
  const u=resmiAdres(attr(a,'href'),kurum.url),title=b?clean(b):'';
  if(title&&d&&u&&u.pathname!=='/'&&u.hostname===new URL(kurum.url).hostname)rows.set(u.href,{source:'Personel',institution:kurum.ad,institutionType:kurum.tur,date:d,title,url:u.href});
 }
 const hidden=id=>attr(nodes(doc,n=>n.tagName==='input'&&attr(n,'id')===id)[0]??{},'value');
 return {haberler:[...rows.values()],sonid:hidden('sonid'),tur:hidden('sayfakonum')||'tumu',yil:hidden('listeseciliyil')||'0'};
}

const headers={Accept:'text/html,application/json','User-Agent':'657.com.tr personel duyuru okuyucu (+https://657.com.tr/iletisim/)'};
export async function personelGetir(url,options={},fetcher=fetch){
 let last;for(let i=0;i<2;i++)try{
  let current=url,request={...options};
  for(let hop=0;hop<6;hop++){
   const r=await fetcher(current,{...request,redirect:'manual',headers:{...headers,...request.headers},signal:AbortSignal.timeout(20000)});
   if([301,302,303,307,308].includes(r.status)){
    const location=r.headers.get('location'),next=location&&resmiAdres(location,current);
    if(!next||/^\/hata(?:\/|$)/i.test(next.pathname)){
     const e=new Error('Kaynak site hata sayfasına veya geçersiz adrese yönlendiriyor');e.name='KaynakHatasi';throw e;
    }
    current=next.href;if(r.status===303||([301,302].includes(r.status)&&request.method==='POST'))request={...request,method:'GET',body:undefined};continue;
   }
   if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.text();
  }
  throw new Error('Kaynak sitede yönlendirme döngüsü');
 }catch(e){last=e;if(e.name==='KaynakHatasi')break;}
 throw last;
}
export async function kurumArsiviniTara(kurum,{sinirTarih,fetcher=fetch,maxSayfa=40}={}){
 let archive=new URL('/Arsiv/tumu',kurum.url).href;
 let first;try{first=arsiviAyristir(await personelGetir(archive,{},fetcher),kurum);}catch{
  archive=new URL('/Arsiv/duyuru',kurum.url).href;
  first=arsiviAyristir(await personelGetir(archive,{},fetcher),kurum);
 }
 const all=new Map(),seen=new Set();let page=first,complete=true,pages=0,hata;
 for(;;){
  pages++;for(const h of page.haberler)all.set(h.url,h);
  const dates=page.haberler.map(h=>h.date),cursor=page.sonid;
  if(!cursor||Number(cursor)<=0||!dates.length||(sinirTarih&&dates.every(d=>d<sinirTarih)))break;
  if(seen.has(cursor)){complete=false;hata='Arşiv devam kimliği ilerlemiyor';break;}seen.add(cursor);
  if(pages>=maxSayfa){complete=false;hata='Arşiv sayfa sınırına ulaşıldı';break;}
  try{
   const payload=await personelGetir(new URL('/Site/ListeDevamGetir',kurum.url).href,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({tur:first.tur,sonid:cursor,yil:first.yil})},fetcher);
   const data=JSON.parse(payload);if(!Array.isArray(data)||typeof data[0]!=='string')throw new Error('Arşiv devam yanıtı geçersiz');
   page={...arsiviAyristir(data[0],kurum,{parca:true}),sonid:String(data[1]??'')};
  }catch(e){complete=false;hata=e.message;break;}
 }
 return {haberler:[...all.values()].filter(h=>(!sinirTarih||h.date>=sinirTarih)&&personelBasligi(h.title)),adet:all.size,sayfa:pages,tamamlandi:complete,hata,url:archive};
}
export async function personelHaberleriniTara({onceki=[],katalog={kurumlar:[]},sinirTarih,fetcher=fetch,eszamanli=6,log=console.log}={}){
 const kurumlar=new Map((katalog.kurumlar??[]).map(k=>[k.url,k])),dizinler=[];
 for(const d of PERSONEL_DIZINLERI)try{
  const rows=kurumlariAyristir(await personelGetir(d.url,{},fetcher),d);
  if(rows.length<({acm:100,bam:10,bim:8}[d.tur]))throw new Error('Resmî kurum dizini eksik veya yapısı değişmiş');
  for(const k of rows)kurumlar.set(k.url,k);dizinler.push({...d,basarili:true,adet:rows.length});
 }catch(e){dizinler.push({...d,basarili:false,hata:e.message});}
 if(!kurumlar.size)throw new Error('Personel kaynak listesine ulaşılamadı');
 const rows=[...kurumlar.values()].sort((a,b)=>a.tur.localeCompare(b.tur)||a.ad.localeCompare(b.ad,'tr'));
 const durumlar=[],haberler=new Map(onceki.filter(h=>h.source==='Personel').map(h=>[h.url,h]));let next=0;
 await Promise.all(Array.from({length:eszamanli},async()=>{for(let k;(k=rows[next++]);){
  try{const r=await kurumArsiviniTara(k,{sinirTarih,fetcher});for(const h of r.haberler)haberler.set(h.url,h);
   durumlar.push({kaynak:'Personel',kurum:k.ad,tur:k.tur,url:r.url,basarili:r.tamamlandi,adet:r.haberler.length,taranan:r.adet,sayfa:r.sayfa,...(!r.tamamlandi?{hata:r.hata+'; önceki kayıtlar korundu'}:{})});
   log(`Personel ${k.ad}: ${r.haberler.length} haber (${r.sayfa} sayfa)`);
  }catch(e){durumlar.push({kaynak:'Personel',kurum:k.ad,tur:k.tur,url:new URL('/Arsiv/tumu',k.url).href,basarili:false,hata:e.message});log(`Personel ${k.ad}: OKUNAMADI ${e.message}`);}
 }}));
 return {haberler:[...haberler.values()].filter(h=>(!sinirTarih||h.date>=sinirTarih)&&personelBasligi(h.title)),durumlar:[...dizinler.map(d=>({...d,kaynak:'Personel dizini'})),...durumlar.sort((a,b)=>a.kurum.localeCompare(b.kurum,'tr'))],katalog:{kontrolTarihi:new Date().toISOString(),dizinler,kurumlar:rows}};
}
