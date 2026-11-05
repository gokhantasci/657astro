import {takvimTarihi} from './bicim';
import {yerelYol} from './site-yolu';
type Payload=Record<string,any>;
const asset=async(name:string)=>{const r=await fetch(yerelYol('/uygulamalar/teftis/'+name));if(!r.ok)throw Error('Belge şablonu alınamadı.');return new Uint8Array(await r.arrayBuffer());};
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const text=(el:Element)=>Array.from(el.getElementsByTagNameNS(W,'t')).map(t=>t.textContent??'').join('');
function replaceParagraphs(root:Element,map:Record<string,string>){
 for(const p of Array.from(root.getElementsByTagNameNS(W,'p'))){
  const before=text(p);let after=before;
  for(const [key,value]of Object.entries(map))after=after.split(key).join(value);
  if(before===after)continue;
  const nodes=Array.from(p.getElementsByTagNameNS(W,'t'));if(!nodes.length)continue;
  nodes[0].textContent=after;nodes[0].setAttribute('xml:space','preserve');nodes.slice(1).forEach(n=>n.textContent='');
 }
}
export async function teftisWord(tur:'byu'|'yimdenetim',data:Payload){
 if(!Array.isArray(data.rows)||!data.rows.length||data.rows.length>20000)throw Error('Belge için 1–20.000 kayıt gerekir.');
 const {unzipSync,zipSync,strFromU8,strToU8}=await import('fflate');
 const zip=unzipSync(await asset(tur+'.docx')),doc=new DOMParser().parseFromString(strFromU8(zip['word/document.xml']),'application/xml');
 if(doc.querySelector('parsererror'))throw Error('Word şablonu okunamadı.');
 const tr=Array.from(doc.getElementsByTagNameNS(W,'tr')).find(r=>text(r).includes('${sNo}'));
 if(!tr)throw Error('Word şablonunda veri satırı bulunamadı.');
 const fields=tur==='byu'?{sNo:'',ESAS_NO:'esasNo',USUL_TAR:'usulKararTarihi',SON_ISLEM_TAR:'sonIslemTarihi',GEREKCELI_TAR:'gerekceliKararTarihi',SURE:'sureGun',ACIKLAMA:'aciklama',HAKIM:'hakim'}:{sNo:'',YIL:'yil',DENETIM_YAPILDI_MI:'denetimYapildiMi',RAPOR_DUZENLENDI_MI:'raporDuzenlendiMi',RAPOR_TARIH:'raporTarih',HAKIM:'hakim',SICIL:'sicil'};
 for(const [i,row]of data.rows.entries()){
  const clone=tr.cloneNode(true) as Element,map:Record<string,string>={};
  for(const [name,key]of Object.entries(fields)){
   const value=name==='sNo'?String(i+1):String(row[key]??'');
   for(const variant of [name,name.replaceAll('_',' ')])map['${'+variant+'}']=value;
   if(name==='GEREKCELI_TAR')map['{GEREKCELI_TAR}']=value;
  }
  replaceParagraphs(clone,map);tr.parentNode!.insertBefore(clone,tr);
 }
 tr.remove();
 const today=takvimTarihi(new Date()),birim=String(data.birimAdi??'').toLocaleUpperCase('tr-TR');
 replaceParagraphs(doc.documentElement,{'${BIRIM_ADI}':birim,'{{TARIH}}':today});
 for(const control of Array.from(doc.getElementsByTagNameNS(W,'sdt'))){
  const tag=control.getElementsByTagNameNS(W,'tag')[0]?.getAttributeNS(W,'val');
  const value=tag==='BIRIM_ADI'?birim:tag==='TARIH_ZAMAN'?`${birim} ${today}`:undefined;
  if(value===undefined)continue;const ts=Array.from(control.getElementsByTagNameNS(W,'t'));if(ts[0])ts[0].textContent=value;ts.slice(1).forEach(t=>t.textContent='');
 }
 zip['word/document.xml']=strToU8(new XMLSerializer().serializeToString(doc));
 return zipSync(zip);
}
export async function teftisCetvel(data:Payload){
 const X=await import('xlsx'),wb=X.read(await asset('cetvel.xls'),{type:'array',cellStyles:true}),ws=wb.Sheets[wb.SheetNames[0]],s2=data.step2??{},s3=data.step3??{},s4=data.step4??{};
 const panel=data.unvanType==='baskan'||data.courtType==='panel',role=panel?'Başkan':'Hâkim';
 const cells:Record<string,unknown>={B16:`${role} - ${s2.leadSicil??''}`,B17:s2.leadName,E16:`Yazı İşleri Müdürü - ${s2.clerkChiefSicil??''}`,C17:s2.clerkChiefName,E17:s2.clerkChiefName,I16:`Zabıt Kâtibi - ${s2.scribeSicil??''}`,I17:s2.scribeName,B10:s3.judgeRegistry,C10:s3.judgeName,D10:`${s3.dutyPlace??''} - ${role}`,B6:s3.dutyPlace,E10:s3.courtName,F10:s3.periodText,G10:s4.devreden,H10:s4.gelenSum,I10:s4.toplamBakilan,J10:s4.cikanSum,B14:String(data.izahat??'').replace(/<\/?(?:bold|red)>/g,'')};
 if(Number(s4.toplamBakilan)>0)cells.K10='%'+(Number(s4.cikanSum)/Number(s4.toplamBakilan)*100).toFixed(2)+' (Siliniz)';
 for(const [addr,value]of Object.entries(cells)){const old=ws[addr]??{};ws[addr]={...old,t:typeof value==='number'?'n':'s',v:value??''};delete ws[addr].w;delete ws[addr].f;}
 return X.write(wb,{type:'array',bookType:'biff8'}) as ArrayBuffer;
}
