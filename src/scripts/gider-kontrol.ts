import {giderKontrol,giderExcelOku} from '../lib/gider-kontrol';
import {tl,sayiOku} from '../lib/bicim';
import {normalize} from '../lib/normalize';
import {dosyaIndir,tabloWord} from '../lib/belge-indir';
const root=document.querySelector<HTMLElement>('[data-gider-kontrol]');
if(root){
 const $=<T extends HTMLElement=HTMLElement>(s:string)=>root.querySelector<T>(s)!;
 const input=(id:string)=>$<HTMLInputElement>('#gk-'+id),error=$('[data-gk-hata]'),status=$('[data-gk-durum]');
 const headers=['Dosya no','Tahsilat','Gider','İade','Bildirilen bakiye','Hesaplanan bakiye','Fark'];
 let rows:ReturnType<typeof giderKontrol>[]=[],page=0,job=0;
 const filtered=()=>rows.map((r,index)=>({...r,index})).filter(r=>normalize(r.dosya).includes(normalize(input('ara').value)));
 const cells=(r:ReturnType<typeof giderKontrol>)=>[r.dosya,...[r.tahsilat,r.gider,r.iade,r.bildirilen,r.hesaplanan,r.fark].map(tl)];
 const draw=()=>{
  const list=filtered(),size=Number(root.dataset.size),pages=Math.max(1,Math.ceil(list.length/size));page=Math.max(0,Math.min(page,pages-1));
  const ids=new Set(),dups=new Set();rows.forEach(r=>{if(ids.has(r.dosya))dups.add(r.dosya);ids.add(r.dosya);});
  $('[data-gk-ozet]').textContent=`${list.length} / ${rows.length} kayıt · ${list.filter(r=>r.fark!==0).length} fark olan kayıt · ${list.filter(r=>r.hesaplanan<0).length} eksi bakiye · ${dups.size} yinelenen dosya no. Toplam fark: ${tl(list.reduce((s,r)=>s+r.fark,0))}`;
  $('[data-gk-rows]').replaceChildren(...list.slice(page*size,(page+1)*size).map(r=>{const tr=document.createElement('tr');for(const v of cells(r)){const td=document.createElement('td');td.textContent=v;tr.append(td);}const td=document.createElement('td'),btn=document.createElement('button');btn.type='button';btn.className='btn btn--quiet btn--kucuk';btn.textContent='Sil';btn.setAttribute('aria-label',r.dosya+' kaydını sil');btn.addEventListener('click',()=>{rows.splice(r.index,1);draw();});td.append(btn);tr.append(td);return tr;}));
  $('[data-gk-sayfa]').textContent=`${page+1} / ${pages}`;$<HTMLButtonElement>('[data-gk-onceki]').disabled=page===0;$<HTMLButtonElement>('[data-gk-sonraki]').disabled=page>=pages-1;$<HTMLButtonElement>('[data-gk-word]').disabled=!list.length;
 };
 const fail=(e:unknown)=>{error.textContent=(e as Error).message;error.hidden=false;};
 $('#gider-kontrol-form').addEventListener('submit',e=>{e.preventDefault();try{const values=Object.fromEntries(['tahsilat','gider','iade','bildirilen'].map(k=>{if(!input(k).value.trim())throw Error('Boş tutar yerine 0 yazın.');return [k,sayiOku(input(k).value)];})) as Record<'tahsilat'|'gider'|'iade'|'bildirilen',number>;rows.push(giderKontrol({dosya:input('dosya').value.trim(),...values}));error.hidden=true;page=Math.floor((rows.length-1)/Number(root.dataset.size));draw();}catch(e){fail(e);}});
 input('excel').addEventListener('change',async()=>{const file=input('excel').files?.[0];if(!file)return;const id=++job;status.textContent='Dosya okunuyor…';try{if(!/\.xlsx?$/i.test(file.name)||file.size>25*1024*1024)throw Error('En fazla 25 MB büyüklüğünde XLS/XLSX seçin.');const X=await import('xlsx'),wb=X.read(await file.arrayBuffer(),{type:'array'}),data=X.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]],{header:1,raw:true,defval:''}),next=giderExcelOku(data);if(id!==job)return;rows=next;page=0;error.hidden=true;status.textContent=`${rows.length} kayıt yüklendi.`;draw();}catch(e){if(id!==job)return;status.textContent='Yükleme tamamlanamadı; önceki kayıtlar korundu.';fail(e);}});
 $('[data-gk-sablon]').addEventListener('click',async()=>{const X=await import('xlsx'),wb=X.utils.book_new();X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet([headers.slice(0,5)]),'Gider Kontrol');X.writeFile(wb,'gider-kontrol-sablonu.xlsx');});
 $('[data-gk-word]').addEventListener('click',async()=>{try{const list=filtered();dosyaIndir(await tabloWord('Yargılama gideri aritmetik kontrolü',`657.com.tr · ${list.length} kayıt. Tahsilat − gider − iade; hukuki uygunluk denetimi değildir.`,headers,list.map(cells)),'yargilama-gideri-kontrolu.docx');}catch(e){fail(e);}});
 $('[data-gk-temizle]').addEventListener('click',()=>{job++;rows=[];page=0;$<HTMLFormElement>('#gider-kontrol-form').reset();input('excel').value='';input('ara').value='';status.textContent='';error.hidden=true;draw();});input('ara').addEventListener('input',()=>{page=0;draw();});$('[data-gk-onceki]').addEventListener('click',()=>{page--;draw();});$('[data-gk-sonraki]').addEventListener('click',()=>{page++;draw();});draw();
}
