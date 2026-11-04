import {normalize} from '../lib/normalize';
const root=document.querySelector<HTMLElement>('[data-dir-yazilar]');
if(root){
 const rows=[...root.querySelectorAll<HTMLElement>('[data-dir-yazi]')],boyut=Number(root.dataset.boyut)||50;let q='',sayfa=0;
 const prev=root.querySelector<HTMLButtonElement>('[data-dir-yazi-prev]')!,next=root.querySelector<HTMLButtonElement>('[data-dir-yazi-next]')!;
 const show=()=>{const terms=normalize(q.trim()).split(/\s+/).filter(Boolean),hits=terms.length?rows.filter(r=>terms.every(t=>r.dataset.search!.includes(t))):[];root.hidden=!terms.length;rows.forEach(r=>r.hidden=true);hits.slice(sayfa*boyut,(sayfa+1)*boyut).forEach(r=>r.hidden=false);root.querySelector('[data-dir-yazi-sayi]')!.textContent=`${hits.length} sonuç`;root.querySelector('[data-dir-yazi-sayfa]')!.textContent=`${sayfa+1} / ${Math.max(1,Math.ceil(hits.length/boyut))}`;prev.disabled=sayfa===0;next.disabled=(sayfa+1)*boyut>=hits.length;};
 document.addEventListener('dizin-arama',e=>{q=(e as CustomEvent<string>).detail;sayfa=0;show();});prev.addEventListener('click',()=>{sayfa--;show();});next.addEventListener('click',()=>{sayfa++;show();});q=new URLSearchParams(location.search).get('q')??'';show();
}
