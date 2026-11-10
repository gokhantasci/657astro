import {readFile,writeFile} from 'node:fs/promises';
const dosya=new URL('../src/data/arac-kullanim-sirasi.json',import.meta.url);
const registry=JSON.parse(await readFile(new URL('../services/oneriler/arac-sayaclari.json',import.meta.url),'utf8'));
let eski={kaynaklar:{}};
try{eski=JSON.parse(await readFile(dosya,'utf8'));}catch{}
const kaynaklar={...eski.kaynaklar};
const kaynaklarListesi=[
 ['ana','https://657.com.tr/_657-servis/api/hesaplama',j=>Object.fromEntries(registry.map(r=>[r.id,j.sayaclar[r.anahtar].toplam]))],
 ['dikte','https://dikte.657.com.tr/stats',j=>({dikte:j.totalSessionsCreated})],
 ['barkod','https://barkod.657.com.tr/api/scan-total',j=>({barkod:j.total})],
];
await Promise.all(kaynaklarListesi.map(async([id,url,oku])=>{
 try{
  const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (657 site build)'},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error(`HTTP ${response.status}`);
  const sayilar=oku(await response.json());
  if(Object.values(sayilar).some(n=>!Number.isSafeInteger(n)||n<0))throw Error('Geçersiz sayaç');
  kaynaklar[id]={tarih:new Date().toISOString(),sayilar};
 }catch(error){
  if(!kaynaklar[id])throw error;
  console.warn(`${id}: son doğrulanan sıralama kaydı korundu (${error.message}).`);
 }
}));
await writeFile(dosya,JSON.stringify({kaynaklar},null,2)+'\n');
console.log('Araç sıralaması: 83 site aracı ve 2 bağımsız uygulamanın gerçek kullanım toplamları.');
