import {aracKullanildi} from './arac-kullanim';
import {udfMetniniOku,metindenUdf,udfMetinleriniBirlestir} from '../lib/udf';
import type {UdfBelgesi} from '../lib/udf-belge';
import {udfBelgesiniCiz,udfSayfalaraBol} from './udf-gorunum';
import {dosyaIndir} from '../lib/belge-indir';
import '../styles/udf.css';
import '../styles/udf-calisma.css';
import {islemDurumunuYaz,type IslemDurumu} from './islem-durumu';
const root=document.querySelector<HTMLElement>('[data-udf]');
/** Metin düğümleri bölünse de (ör. kalın/eğik geçişi) aynı paragrafta arama sürer. */
function isaretle(body:HTMLElement,q:string){
 if(!q)return 0;
 const walker=document.createTreeWalker(body,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest('.udf-liste-isareti,.udf-sayfa-numarasi,.udf-barkod,.udf-filigran,.udf-dogrulama')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 const parts:{node:Text;start:number;end:number}[]=[];let value='',paragraph:Element|null=null;
 for(let n=walker.nextNode();n;n=walker.nextNode()){
  const p=n.parentElement?.closest('p')??null;if(p!==paragraph&&value)value+='\n';paragraph=p;
  const start=value.length;value+=n.textContent??'';parts.push({node:n as Text,start,end:value.length});
 }
 const low=value.toLocaleLowerCase('tr-TR'),matches:{start:number;end:number}[]=[];let count=0,matchIndex=0;
 for(let pos=low.indexOf(q);pos>=0;pos=low.indexOf(q,pos+q.length)){count++;if(matches.length<5000)matches.push({start:pos,end:pos+q.length});}
 for(const part of parts){
  while(matchIndex<matches.length&&matches[matchIndex].end<=part.start)matchIndex++;
  const hits:typeof matches=[];for(let i=matchIndex;i<matches.length&&matches[i].start<part.end;i++)hits.push(matches[i]);if(!hits.length)continue;
  const text=part.node.data,fragment=document.createDocumentFragment();let at=0;
  for(const hit of hits){const start=Math.max(0,hit.start-part.start),end=Math.min(text.length,hit.end-part.start);fragment.append(text.slice(at,start));const mark=document.createElement('mark');mark.textContent=text.slice(start,end);fragment.append(mark);at=end;}
  fragment.append(text.slice(at));part.node.replaceWith(fragment);
 }
 return count;
}
if(root){
 const $=<T extends HTMLElement=HTMLElement>(q:string)=>root.querySelector<T>(q)!;
 const input=$<HTMLInputElement>('#u-dosya'),text=$<HTMLTextAreaElement>('#u-metin'),search=$<HTMLInputElement>('#u-ara');
 let job=0,belge:UdfBelgesi|undefined,belgeMetni='',gorunum:'belge'|'metin'='metin',zoom:number|null=null,exporting=false,belgeAdi='Belge bekleniyor';
 const buttons=[...root.querySelectorAll<HTMLButtonElement>('[data-u-cikti]')];
 const views=[...root.querySelectorAll<HTMLButtonElement>('[data-u-gorunum]')];
 const zoomButtons=[...root.querySelectorAll<HTMLButtonElement>('[data-u-zoom]')];
 const status=(state:IslemDurumu,message:string)=>islemDurumunuYaz(root,state,message);
 const zoomUpdate=()=>{
  const body=$('[data-u-onizleme]'),page=body.querySelector<HTMLElement>('.udf-sayfa'),padding=getComputedStyle(body);
  const ratio=page?(zoom??Math.min(1,Math.max(.25,(body.clientWidth-parseFloat(padding.paddingLeft)-parseFloat(padding.paddingRight))/(parseFloat(page.style.width)*96/72)))):1;
  body.querySelectorAll<HTMLElement>('.udf-sayfa').forEach(item=>{if(item.style.zoom!==String(ratio))item.style.zoom=String(ratio);});
  $('[data-u-zoom-etiket]').textContent=page?'%'+Math.round(ratio*100):'—';
  zoomButtons.forEach(b=>b.disabled=!page||(b.dataset.uZoom==='azalt'&&ratio<=.25)||(b.dataset.uZoom==='artir'&&ratio>=2));
  return ratio;
 };
 zoomButtons.forEach(b=>b.addEventListener('click',()=>{const current=zoomUpdate();zoom=b.dataset.uZoom==='sigdir'?null:Math.min(2,Math.max(.25,current+(b.dataset.uZoom==='artir'?.1:-.1)));zoomUpdate();}));
 let previousWidth=-1,zoomFrame=0;
 new ResizeObserver(entries=>{
  const width=entries[0]?.contentRect.width??0;if(Math.abs(width-previousWidth)<.5)return;
  previousWidth=width;cancelAnimationFrame(zoomFrame);zoomFrame=requestAnimationFrame(zoomUpdate);
 }).observe($('[data-u-onizleme]'));
 const draw=()=>{
  const value=text.value,q=search.value.toLocaleLowerCase('tr-TR'),body=$('[data-u-onizleme]'),rich=Boolean(belge&&value===belgeMetni);
  if(!rich)gorunum='metin';
  body.classList.toggle('udf-metin',gorunum==='metin');body.classList.toggle('udf-belge-alani',gorunum==='belge');
  if(rich&&gorunum==='belge')body.replaceChildren(udfBelgesiniCiz(belge!));else body.textContent=value;
  const hasText=Boolean(value.trim());body.hidden=!hasText;$('[data-u-bos]').hidden=hasText;search.disabled=!hasText;
  $('[data-u-belge-adi]').textContent=belgeAdi;
  const hits=isaretle(body,q);
  if(rich&&gorunum==='belge')requestAnimationFrame(()=>{const first=body.querySelector<HTMLElement>('.udf-sayfa');if(first){udfSayfalaraBol(first,belge!);zoomUpdate();}});
  $('[data-u-sayi]').textContent=`${value.length.toLocaleString('tr-TR')} karakter${q?' · '+hits+' eşleşme':''}${hits>5000?' · İlk 5.000 eşleşme vurgulandı.':''}`;
  $('[data-u-arama-ozet]').textContent=q?hits+' eşleşme':'';
  buttons.forEach(b=>b.disabled=!hasText||exporting);views.forEach(b=>{b.disabled=b.dataset.uGorunum==='belge'&&!rich;b.setAttribute('aria-pressed',String(b.dataset.uGorunum===gorunum));});
  $('[data-u-gorunum-not]').textContent=rich?'Belge biçimleri korunarak gösteriliyor.':belge?'Düzenlenen metin · Yalın görünüm':hasText?'Yalın metin görünümü':'Dosyalar sunucuya gönderilmez.';
  zoomUpdate();
 };
 views.forEach(b=>b.addEventListener('click',()=>{gorunum=b.dataset.uGorunum as typeof gorunum;draw();}));
 input.addEventListener('change',async()=>{
  const files=[...input.files??[]];if(!files.length)return;const id=++job;
  belge=undefined;belgeMetni='';text.value='';zoom=null;belgeAdi=files.map(f=>f.name).join(' · ');draw();$('[data-u-uyarilar]').replaceChildren();status('loading','Belgeler okunuyor…');
  $('[data-dosya-birak]').dataset.state='loading';
  try{
   if(files.length>30)throw Error('Bir seferde en fazla 30 belge seçin.');const docs:{ad:string;metin:string}[]=[],warnings=new Set<string>();let bytes=0,loaded:UdfBelgesi|undefined;
   for(const f of files){bytes+=f.size;if(f.size>25*1024*1024||bytes>50*1024*1024)throw Error('Tek dosya 25 MB, toplam seçim 50 MB sınırını aşamaz.');
    let metin='';if(/\.udf$/i.test(f.name)){const r=udfMetniniOku(new Uint8Array(await f.arrayBuffer()));metin=r.metin;if(files.length===1)loaded=r.belge;r.uyarilar.forEach(w=>warnings.add(w));}else if(/\.txt$/i.test(f.name))metin=new TextDecoder('utf-8',{fatal:true}).decode(await f.arrayBuffer());else throw Error('Yalnız UDF ve UTF-8 TXT dosyaları seçin.');
    docs.push({ad:f.name,metin});
   }
   if(id!==job)return;const value=udfMetinleriniBirlestir(docs);if(value.length>1000000)throw Error('Birleşik metin bir milyon karakter sınırını aşıyor.');
   text.value=value;belge=loaded;belgeMetni=value;gorunum=belge?'belge':'metin';draw();if(value.trim())void aracKullanildi();
   if(files.length>1)warnings.add('Birleştirilen belgeler yalın metin olarak gösterilir. Tek UDF seçerek özgün belge görünümünü açabilirsiniz.');
   status('success',docs.length>1?`${docs.length} belge birleştirildi.`:'Belge okumaya hazır.');$('[data-dosya-birak]').dataset.state='success';$('[data-u-uyarilar]').replaceChildren(...[...warnings].map(w=>{const li=document.createElement('li');li.textContent=w;return li;}));
  }catch(e){if(id===job){belge=undefined;text.value='';draw();status('error','Belge okunamadı: '+(e as Error).message);$('[data-dosya-birak]').dataset.state='error';}}
 });
 text.addEventListener('input',()=>{belgeAdi=text.value.trim()?'Düzenlenen metin':'Belge bekleniyor';draw();status(text.value.trim()?'success':'idle',text.value.trim()?'Metin hazır.':'Belge seçin veya metin yazın.');});search.addEventListener('input',draw);
 $('[data-u-temizle]').addEventListener('click',()=>{job++;belge=undefined;belgeMetni='';zoom=null;belgeAdi='Belge bekleniyor';text.value='';search.value='';input.value='';status('idle','Belge seçerek başlayın.');$('[data-u-uyarilar]').replaceChildren();$('[data-dosya-birak]').dataset.state='idle';$('[data-dosya-secim]').textContent='Henüz dosya seçilmedi.';draw();});
 buttons.forEach(b=>b.addEventListener('click',async()=>{const value=text.value;try{if(!value.trim())return;
  if(b.dataset.uCikti==='pdf'){if(root!.dataset.kip==='duzenle')void aracKullanildi();window.print();return;}
  if(b.dataset.uCikti==='txt')dosyaIndir(new Blob([value],{type:'text/plain;charset=utf-8'}),'belge.txt');
  if(b.dataset.uCikti==='udf')dosyaIndir(new Blob([metindenUdf(value) as BlobPart],{type:'application/octet-stream'}),'metin-belgesi.udf');
  if(b.dataset.uCikti==='docx'){exporting=true;b.setAttribute('aria-busy','true');draw();status('loading','Word çıktısı hazırlanıyor…');const {Document,Packer,Paragraph}=await import('docx');const doc=new Document({creator:'657.com.tr',sections:[{children:value.split('\n').map(text=>new Paragraph({text}))}]});dosyaIndir(await Packer.toBlob(doc),'belge-metni.docx');}
  status('success','İndirme hazır.');
 if(root!.dataset.kip==='duzenle')void aracKullanildi();
 }catch(e){status('error','Çıktı oluşturulamadı: '+(e as Error).message);}finally{exporting=false;b.removeAttribute('aria-busy');draw();}}));
 draw();
}
