// Genel hukuki süre hesabı: hukuk, idari yargı, ceza ve icra süreleri.
// Kurallar: tebliğ günü sayılmaz (HMK m.92, İYUK m.8/1); hafta ve ay süreleri karşılık gelen günde biter, ayda o gün yoksa
// ayın son günü; son gün hafta sonu veya resmî tatile denk gelirse ilk iş gününe uzar (HMK m.93, İYUK m.8/2, CMK m.39/4).
// Adli tatil (20 Temmuz - 31 Ağustos): hukuk ve idari yargıda süre tatilin bitiminden itibaren bir hafta uzar (7 Eylül, HMK m.104);
// ceza yargısında 3 Eylül (CMK m.331/4, kesinleşme hesabındaki kuralla aynı); icra işlerinde uzama yoktur.
// Kaynak: hukukcularevi.com/hukuki-sure-hesaplama-araci/ özetiyle karşılaştırıldı (13.11.2026).
import {ayEkle,gunEkle,isoOku,iso,noktali,gunAdi,type Tatil,type Not} from './kesinlesme';
export type Yargi='hukuk'|'idari'|'ceza'|'icra'|'diger';
export type Birim='gun'|'hafta'|'ay';
export type TebligTuru='normal'|'e-tebligat'|'ilanen';
export interface SureTuru{id:string;ad:string;sayi:number;birim:Birim;yargi:Yargi;dayanak:string;adliTatil:boolean}
export const sureTurleri:SureTuru[]=[
 {id:'idari-dava',ad:'İdari dava açma',sayi:60,birim:'gun',yargi:'idari',dayanak:'İYUK m.7',adliTatil:true},
 {id:'vergi-dava',ad:'Vergi davası açma',sayi:30,birim:'gun',yargi:'idari',dayanak:'İYUK m.7',adliTatil:true},
 {id:'hukuk-kanun-yolu',ad:'Hukuk davasında istinaf / temyiz',sayi:2,birim:'hafta',yargi:'hukuk',dayanak:'HMK m.345, m.361',adliTatil:true},
 {id:'ceza-kanun-yolu',ad:'Ceza davasında istinaf / temyiz',sayi:2,birim:'hafta',yargi:'ceza',dayanak:'CMK m.273, m.291',adliTatil:true},
 {id:'trafik-cezasi',ad:'Trafik cezasına başvuru',sayi:15,birim:'gun',yargi:'ceza',dayanak:'Kabahatler K. m.27',adliTatil:true},
 {id:'odeme-emri-itiraz',ad:'Ödeme emrine itiraz',sayi:7,birim:'gun',yargi:'icra',dayanak:'İİK m.62',adliTatil:false},
 {id:'tuketici-cayma',ad:'Tüketici cayma hakkı',sayi:14,birim:'gun',yargi:'diger',dayanak:'6502 sayılı Kanun m.48',adliTatil:false},
];
const ADLI_BASLANGIC=[6,20],ADLI_BITIS=[7,31];
export const adliTatildeMi=(d:Date)=>{const y=d.getUTCFullYear();return d>=new Date(Date.UTC(y,ADLI_BASLANGIC[0],ADLI_BASLANGIC[1]))&&d<=new Date(Date.UTC(y,ADLI_BITIS[0],ADLI_BITIS[1]));};
export interface SureGirdisi{teblig:string;sayi:number;birim:Birim;yargi:Yargi;adliTatil:boolean;tebligTuru:TebligTuru}
export function hukukiSure(g:SureGirdisi,tatiller:Tatil[]){
 if(!Number.isInteger(g.sayi)||g.sayi<1||g.sayi>9999)throw Error('Süre 1 ile 9999 arasında tam sayı olmalıdır.');
 const notlar:Not[]=[],tatil=new Map(tatiller.map(t=>[t.tarih,t]));
 let teblig=isoOku(g.teblig);
 if(g.tebligTuru==='e-tebligat'){
  const yeni=gunEkle(teblig,5);
  notlar.push({metin:`Elektronik tebligat adresine ulaştığı günü (${noktali(teblig)}) izleyen beşinci günün sonunda yapılmış sayılır (Tebligat K. m.7/a); tebliğ tarihi ${noktali(yeni)} alınmıştır.`});teblig=yeni;
 }else if(g.tebligTuru==='ilanen'){
  const yeni=gunEkle(teblig,7);
  notlar.push({metin:`İlanen tebligat, son ilan tarihinden (${noktali(teblig)}) yedi gün sonra yapılmış sayılır (Tebligat K. m.31); tebliğ tarihi ${noktali(yeni)} alınmıştır.`});teblig=yeni;
 }
 let son=g.birim==='ay'?ayEkle(teblig,g.sayi):gunEkle(teblig,g.birim==='hafta'?7*g.sayi:g.sayi);
 const adliHedef=g.yargi==='ceza'?3:7;
 for(let tur=0;tur<60;tur++){
  const once=son.getTime();
  if(g.adliTatil&&g.yargi!=='icra'&&adliTatildeMi(son)){
   const ad=g.yargi==='ceza'?'CMK m.331/4':g.yargi==='idari'?'İYUK m.8':'HMK m.104';
   notlar.push({metin:`${noktali(son)} günü adli tatile (20 Temmuz - 31 Ağustos) denk geldiğinden, ${ad} uyarınca süre tatilin bitiminden itibaren uzar; ${adliHedef} Eylül ${son.getUTCFullYear()} alınmıştır.`});
   son=new Date(Date.UTC(son.getUTCFullYear(),8,adliHedef));
  }
  const gun=son.getUTCDay();
  if(gun===6||gun===0){notlar.push({metin:`${noktali(son)} günü ${gunAdi(son)} olduğundan süre ilk iş gününe uzar.`});son=gunEkle(son,gun===6?2:1);}
  const t=tatil.get(iso(son));
  if(t){
   if(t.yarim&&g.yargi!=='ceza')notlar.push({metin:`${noktali(son)} tarihi ${t.ad} yarım gün resmî tatildir; ceza dışındaki alanlarda süre uzatılmadı, olay için ilgili Yargıtay / Danıştay içtihadını kontrol edin.`});
   else{notlar.push({metin:`${noktali(son)} günü ${t.ad} ${t.yarim?'(yarım gün) ':''}olduğundan süre ilk iş gününe uzar.`});son=gunEkle(son,1);}
  }
  if(son.getTime()===once)break;
 }
 return {teblig,son,kesin:gunEkle(son,1),notlar};
}
