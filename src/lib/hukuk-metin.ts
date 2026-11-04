import type {KararGirdi,VekaletTarifesi} from './hukuk-hesap';
// Adliyeci'nin tam/kısmi kabul çıktı sözlüğü; rakamlar bizim ortak hesap motorundan gelir.
// Kaynaktaki yazım korunur: bu metinler UYAP'a yapıştırılmaktadır.
const money=(n:number)=>n.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2});
export interface MetinSonuc{harc:number;odenen:number;bakiye:number;iade:number;davaci:number;davali:number;davaciyaHarc:number;davaciyaDiger:number;davaciyaGider:number;pay:number;}
export function kaynakKabulMetni(g:KararGirdi,r:MetinSonuc,v:VekaletTarifesi){
 if(g.tur==='acilmamis'&&!g.harcMuaf&&!g.arabuluculuk&&!g.davaliGider&&r.iade>0){
  const dc=g.davaciCok?'Davacılar':'Davacı',dd=g.davaliCok?'Davalılar':'Davalı',dcden=g.davaciCok?'davacılardan':'davacıdan',ddye=g.davaliCok?'davalılara':'davalıya';
  return ['Hüküm : Yukarıda açıklanan nedenlerle;','.....',
   `-Harçlar kanunu gereğince alınması gereken ${money(r.harc)}-TL harcın mahsubu ile fazladan alınan ${money(r.iade)}-TL'nin yatıran tarafa iadesine,`,
   ...(r.davali?[`-${dd} kendisini vekil ile temsil ettirdiginden A.A.Ü.T (Madde-7) göre hesaplanan ${money(r.davali)}-TL maktu vekalet ücretinin ${dcden} alınarak ${ddye} verilmesine,`]:[]),
   `-${dc} tarafından yapılan yargılama giderlerinin kendi üzerinde bırakılmasına,`,
   '- Kullanılmayan gider avansının bulunması halinde kararın kesinleşmesinden sonra HMK’nun 333. maddesi uyarınca resen yatırana İADESİNE,'].join('\n\n');
 }
 if(!['tam-kabul','kismen-kabul'].includes(g.tur)||!g.parasal||g.harcMuaf||g.giderDavacida||g.arabuluculuk||g.davaliGider||g.kesif||r.iade)return null;
 const dc=g.davaciCok?'Davacılar':'Davacı',dd=g.davaliCok?'Davalılar':'Davalı',dcden=g.davaciCok?'davacılardan':'davacıdan',ddden=g.davaliCok?'davalılardan':'davalıdan',dcye=g.davaciCok?'davacılara':'davacıya',ddye=g.davaliCok?'davalılara':'davalıya';
 const out=['Hüküm : Yukarıda açıklanan nedenlerle;','.....'];
 out.push(r.bakiye>0?`-Harçlar kanunu gereğince ${g.tur==='tam-kabul'?'dava değeri':'kabul edilen değer'} üzerinden alınması gereken toplam ${money(r.harc)}-TL harçtan daha önceden ödenen toplam ${money(r.odenen)}-TL harç düşüldükten sonra eksik kalan ${money(r.bakiye)}-TL harcın ${ddden} alınarak hazineye irad kaydına,`:'-Harçlar kanunu gereğince alınması gereken harç peşin yatırıldığından yeniden alınmasına yer olmadığına,');
 const maktu=v.mahkemeler.find(m=>m.id===g.mahkeme)!.maktu;
 if(r.davaci){
  const kind=r.davaci<maktu?'(Madde-13)':r.davaci===maktu?'(madde-13 İkinci Kısım İkinci Bülüm)':'(madde-13 Üçüncü Kısım)';
  const label=r.davaci<maktu?'':r.davaci===maktu?'maktu ':'nisbi ';
  out.push(`-${dc} kendisini vekil ile temsil ettirdiginden A.A.Ü.T ${kind} göre hesaplanan ${money(r.davaci)}-TL ${label}vekalet ücretinin ${ddden} alınarak ${dcye} verilmesine,`);
 }
 if(r.davali){
  const cap=r.davali===g.dava-g.kabul;
  out.push(cap?`-${dd} kendisini vekil ile temsil ettirdiginden A.A.Ü.T göre vekalet ücreti red edilen miktarı geçemeyeceğinden ${money(r.davali)}-TL vekalet ücretinin ${dcden} alınarak ${ddye} verilmesine,`:`-${dd} kendisini vekil ile temsil ettirdiginden A.A.Ü.T göre hesaplanan ${money(r.davali)}-TL ${r.davali===maktu?'maktu':'nisbi'} vekalet ücretinin ${dcden} alınarak ${ddye} verilmesine,`);
 }
 const list=(items:[number,string][])=>items.filter(([n])=>n>0).map(([n,name])=>`${money(n)}-TL ${name},`).join(' ');
 const harclar=list([[g.basvuru,'Başvuru Harcı'],[g.pesin,'Peşin/nisbi Harcı'],[g.tamamlama,'Tamamlama Harcı'],[g.islah,'Islah Harcı'],[g.kesifHarci??0,'Keşif Harcı']]);
 const giderler=list([[g.bilirkisi,'Bilirkişi ücreti'],[g.posta,'Tebligat, Posta ve diğer masraflar']]);
 if(g.tur==='tam-kabul'&&r.davaciyaGider)out.push(`-${dc} tarafından yapılan; ${[harclar,giderler].filter(Boolean).join(' ')} olmak üzere toplam ${money(r.davaciyaGider)}TL'nin ${ddden} alınarak ${dcye} verilmesine, ,`);
 if(g.tur==='kismen-kabul'){
  if(r.davaciyaHarc)out.push(`-${dc} tarafından yapılan; ${harclar} olmak üzere toplam ${money(r.davaciyaHarc)}TL harcın ${ddden} alınarak ${dcye} verilmesine, ,`);
  if(r.davaciyaDiger)out.push(`-${dc} tarafından yapılan; ${giderler} olmak üzere toplam ${money(g.bilirkisi+g.posta)}-TL yargılama giderinin kabul red oranı dikkate alınarak ${money(r.davaciyaDiger)}-TL lik kısmanın ${ddden} alınarak ${dcye} verilmesine, bakiye yargılama giderinin ise ${dc} üzerinde bırakılmasına,`);
 }
 out.push((g.tur==='kismen-kabul'?'- ':'-')+'Kullanılmayan gider avansının bulunması halinde kararın kesinleşmesinden sonra HMK’nun 333. maddesi uyarınca resen yatırana İADESİNE,');
 return out.join('\n\n');
}
