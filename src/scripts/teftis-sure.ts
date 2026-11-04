import {teftisSureOku,sureAraclari,type SureKaydi,type SureAraci} from '../lib/teftis-sure';
import {normalize} from '../lib/normalize';
import {dosyaIndir,tabloWord} from '../lib/belge-indir';
const root=document.querySelector<HTMLElement>('[data-teftis-sure]');
if(root){
 const tur=root.dataset.teftisSure as SureAraci,c=sureAraclari[tur];
 const gerekceliHucreler=(r:SureKaydi)=>r.hucreler;
 const $=<T extends HTMLElement=HTMLElement>(q:string)=>root.querySelector<T>(q)!;
 const input=$<HTMLInputElement>('#g-dosya'),ara=$<HTMLInputElement>('#g-ara'),enaz=$<HTMLInputElement>('#g-enaz'),prev=$<HTMLButtonElement>('[data-g-onceki]'),next=$<HTMLButtonElement>('[data-g-sonraki]'),word=$<HTMLButtonElement>('[data-g-word]');
 let rows:SureKaydi[]=[],filtered:SureKaydi[]=[],page=0,birim='',job=0;
 const draw=()=>{
  const q=normalize(ara.value),min=Number(enaz.value);filtered=rows.filter(r=>normalize(gerekceliHucreler(r).join(' ')).includes(q)&&(min===0||r.bildirilen!==null&&r.bildirilen>=min));
  const size=Number(root.dataset.boyut),pages=Math.max(1,Math.ceil(filtered.length/size));page=Math.min(page,pages-1);
  $('[data-g-rows]').replaceChildren(...filtered.slice(page*size,(page+1)*size).map(r=>{const tr=document.createElement('tr');for(const [i,text]of gerekceliHucreler(r).entries()){const c=document.createElement(i?'td':'th');c.dataset.etiket=root.querySelectorAll('thead th')[i]?.textContent??'';c.textContent=text;if(!i)c.setAttribute('scope','row');tr.append(c);}return tr;}));
  $('[data-g-sayi]').textContent=`${birim?birim+' · ':''}${filtered.length} / ${rows.length} kayıt`; $('[data-g-sayfa]').textContent=`${page+1} / ${pages} · ${size} kayıt/sayfa`;prev.disabled=page===0;next.disabled=page===pages-1;word.disabled=!filtered.length;
 };
 input.addEventListener('change',async()=>{
  const file=input.files?.[0];if(!file)return;const id=++job;rows=[];birim='';page=0;draw();$('[data-g-uyari]').hidden=true;word.disabled=true;
  if(!/\.xlsx?$/i.test(file.name)){$('[data-g-durum]').textContent='XLS veya XLSX dosyası seçin.';return;}
  if(file.size>25*1024*1024){$('[data-g-durum]').textContent='Dosya en fazla 25 MB olabilir.';return;}
  $('[data-g-durum]').textContent='Dosya okunuyor…';
  try{const XLSX=await import('xlsx'),book=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true}),sheet=book.SheetNames.includes('StyleSheet')?'StyleSheet':book.SheetNames[0];const data=XLSX.utils.sheet_to_json<unknown[]>(book.Sheets[sheet],{header:1,raw:true,defval:''}),r=teftisSureOku(data,tur);if(id!==job)return;rows=r.rows;birim=r.birim;page=0;draw();$('[data-g-durum]').textContent=`${rows.length} kayıt okundu; ${r.atlanan} başlık/veri dışı satır atlandı. ${r.uyarilar.length} tarih/süre uyarısı.`;const details=$('[data-g-uyari]');details.hidden=!r.uyarilar.length;details.querySelector('ul')!.replaceChildren(...r.uyarilar.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));}
  catch(e){if(id!==job)return;rows=[];birim='';draw();$('[data-g-durum]').textContent=(e as Error).message;}
 });
 for(const el of [ara,enaz])el.addEventListener('input',()=>{page=0;draw();});prev.addEventListener('click',()=>{page--;draw();});next.addEventListener('click',()=>{page++;draw();});$('[data-g-form]').addEventListener('submit',e=>e.preventDefault());
 $('[data-g-temizle]').addEventListener('click',()=>{job++;rows=[];birim='';page=0;input.value='';ara.value='';enaz.value='0';$('[data-g-durum]').textContent='';$('[data-g-uyari]').hidden=true;draw();});
 word.addEventListener('click',async()=>{word.disabled=true;const exportRows=filtered.map(gerekceliHucreler);try{dosyaIndir(await tabloWord(c.baslik,`${birim} · ${exportRows.length} kayıt. Bildirilen gün ve takvim günü ayrıdır.`,[...c.basliklar],exportRows),tur+'-zaman-kontrolu.docx');}catch(e){$('[data-g-durum]').textContent='Word çıktısı oluşturulamadı: '+(e as Error).message;}finally{word.disabled=!filtered.length;}});
}
