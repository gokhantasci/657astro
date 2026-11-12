import {strToU8,zipSync} from 'fflate';
import type {UdfBelgesi,UdfDugum} from './udf-belge';
/**
 * Okunmuş UDF belgelerini biçimleri (yazı tipi, tablo, görsel, sekme, üst/alt bilgi) korunarak yeniden yazar.
 * Birden çok belge verilirse gövdeler sırayla eklenir; sayfa düzeni, üst ve alt bilgi ilk belgeden alınır.
 * Her düğümün çözümlenmiş stili öznitelik olarak yazıldığından ayrıca stil tablosu gerekmez.
 * Elektronik imza, doğrulama kodu ve karekod taşınmaz; bunlar yeni belge için geçerli olmaz.
 */
const kacis=(s:string)=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const METIN_DUGUMLERI=new Set(['content','field','space']);
// Karekod ve doğrulama öğeleri eski belgeye aittir; yeni belgede imza olmadığı için taşınmaz.
const TASINMAYAN=new Set(['barcode']);
const yazilmayanOznitelik=new Set(['startOffset','length','resolver','name']);
function sonMetinDugumu(dugumler:UdfDugum[]):UdfDugum|undefined{
 for(let i=dugumler.length-1;i>=0;i--){
  const d=dugumler[i],alt=sonMetinDugumu(d.cocuklar);if(alt)return alt;
  if(METIN_DUGUMLERI.has(d.tur)&&d.metin!==undefined)return d;
 }
}
function kopya(d:UdfDugum):UdfDugum{return {...d,cocuklar:d.cocuklar.map(kopya)};}
export function udfBelgeleriniYaz(belgeler:UdfBelgesi[]):Uint8Array{
 if(!belgeler.length)throw Error('Yazılacak belge yok.');
 let metin='';
 function yaz(d:UdfDugum):string{
  if(TASINMAYAN.has(d.tur))return '';
  const oz:Record<string,string>={};
  for(const [k,v] of Object.entries({...d.ozellikler,...d.stil}))if(!yazilmayanOznitelik.has(k)&&v!==undefined)oz[k]=v;
  if(METIN_DUGUMLERI.has(d.tur)){
   const t=d.metin??'';oz.startOffset=String(metin.length);oz.length=String(t.length);metin+=t;
  }
  const a=Object.entries(oz).map(([k,v])=>` ${k}="${kacis(String(v))}"`).join('');
  const c=d.cocuklar.map(yaz).join('');
  return c?`<${d.tur}${a}>${c}</${d.tur}>`:`<${d.tur}${a}/>`;
 }
 const ilk=belgeler[0];
 const govdeler=belgeler.map(b=>{
  const g=b.govde.map(kopya),son=sonMetinDugumu(g);
  // Belgeler birbirine yapışmasın: son paragraf satır sonuyla bitmiyorsa ekle.
  if(son&&!son.metin!.endsWith('\n'))son.metin+='\n';
  return g;
 });
 const govde=govdeler.map(g=>g.map(yaz).join('')).join('');
 const bilgi=(tur:string,oz:Record<string,string>|undefined,cocuklar:UdfDugum[])=>{
  if(!cocuklar.length&&!(oz&&Object.keys(oz).length))return '';
  return yaz({tur,stil:{},ozellikler:oz??{},cocuklar});
 };
 const ust=bilgi('header',ilk.ustOzellik,ilk.ust),alt=bilgi('footer',ilk.altOzellik,ilk.alt);
 const s=ilk.sayfa,yatay=s.genislik>s.yukseklik;
 const varsayilan=Object.entries(ilk.stil).map(([k,v])=>` ${k}="${kacis(String(v))}"`).join('');
 // Üst ve alt bilgi metin aralıkları gövdeden sonra yazılır; ofsetler tek metinde birleşir.
 const xml=`<?xml version="1.0" encoding="UTF-8"?><template format_id="1.8"><content><![CDATA[${'\u0000'}]]></content><properties><pageFormat mediaSizeName="1" leftMargin="${s.sol}" rightMargin="${s.sag}" topMargin="${s.ust}" bottomMargin="${s.alt}" paperOrientation="${yatay?2:1}" headerFOffset="${s.ustYazi}" pageWidth="${s.genislik}" pageHeight="${s.yukseklik}"/></properties><elements resolver="hvl-default">${ust}${govde}${alt}</elements><styles><style name="default"${varsayilan}/></styles></template>`;
 if(/[\u0001-\u0008\u000b\u000c\u000e-\u001f￾￿]/.test(metin))throw Error('Belge metninde XML’e yazılamayan karakter var.');
 const cdata=metin.replace(/\]\]>/g,']]]]><![CDATA[>');
 return zipSync({'content.xml':strToU8(xml.replace('<![CDATA['+'\u0000'+']]>',()=>'<![CDATA['+cdata+']]>'))},{level:6});
}
