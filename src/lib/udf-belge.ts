export interface UdfDugum {
 tur:string; stil:Record<string,string>; ozellikler:Record<string,string>; metin?:string; cocuklar:UdfDugum[];
}
export interface UdfBelgesi {
 sayfa:{genislik:number;yukseklik:number;sol:number;sag:number;ust:number;alt:number;ustYazi:number};
 stil:Record<string,string>; govde:UdfDugum[]; ust:UdfDugum[]; alt:UdfDugum[];
 ustBaslangic:number;
 dogrulama?:{webId:string;kod?:string;sicil?:string;imzaDosyasi:boolean};
 sayfaNumarasi?:{on:string;baslangic:number;ayrac:string;stil:Record<string,string>};
}
const attrs=(el:Element)=>Object.fromEntries([...el.attributes].map(a=>[a.name,a.value]));
const stilAlanlari=new Set(['family','size','bold','italic','underline','strikethrough','superscript','subscript','shadow','foreground','background','Alignment','LeftIndent','RightIndent','FirstLineIndent','Hanging','SpaceAbove','SpaceBelow','LineSpacing']);
const yalnizStil=(a:Record<string,string>)=>Object.fromEntries(Object.entries(a).filter(([key])=>stilAlanlari.has(key)));
const sayi=(el:Element|null,ad:string,fallback:number,min:number,max:number)=>{const raw=el?.getAttribute(ad),n=raw===null||raw===undefined?NaN:Number(raw);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;};
/** UDF aralıkları Java ve JavaScript'te aynı UTF-16 karakter ölçüsünü kullanır. */
export function udfYapisiniOku(doc:Document,metin:string,uyarilar:string[]):UdfBelgesi|undefined{
 const elements=doc.documentElement.querySelector(':scope > elements');if(!elements)return;
 const styles=new Map([...doc.querySelectorAll('styles > style')].map(s=>[s.getAttribute('name')??'',attrs(s)]));
 const stil=(name:string,seen=new Set<string>()):Record<string,string>=>{
  if(!name||seen.has(name)||seen.size>16)return {};seen.add(name);const s=styles.get(name)??{};
  return {...stil(s.resolveParent??s.parent??'',seen),...yalnizStil(s)};
 };
 const base={family:'Times New Roman',size:'12',...stil('default'),...stil(elements.getAttribute('resolver')??'')};
 let nodes=0,textBudget=0;const unsupported=new Set<string>();let badRange=false;
 function oku(el:Element,inherited:Record<string,string>,depth=0):UdfDugum[]{
  if(++nodes>30000||depth>32)throw Error('Belge yapısı görüntüleme sınırını aşıyor.');
  const a=attrs(el),s={...inherited,...stil(a.resolver??a.name??''),...yalnizStil(a)},tur=el.localName;
  if(!['paragraph','content','field','space','table','row','cell','header','footer','barcode','image','picture','tab','lineBreak','pageBreak'].includes(tur)){unsupported.add(tur);return [];}
  let text:string|undefined;
  if(tur==='content'||tur==='field'||tur==='space'){
   const start=Number(a.startOffset),length=Number(a.length);
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(length)||start<0||length<0||start+length>metin.length){badRange=true;text='';}
   else {textBudget+=length;if(textBudget>8*1024*1024)throw Error('Belgedeki metin aralıklarının toplamı görüntüleme sınırını aşıyor.');text=metin.slice(start,start+length);}
  }
  return [{tur,stil:s,ozellikler:a,metin:text,cocuklar:[...el.children].flatMap(c=>oku(c,s,depth+1))}];
 }
 const all=[...elements.children].flatMap(e=>oku(e,base));
 const header=all.find(n=>n.tur==='header'),footer=all.find(n=>n.tur==='footer'),format=doc.querySelector('properties > pageFormat');
 const landscape=format?.getAttribute('paperOrientation')==='2';
 const media:Record<string,[number,number]>={'1':[595.2756,841.8898],'2':[419.5276,595.2756],'3':[612,792]};
 const [paperWidth,paperHeight]=media[format?.getAttribute('mediaSizeName')??'1']??media['1'];
 const page={genislik:sayi(format,'pageWidth',landscape?paperHeight:paperWidth,200,2000),yukseklik:sayi(format,'pageHeight',landscape?paperWidth:paperHeight,200,3000),sol:sayi(format,'leftMargin',56.7,0,200),sag:sayi(format,'rightMargin',56.7,0,200),ust:sayi(format,'topMargin',56.7,0,200),alt:sayi(format,'bottomMargin',56.7,0,200),ustYazi:sayi(format,'headerFOffset',15,0,200)};
 if(page.sol+page.sag>=page.genislik||page.ust+page.alt>=page.yukseklik)throw Error('Belgenin sayfa kenar boşlukları geçersiz.');
 if(unsupported.size)uyarilar.push('Önizlemede desteklenmeyen öğeler var: '+[...unsupported].join(', ')+'.');
 if(badRange)uyarilar.push('Bazı metin aralıkları geçersiz olduğu için önizlemeye alınmadı.');
 if(all.some(n=>n.tur==='pageBreak'))uyarilar.push('Sayfa sonları önizlemede ayraçla gösterilir.');
 return {sayfa:page,stil:base,govde:all.filter(n=>n.tur!=='header'&&n.tur!=='footer'),ust:header?.cocuklar??[],alt:footer?.cocuklar??[],ustBaslangic:Math.max(1,Math.floor(Number(header?.ozellikler.startPage)||1)),...(footer?.ozellikler['pageNumber-spec']?{sayfaNumarasi:{on:footer.ozellikler['pageNumber-foreStr']??'',baslangic:sayi(doc.querySelector('footer'),'pageNumber-pageStartNumStr',1,1,999999),ayrac:footer.ozellikler['pageNumber-seperator']??'',stil:{family:footer.ozellikler['pageNumber-fontFace']??'Arial',size:footer.ozellikler['pageNumber-fontSize']??'11',foreground:footer.ozellikler['pageNumber-color']??'-16777216'}}}:{})};
}
