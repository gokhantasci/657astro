export {};
const rows=[...document.querySelectorAll<HTMLElement>('[data-belge-sayac-yol]')];
if(rows.length)void(async()=>{
 const status=document.querySelector('[data-belge-sayac-durum]');
 try{
  const r=await fetch('/_657-servis/api/okunma/siralama?donem=toplam',{signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();const j=await r.json();const map=new Map<string,number>(j.okunmalar.map((r:{path:string;sayi:number})=>[r.path,r.sayi]));
  for(const row of rows)row.textContent=(Number(row.dataset.taban)+(map.get(row.dataset.belgeSayacYol!)??0)).toLocaleString('tr-TR');
  if(status)status.textContent='Okunma: arşiv ve yeni sayfa görüntülenmelerinin toplamı.';
 }catch{if(status)status.textContent='Canlı sayaç alınamadı; arşiv değerleri gösteriliyor.';}
})();
