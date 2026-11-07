export interface BelgeSayfasi{no:number;metin:string;yontem?:string;guven?:number}
export interface BelgeSorusu{soru:string;cevap:string;sayfa:number}
const duz=(s:string)=>s.replace(/\s+/g,' ').trim();
// Cevaplar yorum üretmez: belge içindeki cümle/paragraflar aynen alıntılanır.
export function belgeSorulari(baslik:string,sayfalar:BelgeSayfasi[],tur:'dpb'|'genelge'):BelgeSorusu[]{
 const konular=['aday memur','KPSS','yıllık izin','aylıksız izin','doğum izni','hastalık izni','sözleşmeli personel','ek gösterge','vekalet ücreti','vekâlet ücreti','disiplin','görevde yükselme','askerlik','emeklilik','muvafakat','naklen atama','kazanılmış hak aylığı','sosyal denge','pasaport','mesai','adli yardım','tebligat','bilirkişi','istinabe','adli görüşme','arabuluculuk','uzlaştırma'];
 const temiz=duz(baslik).replace(/\s*\([^)]*\)\s*$/,'').replace(/\s*(?:hk\.?|hakkında|ilişkin)\.?$/i,'').replace(/^\d+[\d/\-]*\s*No['’]?lu\s*(?:Ek\s*)?Genelge\s*/i,'');
 const konu=temiz.length<=95?temiz:konular.find(k=>baslik.toLocaleLowerCase('tr').includes(k))??'Bu personel olayı';
 const paragraphs=sayfalar.flatMap(p=>p.metin.split(/\n\s*\n/).map(duz).filter(s=>s.length>=70).map(text=>({text,sayfa:p.no})));
 if(!paragraphs.length){
  const no=baslik.match(/^([\d/\-]+)/)?.[1];
  return [{soru:no?`${no} numaralı genelgenin konusu nedir?`:`${temiz} hangi belgenin konusudur?`,cevap:baslik,sayfa:1}];
 }
 const alinti=(row:typeof paragraphs[number],son=false)=>{
  const sentences=row.text.split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ])/);
  const eligible=sentences.filter(s=>s.length>=60&&s.length<=650);
  return eligible.length?(son?eligible.at(-1)!:eligible[0]):row.text;
 };
 let question=tur==='genelge'?`${konu} konusunda genelge ne düzenliyor?`:`${konu} hakkında DPB'nin görüşü nedir?`;
 if(tur==='dpb'&&temiz.length<=160){
  question=temiz.replace(/(?:nın|nin|nun|nün) mümkün (?:olduğu|olmadığı|olup olmadığı).*$/i,' mümkün mü?').replace(/mümkün (?:olduğu|olmadığı|olup olmadığı).*$/i,'mümkün mü?').replace(/bulunup bulunmadığı.*$/i,'var mı?');
  if(!question.endsWith('?'))question=`${konu} hakkında DPB'nin görüşü nedir?`;
 }
 if(tur==='dpb'&&/Aday memurun KPSS süreci sonunda/.test(baslik))question='Aday memur KPSS sonucuyla başka kuruma atanabilir mi?';
 const sonuc=[...paragraphs].reverse().find(p=>/mütalaa|değerlendiril|görüş|mümkün|gerekti|uygun|rica ederim|arz ederim/i.test(p.text))??paragraphs[0];
 const out:BelgeSorusu[]=[{soru:question,cevap:alinti(sonuc,true),sayfa:sonuc.sayfa}];
 const law=paragraphs.find(p=>/\d{3,4}\s*sayılı/.test(p.text)&&p.text!==sonuc.text);
 if(law)out.push({soru:`${konu} için metinde hangi mevzuat dayanağı gösteriliyor?`,cevap:alinti(law),sayfa:law.sayfa});
 const sure=paragraphs.find(p=>/\b\d+\s*(?:iş\s*)?(?:gün|ay|yıl)\b/i.test(p.text)&&p!==law&&p!==sonuc);
 if(sure)out.push({soru:`${konu} için belgede hangi süre belirtiliyor?`,cevap:alinti(sure),sayfa:sure.sayfa});
 return out.filter((r,i)=>out.findIndex(x=>x.cevap===r.cevap)===i);
}
