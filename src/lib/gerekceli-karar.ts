import {normalize} from './normalize';
export interface GerekceliKayit {esas:string;karar:string;kisa:string;gerekceli:string;gecikme:number|null;hesaplanan:number|null;hakim:string;}
export const tarihOku=(v:unknown)=>{
 if(v instanceof Date&&!Number.isNaN(+v))return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`;
 const s=String(v??'').trim(),m=s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/),iso=m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:/^\d{4}-\d{2}-\d{2}$/.test(s)?s:'';
 if(!iso)return '';const d=new Date(iso+'T00:00:00Z');return !Number.isNaN(+d)&&d.toISOString().slice(0,10)===iso?iso:'';
};
export function gerekceliOku(aoa:unknown[][]){
 const header=aoa.findIndex(row=>row.some(c=>normalize(String(c)).includes('kisa karar'))&&row.some(c=>normalize(String(c)).includes('esas'))&&row.some(c=>normalize(String(c)).includes('gerekceli karar')));
 if(header<0)throw Error('Esas no, kısa karar tarihi ve gerekçeli karar tarihi başlıkları bulunamadı. UYAP gerekçeli karar zaman kontrolü Excel dosyasını seçin.');
 const hs=aoa[header].map(c=>normalize(String(c??''))),find=(q:string)=>hs.findIndex(c=>c.includes(q));
 const col={esas:find('esas'),karar:find('karar tur'),kisa:find('kisa karar'),gerekceli:find('gerekceli karar'),gecikme:find('gecikme'),hakim:find('hakim')};
 const rows:GerekceliKayit[]=[],uyarilar:string[]=[];let atlanan=0;
 for(const row of aoa.slice(header+1)){
  const esas=String(row[col.esas]??'').trim();if(!/^\d{4}\s*\/\s*\d{1,6}$/.test(esas)){if(row.some(v=>String(v??'').trim()))atlanan++;continue;}
  const kisa=tarihOku(row[col.kisa]),gerekceli=tarihOku(row[col.gerekceli]),gv=String(row[col.gecikme]??'').trim(),gecikme=/^-?\d+(?:[.,]\d+)?$/.test(gv)?Number(gv.replace(',','.')):null;
  const hesaplanan=kisa&&gerekceli?(+new Date(gerekceli+'T00:00:00Z')-+new Date(kisa+'T00:00:00Z'))/86400000:null;
  if(!kisa||!gerekceli)uyarilar.push(`${esas}: karar tarihlerinden biri boş veya geçersiz.`);
  if(hesaplanan!==null&&hesaplanan<0)uyarilar.push(`${esas}: gerekçeli karar tarihi kısa karar tarihinden önce.`);
  if(hesaplanan!==null&&gecikme!==null&&hesaplanan!==gecikme)uyarilar.push(`${esas}: bildirilen süre ${gecikme}, tarihler arasındaki takvim günü ${hesaplanan}.`);
  rows.push({esas:esas.replace(/\s/g,''),karar:String(row[col.karar]??''),kisa,gerekceli,gecikme,hesaplanan,hakim:String(row[col.hakim]??'')});
 }
 if(!rows.length)throw Error('Geçerli esas numarası taşıyan kayıt bulunamadı.');
 return {rows,uyarilar,atlanan,birim:String(aoa[4]?.[5]??'').trim()};
}
export const GEREKCELI_BASLIKLAR=['Esas no','Karar türü','Kısa karar tarihi','Gerekçeli karar tarihi','Bildirilen gün','Takvim günü','Hâkim'];
export function gerekceliHucreler(r:GerekceliKayit){const fmt=(s:string)=>s?s.split('-').reverse().join('/'):'—';return [r.esas,r.karar,fmt(r.kisa),fmt(r.gerekceli),r.gecikme===null?'—':String(r.gecikme),r.hesaplanan===null?'—':String(r.hesaplanan),r.hakim];}
