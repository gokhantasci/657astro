export {};
type Kayit={baslik:string;yol:string;taban:number};
for(const root of document.querySelectorAll<HTMLElement>('[data-cok-okunan]')){
 const status=root.querySelector<HTMLElement>('[data-cok-okunan-durum]')!,retry=root.querySelector<HTMLButtonElement>('[data-cok-okunan-tekrar]')!;
 async function load(){
  retry.hidden=true;status.textContent='Güncel okunma sıralaması yükleniyor…';
  try{
   const json=async(url:string)=>{const r=await fetch(url,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();return r.json();};
   const [catalog,counts]=await Promise.all([json('/cok-okunanlar.json'),json('/_657-servis/api/okunma/siralama?donem=toplam')]);
   const map=new Map<string,number>(counts.okunmalar.map((r:{path:string;sayi:number})=>[r.path,r.sayi]));
   const rows=(catalog[root.dataset.cokOkunan!] as Kayit[]).map(r=>({...r,sayi:r.taban+(map.get(r.yol)??0)})).sort((a,b)=>b.sayi-a.sayi||a.baslik.localeCompare(b.baslik,'tr')||a.yol.localeCompare(b.yol)).slice(0,Number(root.dataset.adet));
   root.querySelector('ol')!.replaceChildren(...rows.map(r=>{const li=document.createElement('li'),a=document.createElement('a'),title=document.createElement('strong'),count=document.createElement('span');a.href=r.yol;title.textContent=r.baslik;count.textContent=`${r.sayi.toLocaleString('tr-TR')} görüntülenme`;a.append(title,count);li.append(a);return li;}));
   status.textContent='Arşiv ve yeni görüntülenmelerin toplamına göre. Eşit sayılarda alfabetik sıra kullanılır.';
  }catch{status.textContent='Güncel sayaç alınamadı; arşiv sıralaması gösteriliyor.';retry.hidden=false;}
 }
 retry.addEventListener('click',()=>void load());void load();
}
