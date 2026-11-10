import {idariIlBilgisi} from './idari-yargi';

// Mevcut çağıranların arayüzü korunur; varlık/faaliyet ve çevre bilgisi HSK rehberinden gelir.
export interface IdareBilgisi {
 il:string;
 var:boolean;
 faal:boolean;
 durumMetni:string;
 mahkeme:string;
 bolge:string;
 cogul:boolean;
 cevreKarari?:NonNullable<ReturnType<typeof idariIlBilgisi>>['cevreKarari'];
}
export function idareBilgisi(il:string):IdareBilgisi|undefined {
 const k=idariIlBilgisi(il);
 if(!k)return undefined;
 return {il:k.il,var:k.durum!=='yok',faal:k.durum==='faal',durumMetni:k.durumMetni,mahkeme:k.idareMahkemesi,bolge:k.bim,cogul:false,cevreKarari:k.cevreKarari};
}
