import {code128,qrcode} from '@bwip-js/browser';
import type {UdfBelgesi,UdfDugum} from '../lib/udf-belge';
const numeric=(v:string|undefined,min:number,max:number)=>v!==undefined&&v.trim()!==''&&Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):undefined;
export function udfRengi(raw:string|undefined){
 if(raw===undefined||!/^[-+]?\d+$/.test(raw))return;
 const n=Number(raw);if(!Number.isSafeInteger(n)||n< -2147483648||n>4294967295)return;
 return '#'+(n>>>0&0xffffff).toString(16).padStart(6,'0');
}
function yaziyiBicimle(el:HTMLElement,s:Record<string,string>){
 const family=s.family?.trim();if(family&&/^[\p{L}\p{N} _-]{1,80}$/u.test(family))el.style.fontFamily=['Dialog','DialogInput','SansSerif'].includes(family)?'Arial, sans-serif':family==='Serif'?'Times New Roman, serif':`"${family}"`;
 const size=numeric(s.size,5,144);if(size!==undefined)el.style.fontSize=size+'pt';
 el.style.fontWeight=s.bold==='true'?'700':'400';el.style.fontStyle=s.italic==='true'?'italic':'normal';
 const decorations=[s.underline==='true'?'underline':'',s.strikethrough==='true'?'line-through':''].filter(Boolean);el.style.textDecorationLine=decorations.join(' ')||'none';
 const fg=udfRengi(s.foreground),bg=udfRengi(s.background);if(fg)el.style.color=fg;if(bg)el.style.backgroundColor=bg;
 if(s.superscript==='true'||s.subscript==='true'){el.style.verticalAlign=s.superscript==='true'?'super':'sub';el.style.fontSize=(size??12)*.75+'pt';}
 if(s.shadow==='true')el.style.textShadow='1px 1px 1px #999';
}
function sayfaKromu(article:HTMLElement,doc:UdfBelgesi){
 const info=doc.dogrulama;if(!info)return;
 if(info.sicil){const watermark=document.createElement('div'),pattern=document.createElement('div');watermark.className='udf-filigran';pattern.className='udf-filigran__doku';watermark.setAttribute('aria-hidden','true');
  for(let i=0;i<35;i++){const mark=document.createElement('span');mark.textContent=info.sicil;pattern.append(mark);}watermark.append(pattern);article.prepend(watermark);}
 if(info.webId){article.classList.add('udf-sayfa--dogrulama');const notice=document.createElement('div');notice.className='udf-dogrulama';
  notice.style.left=doc.sayfa.sol+'pt';notice.style.right=doc.sayfa.sag+'pt';
  notice.textContent=`UYAP Bilişim Sistemindeki bu dokümana vatandaş portalından ${info.webId} koduyla erişebilirsiniz.`;article.append(notice);}
 if(info.kod){const qr=document.createElement('canvas');qr.className='udf-dogrulama-qr';qr.setAttribute('role','img');qr.setAttribute('aria-label','Belgede yer alan UYAP doğrulama karekodu');
  try{qrcode(qr,{bcid:'qrcode',text:`https://evrakdogrula.uyap.gov.tr/${info.kod}`,scale:2});article.append(qr);}catch{/* Kod metni dosyada kalır; geçersiz karekod çizilmez. */}}
}
function sekme(){const span=document.createElement('span');span.className='udf-sekme';span.setAttribute('aria-hidden','true');return span;}
function sekmeleriYerlestir(root:HTMLElement){
 for(const p of root.querySelectorAll<HTMLElement>('.udf-paragraf:has(.udf-sekme)')){
  const stops=(p.dataset.tabSet??'').split(',').map(part=>{const [position,align]=part.split(':');return {position:Number(position),align:Number(align)||0};}).filter(s=>s.position>0&&Number.isFinite(s.position)).sort((a,b)=>a.position-b.position);
  const tabs=[...p.querySelectorAll<HTMLElement>('.udf-sekme')];tabs.forEach(tab=>tab.style.width='0px');
  for(const [index,tab] of tabs.entries()){
   const rect=p.getBoundingClientRect(),scale=p.offsetWidth?rect.width/p.offsetWidth:1;
   const x=(tab.getBoundingClientRect().left-rect.left)/scale*72/96;
   const stop=stops.find(s=>s.position>x+.5)??{position:(Math.floor(x/36)+1)*36,align:0};
   let segment=0;if(stop.align===1||stop.align===2){const range=document.createRange();range.setStartAfter(tab);const next=tabs[index+1];if(next)range.setEndBefore(next);else range.setEnd(p,p.childNodes.length);segment=range.getBoundingClientRect().width/scale*72/96;}
   const space=stop.position-x-(stop.align===1?segment:stop.align===2?segment/2:0);
   tab.style.width=Math.max(0,space)*96/72+'px';
  }
 }
}
export function udfBelgesiniCiz(doc:UdfBelgesi){
 const article=document.createElement('article');article.className='udf-sayfa';article.setAttribute('aria-label','Biçimlendirilmiş UDF belgesi');
 const p=doc.sayfa;article.style.width=p.genislik+'pt';article.style.height=p.yukseklik+'pt';article.style.padding=`${p.ust}pt ${p.sag}pt ${p.alt}pt ${p.sol}pt`;yaziyiBicimle(article,doc.stil);
 const numbers=new Map<string,number>();
 function ciz(n:UdfDugum):HTMLElement{
  const a=n.ozellikler;
  if(n.tur==='content'||n.tur==='field'||n.tur==='space'){const span=document.createElement('span');const parts=(n.metin??'').split('\t');parts.forEach((part,i)=>{if(i)span.append(sekme());span.append(document.createTextNode(part));});yaziyiBicimle(span,n.stil);return span;}
  if(n.tur==='barcode'){
   const box=document.createElement('span');box.className='udf-barkod';const value=a.barcodeData??'';box.setAttribute('role','img');box.setAttribute('aria-label','Barkod: '+value);
   const canvas=document.createElement('canvas');
   try{if(!/^[\x20-\x7e]{1,256}$/.test(value))throw Error();code128(canvas,{bcid:'code128',text:value,scale:2,height:12,includetext:true,textxalign:'center',backgroundcolor:'FFFFFF'});box.append(canvas);}catch{box.textContent='Barkod: '+value;}
   return box;
  }
  if(n.tur==='image'||n.tur==='picture'){
   const box=document.createElement('span');box.className='udf-gorsel';const data=a.imageData??a.data??'';
   const raw=data.replace(/^data:image\/(png|jpeg|gif);base64,/,'').replace(/\s/g,'');
   const mime=raw.startsWith('iVBORw0KGgo')?'png':raw.startsWith('/9j/')?'jpeg':raw.startsWith('R0lGOD')?'gif':null;
   if(mime&&raw.length<=8*1024*1024&&/^[A-Za-z0-9+/]*={0,2}$/.test(raw)){
    const image=document.createElement('img');image.src=`data:image/${mime};base64,${raw}`;image.alt='Belge görseli';
    const w=numeric(a.width,1,1200),h=numeric(a.height,1,1200);if(w)image.style.width=w+'pt';if(h)image.style.height=h+'pt';box.append(image);
   }else box.textContent='[Görsel önizlenemedi]';return box;
  }
  if(n.tur==='tab')return sekme();
  if(n.tur==='lineBreak')return document.createElement('br');
  if(n.tur==='pageBreak'){const hr=document.createElement('hr');hr.className='udf-sayfa-sonu';return hr;}
  if(n.tur==='table'){
   const table=document.createElement('table');table.className='udf-belge-tablosu';table.setAttribute('aria-label',a.tableName||'Belge tablosu');if(a.border==='borderNone')table.classList.add('udf-belge-tablosu--kenarsiz');
   const widths=(a.columnSpans??'').split(',').map(Number);if(widths.length<=100&&widths.every(w=>Number.isFinite(w)&&w>0)){const cols=document.createElement('colgroup'),sum=widths.reduce((x,y)=>x+y,0);for(const w of widths){const col=document.createElement('col');col.style.width=w/sum*100+'%';cols.append(col);}table.append(cols);}
   const body=document.createElement('tbody');body.append(...n.cocuklar.map(ciz));table.append(body);return table;
  }
  const tags:Record<string,string>={paragraph:'p',row:'tr',cell:'td',header:'header',footer:'footer'};
  const el=document.createElement(tags[n.tur]??'div');
  if(n.tur==='cell'){for(const [attr,prop]of [['colSpan','colSpan'],['rowSpan','rowSpan']] as const){const val=numeric(a[attr],1,100);if(val)(el as HTMLTableCellElement)[prop]=Math.floor(val);}}
  if(n.tur==='paragraph'){
   el.className='udf-paragraf';yaziyiBicimle(el,n.stil);
   if(a.TabSet)el.dataset.tabSet=a.TabSet;
   el.style.textAlign=['left','center','right','justify'][Number(n.stil.Alignment??0)]??'left';
   for(const [key,prop]of [['LeftIndent','marginLeft'],['RightIndent','marginRight'],['FirstLineIndent','textIndent'],['SpaceAbove','paddingTop'],['SpaceBelow','paddingBottom']] as const){const value=numeric(n.stil[key],key==='FirstLineIndent'?-200:0,500);if(value!==undefined)el.style[prop]=value+'pt';}
   const hanging=numeric(n.stil.Hanging,0,500);if(hanging){el.style.paddingLeft=hanging+'pt';el.style.textIndent=((numeric(n.stil.FirstLineIndent,-200,500)??0)-hanging)+'pt';}
   const line=numeric(n.stil.LineSpacing,0,5);if(line!==undefined)el.style.lineHeight=String(1.15+line);
   if(a.Bulleted==='true'||a.Numbered==='true'){
    el.classList.add('udf-liste');el.setAttribute('role','listitem');const marker=document.createElement('span');marker.className='udf-liste-isareti';marker.setAttribute('aria-hidden','true');
    const id=(a.ListId??'default')+':'+(a.ListLevel??'1'),index=(numbers.get(id)??0)+1;numbers.set(id,index);
    const format=a.NumberType??'';const value=format.includes('LETTER')?String.fromCharCode((format.includes('LOWER')?97:65)+(index-1)%26):String(index);
    marker.textContent=a.Bulleted==='true'?'•':format.includes('PARANTHESE_2')?value+')':format.includes('PARANTHESE')?'('+value+')':value+'.';el.append(marker);
   }
  }
  el.append(...n.cocuklar.map(ciz));
  if(n.tur==='paragraph'){
   // Paragraf sınırı HTML tarafından çizilir; UDF'nin son satır sonunu ikinci kez çizme.
   let last:Node|null=el.lastChild;while(last?.lastChild)last=last.lastChild;
   if(last?.nodeType===Node.TEXT_NODE)last.textContent=(last.textContent??'').replace(/\r?\n$/,'');
   if(!el.textContent&&!el.querySelector('canvas,img'))el.append(document.createElement('br'));
  }
  return el;
 }
 const header=document.createElement('header');header.className='udf-ust-yazi';header.style.top=doc.sayfa.ustYazi+'pt';header.style.left=doc.sayfa.sol+'pt';header.style.right=doc.sayfa.sag+'pt';header.append(...doc.ust.map(ciz));
 const body=document.createElement('div');body.className='udf-belge-govde';body.append(...doc.govde.map(ciz));
 const footer=document.createElement('footer');footer.className='udf-alt-yazi';footer.append(...doc.alt.map(ciz));
 if(doc.sayfaNumarasi){const num=document.createElement('span');num.className='udf-sayfa-numarasi';num.textContent=doc.sayfaNumarasi.on+doc.sayfaNumarasi.baslangic;yaziyiBicimle(num,doc.sayfaNumarasi.stil);footer.append(num);}
 article.append(header,body,footer);sayfaKromu(article,doc);return article;
}

/** Belge bloklarını ölçerek UDF kâğıt boyutunda ayrı sayfalara taşır. */
export function udfSayfalaraBol(first:HTMLElement,doc:UdfBelgesi){
 if(!first.isConnected)return;
 sekmeleriYerlestir(first);
 const source=first.querySelector<HTMLElement>('.udf-belge-govde')!;
 const headerTemplate=first.querySelector<HTMLElement>('.udf-ust-yazi')!.cloneNode(true) as HTMLElement;
 if(doc.ustBaslangic>1)first.querySelector<HTMLElement>('.udf-ust-yazi')!.replaceChildren();
 const blocks=[...source.children];source.replaceChildren();
 const pages=[first];let page=first,body=source;
 const makePage=()=>{
  const next=first.cloneNode(false) as HTMLElement;
  const head=headerTemplate.cloneNode(true) as HTMLElement;
  if(pages.length+1<doc.ustBaslangic)head.replaceChildren();
  const content=document.createElement('div');content.className='udf-belge-govde';
  const foot=first.querySelector<HTMLElement>('.udf-alt-yazi')!.cloneNode(true);
  next.append(head,content,foot);sayfaKromu(next,doc);page.after(next);pages.push(next);page=next;body=content;
 };
 function parcala(p:HTMLParagraphElement):[HTMLParagraphElement,HTMLParagraphElement]|undefined{
  const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT),texts:Text[]=[];
  for(let node=walker.nextNode();node;node=walker.nextNode())texts.push(node as Text);
  const total=texts.reduce((sum,node)=>sum+node.data.length,0);if(total<2)return;
  const pair=(at:number):[HTMLParagraphElement,HTMLParagraphElement]=>{
   let offset=at,target=texts.at(-1)!;
   for(const node of texts){if(offset<=node.data.length){target=node;break;}offset-=node.data.length;}
   const before=document.createRange();before.setStart(p,0);before.setEnd(target,offset);
   const after=document.createRange();after.setStart(target,offset);after.setEnd(p,p.childNodes.length);
   const firstPart=p.cloneNode(false) as HTMLParagraphElement,lastPart=p.cloneNode(false) as HTMLParagraphElement;
   firstPart.append(before.cloneContents());lastPart.append(after.cloneContents());
   return [firstPart,lastPart];
  };
  let low=1,high=total-1,best:ReturnType<typeof pair>|undefined;
  while(low<=high){const mid=Math.floor((low+high)/2),parts=pair(mid);p.replaceWith(parts[0]);
   const fits=body.scrollHeight<=body.clientHeight;parts[0].replaceWith(p);
   if(fits){best=parts;low=mid+1;}else high=mid-1;
  }
  return best;
 }
 const queue=[...blocks];
 while(queue.length){const block=queue.shift()!;
  if(block.classList.contains('udf-sayfa-sonu')){makePage();continue;}
  body.append(block);
  if(body.scrollHeight>body.clientHeight){
   const parts=block instanceof HTMLParagraphElement?parcala(block):undefined;
   if(parts){block.replaceWith(parts[0]);makePage();queue.unshift(parts[1]);}
   else if(body.children.length>1){block.remove();makePage();queue.unshift(block);}
  }
 }
 for(const [index,item] of pages.entries()){
  sekmeleriYerlestir(item);
  const head=item.querySelector<HTMLElement>('.udf-ust-yazi');if(head&&index+1<doc.ustBaslangic)head.replaceChildren();
  const label=item.querySelector<HTMLElement>('.udf-sayfa-numarasi');
  if(label&&doc.sayfaNumarasi)label.textContent=doc.sayfaNumarasi.on+(doc.sayfaNumarasi.baslangic+index)+(doc.sayfaNumarasi.ayrac?doc.sayfaNumarasi.ayrac+pages.length:'');
  item.setAttribute('aria-label',`Biçimlendirilmiş UDF belgesi, sayfa ${index+1} / ${pages.length}`);
 }
 return pages.length;
}
