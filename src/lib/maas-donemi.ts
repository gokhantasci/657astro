/** Formlarda yalnızca katsayı döneminin kapsadığı ödeme ayları sunulur. */
export function donemAylari(d:{baslangic:string;bitis:string}){
 const yil=Number(d.baslangic.slice(0,4)),sonYil=Number(d.bitis.slice(0,4));
 if(yil!==sonYil)throw new Error('Maaş katsayı dönemi aynı takvim yılı içinde olmalıdır.');
 const ilk=Number(d.baslangic.slice(5,7)),son=Number(d.bitis.slice(5,7));
 return Array.from({length:son-ilk+1},(_,i)=>({value:ilk+i,label:new Intl.DateTimeFormat('tr-TR',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(yil,ilk+i-1,1)))}));
}
