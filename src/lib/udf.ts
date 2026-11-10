import {unzipSync,strFromU8,strToU8,zipSync} from 'fflate';
import {udfYapisiniOku,type UdfBelgesi} from './udf-belge';
export interface UdfMetni {metin:string;uyarilar:string[];belge?:UdfBelgesi;}
const MAX_XML=8*1024*1024;
export function udfMetniniOku(data:Uint8Array):UdfMetni{
 if(data.length>25*1024*1024)throw Error('UDF dosyası en fazla 25 MB olabilir.');
 let toplam=0,imza=false;
 const files=unzipSync(data,{filter:f=>{
  toplam+=f.originalSize;if(toplam>64*1024*1024)throw Error('Arşivin açılmış boyutu sınırı aşıyor.');
  if(/sign|imza/i.test(f.name))imza=true;
  if(f.name==='content.xml'&&f.originalSize>MAX_XML)throw Error('UDF metin bölümü en fazla 8 MB olabilir.');
  if(f.name==='documentproperties.xml'&&f.originalSize>256*1024)throw Error('UDF belge özellikleri boyut sınırını aşıyor.');
  return f.name==='content.xml'||f.name==='documentproperties.xml';
 }});
 if(!files['content.xml'])throw Error('Arşivde content.xml bulunamadı. Dosya bir UDF belgesi olmayabilir.');
 const xml=strFromU8(files['content.xml']);
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Dış varlık veya DTD içeren XML işlenmez.');
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 if(doc.querySelector('parsererror')||doc.documentElement.localName!=='template')throw Error('UDF belge XML’i geçersiz.');
 const content=Array.from(doc.documentElement.children).find(e=>e.localName==='content');
 if(!content)throw Error('UDF metin bölümü bulunamadı.');
 const uyarilar=['Metin çıktıları belgenin yalın metnidir; özgün biçimlendirme belge görünümünde gösterilir.'];
 if(doc.querySelector('image,picture'))uyarilar.push('Görsellerin içindeki yazı metin aramasına dahil değildir.');
 if(imza)uyarilar.push('Arşivde imza dosyası bulundu. Dönüştürülen metin ve yeni çıktılar elektronik imzayı taşımaz.');
 const metin=content.textContent??'',belge=udfYapisiniOku(doc,metin,uyarilar);
 if(belge){
  const webId=(doc.querySelector('webID')?.getAttribute('id')??'').replace(/\s+/g,' ').trim().slice(0,128);
  let kod='',sicil='';
  const data=files['documentproperties.xml'];
  if(data){const propsXml=strFromU8(data).replace(/<!DOCTYPE\s+properties\s+SYSTEM\s+["']http:\/\/java\.sun\.com\/dtd\/properties\.dtd["']\s*>/i,'');if(!/<!DOCTYPE|<!ENTITY/i.test(propsXml)){
   const props=new DOMParser().parseFromString(propsXml,'application/xml');
   if(!props.querySelector('parsererror'))for(const entry of props.querySelectorAll('entry')){
    const key=entry.getAttribute('key'),value=(entry.textContent??'').trim();
    if(key==='uyapdogrulamakodu'&&/^[A-Za-z0-9_-]{1,64}$/.test(value))kod=value;
    if(key==='uyapsicil'&&/^\d{3,10}$/.test(value))sicil=value;
   }
  }}
  if(webId||kod||sicil||imza)belge.dogrulama={webId,...(kod?{kod}:{}),...(sicil?{sicil}:{}),imzaDosyasi:imza};
  if(webId||kod)uyarilar.push('Belgedeki doğrulama bilgileri dosyadan gösterilir; bu ekranda resmî doğrulama yapılmaz.');
 }
 return {metin,uyarilar,belge};
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
