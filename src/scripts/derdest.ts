import {derdestOku,derdestListe,type DerdestVerisi} from '../lib/derdest';
const kok=document.querySelector<HTMLElement>('[data-derdest]');
if(kok){
 const q=<T extends HTMLElement=HTMLElement>(ad:string)=>kok.querySelector<T>(`[data-dr-${ad}]`)!;
 const dosya=q<HTMLInputElement>('dosya'),cikti=q<HTMLTextAreaElement>('cikti'),sirala=q<HTMLInputElement>('sirala'),tekil=q<HTMLInputElement>('tekil');
 const actions=['kopyala','txt','csv'].map(ad=>q<HTMLButtonElement>(ad));
 let veri:DerdestVerisi|null=null,ad='derdest_liste',sira=0;
 const sayi=(n:number)=>n.toLocaleString('tr-TR');
 function bosalt(){veri=null;cikti.value='';q('toplam').textContent='0';q('adet').textContent='0 dosya';q('kontrol').textContent='Dosya bekleniyor';q('not').textContent='Dosyayı seçtiğinizde Excel’deki yıl toplamlarıyla karşılaştırılır.';q('yillar').replaceChildren();q('aktarim').textContent='';actions.forEach(b=>b.disabled=true);q('hata').hidden=true;}
 function ciz(){
  if(!veri)return;const liste=derdestListe(veri.dosyalar,sirala.checked,tekil.checked);cikti.value=liste.join('\n');q('adet').textContent=`${sayi(liste.length)} dosya`;q('aktarim').textContent='';actions.forEach(b=>b.disabled=!liste.length);
  q('yillar').replaceChildren(...[...new Set(veri.dosyalar.map(d=>d.yil))].sort((a,b)=>a-b).map(y=>{
   const tr=document.createElement('tr'),okunan=veri!.dosyalar.filter(d=>d.yil===y).length,listelenen=liste.filter(s=>s.startsWith(y+'/')).length,expected=veri!.beklenen[y];
   [String(y),sayi(okunan),sayi(listelenen),expected===undefined?'—':sayi(expected)+(expected===okunan?' ✓':' ≠')].forEach((text,i)=>{const td=document.createElement(i?'td':'th');if(!i)td.setAttribute('scope','row');else td.className='num';td.textContent=text;tr.append(td);});return tr;
  }));
 }
 async function isle(file?:File){
  if(!file)return;const an=++sira;bosalt();q('durum').textContent=`${file.name} okunuyor…`;
  try{
   if(!/\.(xls|xlsx)$/i.test(file.name))throw Error('XLS veya XLSX biçiminde bir Excel dosyası seçin.');
   if(file.size>25*1024*1024)throw Error('Dosya en fazla 25 MB olabilir.');
   const XLSX=await import('xlsx'),buffer=await file.arrayBuffer();if(an!==sira)return;
   const sonuc=derdestOku(XLSX.read(buffer,{type:'array'}));
   if(!sonuc.dosyalar.length)throw Error('B sütununda yıl ve yanındaki sütunlarda dosya numarası bulunamadı. Excel düzenini kontrol edin.');
   veri=sonuc;ad=file.name.replace(/\.[^.]+$/,'')+'_liste';q('toplam').textContent=sayi(veri.dosyalar.length);
   const toplam=veri.genelToplam,uyum=toplam===veri.dosyalar.length&&Object.entries(veri.beklenen).every(([y,n])=>veri!.dosyalar.filter(d=>String(d.yil)===y).length===n);
   q('kontrol').textContent=toplam===null?'Kontrol edilemedi':uyum?'Toplam tutuyor':'Toplam tutmuyor';
   q('not').textContent=toplam===null?'Bütün sayfalar için karşılaştırılabilir toplam bulunamadı; yıl bazındaki değerleri kontrol edin.':uyum?`Excel’deki toplam (${sayi(toplam)}) ile aynı.`:`Excel toplamı ${sayi(toplam)}, okunan ${sayi(veri.dosyalar.length)}. Yıl toplamlarını ve dosya düzenini kontrol edin.`;
   q('durum').textContent=`${file.name} · ${sayi(veri.sayfalar.length)} çalışma sayfası okundu.`;ciz();
  }catch(e){if(an!==sira)return;bosalt();q('hata').hidden=false;q('hata').textContent=(e as Error).message||'Excel dosyası okunamadı.';q('durum').textContent='Dosya işlenemedi.';}
 }
 function indir(ext:'txt'|'csv'){
  if(!veri)return;const body=ext==='csv'?cikti.value.replace(/\n/g,'\r\n'):cikti.value;
  const url=URL.createObjectURL(new Blob(['\uFEFF',body],{type:ext==='csv'?'text/csv;charset=utf-8':'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=ad+'.'+ext;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 }
 dosya.addEventListener('change',()=>void isle(dosya.files?.[0]));
 for(const el of [sirala,tekil])el.addEventListener('change',ciz);
 q('temizle').addEventListener('click',()=>{sira++;bosalt();dosya.value='';q('durum').textContent='Henüz dosya seçilmedi.';});
 q('kopyala').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(cikti.value);q('aktarim').textContent='Liste panoya kopyalandı.';}catch{cikti.focus();cikti.select();q('aktarim').textContent='Liste seçildi. Ctrl+C veya cihazınızın kopyalama menüsünü kullanın.';}});
 q('txt').addEventListener('click',()=>indir('txt'));q('csv').addEventListener('click',()=>indir('csv'));
 const birak=q('birak');birak.addEventListener('dragover',e=>{e.preventDefault();birak.classList.add('is-uzerinde');});birak.addEventListener('dragleave',()=>birak.classList.remove('is-uzerinde'));
 birak.addEventListener('drop',e=>{e.preventDefault();birak.classList.remove('is-uzerinde');void isle(e.dataTransfer?.files[0]);});
}
