import {normalize} from './normalize';
import {tarihOku} from './gerekceli-karar';
import {gun} from './bicim';
export type SureAraci='iddianame'|'tensip'|'hedef-sure-kontrolu';
export const sureAraclari={
 iddianame:{baslik:'İddianame değerlendirilme zaman kontrolü',baslikAnahtari:'iddianame degerlendirilme zaman kontrolu',basliklar:['İddianame no','Değerlendirme no','Gönderim tarihi','Değerlendirme tarihi','Değerlendirme durumu','Bildirilen gün','Takvim günü','Hâkim'],kolonlar:[2,5,6,8,9,10,11],tarihIndeksleri:[2,3],sureIndeksi:5,birimKolonu:5},
 tensip:{baslik:'Tensip zaman kontrolü',baslikAnahtari:'tensip zaman kontrolu',basliklar:['Esas no','İddianame kabul tarihi','Tensip tarihi','Bildirilen gün','Takvim günü','Hâkim'],kolonlar:[2,5,7,10,11],tarihIndeksleri:[1,2],sureIndeksi:3,birimKolonu:6},
 'hedef-sure-kontrolu':{baslik:'Hedef süre kontrolü',baslikAnahtari:'hedef sure kontrolu',basliklar:['Esas no','Suç','Öngörülen süre','Aşan süre','Aşım sebebi'],kolonlar:[2,6,9,10,12],tarihIndeksleri:[],sureIndeksi:3,birimKolonu:5}
} as const;
export interface SureKaydi{hucreler:string[];bildirilen:number|null;takvim:number|null;}
export function teftisSureOku(aoa:unknown[][],tur:SureAraci){
 const c=sureAraclari[tur];
 if(!normalize(String(aoa[2]?.[3]??'')).includes(c.baslikAnahtari))throw Error(`D3 hücresinde “${c.baslik}” başlığı yok. Orijinal UYAP zaman kontrolü tablosunu seçin.`);
 const rows:SureKaydi[]=[],uyarilar:string[]=[];let atlanan=0;
 for(const row of aoa.slice(11)){
  const values=c.kolonlar.map(i=>String(row[i]??'').trim()),id=values[0];
  if(!/^\d{4}\s*\/\s*\d{1,6}$/.test(id)){if(values.some(Boolean))atlanan++;continue;}
  if(tur==='iddianame'&&!/^\d{4}\s*\/\s*\d{1,6}$/.test(values[1])){atlanan++;continue;}
  const dates=c.tarihIndeksleri.map(i=>tarihOku(row[c.kolonlar[i]]));
  if(c.tarihIndeksleri.length&&(!dates[0]||(tur==='tensip'&&!dates[1]))){atlanan++;continue;}
  c.tarihIndeksleri.forEach((i,j)=>values[i]=dates[j]?gun(dates[j]):'—');
  const raw=values[c.sureIndeksi],bildirilen=/^-?\d+$/.test(raw)?Number(raw):null;
  const takvim=dates.length===2&&dates.every(Boolean)?(+new Date(dates[1]+'T00:00:00Z')-+new Date(dates[0]+'T00:00:00Z'))/86400000:null;
  if(takvim===null&&dates.length)uyarilar.push(`${id}: bitiş tarihi boş veya geçersiz.`);
  else if(takvim!==null&&takvim<0)uyarilar.push(`${id}: bitiş tarihi başlangıçtan önce.`);
  else if(takvim!==null&&bildirilen!==null&&takvim!==bildirilen)uyarilar.push(`${id}: bildirilen ${bildirilen} gün, takvim farkı ${takvim} gün.`);
  if(dates.length)values.splice(c.sureIndeksi+1,0,takvim===null?'—':String(takvim));
  rows.push({hucreler:values,bildirilen,takvim});
 }
 if(!rows.length)throw Error('C12’den itibaren uygun kayıt bulunamadı.');
 return {rows,uyarilar,atlanan,birim:String(aoa[4]?.[c.birimKolonu]??'').trim(),aralik:String(aoa[5]?.[c.birimKolonu]??'').trim()};
}
