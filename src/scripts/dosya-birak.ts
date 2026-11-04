// Yerel dosya seçicisini korur; sürükle/bırak da aynı change olayını kullanır.
document.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach(input=>{
 if(input.closest('[data-drop],.dosya-birak,.dropzone')||input.dataset.birak)return;
 input.dataset.birak='1';input.id||=`dosya-${crypto.randomUUID()}`;
 const zone=document.createElement('label');zone.className='dosya-birak';zone.htmlFor=input.id;
 zone.textContent='Dosyayı buraya sürükleyip bırakın veya dosya seçmek için tıklayın.';
 input.before(zone);zone.append(input);
 for(const ev of ['dragenter','dragover'])zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.add('is-surukle');});
 zone.addEventListener('dragleave',()=>zone.classList.remove('is-surukle'));
 zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('is-surukle');const files=(e as DragEvent).dataTransfer?.files;if(!files?.length||input.disabled)return;const dt=new DataTransfer();for(const f of [...files].slice(0,input.multiple?files.length:1))dt.items.add(f);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));});
});
