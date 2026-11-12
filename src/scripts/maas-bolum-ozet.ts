// Katlanmış maaş formu bölümlerinde mevcut seçimleri özetler; hesap yapmaz.
for(const form of document.querySelectorAll<HTMLFormElement>('form')){
 const bolumler=Array.from(form.querySelectorAll<HTMLDetailsElement>('details.maas-bolum[data-ozet]'));
 if(!bolumler.length)continue;
 const metin=(id:string)=>{
  const el=form.elements.namedItem(id) as HTMLInputElement|HTMLSelectElement|null;
  if(!el)return '';
  return (el instanceof HTMLSelectElement?el.selectedOptions[0]?.textContent??'':el.value).trim();
 };
 const etiket=(id:string)=>form.querySelector(`label[for="${id}"]`)?.textContent?.trim()??id;
 const guncelle=()=>{
  for(const b of bolumler){
   const ids=(b.dataset.ozet??'').split(',').filter(Boolean);
   const hedef=b.querySelector('[data-ozet-metin]');
   if(!hedef||!ids.length)continue;
   const parcalar=ids.filter(id=>{const el=form.elements.namedItem(id) as HTMLElement|null;return el&&!el.closest('[hidden]');}).map(id=>{
    const v=metin(id);if(v==='')return '';
    const el=form.elements.namedItem(id) as HTMLElement;
    const ad=etiket(id).replace(/\s*\(.*\)\s*$/,'').replace(/\?$/,'');
    return el instanceof HTMLSelectElement&&v.length>6?v:`${ad}: ${v}`;
   }).filter(Boolean);
   hedef.textContent=parcalar.length?parcalar.join(' · '):(b.dataset.ozetVarsayilan??'');
  }
 };
 form.addEventListener('input',()=>queueMicrotask(guncelle));
 form.addEventListener('change',()=>queueMicrotask(guncelle));
 form.addEventListener('reset',()=>setTimeout(guncelle));
 form.addEventListener('invalid',e=>{const el=e.target as HTMLElement;for(const d of bolumler)if(d.contains(el))d.open=true;},true);
 guncelle();
 // Bölüm alanları betikle sonradan doldurulduğunda da özet güncel kalsın.
 setTimeout(guncelle,0);
}
