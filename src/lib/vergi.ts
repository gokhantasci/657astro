// Ücret gelirleri tarifesi: GVK 103. Kümülatif matrahın dilim geçişi tek ayın içinde bölünür.
export interface VergiTarifesi { yil:number; dilimler:{sinir:number|null;oran:number}[]; asgariBrut:number; isciPrimOrani:number; damgaOrani:number; engellilikIndirimleri:number[]; kaynak:string[]; }
export const yuvarla=(n:number)=>Math.round((n+1e-8)*100)/100;
export function birikimliVergi(matrah:number,t:VergiTarifesi){
 let onceki=0,toplam=0;
 for(const d of t.dilimler){const ust=d.sinir??Infinity;toplam+=Math.max(0,Math.min(matrah,ust)-onceki)*d.oran/100;if(matrah<=ust)break;onceki=ust;}
 return toplam;
}
export function aylikVergi(matrah:number,onceki:number,t:VergiTarifesi){return yuvarla(birikimliVergi(onceki+Math.max(0,matrah),t)-birikimliVergi(onceki,t));}
export function vergiIstisnasi(ay:number,t:VergiTarifesi){
 const asgariMatrah=t.asgariBrut*(1-t.isciPrimOrani/100);
 return {gelir:aylikVergi(asgariMatrah,asgariMatrah*(ay-1),t),damga:yuvarla(t.asgariBrut*t.damgaOrani/1000)};
}
