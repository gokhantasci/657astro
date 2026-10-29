/** Tam ay 4/B ücret cetveli. Kaynakta bulunmayan yıl/koşul için ücret uydurulmaz. */
export interface SozlesmeliUcret {ucret:number;ekOdemeOran:number}
export interface SozlesmeliVaryant {id:string;ad:string;yillar:(SozlesmeliUcret|null)[]}
export interface SozlesmeliUnvan {id:string;ad:string;varyantlar:SozlesmeliVaryant[]}
export function sozlesmeliTarife(unvan:SozlesmeliUnvan,varyantId:string,hizmetYili:number,aylik:number,kaynakAylik:number):SozlesmeliUcret{
 if(!Number.isInteger(hizmetYili)||hizmetYili<0||hizmetYili>50)throw new Error('Hizmet yılını 0–50 arasında tam sayı olarak girin.');
 const varyant=unvan.varyantlar.find(v=>v.id===varyantId);
 if(!varyant)throw new Error('Unvanın öğrenim / kurum seçeneğini seçin.');
 const satir=varyant.yillar[Math.min(25,hizmetYili)];
 if(!satir)throw new Error('Bu unvan, öğrenim ve hizmet yılı için kaynakta ücret bulunamadı. Sözleşmedeki ücret ve oranı elle girme seçeneğini kullanın.');
 if(!(aylik>0&&kaynakAylik>0))throw new Error('Sözleşmeli ücret katsayısı bulunamadı.');
 return {ucret:Number((satir.ucret*aylik/kaynakAylik).toFixed(2)),ekOdemeOran:satir.ekOdemeOran};
}
