import {yerelYol} from '../lib/site-yolu';
import dosyalar from '../data/dosyalar.json' with {type:'json'};
// Sitedeki ortak PDF/Word/Excel/arşiv bağlantıları; kişisel blob çıktıları izlenmez.
const api=import.meta.env.PUBLIC_INDIRME_API??'https://657.com.tr/_657-servis/api/indirme';
const requests=new Map<string,Promise<number>>();
const izle=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting)continue;izle.unobserve(e.target);const el=e.target as HTMLElement,id=el.dataset.dosyaSayaci!;if(!requests.has(id))requests.set(id,fetch(`${api}?id=${id}`,{signal:AbortSignal.timeout(5000)}).then(async r=>{if(!r.ok)throw Error();return (await r.json()).sayi;}));requests.get(id)!.then(n=>{if(Number.isSafeInteger(n)&&n>=0)el.textContent=` · ${n.toLocaleString('tr-TR')} indirme başlatıldı`;}).catch(()=>{el.textContent='';});}},{rootMargin:'100px'});
for(const a of document.querySelectorAll<HTMLAnchorElement>('a[href]')){
 if(a.dataset.indirmeId||!crypto.subtle)continue;
 const u=new URL(a.href);if(![location.hostname,'657.com.tr','www.657.com.tr'].includes(u.hostname)||!/^https?:$/.test(u.protocol)||! /\.(pdf|docx?|xlsx?|zip|rar|exe|udf)$/i.test(u.pathname))continue;
 const base=yerelYol('/');const path=base!=='/'&&u.pathname.startsWith(base)?'/'+u.pathname.slice(base.length):u.pathname;
 void crypto.subtle.digest('SHA-256',new TextEncoder().encode(path)).then(bytes=>{
  const bilinen=dosyalar.find(d=>new URL(d.indirme).pathname===path);
  const id=bilinen?.id??'dosya-'+[...new Uint8Array(bytes)].slice(0,16).map(v=>v.toString(16).padStart(2,'0')).join(''),out=document.createElement('small');out.dataset.dosyaSayaci=id;out.textContent=' · Sayaç yükleniyor…';a.after(out);izle.observe(out);
  a.addEventListener('click',()=>{void fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id}),keepalive:true}).then(async r=>{if(!r.ok)throw Error();const d=await r.json();if(Number.isSafeInteger(d.sayi))out.textContent=` · ${d.sayi.toLocaleString('tr-TR')} indirme başlatıldı`;}).catch(()=>{});});
 });
}
