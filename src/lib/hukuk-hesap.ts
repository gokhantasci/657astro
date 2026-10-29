import {tl} from './bicim';
export interface HarcTarifesi {maktu:number;basvuruAsliye:number;basvuruSulh:number;istinafBasvuru:number;temyizBasvuru:number;temyizMaktu:number;nisbiBinde:number;nafakaBinde:number;pesinPayda:number;cismaniPesinPayda:number}
export interface VekaletTarifesi {maneviSinirKalkis:string;basamaklar:{miktar:number|null;oran:number}[];mahkemeler:{id:string;ad:string;maktu:number}[]}
export const kurus=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
function pozitif(...v:number[]){if(v.some(n=>!Number.isFinite(n)||n<0||n>1e12))throw new Error('Tutarları 0 ile 1 trilyon arasında girin.');}
export function nisbiVekalet(tutar:number,t:VekaletTarifesi){
 pozitif(tutar);let kalan=tutar,toplam=0;
 const dilimler:{matrah:number;oran:number;tutar:number}[]=[];
 for(const b of t.basamaklar){const matrah=Math.min(kalan,b.miktar??Infinity);if(matrah<=0)break;const ucret=matrah*b.oran/100;toplam+=ucret;dilimler.push({matrah,oran:b.oran,tutar:kurus(ucret)});kalan-=matrah;}
 if(kalan>0)throw new Error('Vekâlet tarifesinin son basamağı eksik.');
 return {tutar:kurus(toplam),dilimler};
}
export function vekalet(tutar:number,mahkeme:string,t:VekaletTarifesi,parasal=true){
 const m=t.mahkemeler.find(m=>m.id===mahkeme);if(!m)throw new Error('Mahkeme tarifesi bulunamadı.');
 if(!parasal)return m.maktu;
 if(tutar===0)return 0;
 if(['icra-is','icra-durusmali'].includes(mahkeme))return kurus(Math.min(tutar,m.maktu,nisbiVekalet(tutar,t).tutar));
 return kurus(Math.min(tutar,Math.max(m.maktu,nisbiVekalet(tutar,t).tutar)));
}
export type KararTuru='tam-kabul'|'kismen-kabul'|'red'|'husumet'|'acilmamis'|'feragat'|'sulh'|'davayi-kabul'|'nafaka-tam'|'nafaka-kismen'|'maddi-tazminat'|'manevi-tazminat';
export interface KararGirdi {
 tur:KararTuru;tarih:string;mahkeme:string;parasal:boolean;dava:number;kabul:number;
 davaciVekil:boolean;davaliVekil:boolean;onIncelemeOnce:boolean;ilkCelse:boolean;
 pesin:number;tamamlama:number;islah:number;basvuru:number;kesifHarci?:number;kesif:number;bilirkisi:number;posta:number;davaliGider:number;arabuluculuk:number;
 harcMuaf:boolean;giderDavacida:boolean;sulhDavaliPay:number;
 davaciCok?:boolean;davaliCok?:boolean;
}
export function kararHesap(g:KararGirdi,h:HarcTarifesi,v:VekaletTarifesi){
 pozitif(g.dava,g.kabul,g.pesin,g.tamamlama,g.islah,g.basvuru,g.kesifHarci??0,g.kesif,g.bilirkisi,g.posta,g.davaliGider,g.arabuluculuk,g.sulhDavaliPay);
 if(g.sulhDavaliPay>100)throw new Error('Davalı payı %100’ü geçemez.');
 const nafaka=g.tur.startsWith('nafaka');
 const parasal=nafaka||g.parasal;
 const dava=kurus(g.dava*(nafaka?12:1));
 const ret=['red','husumet','acilmamis','feragat'].includes(g.tur);
 const tam=['tam-kabul','nafaka-tam','davayi-kabul'].includes(g.tur);
 const kabul=ret?0:tam?dava:kurus(g.kabul*(nafaka?12:1));
 if(kabul>dava)throw new Error('Kabul edilen tutar dava değerini geçemez.');
 const red=kurus(dava-kabul),maktu=vekalet(0,g.mahkeme,v,false);
 let davaci=0,davali=0;
 if(g.tur==='husumet'){
  // AAÜT 7/2: parasal işte nispi hesap maktu üst sınırıyla; ön inceleme yarısı uygulanmaz.
  davali=parasal?Math.min(dava,maktu,nisbiVekalet(dava,v).tutar):maktu;
 }else if(g.tur==='acilmamis'){
  // AAÜT 7/1, mahkeme maktu tavanı ve ön inceleme aşaması.
  davali=Math.min(maktu,vekalet(dava,g.mahkeme,v,parasal))*(g.onIncelemeOnce?.5:1);
 }else if(['feragat','davayi-kabul','sulh'].includes(g.tur)){
  const ucret=vekalet(dava,g.mahkeme,v,parasal)*(g.onIncelemeOnce?.5:1);
  if(g.tur==='feragat')davali=ucret;else if(g.tur==='davayi-kabul')davaci=ucret;
  else{davaci=ucret*g.sulhDavaliPay/100;davali=ucret-davaci;}
 }else{
  davaci=vekalet(kabul,g.mahkeme,v,parasal);
  davali=vekalet(red,g.mahkeme,v,parasal);
  if(!parasal){davaci=ret?0:maktu;davali=ret?maktu:0;}
  if(nafaka)davali=0; // AAÜT 9/2: reddedilen nafaka için ücret yok.
  if(['maddi-tazminat','manevi-tazminat'].includes(g.tur)){
   if(kabul===0)davali=maktu; // AAÜT 10/3 ve 13/4.
   else if(g.tur==='maddi-tazminat'||g.tarih<v.maneviSinirKalkis)davali=Math.min(davali,davaci);
  }
 }
 davaci=g.davaciVekil?kurus(davaci):0;davali=g.davaliVekil?kurus(davali):0;
 const feragat=['feragat','sulh','davayi-kabul'].includes(g.tur);
 const oran=nafaka?h.nafakaBinde:h.nisbiBinde;
 const harcMatrahi=feragat?dava:kabul;
 let harc=parasal&&!ret?Math.max(h.maktu,harcMatrahi*oran/1000):h.maktu;
 if(feragat)harc=(parasal?Math.max(h.maktu,dava*oran/1000):h.maktu)*(g.ilkCelse?1/3:2/3);
 harc=g.harcMuaf?0:kurus(harc);
 const odenen=kurus(g.pesin+g.tamamlama+g.islah),bakiye=kurus(Math.max(0,harc-odenen)),iade=kurus(Math.max(0,odenen-harc));
 let pay=ret?0:tam?1:parasal&&dava>0?kabul/dava:1;
 if(g.tur==='sulh')pay=g.sulhDavaliPay/100;
 if(g.giderDavacida)pay=0;
 // Kısmi kabulde kabul tutarı için gerekli harçlar oranlanmaz; iade edilen kısım
 // çıkarıldıktan sonra davacıya tam verilir. Diğer giderler kabul/ret oranındadır.
 const harcGider=kurus(g.basvuru+g.pesin+g.tamamlama+g.islah+(g.kesifHarci??0)-iade);
 const harcPay=g.giderDavacida?0:g.tur==='sulh'?pay:pay>0?1:0;
 const davaciyaHarc=kurus(harcGider*harcPay),davaciyaDiger=kurus((g.kesif+g.bilirkisi+g.posta)*pay);
 const davaciyaGider=kurus(davaciyaHarc+davaciyaDiger),davaliyaGider=kurus(g.davaliGider*(1-pay));
 const arabulucuDavali=kurus(g.arabuluculuk*pay),arabulucuDavaci=kurus(g.arabuluculuk-arabulucuDavali);
 const satirlar=[['Karar ve ilam harcı',harc],['Mahsup edilecek harç',odenen],['Bakiye harç',bakiye],['İade edilecek harç',iade],['Davacı lehine vekâlet ücreti',davaci],['Davalı lehine vekâlet ücreti',davali],['Davacıya ödenecek yargılama gideri',davaciyaGider],['Davalıya ödenecek yargılama gideri',davaliyaGider],['Davalıya düşen arabuluculuk gideri',arabulucuDavali],['Davacıya düşen arabuluculuk gideri',arabulucuDavaci]].map(([ad,tutar])=>({ad:ad as string,tutar:tutar as number}));
 const metin=['HESAP DÖKÜMÜ',...satirlar.filter(s=>s.tutar>0).map(s=>`${s.ad}: ${tl(s.tutar)}`),`Yargılama giderinin davalıya yüklenen payı: %${(pay*100).toLocaleString('tr-TR',{maximumFractionDigits:4})}.`].join('\n');
 const dc=g.davaciCok?'Davacılar':'Davacı',dd=g.davaliCok?'Davalılar':'Davalı',dcden=g.davaciCok?'davacılardan':'davacıdan',ddden=g.davaliCok?'davalılardan':'davalıdan',dcye=g.davaciCok?'davacılara':'davacıya',ddye=g.davaliCok?'davalılara':'davalıya';
 const taslak=['HÜKÜM TASLAĞI — HARÇ, VEKÂLET VE GİDERLER'];
 if(g.harcMuaf)taslak.push('Seçilen muafiyet kapsamında karar ve ilam harcı alınmasına yer olmadığına,');
 else if(bakiye>0){
  const davalidan=g.tur==='sulh'?kurus(bakiye*pay):(parasal?kabul>0:!ret)?bakiye:0;
  taslak.push(`Alınması gereken ${tl(harc)} karar ve ilam harcından ödenen ${tl(odenen)} harcın mahsubuna,`);
  if(davalidan>0)taslak.push(`Bakiye harcın ${tl(davalidan)} kısmının ${ddden} alınarak Hazineye gelir kaydına,`);
  if(bakiye-davalidan>0)taslak.push(`Bakiye harcın ${tl(kurus(bakiye-davalidan))} kısmının ${dcden} alınarak Hazineye gelir kaydına,`);
 }else taslak.push(`Alınması gereken ${tl(harc)} karar ve ilam harcı ödendiğinden yeniden harç alınmasına yer olmadığına,`);
 if(iade>0)taslak.push(`Fazla ödenen ${tl(iade)} harcın yatıran tarafa iadesine,`);
 if(davaci>0)taslak.push(`${dc} kendisini vekille temsil ettirdiğinden hesaplanan ${tl(davaci)} vekâlet ücretinin ${ddden} alınarak ${dcye} verilmesine,`);
 if(davali>0)taslak.push(`${dd} kendisini vekille temsil ettirdiğinden hesaplanan ${tl(davali)} vekâlet ücretinin ${dcden} alınarak ${ddye} verilmesine,`);
 if(davaciyaGider>0)taslak.push(`${tl(davaciyaHarc)} harç gideri ve ${tl(davaciyaDiger)} diğer gider olmak üzere toplam ${tl(davaciyaGider)} yargılama giderinin ${ddden} alınarak ${dcye} verilmesine,`);
 if(davaliyaGider>0)taslak.push(`${tl(davaliyaGider)} yargılama giderinin ${dcden} alınarak ${ddye} verilmesine,`);
 if(pay<1)taslak.push(`${dc} tarafından yapılan yargılama giderlerinin karşı tarafa yüklenmeyen kısmının kendi üzerinde bırakılmasına,`);
 if(arabulucuDavali>0)taslak.push(`Hazinece ödenen arabuluculuk giderinin ${tl(arabulucuDavali)} kısmının ${ddden} alınarak Hazineye gelir kaydına,`);
 if(arabulucuDavaci>0)taslak.push(`Hazinece ödenen arabuluculuk giderinin ${tl(arabulucuDavaci)} kısmının ${dcden} alınarak Hazineye gelir kaydına,`);
 taslak.push('Kullanılmayan gider avansının karar kesinleştiğinde yatıran tarafa iadesine.');
 return {harc,bakiye,iade,davaci,davali,davaciyaHarc,davaciyaDiger,davaciyaGider,davaliyaGider,arabulucuDavali,arabulucuDavaci,kabul,red,pay,satirlar,metin,taslak:taslak.join('\n\n')};
}
export function islahHarci(eski:number,yeni:number,h:HarcTarifesi,cismani=false){pozitif(eski,yeni);if(yeni<eski)throw new Error('Yeni dava değeri önceki değerden az olamaz.');const artis=kurus(yeni-eski);return {artis,harc:kurus(artis*h.nisbiBinde/1000/(cismani?h.cismaniPesinPayda:h.pesinPayda))};}
export function istinafHarci(deger:number,h:HarcTarifesi,nisbi=true,nafaka=false,temyiz=false,cismani=false){pozitif(deger);if(nafaka&&cismani)throw new Error('Nafaka ve cismani zarar seçenekleri birlikte kullanılamaz.');const alt=temyiz?h.temyizMaktu:h.maktu,basvuru=temyiz?h.temyizBasvuru:h.istinafBasvuru;const karar=nisbi?Math.max(alt,deger*(nafaka?12:1)*(nafaka?h.nafakaBinde:h.nisbiBinde)/1000/(cismani?h.cismaniPesinPayda:h.pesinPayda)):alt;return {karar:kurus(karar),basvuru,toplam:kurus(karar+basvuru)};}
export function kasaHesabi(gelir:number[],gider:number[]){pozitif(...gelir,...gider);const bankaKasa=kurus(gelir.reduce((a,b)=>a+b,0)),yukumluluk=kurus(gider.reduce((a,b)=>a+b,0));return {bankaKasa,yukumluluk,fark:kurus(bankaKasa-yukumluluk)};}
export function paylastir(toplam:number,kisiler:{ad:string;pay:number}[],yuzde=true){
 pozitif(toplam,...kisiler.map(k=>k.pay));if(!kisiler.length)throw new Error('En az bir kişi girin.');
 const sum=kisiler.reduce((a,k)=>a+k.pay,0),toplamKurus=Math.round(toplam*100);
 if(yuzde&&Math.abs(sum-100)>.000001)throw new Error('Yüzdelerin toplamı %100 olmalı.');
 if(!yuzde&&(kisiler.some(k=>Math.abs(k.pay-kurus(k.pay))>.000001)||Math.round(sum*100)!==toplamKurus))throw new Error('Kişi tutarları en fazla iki ondalıklı olmalı ve toplam tutara eşit olmalı.');
 if(!yuzde)return kisiler.map(k=>({ad:k.ad,tutar:kurus(k.pay)}));
 // En büyük kalan yöntemi: toplam kuruş korunur, hiçbir kişiye negatif pay verilmez.
 const paylar=kisiler.map(k=>toplamKurus*k.pay/sum),kuruslar=paylar.map(Math.floor);
 const sira=paylar.map((p,i)=>({i,kalan:p-kuruslar[i]})).sort((a,b)=>b.kalan-a.kalan||a.i-b.i);
 const kalan=toplamKurus-kuruslar.reduce((a,b)=>a+b,0);for(let i=0;i<kalan;i++)kuruslar[sira[i].i]++;
 return kisiler.map((k,i)=>({ad:k.ad,tutar:kuruslar[i]/100}));
}
