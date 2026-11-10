import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('artifacts/site-sagligi-20261105');fs.mkdirSync(out,{recursive:true});
const base='https://657.com.tr', jobs=new Map();
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html')){const rel=path.relative('dist',p).replaceAll('\\','/');const route='/'+rel.replace(/index\.html$/,'');jobs.set(base+route,{url:base+route,kind:'built'});}}}
walk('dist');
const locs=s=>[...s.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replaceAll('&amp;','&'));
const sm=await(await fetch(base+'/sitemap.xml')).text(), manifest=[];
for(const u of locs(sm)){const xml=await(await fetch(u)).text();for(const url of locs(xml)){manifest.push({url,group:new URL(u).pathname});jobs.set(url,{url,kind:'sitemap'});}}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,1));
const list=[...jobs.values()],file=path.join(out,'http.jsonl');
const prev=fs.existsSync(file)?fs.readFileSync(file,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[];
const done=new Set(prev.filter(x=>!x.error).map(x=>x.url));let cursor=0,count=done.size;
const progress=()=>fs.writeFileSync(path.join(out,'http-progress.json'),JSON.stringify({total:list.length,completed:count,sitemap:manifest.length,updatedAt:new Date().toISOString()},null,1));
fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify(list));progress();
async function worker(){while(cursor<list.length){const job=list[cursor++];if(done.has(job.url))continue;const start=performance.now();let row={...job,checkedAt:new Date().toISOString()};try{const r=await fetch(job.url,{redirect:'manual',signal:AbortSignal.timeout(30000)});row.headersMs=Math.round(performance.now()-start);row.status=r.status;row.location=r.headers.get('location');row.cfCache=r.headers.get('cf-cache-status');row.cfRay=r.headers.get('cf-ray');row.contentEncoding=r.headers.get('content-encoding');row.contentLength=r.headers.get('content-length');row.cacheControl=r.headers.get('cache-control');row.server=r.headers.get('server');const html=await r.text();row.decodedBytes=Buffer.byteLength(html);row.totalMs=Math.round(performance.now()-start);row.noindex=/<meta[^>]+(?:name=["']robots["'][^>]+content=["'][^"']*noindex|content=["'][^"']*noindex[^>]+name=["']robots)/i.test(html);row.canonical=html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1]??null;row.refresh=html.match(/http-equiv=["']refresh["'][^>]+content=["']([^"']+)/i)?.[1]??null;row.ga=html.includes('G-SBMKDHD5TF');row.gtm=html.includes('GTM-KPCCB5FP');}catch(e){row.error=e.message;row.totalMs=Math.round(performance.now()-start);}fs.appendFileSync(file,JSON.stringify(row)+'\n');count++;if(count%100===0){progress();console.log(count+'/'+list.length);}}}
await Promise.all(Array.from({length:6},worker));progress();fs.writeFileSync(path.join(out,'http-complete.json'),JSON.stringify({total:list.length,sitemap:manifest.length,finishedAt:new Date().toISOString()}));console.log('COMPLETE',list.length);
