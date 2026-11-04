const api=import.meta.env.PUBLIC_INDIRME_API??'https://657.com.tr/_657-servis/api/indirme';
for(const link of document.querySelectorAll<HTMLAnchorElement>('a[data-indirme-id]')){
 const id=link.dataset.indirmeId!,out=document.querySelector<HTMLElement>(`[data-indirme-sayi="${CSS.escape(id)}"]`);
 const oku=async(method:'GET'|'POST')=>{const r=await fetch(method==='GET'?`${api}?id=${encodeURIComponent(id)}`:api,{method,headers:method==='POST'?{'Content-Type':'application/json'}:{},...(method==='POST'?{body:JSON.stringify({id}),keepalive:true}:{}),signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error();const d=await r.json();if(!Number.isSafeInteger(d.sayi)||d.sayi<0)throw Error();if(out)out.textContent=`${d.sayi.toLocaleString('tr-TR')} indirme başlatıldı`;};
 void oku('GET').catch(()=>{if(out)out.textContent='İndirme sayacına ulaşılamıyor';});
 link.addEventListener('click',()=>{void oku('POST').catch(()=>{/* Dosya indirmesi sayaç bağlantısından bağımsız sürer. */});});
}
