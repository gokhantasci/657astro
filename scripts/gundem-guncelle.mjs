// Derleme makinesi kaynaklara bağlanır; ziyaretçi yalnız 657.com.tr JSON'unu okur.
import {readFile,writeFile} from 'node:fs/promises';
const target=new URL('../src/data/gundem.json',import.meta.url);
let data={};try{data=JSON.parse(await readFile(target,'utf8'));}catch{}
const get=async u=>{const r=await fetch(u,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(`HTTP ${r.status}`);return r;};
const now=new Date().toISOString();let changed=0;
try{
 const base='https://pompafiyat.turkiyeshell.com/api/Public/';
 const [p,s]=await Promise.all([get(base+'prices').then(r=>r.json()),get(base+'sources').then(r=>r.json())]);
 if(!p.groups?.length||!p.products?.length||!/^\d{2}\.\d{2}\.\d{4}$/.test(s.EFFECTIVE_DATE?.content))throw Error('Shell şeması değişti.');
 const plain=s=>s.replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
 data.yakit={guncelleme:now,kaynak:'https://www.shell.com.tr/suruculer/shell-yakitlari/akaryakit-pompa-satis-fiyatlari.html',gecerliTarih:s.EFFECTIVE_DATE.content.split('.').reverse().join('-'),urunler:p.products.map(x=>({kod:x.fepProductCode.trim(),ad:plain(x.webProductName)})),iller:p.groups.map(x=>({kod:x.cityCode,ad:x.cityName,ilceler:x.counties.map(c=>({kod:c.countyCode,ad:c.countyName,fiyatlar:Object.fromEntries(Object.entries(c.prices).filter(([,v])=>typeof v==='number'&&v>0).map(([k,v])=>[k.trim(),v]))}))}))};changed++;
}catch(e){console.warn('Shell yenilenemedi; önceki tarihli kayıt korunuyor:',e.message);}
try{
 const xml=await (await get('https://www.tcmb.gov.tr/kurlar/today.xml')).text(),usd=xml.match(/<Currency[^>]*Kod="USD"[^>]*>([\s\S]*?)<\/Currency>/)?.[1];
 const alis=Number(usd?.match(/<ForexBuying>([^<]+)/)?.[1]),satis=Number(usd?.match(/<ForexSelling>([^<]+)/)?.[1]);
 const tarih=xml.match(/Tarih="([^"]+)"/)?.[1];if(!alis||!satis||!tarih)throw Error('TCMB şeması değişti.');
 data.doviz={guncelleme:now,tarih:tarih.split('.').reverse().join('-'),alis,satis,kaynak:'https://www.tcmb.gov.tr/kurlar/today.xml'};changed++;
}catch(e){console.warn('TCMB yenilenemedi; önceki tarihli kayıt korunuyor:',e.message);}
try{
 const cities=[{ad:'Sakarya',lat:40.7569,lon:30.3781},{ad:'İstanbul',lat:41.0082,lon:28.9784},{ad:'Ankara',lat:39.9334,lon:32.8597},{ad:'İzmir',lat:38.4237,lon:27.1428}];
 const rows=await Promise.all(cities.map(async c=>{const u=`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,weather_code&timezone=Europe%2FIstanbul`;const d=await (await get(u)).json();if(!Number.isFinite(d.current?.temperature_2m))throw Error('Hava durumu şeması değişti.');return {ad:c.ad,...d.current};}));
 data.hava={guncelleme:now,kaynak:'https://open-meteo.com/',iller:rows};changed++;
}catch(e){console.warn('Hava durumu yenilenemedi; önceki tarihli kayıt korunuyor:',e.message);}
if(changed)await writeFile(target,JSON.stringify(data,null,1)+'\n');else process.exitCode=1;
console.log(`${changed}/3 gündem kaynağı yenilendi.`);
