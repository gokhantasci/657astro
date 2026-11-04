import {sayiOku} from './bicim';
import {normalize} from './normalize';
export interface GiderKaydi{dosya:string;tahsilat:number;gider:number;iade:number;bildirilen:number;}
const kr=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
export function giderKontrol(g:GiderKaydi){
 if(!/^\d{4}\s*\/\s*\d+$/.test(g.dosya))throw Error('Dosya numarasını 2026/123 biçiminde girin.');
 if([g.tahsilat,g.gider,g.iade].some(n=>!Number.isFinite(n)||n<0||n>1e12)||!Number.isFinite(g.bildirilen)||Math.abs(g.bildirilen)>1e12)throw Error('Tahsilat, gider ve iade sıfırdan küçük olamaz; tutarlar 1 trilyon TL sınırında olmalıdır.');
 const hesaplanan=kr(kr(g.tahsilat)-kr(g.gider)-kr(g.iade));
 return {...g,dosya:g.dosya.replace(/\s/g,''),hesaplanan,fark:kr(hesaplanan-kr(g.bildirilen))};
}
export function giderExcelOku(rows:unknown[][]){
 const names=[['dosya no','esas no'],['tahsilat','tahsil edilen'],['gider','harcanan'],['iade','iade edilen'],['bildirilen bakiye','bakiye']];
 const head=rows.findIndex(r=>names.every(aliases=>r.some(v=>aliases.includes(normalize(String(v??'')).trim()))));
 if(head<0)throw Error('Dosya No, Tahsilat, Gider, İade ve Bildirilen Bakiye sütunları gerekli. Şablonu kullanın.');
 const indices=names.map(aliases=>rows[head].findIndex(v=>aliases.includes(normalize(String(v??'')).trim())));
 const result=[];
 for(let i=head+1;i<rows.length;i++){
  const row=rows[i];if(!row.some(v=>String(v??'').trim()))continue;
  const values=indices.map(k=>row[k]);
  if(values.some(v=>v===undefined||v===null||String(v).trim()===''))throw Error(`${i+1}. satırda eksik alan var; boş tutar yerine 0 yazın.`);
  try{result.push(giderKontrol({dosya:String(values[0]).trim(),tahsilat:sayiOku(String(values[1])),gider:sayiOku(String(values[2])),iade:sayiOku(String(values[3])),bildirilen:sayiOku(String(values[4]))}));}
  catch(e){throw Error(`${i+1}. satır: ${(e as Error).message}`);}
 }
 if(!result.length)throw Error('Şablonda kontrol edilecek kayıt yok.');return result;
}
