// Arşiv tabanı + ortak servis sayacı; servis bağlı değilse bu tarayıcıdaki ziyaretler açıkça etiketlenir.
const yollar=new Map<string,number>();
const requests=new Map<string,Promise<number>>();
for(const el of document.querySelectorAll<HTMLElement>('[data-okunma-path]')){
 const path=el.dataset.okunmaPath!;let n=yollar.get(path);
 if(n===undefined){
  try{const key='657:ziyaret:'+path,onceki=Number(localStorage.getItem(key));n=(Number.isSafeInteger(onceki)&&onceki>=0?onceki:0)+1;localStorage.setItem(key,String(n));}
  catch{n=1;}
  yollar.set(path,n);
 }
 const toplam=el.querySelector<HTMLElement>('[data-okunma-toplam]'),taban=Number(el.dataset.okunmaTaban??0);
 if(toplam)toplam.textContent=`${(taban+n).toLocaleString('tr-TR')} kez okundu`;
 const yerel=el.querySelector<HTMLElement>('[data-okunma-yerel]');
 if(yerel){yerel.textContent=` · Arşiv + bu tarayıcıdaki ${n.toLocaleString('tr-TR')} ziyaret`;yerel.hidden=false;}
 const api=/657\.com\.tr$/.test(location.hostname)?el.dataset.okunmaApi:undefined;
 if(api){
  if(!requests.has(path))requests.set(path,fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path}),signal:AbortSignal.timeout(5000)}).then(async r=>{if(!r.ok)throw Error('Sayaç erişimi yok.');const d=await r.json();if(!Number.isSafeInteger(d.sayi)||d.sayi<0)throw Error('Geçersiz sayaç.');return d.sayi;}));
  requests.get(path)!.then(sayi=>{if(toplam){toplam.textContent=`${(taban+sayi).toLocaleString('tr-TR')} kez okundu`;toplam.title='Arşiv tabanı ve ortak servisteki yeni görüntülemeler';}if(yerel){yerel.textContent='';yerel.hidden=true;}}).catch(()=>{/* Etiketli yerel sayaç korunur. */});
 }
}
