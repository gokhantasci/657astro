import {unzipSync,strFromU8,strToU8,zipSync} from 'fflate';
export interface UdfMetni {metin:string;uyarilar:string[];}
const MAX_XML=8*1024*1024;
export function udfMetniniOku(data:Uint8Array):UdfMetni{
 if(data.length>25*1024*1024)throw Error('UDF dosyası en fazla 25 MB olabilir.');
 let toplam=0,imza=false;
 const files=unzipSync(data,{filter:f=>{
  toplam+=f.originalSize;if(toplam>64*1024*1024)throw Error('Arşivin açılmış boyutu sınırı aşıyor.');
  if(/sign|imza/i.test(f.name))imza=true;
  if(f.name==='content.xml'&&f.originalSize>MAX_XML)throw Error('UDF metin bölümü en fazla 8 MB olabilir.');
  return f.name==='content.xml';
 }});
 if(!files['content.xml'])throw Error('Arşivde content.xml bulunamadı. Dosya bir UDF belgesi olmayabilir.');
 const xml=strFromU8(files['content.xml']);
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Dış varlık veya DTD içeren XML işlenmez.');
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 if(doc.querySelector('parsererror')||doc.documentElement.localName!=='template')throw Error('UDF belge XML’i geçersiz.');
 const content=Array.from(doc.documentElement.children).find(e=>e.localName==='content');
 if(!content)throw Error('UDF metin bölümü bulunamadı.');
 const uyarilar=['Bu çıktı belgenin yalın metnidir. Tablo yerleşimi, yazı biçimleri, görseller ve sayfa düzeni aktarılmaz.'];
 if(doc.querySelector('image,picture'))uyarilar.push('Belgede görsel öğe var; görsel içindeki yazı için OCR gerekir.');
 if(imza)uyarilar.push('Arşivde imza dosyası bulundu. Dönüştürülen metin ve yeni çıktılar elektronik imzayı taşımaz.');
 return {metin:content.textContent??'',uyarilar};
}
const xmlAttr=(s:string)=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
/** Java/UYAP metin aralıkları UTF-16 kod birimleridir; JS length aynı ölçüyü kullanır. */
export function metindenUdf(text:string){
 if(!text.trim())throw Error('Önce metin girin.');
 const metin=text.replace(/\r\n?/g,'\n');
 if(metin.length>1000000)throw Error('Metin en fazla bir milyon karakter olabilir.');
 if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/.test(metin)||strFromU8(strToU8(metin))!==metin)throw Error('Metinde XML’e yazılamayan karakter var.');
 const satirlar=metin.split('\n');let offset=0;
 const p=satirlar.map((s,i)=>{const length=s.length+(i<satirlar.length-1?1:0),start=offset;offset+=length;return `<paragraph Alignment="0"><content startOffset="${start}" length="${length}" family="Arial" size="12"/></paragraph>`;}).join('');
 const xml=`<?xml version="1.0" encoding="UTF-8"?><template format_id="1.8"><content><![CDATA[${metin.replace(/\]\]>/g,']]]]><![CDATA[>')}]]></content><properties><pageFormat pageWidth="595.2756" pageHeight="841.8898" leftMargin="56.7" rightMargin="56.7" topMargin="56.7" bottomMargin="56.7" paperOrientation="1"/></properties><elements resolver="hvl-default">${p}</elements><styles><style name="default" family="${xmlAttr('Arial')}" size="12"/></styles></template>`;
 return zipSync({'content.xml':strToU8(xml)},{level:6});
}
export function udfMetinleriniBirlestir(docs:{ad:string;metin:string}[]){
 if(!docs.length)throw Error('Birleştirilecek belge seçin.');return docs.map(d=>d.metin.replace(/\s+$/,'')).join('\n\n');
}
