import {aracKullanildi} from './arac-kullanim';
import {udfMetniniOku,metindenUdf,udfMetinleriniBirlestir} from '../lib/udf';
import {dosyaIndir} from '../lib/belge-indir';
const root=document.querySelector<HTMLElement>('[data-udf]');
if(root){
 const $=<T extends HTMLElement=HTMLElement>(q:string)=>root.querySelector<T>(q)!;
 const input=$<HTMLInputElement>('#u-dosya'),text=$<HTMLTextAreaElement>('#u-metin'),search=$<HTMLInputElement>('#u-ara');
 let job=0;
 const buttons=[...root.querySelectorAll<HTMLButtonElement>('[data-u-cikti]')];
 const draw=()=>{
  const value=text.value,q=search.value.toLocaleLowerCase('tr-TR'),body=$('[data-u-onizleme]');body.replaceChildren();
  let at=0,hits=0,low=value.toLocaleLowerCase('tr-TR');
  if(q)for(let pos=low.indexOf(q);pos>=0;pos=low.indexOf(q,at)){body.append(document.createTextNode(value.slice(at,pos)));const mark=document.createElement('mark');mark.textContent=value.slice(pos,pos+q.length);body.append(mark);at=pos+q.length;hits++;}
  body.append(document.createTextNode(value.slice(at)));$('[data-u-sayi]').textContent=`${value.length.toLocaleString('tr-TR')} UTF-16 karakter${q?' · '+hits+' eşleşme':''}`;buttons.forEach(b=>b.disabled=!value.trim());
 };
 input.addEventListener('change',async()=>{
  const files=[...input.files??[]];if(!files.length)return;const id=++job;
  text.value='';draw();$('[data-u-uyarilar]').replaceChildren();$('[data-u-durum]').textContent='Belgeler okunuyor…';
  try{
   if(files.length>30)throw Error('Bir seferde en fazla 30 belge seçin.');const docs:{ad:string;metin:string}[]=[],warnings=new Set<string>();let bytes=0;
   for(const f of files){bytes+=f.size;if(f.size>25*1024*1024||bytes>50*1024*1024)throw Error('Tek dosya 25 MB, toplam seçim 50 MB sınırını aşamaz.');
    let metin='';if(/\.udf$/i.test(f.name)){const r=udfMetniniOku(new Uint8Array(await f.arrayBuffer()));metin=r.metin;r.uyarilar.forEach(w=>warnings.add(w));}else if(/\.txt$/i.test(f.name))metin=new TextDecoder('utf-8',{fatal:true}).decode(await f.arrayBuffer());else throw Error('Yalnız UDF ve UTF-8 TXT dosyaları seçin.');
    docs.push({ad:f.name,metin});
   }
   if(id!==job)return;const value=udfMetinleriniBirlestir(docs);if(value.length>1000000)throw Error('Birleşik metin bir milyon karakter sınırını aşıyor.');text.value=value;draw();if(value.trim())void aracKullanildi();$('[data-u-durum]').textContent=docs.map(d=>d.ad).join(' · ');$('[data-u-uyarilar]').replaceChildren(...[...warnings].map(w=>{const li=document.createElement('li');li.textContent=w;return li;}));
  }catch(e){if(id===job)$('[data-u-durum]').textContent='Belge okunamadı: '+(e as Error).message;}
 });
 text.addEventListener('input',draw);search.addEventListener('input',draw);
 $('[data-u-temizle]').addEventListener('click',()=>{job++;text.value='';search.value='';input.value='';$('[data-u-durum]').textContent='';$('[data-u-uyarilar]').replaceChildren();draw();});
 buttons.forEach(b=>b.addEventListener('click',async()=>{const value=text.value;try{if(!value.trim())return;
  if(b.dataset.uCikti==='pdf'){if(root!.dataset.kip==='duzenle')void aracKullanildi();window.print();return;}
  if(b.dataset.uCikti==='txt')dosyaIndir(new Blob([value],{type:'text/plain;charset=utf-8'}),'belge.txt');
  if(b.dataset.uCikti==='udf')dosyaIndir(new Blob([metindenUdf(value) as BlobPart],{type:'application/octet-stream'}),'metin-belgesi.udf');
  if(b.dataset.uCikti==='docx'){b.disabled=true;const {Document,Packer,Paragraph}=await import('docx');const doc=new Document({creator:'657.com.tr',sections:[{children:value.split('\n').map(text=>new Paragraph({text}))}]});dosyaIndir(await Packer.toBlob(doc),'belge-metni.docx');}
 if(root!.dataset.kip==='duzenle')void aracKullanildi();
 }catch(e){$('[data-u-durum]').textContent='Çıktı oluşturulamadı: '+(e as Error).message;}finally{draw();}}));
}
