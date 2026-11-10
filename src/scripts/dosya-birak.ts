// Aynı görünüm ana sayfalarda ve izole teftiş araçlarında kullanılır.
(()=>{
 const selector='[data-dosya-birak],[data-drop],.birak,.dropzone,.kontrol-yukle,[id$="Drop"],[id$="drop"],#dropZone,.border-dashed';
 function hazirla(){
  document.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach(input=>{
   if(input.dataset.birak)return;
   input.dataset.birak='1';input.id||=`dosya-${crypto.randomUUID()}`;
   const sibling=input.previousElementSibling;
   let zone=input.closest<HTMLElement>(selector)||(sibling?.matches(selector)?sibling as HTMLElement:null);
   const existing=Boolean(zone)&&!zone?.hasAttribute('data-dosya-birak');
   if(!zone){
    const label=document.createElement('label');label.htmlFor=input.id;zone=label;input.before(zone);zone.append(input);
   }
   zone.classList.add('dosya-birak');
   input.classList.add('dosya-birak__input');
   let selected=zone.querySelector<HTMLElement>('[data-dosya-secim]');
   if(!selected){selected=document.createElement('span');selected.className='dosya-birak__secim';selected.dataset.dosyaSecim='';selected.textContent='Henüz dosya seçilmedi.';zone.append(selected);}
   input.addEventListener('change',()=>{
    const files=[...input.files??[]];
    selected!.textContent=files.length?files.map(f=>`${f.name} · ${new Intl.NumberFormat('tr-TR',{maximumFractionDigits:1}).format(f.size/1024)} KB`).join(' / '):'Henüz dosya seçilmedi.';
    selected!.title=selected!.textContent;zone!.dataset.state=files.length?'selected':'idle';
   },true);
   const syncDisabled=()=>zone!.setAttribute('aria-disabled',String(input.disabled));syncDisabled();
   new MutationObserver(syncDisabled).observe(input,{attributes:true,attributeFilter:['disabled']});
   // Eski motorun dinleyicilerini ve durum/spinner düğümlerini koru.
   if(existing&&!zone.classList.contains('birak')){
    for(const child of [...zone.children]){
     if(child!==input&&!child.id&&!child.hasAttribute('data-dosya-secim')&&!child.querySelector('[id],input')&&!child.classList.contains('spinner-border'))child.classList.add('dosya-birak__eski');
    }
   }
   for(const picker of document.querySelectorAll<HTMLElement>('label[for],button[onclick],[data-teftis-action="excel-pick"]')){
    if(picker===zone)continue;
    const target=picker.getAttribute('for');
    const handler=picker.getAttribute('onclick')||'';
    if(target===input.id||handler.includes(`getElementById('${input.id}')`)||(input.id==='excelInput'&&picker.dataset.teftisAction==='excel-pick'))picker.classList.add('dosya-birak__eski');
   }
   if(!zone.querySelector('.dosya-birak__mesaj')){
   const prompt=document.createElement('span');prompt.className='dosya-birak__mesaj';
   prompt.textContent=input.multiple?'Dosyaları buraya sürükleyip bırakın veya dosya seçmek için tıklayın.':'Dosyayı buraya sürükleyip bırakın veya dosya seçmek için tıklayın.';
   zone.prepend(prompt);
   if(!zone.classList.contains('birak')){
    const title=document.createElement('strong');title.textContent=input.multiple?'Dosyaları buraya bırakın ya da seçin':'Dosyayı buraya bırakın ya da seçin';
    const types=document.createElement('span');types.className='dosya-birak__bilgi';types.textContent=input.accept.split(',').filter(t=>t.trim().startsWith('.')).map(t=>t.trim().slice(1).toUpperCase()).join(' / ');
    const privacy=document.createElement('span');privacy.className='dosya-birak__bilgi';privacy.textContent='Dosya tarayıcınızda işlenir; sunucuya yüklenmez.';
    prompt.after(title,types,privacy);
   }
   }
   if(!existing){
    for(const ev of ['dragenter','dragover'])zone.addEventListener(ev,e=>{e.preventDefault();if(!input.disabled)zone.classList.add('is-surukle');});
    zone.addEventListener('dragleave',()=>zone.classList.remove('is-surukle'));
    zone.addEventListener('drop',e=>{
     e.preventDefault();zone.classList.remove('is-surukle');const files=e.dataTransfer?.files;
     if(!files?.length||input.disabled)return;
     const dt=new DataTransfer();for(const f of [...files].slice(0,input.multiple?files.length:1))dt.items.add(f);
     input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
    });
   }else if(!zone.contains(input)&&!zone.hasAttribute('tabindex')){
    zone.tabIndex=0;zone.setAttribute('role','button');
    zone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!input.disabled)input.click();}});
   }
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hazirla);else hazirla();
 // Bazı eski araçlar ikinci dosya alanını ilk dosya okunduktan sonra oluşturur.
 new MutationObserver(hazirla).observe(document.documentElement,{subtree:true,childList:true});
})();
