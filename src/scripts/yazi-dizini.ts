import {normalize} from '../lib/normalize';
const root=document.querySelector<HTMLElement>('[data-yazi-dizini]');
if(root){
 const input=root.querySelector<HTMLInputElement>('#yazi-ara')!,type=root.querySelector<HTMLSelectElement>('#yazi-tur')!,rows=[...root.querySelectorAll<HTMLElement>('[data-yazi-kaydi]')],prev=root.querySelector<HTMLButtonElement>('[data-yazi-onceki]')!,next=root.querySelector<HTMLButtonElement>('[data-yazi-sonraki]')!;
 const size=Number(root.dataset.yaziBoyu)||50;let page=0;
 const render=()=>{const q=normalize(input.value),matches=rows.filter(r=>(!type.value||r.dataset.tur===type.value)&&normalize(r.dataset.metin??'').includes(q));const pages=Math.max(1,Math.ceil(matches.length/size));page=Math.min(page,pages-1);const visible=new Set(matches.slice(page*size,(page+1)*size));rows.forEach(r=>r.hidden=!visible.has(r));root.querySelector('[data-yazi-sayi]')!.textContent=matches.length+' sonuç';root.querySelector('[data-yazi-sayfa]')!.textContent=`${page+1} / ${pages}`;root.querySelector<HTMLElement>('[data-yazi-bos]')!.hidden=matches.length>0;prev.disabled=page===0;next.disabled=page>=pages-1;};
 for(const el of [input,type])el.addEventListener('input',()=>{page=0;render();});prev.addEventListener('click',()=>{page--;render();});next.addEventListener('click',()=>{page++;render();});root.querySelector('[data-yazi-form]')!.addEventListener('submit',e=>{e.preventDefault();page=0;render();});
 const q=new URLSearchParams(location.search).get('q');if(q)input.value=q;render();
}
