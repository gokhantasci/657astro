import type {Content,ContentText,TableCell,TDocumentDefinitions} from 'pdfmake/interfaces';
import {yerelYol} from '../lib/site-yolu';
import {dosyaIndir} from '../lib/belge-indir';
const norm=(s:string)=>(s??'').replace(/[\t\r\n ]+/g,' ').trim();
const base64=(blob:Blob)=>new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(Error('Dosya okunamadı.'));r.readAsDataURL(blob);});
let assets:Promise<{font:string;logo:string}>|undefined;
async function antetDosyalari(){
 assets??=(async()=>{const [font,logo]=await Promise.all(['/fonts/noto/NotoSans-Regular.ttf','/logo.png'].map(async path=>{const r=await fetch(yerelYol(path));if(!r.ok)throw Error('Antet dosyaları yüklenemedi.');return base64(await r.blob());}));return {font,logo};})();
 try{return await assets;}catch(e){assets=undefined;throw e;}
}
function yazi(node:Node,style:Partial<ContentText>={}):ContentText[]{
 if(node.nodeType===Node.TEXT_NODE)return [{text:(node.textContent??'').replace(/[\n\r]+/g,' '),...style}];
 if(!(node instanceof HTMLElement))return [];
 if(node.tagName==='BR')return [{text:'\n',...style}];
 const next={...style};if(['STRONG','B'].includes(node.tagName))next.bold=true;if(['EM','I'].includes(node.tagName))next.italics=true;
 if(node.tagName==='A'&&/^https?:\/\//.test((node as HTMLAnchorElement).href))next.link=(node as HTMLAnchorElement).href;
 return [...node.childNodes].flatMap(n=>yazi(n,next));
}
/** Dış doğrulama altlıkları ve kurum anteti yerine 657 antetiyle okuma nüshası. */
export function antetIcerigi(root:HTMLElement,images=new Map<string,{data:string;width:number;height:number}>()):Content[]{
 const empty=()=>({text:''});
 function block(el:HTMLElement):Content[]{
  if(el.matches('.kaynak-sayfa-no,.kaynak-ozgun-numara')||el.querySelector('img[alt="Kaynak belgenin doğrulama bilgileri"]'))return [];
  if(el===root.querySelector('.belge-kurum')&&/T\.C\.|BAKANLIĞI/.test(el.textContent??''))return [];
  if(el.tagName==='TABLE'){
   const table=el as HTMLTableElement,rows=[...table.rows];if(!rows.length)return [];
   const count=Math.max(...rows.map(r=>[...r.cells].reduce((sum,c)=>sum+c.colSpan,0))),pending:number[]=Array(count).fill(0),body:TableCell[][]=[];
   for(const row of rows){const cells:TableCell[]=[];let col=0;
    for(const cell of [...row.cells]){
     while(pending[col]>0){cells.push(empty());pending[col]--;col++;}
     const content=blocks(cell as HTMLElement),span=Math.min(cell.colSpan,count-col),rowSpan=Math.min(cell.rowSpan,rows.length-body.length);
     cells.push({stack:content.length?content:[empty()],...(span>1?{colSpan:span}:{}),...(rowSpan>1?{rowSpan}:{}),fillColor:cell.tagName==='TH'?'#f0f2f5':undefined});
     for(let i=0;i<span;i++){if(i)cells.push(empty());if(rowSpan>1)pending[col+i]=rowSpan-1;}col+=span;
    }
    while(col<count){cells.push(empty());if(pending[col]>0)pending[col]--;col++;}body.push(cells);
   }
   return [{table:{headerRows:table.tHead?.rows.length??0,widths:Array(count).fill('*'),body},layout:'lightHorizontalLines',fontSize:count>8?7.5:9,margin:[0,8,0,12]}];
  }
  if(['UL','OL'].includes(el.tagName)){
   const items=[...el.children].map(li=>({stack:blocks(li as HTMLElement)}));return [el.tagName==='OL'?{ol:items,margin:[12,0,0,10]}:{ul:items,margin:[12,0,0,10]}];
  }
  if(el.tagName==='IMG'){
   const image=images.get((el as HTMLImageElement).src);return image?[{image:image.data,width:image.width,height:image.height,margin:[0,8,0,12]}]:[];
  }
  if(['P','H2','H3','H4'].includes(el.tagName)){
   const text=yazi(el),pictures=[...el.querySelectorAll('img')].flatMap(img=>block(img));if(!norm(el.textContent??''))return pictures;
   const centered=Boolean(el.closest('.belge-kurum')),right=Boolean(el.closest('.belge-imza')),left=Boolean(el.closest('.belge-ust-bilgi'));
   return [{text,alignment:centered?'center':right?'right':left?'left':'justify',fontSize:el.tagName==='H2'?13:11,bold:el.tagName!=='P',margin:[0,0,0,10],lineHeight:1.3},...pictures];
  }
  return blocks(el);
 }
 function blocks(el:HTMLElement):Content[]{
  return [...el.childNodes].flatMap(n=>n instanceof HTMLElement?block(n):n.nodeType===Node.TEXT_NODE&&norm(n.textContent??'')?[{text:norm(n.textContent??''),margin:[0,0,0,8]} as Content]:[]);
 }
 return blocks(root);
}
export async function antetliPdf(root:HTMLElement){
 const source=root.querySelector<HTMLElement>('[data-ozgun-metin]');if(!source)throw Error('Belge metni bulunamadı.');
 const images=new Map<string,{data:string;width:number;height:number}>();let bytes=0;
 for(const img of source.querySelectorAll<HTMLImageElement>('img')){
  if(img.alt==='Kaynak belgenin doğrulama bilgileri'||images.has(img.src))continue;
  const url=new URL(img.src);if(url.origin!==location.origin)throw Error('Belge görseli aynı site üzerinden yüklenmelidir.');
  const response=await fetch(url.href);if(!response.ok)throw Error('Belge görseli yüklenemedi.');const blob=await response.blob();bytes+=blob.size;
  if(bytes>32*1024*1024||images.size>=100)throw Error('Belgedeki görsellerin toplamı PDF oluşturma sınırını aşıyor.');
  const bitmap=await createImageBitmap(blob),scale=Math.min(511/bitmap.width,650/bitmap.height,1);
  images.set(img.src,{data:`data:${blob.type};base64,${await base64(blob)}`,width:bitmap.width*scale,height:bitmap.height*scale});bitmap.close();
 }
 const {font,logo}=await antetDosyalari(),{default:pdf}=await import('pdfmake/build/pdfmake');
 pdf.addVirtualFileSystem({'NotoSans.ttf':font});pdf.addFonts({Noto:{normal:'NotoSans.ttf',bold:'NotoSans.ttf',italics:'NotoSans.ttf',bolditalics:'NotoSans.ttf'}});
 const baslik=root.dataset.belgeBaslik??document.title,kurum=root.dataset.belgeKurum??'',kaynak=root.dataset.belgeKaynak??'';
 const doc:TDocumentDefinitions={
  info:{title:baslik,author:'657.com.tr',subject:kurum+' - arşiv nüshası'},pageSize:'A4',pageMargins:[42,106,42,48],defaultStyle:{font:'Noto',fontSize:11,color:'#132036'},
  header:()=>({margin:[42,26,42,0],stack:[{columns:[{image:'data:image/png;base64,'+logo,width:36,height:36},{width:'*',stack:[{text:'657.com.tr',fontSize:19,color:'#132036'},{text:'Belge arşivi',fontSize:9,color:'#59657a'}],margin:[10,0,0,0]},{text:kurum,fontSize:9,color:'#59657a',alignment:'right',width:155,margin:[0,12,0,0]}]},{canvas:[{type:'line',x1:0,y1:12,x2:511,y2:12,lineWidth:1.5,lineColor:'#c8102e'}]}]}),
  content:[{text:baslik,fontSize:14,lineHeight:1.2,margin:[0,0,0,12]},{text:[{text:'Kaynak: '+kurum+'  ·  ',color:'#59657a'},{text:'Özgün PDF',link:kaynak,color:'#b00d27'}],fontSize:8,margin:[0,0,0,18]},...antetIcerigi(source,images)],
  footer:(page,total)=>({columns:[{text:'657.com.tr · Belge arşivi',alignment:'left'},{text:`${page} / ${total}`,alignment:'right'}],fontSize:8,color:'#59657a',margin:[42,16,42,0]})
 };
 return pdf.createPdf(doc).getBlob();
}
const root=document.querySelector<HTMLElement>('[data-belge-indir]');
if(root){const button=root.querySelector<HTMLButtonElement>('[data-antet-pdf]')!,status=root.querySelector<HTMLElement>('[data-antet-durum]')!;
 button.addEventListener('click',async()=>{button.disabled=true;status.textContent='Antetli PDF hazırlanıyor…';try{const blob=await antetliPdf(root);dosyaIndir(blob,(root.dataset.belgeId??'belge')+'-657-antetli.pdf');status.textContent='Antetli PDF hazır.';}catch(e){status.textContent='PDF hazırlanamadı: '+(e as Error).message;}finally{button.disabled=false;}});
}
