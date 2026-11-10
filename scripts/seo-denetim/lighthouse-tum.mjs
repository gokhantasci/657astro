// Tüm site haritası adreslerinde ayrı mobil Lighthouse. Tek Chrome, sıralı ölçüm;
// paralel CPU yükü performans puanlarını bozmasın. JSONL dosyasından devam eder.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const out=path.resolve(process.argv[2]||'artifacts/canli-denetim-20261104');
const tools=path.resolve('artifacts/audit-tools/node_modules');
const {default:lighthouse}=await import(pathToFileURL(path.join(tools,'lighthouse/core/index.js')));
const {launch}=await import(pathToFileURL(path.join(tools,'chrome-launcher/dist/index.js')));
const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8'));
const priority=['/','/memur-maas-hesaplama/','/enflasyon-farki-hesaplama-robotu/','/yargilamagideri/','/kesinlesme/','/hukuk-sozlugu/','/cikmis-mulakat-sorulari/','/adlicevre/','/unvan-maaslari/','/yazilar/','/asistan/','/kira-artis-hesaplama/','/araclar/','/iflas-idare-ucreti-hesaplama/'];
const order=u=>{const i=priority.indexOf(new URL(u).pathname);return i<0?100:i;};
const templateMode=process.argv.includes('--templates');
const samples=[...fs.readFileSync('tests/tasarim-tutarlilik.spec.ts','utf8').matchAll(/\['([^']+)', '(\/[^']*)'\]/g)].map(m=>({url:'https://657.com.tr'+m[2],group:m[1]}));
const extra=[['DPB dizini','/devlet-personel-baskanligi-mutalaalari/'],['dosyalar','/dosyalar/'],['özel günler','/ozel-gunler/'],['AAÜT tarifesi','/avukatlik-asgari-ucret-tarifesi/'],['CMK tarifesi','/cmk-avukatlik-asgari-ucret-tarifesi/'],['katsayı arşivi','/memur-maas-katsayilari/'],['kira','/kira-artis-hesaplama/'],['nüfus analizi','/nufus-analiz-sistemi-bosanma-karari-hazirla/'],['Almanya posta','/almanya-posta-kodu-konsolosluk/'],['derdest liste','/derdest-dosya-listesi/'],['UDF editörü','/udf-editor/'],['UDF görüntüleyici','/udf-goruntuleyici/'],['iletişim','/iletisim/']];
for(const [group,p] of extra)if(manifest.some(x=>new URL(x.url).pathname===p))samples.push({url:'https://657.com.tr'+p,group});
for(const [group,re] of [['DPB görüşü',/^\/dpb-gorusleri\/[^/]+\/$/],['sözlük harfi',/^\/hukuk-sozlugu\/harf\/[^/]+\/$/],['mülakat sayfalama',/^\/cikmis-mulakat-sorulari\/sayfa\/\d+\/$/],['yazı kategorisi',/^\/yazilar\/kategori\/[^/]+\/$/],['yıllık maaş arşivi',/^\/unvan-maaslari\/\d{4}\/$/]]){const m=manifest.find(x=>re.test(new URL(x.url).pathname));if(m)samples.push({...m,group});}
const list=[...new Map((templateMode?samples:manifest).map(x=>[x.url,x])).values()].sort((a,b)=>order(a.url)-order(b.url));
const resultFile=path.join(out,'lighthouse.jsonl');
const previous=fs.existsSync(resultFile)?fs.readFileSync(resultFile,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
const done=new Set(previous.map(x=>x.url));
fs.mkdirSync(path.join(out,'lighthouse-raw'),{recursive:true});
let chrome,stop=false,completed=done.size,startedAt=new Date().toISOString();
process.on('SIGINT',()=>{stop=true;});process.on('SIGTERM',()=>{stop=true;});
completed=list.filter(x=>done.has(x.url)).length;
const status=extra=>fs.writeFileSync(path.join(out,'lighthouse-progress.json'),JSON.stringify({startedAt,updatedAt:new Date().toISOString(),total:list.length,completed,mode:(templateMode?'template samples; ':'all URLs; ')+'mobile; simulated throttling; sequential; analytics requests blocked',...extra},null,1));
status({state:'running',pid:process.pid});
try{
 for(const job of list){
  if(done.has(job.url))continue;if(stop)break;
  if(!chrome)chrome=await launch({chromePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',chromeFlags:['--headless','--disable-gpu','--no-first-run']});
  status({state:'running',pid:process.pid,current:job.url});
  const start=Date.now();let row={url:job.url,group:job.group};
  try{
   const {lhr}=await lighthouse(job.url,{port:chrome.port,logLevel:'error',onlyCategories:['performance','accessibility','best-practices','seo'],blockedUrlPatterns:['*google-analytics.com/*','*googletagmanager.com/*','*cloudflareinsights.com/*'],maxWaitForLoad:35000});
   const id=createHash('sha256').update(job.url).digest('hex').slice(0,16);
   const raw=path.join('lighthouse-raw',id+'.json.gz');fs.writeFileSync(path.join(out,raw),gzipSync(JSON.stringify(lhr)));
   row={...row,fetchTime:lhr.fetchTime,finalUrl:lhr.finalDisplayedUrl,lighthouseVersion:lhr.lighthouseVersion,raw,runtimeError:lhr.runtimeError||null,scores:Object.fromEntries(Object.entries(lhr.categories).map(([k,v])=>[k,v.score===null?null:Math.round(v.score*100)])),metrics:Object.fromEntries(['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index'].map(k=>[k,lhr.audits[k]?.numericValue??null])),failed:Object.entries(lhr.audits).filter(([,v])=>v.score!==null&&v.score<1&&v.scoreDisplayMode!=='informative').map(([id,v])=>({id,title:v.title,score:v.score,description:v.description,details:v.details}))};
  }catch(e){row.error=e.message;try{await chrome.kill();}catch{}chrome=null;}
  row.elapsedMs=Date.now()-start;fs.appendFileSync(resultFile,JSON.stringify(row)+'\n');completed++;done.add(job.url);console.log(completed+'/'+list.length,job.url,JSON.stringify(row.scores||row.error));
  if(completed%50===0&&chrome){await chrome.kill();chrome=null;}
 }
 status({state:completed===list.length?'complete':'stopped',pid:process.pid});
}finally{if(chrome)await chrome.kill();}
