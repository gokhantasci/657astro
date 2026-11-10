import {aracSorgulandi} from './arac-kullanim';
import {konsoloslukAra,type KonsoloslukKaydi} from '../lib/konsolosluk';
const root=document.querySelector<HTMLElement>('[data-konsolosluk]');
if(root){
 const $=<T extends HTMLElement=HTMLElement>(s:string)=>root.querySelector<T>(s)!;
 const country=$<HTMLSelectElement>('#kon-ulke'),postal=$<HTMLInputElement>('#kon-posta'),query=$<HTMLInputElement>('#kon-ara');
 let rows:KonsoloslukKaydi[]=[],page=0,loaded=false,kullanici=false;
 const draw=()=>{
  const result=konsoloslukAra(rows,country.value,postal.value,query.value),size=Number(root.dataset.size),pages=Math.max(1,Math.ceil(result.length/size));page=Math.max(0,Math.min(page,pages-1));
  $('[data-kon-sayi]').textContent=result.length.toLocaleString('tr-TR')+' kayıt';$('[data-kon-sayfa]').textContent=`${page+1} / ${pages}`;
  $('[data-kon-satirlar]').replaceChildren(...result.slice(page*size,(page+1)*size).map(r=>{const tr=document.createElement('tr');for(const v of [r.temsilcilik,r.bolge,r.sehir,r.posta]){const td=document.createElement('td');td.textContent=v||'—';tr.append(td);}return tr;}));
  $<HTMLButtonElement>('[data-kon-onceki]').disabled=page===0;$<HTMLButtonElement>('[data-kon-sonraki]').disabled=page>=pages-1;
  if(loaded&&country.value&&kullanici)aracSorgulandi([country.value,postal.value,query.value]);
  if(loaded)$('[data-kon-durum]').textContent=!country.value?'Bir ülke seçin.':result.length?'Eşleşmeler kaynak arşivinden listelenmiştir.':'Kaynak arşivinde bu bilgilerle eşleşen kayıt bulunamadı.';
 };
 const load=async()=>{loaded=false;$('[data-kon-yenile]').hidden=true;$('[data-kon-durum]').textContent='Kaynak verileri yükleniyor…';try{const r=await fetch(root.dataset.kaynak!);if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();if(!Array.isArray(data)||data.some(r=>typeof r.ulke!=='string'||typeof r.posta!=='string'))throw Error('Veri biçimi geçersiz.');rows=data;loaded=true;draw();}catch{$('[data-kon-durum]').textContent='Kaynak verileri yüklenemedi. Yeniden deneyin.';$('[data-kon-yenile]').hidden=false;}};
 for(const el of [country,postal,query])el.addEventListener('input',()=>{kullanici=true;page=0;draw();});$('[data-kon-form]').addEventListener('submit',e=>{e.preventDefault();kullanici=true;page=0;draw();});$('[data-kon-onceki]').addEventListener('click',()=>{page--;draw();});$('[data-kon-sonraki]').addEventListener('click',()=>{page++;draw();});$('[data-kon-yenile]').addEventListener('click',()=>void load());draw();void load();
}
