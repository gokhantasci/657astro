import {smmHesap,faizHesap,type SmmGirdi,type FaizGirdi,type FaizVeri} from '../lib/mali-hesap';
import {sayiOku,tl,gun} from '../lib/bicim';
const form=document.querySelector<HTMLFormElement>('#mali-form');
if(form){
 const d=JSON.parse(document.querySelector('#mali-veri')!.textContent!) as {tur:'smm'|'faiz';kurallar:{faiz:FaizVeri};smmSatirlar:[string,string][]};
 const field=(id:string)=>form.elements.namedItem(id) as HTMLInputElement|HTMLSelectElement;
 const n=(id:string)=>{const s=field(id).value;if(!s.trim())throw new Error('Sayı alanlarını boş bırakmayın.');return sayiOku(s);};
 const out=(id:string)=>document.querySelector<HTMLElement>(`[data-mali-${id}]`)!;
 function hesapla(){try{
  if(d.tur==='faiz')field('oran').disabled=field('tur').value!=='elle';
  if(!form!.checkValidity())throw new Error('Tarih ve sayı alanlarını kontrol edin.');
  let satirlar:{ad:string;tutar:number}[];
  if(d.tur==='smm'){
   const r=smmHesap({tutar:n('tutar'),yon:field('yon').value as SmmGirdi['yon'],stopaj:n('stopaj'),kdv:n('kdv'),tevkifat:n('tevkifat')});out('ana').textContent=tl(r.tahsilat);out('not').textContent=r.tersFark?`Kuruş yuvarlamasından doğan ters hesap farkı: ${tl(r.tersFark)}`:'';
   satirlar=d.smmSatirlar.map(([id,ad])=>({ad,tutar:r[id as keyof typeof r]}));
  }else{
   const r=faizHesap({anapara:n('anapara'),baslangic:field('baslangic').value,bitis:field('bitis').value,tur:field('tur').value as FaizGirdi['tur'],oran:field('tur').value==='elle'?n('oran'):0,yilEsasi:n('yilEsasi') as 360|365},d.kurallar.faiz);out('ana').textContent=tl(r.faiz);out('not').textContent=`${r.gun} gün · Anapara dahil ${tl(r.toplam)}`;
   satirlar=r.satirlar.map(s=>({ad:`${gun(s.baslangic)} – ${gun(s.bitis)} (bitiş hariç); ${s.gun} gün × %${s.oran.toLocaleString('tr-TR')}`,tutar:s.faiz}));
  }
  out('satirlar').replaceChildren(...satirlar.map(s=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=s.ad;dd.className='num';dd.textContent=tl(s.tutar);div.append(dt,dd);return div;}));out('hata').hidden=true;
 }catch(e){out('hata').textContent=(e as Error).message;out('hata').hidden=false;out('ana').textContent='—';out('not').textContent='';out('satirlar').replaceChildren();}}
 form.addEventListener('input',hesapla);form.addEventListener('change',hesapla);form.addEventListener('submit',e=>{e.preventDefault();hesapla();});document.querySelector('[data-mali-sifirla]')!.addEventListener('click',()=>{form.reset();setTimeout(hesapla);});
 if(d.tur==='faiz')field('oran').disabled=true;
}
