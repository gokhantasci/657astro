import {genelgeSorusu} from './genelge-soru-basliklari';
export interface BelgeSayfasi{no:number;metin:string;yontem?:string;guven?:number}
export interface BelgeSorusu{soru:string;cevap:string;sayfa:number}
const duz=(s:string)=>s.replace(/\s+/g,' ').trim();
// Bülten tek bir personel olayı değildir. Her görüşün özeti ve kendisine ait
// sonuç paragrafı birlikte değerlendirilir; başka görüşten cevap taşınmaz.
export function bultenSorulari(sayfalar:BelgeSayfasi[]):BelgeSorusu[]{
 const gorusler:{baslik:string;sayfalar:BelgeSayfasi[]}[]=[];
 for(const p of sayfalar){
  if(p.no<25)continue;
  for(const parca of p.metin.split(/(?=^Özet\s*:)/m)){
   if(/^Özet\s*:/.test(parca))gorusler.push({baslik:duz(parca.split(/\n\s*\n/)[0]).replace(/^Özet\s*:\s*/,''),sayfalar:[]});
   if(gorusler.length)gorusler.at(-1)!.sayfalar.push({...p,metin:parca});
  }
 }
 return gorusler.flatMap(g=>{
  const q=belgeSorulari(g.baslik,g.sayfalar,'dpb')[0];if(!q)return [];
  const olay=g.baslik.replace(/\s*\([^)]*\)\s*$/,'').replace(/\s*hk\.?$/i,'').split(/,|;|\bancak\b/)[0].trim();
  if(olay.length>=25&&olay.length<=160&&!q.soru.endsWith('mümkün mü?'))q.soru=`${olay} konusunda DPB'nin görüşü nedir?`;
  return [q];
 }).filter((q,i,all)=>all.findIndex(x=>x.cevap===q.cevap)===i);
}
// Cevaplar yorum üretmez: belge içindeki cümle/paragraflar aynen alıntılanır.
export function belgeSorulari(baslik:string,sayfalar:BelgeSayfasi[],tur:'dpb'|'genelge'):BelgeSorusu[]{
 const konular=['aday memur','KPSS','yıllık izin','aylıksız izin','doğum izni','hastalık izni','sözleşmeli personel','ek gösterge','vekalet ücreti','vekâlet ücreti','disiplin','görevde yükselme','askerlik','emeklilik','muvafakat','naklen atama','kazanılmış hak aylığı','sosyal denge','pasaport','mesai','adli yardım','tebligat','bilirkişi','istinabe','adli görüşme','arabuluculuk','uzlaştırma'];
 const temiz=duz(baslik).replace(/\s*\([^)]*\)\s*$/,'').replace(/\s*(?:hk\.?|hakkında|ilişkin)\.?$/i,'').replace(/^\d+[\d/\-]*\s*No['’]?lu\s*(?:Ek\s*)?Genelge\s*/i,'');
 const konu=temiz.length<=95?temiz:konular.find(k=>baslik.toLocaleLowerCase('tr').includes(k))??(tur==='genelge'?'Bu genelge':'Bu personel olayı');
 const paragraphs=sayfalar.flatMap(p=>p.metin.split(/\n\s*\n/).map(duz).filter(s=>s.length>=70).map(text=>({text,sayfa:p.no})));
 if(!paragraphs.length){
  const no=baslik.match(/^([\d/\-]+)/)?.[1];
  return [{soru:no?`${no} numaralı genelgenin konusu nedir?`:`${temiz} hangi belgenin konusudur?`,cevap:baslik,sayfa:1}];
 }
 const alinti=(row:typeof paragraphs[number],son=false)=>{
  const sentences=row.text.split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ])/);
  const eligible=sentences.filter(s=>s.length>=60&&s.length<=650);
  const ozet=paragraphs.find(p=>/^ÖZET\s*:/i.test(p.text)&&p.text.length<=650);
  return eligible.length?(son?eligible.at(-1)!:eligible[0]):row.text.length>650&&ozet?ozet.text:row.text;
 };
 let question=tur==='genelge'?`${konu} konusunda genelge ne düzenliyor?`:`${konu} hakkında DPB'nin görüşü nedir?`;
 if(tur==='dpb'&&temiz.length<=160){
  question=temiz.replace(/(?:nın|nin|nun|nün) mümkün (?:olduğu|olmadığı|olup olmadığı).*$/i,' mümkün mü?').replace(/mümkün (?:olduğu|olmadığı|olup olmadığı).*$/i,'mümkün mü?').replace(/bulunup bulunmadığı.*$/i,'var mı?');
  if(!question.endsWith('?'))question=`${konu} hakkında DPB'nin görüşü nedir?`;
 }
 if(tur==='dpb'&&/Aday memurun KPSS süreci sonunda/.test(baslik))question='Aday memur KPSS sonucuyla başka kuruma atanabilir mi?';
 if(tur==='genelge')question=genelgeSorusu(baslik)??question;
 let sonuc=[...paragraphs].reverse().find(p=>/mütalaa|değerlendiril|görüş|mümkün|gerekti|uygun|rica ederim|arz ederim/i.test(p.text))??paragraphs[0];
 if(tur==='genelge'){
  const stop=new Set(['hangi','nasıl','neden','nedir','ilişk','genel','işlem','uygul','yürüt','konus','hakkı','için','sayıl','belir']);
  const terms=new Set(question.toLocaleLowerCase('tr').split(/[^a-zçğıöşü]+/).filter(w=>w.length>3).map(w=>w.slice(0,5)).filter(w=>!stop.has(w)));
  const puan=(s:string)=>{const words=new Set(s.toLocaleLowerCase('tr').split(/[^a-zçğıöşü]+/).map(w=>w.slice(0,5)));return [...terms].filter(t=>words.has(t)).length*3+(terms.size&&/yapılması|edilmesi|bildirilmesi|gönderilmesi|alınması|düzenlenmesi/.test(s)?2:0);};
  const aday=[...paragraphs].sort((a,b)=>puan(b.text)-puan(a.text));if(aday[0]&&puan(aday[0].text)>2)sonuc=aday[0];
 }
 const out:BelgeSorusu[]=[{soru:question,cevap:alinti(sonuc,true),sayfa:sonuc.sayfa}];
 const law=paragraphs.find(p=>/\d{3,4}\s*sayılı/.test(p.text)&&p.text!==sonuc.text);
 if(law)out.push({soru:`${konu} için metinde hangi mevzuat dayanağı gösteriliyor?`,cevap:alinti(law),sayfa:law.sayfa});
 const sure=paragraphs.find(p=>/\b\d+\s*(?:iş\s*)?(?:gün|ay|yıl)\b/i.test(p.text)&&p!==law&&p!==sonuc);
 if(sure)out.push({soru:`${konu} için belgede hangi süre belirtiliyor?`,cevap:alinti(sure),sayfa:sure.sayfa});
 return out.map(r=>({...r,sayfa:sayfalar.find(p=>duz(p.metin).includes(r.cevap))?.no??r.sayfa})).filter((r,i)=>out.findIndex(x=>x.cevap===r.cevap)===i);
}
