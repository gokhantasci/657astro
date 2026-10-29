export interface PostaBolgesi{baslangic:number;bitis:number;temsilcilik:string}
export function almanyaPostaBul(kod:string,bolgeler:PostaBolgesi[]){
 if(!/^\d{5}$/.test(kod.trim()))throw new Error('Almanya posta kodunu baştaki sıfırlar dahil beş rakamla girin.');
 const sayi=Number(kod),bulunan=bolgeler.filter(b=>b.baslangic<=sayi&&b.bitis>=sayi).sort((a,b)=>(a.bitis-a.baslangic)-(b.bitis-b.baslangic));
 return {kod:kod.trim(),bolgeler:bulunan,temsilcilikler:[...new Set(bulunan.map(b=>b.temsilcilik))]};
}
