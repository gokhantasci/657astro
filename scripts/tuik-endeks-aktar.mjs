// TÜİK'in indirilen genel endeks tablosunu kayıpsız okuyarak ortak veri kaydını günceller.
import * as XLSX from 'xlsx';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dosya=process.argv[2]??'docs/Tüketici fiyat endeksi ve değişim oranları.xls';
const mevcut=JSON.parse(await readFile('src/data/enflasyon.json','utf8'));
const kaynak=process.argv[3]??mevcut.kaynakUrl;
if(!/^https:\/\/(?:veriportali|data)\.tuik\.gov\.tr\//.test(kaynak))throw Error('TÜİK bülten/kaynak URL’sini girin.');
const kayitTarihi=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul'}).format(new Date());
const bytes=await readFile(dosya),w=XLSX.read(bytes,{type:'buffer'});
const rows=XLSX.utils.sheet_to_json(w.Sheets[w.SheetNames[0]],{header:1});
if(!rows.some(r=>String(r[0]).includes('2025=100')))throw Error('Beklenen TÜİK 2025=100 tablosu değil.');
const veriler=[];let bolum='';
for(const r of rows){
 if(String(r[1]).includes('Endeks -'))bolum='endeks';
 else if(String(r[1]).includes('Monthly rate'))bolum='degisim';
 else if(!r[0]&&r[1])bolum='';
 if(typeof r[0]!=='number'||!bolum)continue;
 for(let ay=1;ay<=12;ay++)if(typeof r[ay]==='number'){
  let a=veriler.find(a=>a.yil===r[0]&&a.ay===ay);
  if(!a){a={yil:r[0],ay};veriler.push(a);}a[bolum]=r[ay];
 }
}
if(!veriler.length||veriler.some(a=>!a.endeks||a.degisim===undefined))throw Error('Eksik endeks/oran eşleştirmesi.');
await writeFile('src/data/tuik-endeks.json',JSON.stringify({taban:'2025=100',kaynak,dosya,sha256:createHash('sha256').update(bytes).digest('hex'),aylar:veriler},null,1)+'\n');
for(const file of ['src/data/enflasyon.json','src/data/enflasyon-arsivi.json']){
 const d=JSON.parse(await readFile(file,'utf8'));
 for(const p of Array.isArray(d)?d:[d]){
  const baz=veriler.find(a=>a.yil===p.baz_endeks.yil&&a.ay===p.baz_endeks.ay);
  if(!baz)continue;
  p.baz_endeks.deger=baz.endeks;p.endeksTabani='2025=100';
  p.kaynakUrl=kaynak;p.kayitTarihi=kayitTarihi;
  for(const a of p.aylar){const v=veriler.find(v=>v.yil===a.yil&&v.ay===a.ay);if(v){a.endeks=v.endeks;a.degisim=v.degisim;delete a.endeksHesaplandi;}}
  p.kaynak='TÜİK Tüketici fiyat endeksi ve değişim oranları tablosu (2025=100). Genel endeksler dosyadaki resmî değerlerdir; yuvarlanmış aylık oranlardan türetilmemiştir.';
 }
 await writeFile(file,JSON.stringify(d,null,1)+'\n');
}
console.log(`${veriler.length} resmî aylık endeks/oran kaydı aktarıldı.`);
