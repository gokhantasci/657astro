// Canlı site haritası ve eski adresler; devam edilebilir, salt okunur HTTP denetimi.
import fs from 'node:fs';
import path from 'node:path';
import {parse} from 'parse5';
const OUT=path.resolve(process.argv[2]||'artifacts/canli-denetim-20261104');
const SITE='https://657.com.tr', NS=6;
fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(path.join(OUT,'html'),{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const decode=s=>s.replace(/&amp;/g,'&');
const locs=s=>[...s.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>decode(m[1]));
const manifest=[];
const index=await fetch(SITE+'/sitemap.xml');if(!index.ok)throw Error('sitemap '+index.status);
const indexText=await index.text();fs.writeFileSync(path.join(OUT,'html/sitemap.xml'),indexText);
for(const u of locs(indexText)){
 if(new URL(u).origin!==SITE)throw Error('Dış sitemap');
 const r=await fetch(u);if(!r.ok)throw Error(u+' '+r.status);const text=await r.text();
 fs.writeFileSync(path.join(OUT,'html',path.basename(new URL(u).pathname)),text);
 for(const url of locs(text))manifest.push({url,group:path.basename(new URL(u).pathname).replace(/^sitemap-|\.xml$/g,'')});
}
fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(manifest,null,1));
console.log('Site haritası:',manifest.length);
const old=read('docs/seo-canli-eksik-adresler.json').gruplar;
const jobs=new Map(manifest.map(x=>[x.url,{...x,kind:'sitemap'}]));
for(const [group,rows] of Object.entries(old))for(const x of rows){const url=new URL(x.yol,SITE).href;if(!jobs.has(url))jobs.set(url,{url,group,kind:'legacy',intent:x.not?'gone':'review'});}
for(const x of read('src/data/wp-yonlendirmeler.json').kurallar){const url=new URL(x.eski,SITE).href;if(!jobs.has(url))jobs.set(url,{url,group:'wp-redirect',kind:'legacy',expected:x.yeni});}
if(fs.existsSync(path.join(OUT,'extra-urls.json')))for(const p of read(path.join(OUT,'extra-urls.json'))){const url=new URL(p,SITE).href;if(!jobs.has(url))jobs.set(url,{url,group:'linked',kind:'linked'});}
for(const p of ['/robots.txt','/llms.txt','/llms-full.txt','/sitemap_index.xml','/feed/','/memur-maas-hesaplama/zabit-katibi/7-2/12-yil/','/denetimtutanagi.docx','/404/','/500/'])jobs.set(SITE+p,{url:SITE+p,kind:'special',group:'special'});
const file=path.join(OUT,'http.jsonl');
const previous=fs.existsSync(file)?fs.readFileSync(file,'utf8').trim().split('\n').filter(Boolean).flatMap(l=>{try{return[JSON.parse(l)];}catch{return[];}}):[];
// Kesilen son JSONL satırını temizle; hata yanıtlarını yeniden dene.
fs.writeFileSync(file,previous.map(x=>JSON.stringify(x)).join('\n')+(previous.length?'\n':''));
const done=new Set(previous.filter(x=>x.status&&x.status<500&&!x.error).map(x=>x.url));
let list=[...jobs.values()].filter(x=>!done.has(x.url)), cursor=0, count=done.size;
function meta(html){
 const doc=parse(html), elements=[];function walk(n){if(n.tagName)elements.push(n);for(const c of n.childNodes||[])walk(c);}walk(doc);
 const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
 const text=n=>(n.childNodes||[]).map(c=>c.nodeName==='#text'?c.value:text(c)).join(' ');
 const m=(k,v)=>attr(elements.find(n=>n.tagName==='meta'&&attr(n,k)===v)||{},'content')||'';
 const canonical=elements.filter(n=>n.tagName==='link'&&attr(n,'rel')==='canonical').map(n=>attr(n,'href'));
 const ld=[];let invalidLd=0;for(const n of elements.filter(n=>n.tagName==='script'&&attr(n,'type')==='application/ld+json')){try{const j=JSON.parse(text(n));ld.push(...(Array.isArray(j)?j:j['@graph']||[j]));}catch{invalidLd++;}}
 const types=ld.flatMap(x=>[].concat(x?.['@type']||[]));
 const main=elements.find(n=>n.tagName==='main')||doc;
 const clean=n=>['script','style','nav','footer','header'].includes(n.tagName)?'':n.nodeName==='#text'?n.value:(n.childNodes||[]).map(clean).join(' ');
 const body=clean(main).replace(/\s+/g,' ').trim();
 const links=elements.filter(n=>n.tagName==='a').map(n=>attr(n,'href')).filter(Boolean);
 const official=links.filter(u=>/^https?:/.test(u)&&/\.gov\.tr(?:[/:]|$)|resmigazete|mevzuat\.gov/i.test(u)).length;
 return {title:text(elements.find(n=>n.tagName==='title')||{}).trim(),description:m('name','description'),canonical,robots:m('name','robots'),h1:elements.filter(n=>n.tagName==='h1').length,types,invalidLd,words:body?body.split(' ').length:0,first:body.slice(0,350),official,hasAuthor:ld.some(x=>x.author),hasDate:ld.some(x=>x.dateModified||x.datePublished),hasOrganization:types.includes('Organization'),ogImage:m('property','og:image'),lang:attr(elements.find(n=>n.tagName==='html')||{},'lang')||'',viewport:!!m('name','viewport'),imgMissingAlt:elements.filter(n=>n.tagName==='img'&&attr(n,'alt')===undefined).length,directAnswer:/class="[^"]*dogrudan-yanit/.test(html),steps:/class="[^"]*hesap-adimlari/.test(html),questionHeadings:elements.filter(n=>/^h[2-6]$/.test(n.tagName)&&/\?\s*$/.test(text(n))).length,hasList:elements.some(n=>['ul','ol','dl','table'].includes(n.tagName)),snippetAllowed:!/nosnippet|max-snippet:\s*0/i.test(m('name','robots')),refresh:m('http-equiv','refresh'),internalLinks:links.filter(u=>u.startsWith('/')||u.startsWith(SITE))};
}
async function work(){while(cursor<list.length){const job=list[cursor++];const start=Date.now();let row={...job,checkedAt:new Date().toISOString()};try{
 const r=await fetch(job.url,{redirect:'manual',signal:AbortSignal.timeout(30000)});row.status=r.status;row.location=r.headers.get('location');row.cfCache=r.headers.get('cf-cache-status');row.cfRay=r.headers.get('cf-ray');row.contentType=r.headers.get('content-type');
 if(row.contentType?.includes('text/html')){const html=await r.text();row.bytes=Buffer.byteLength(html);row.meta=meta(html);if(['sitemap','linked'].includes(job.kind)&&r.status===200){let p=decodeURIComponent(new URL(job.url).pathname);const dest=path.resolve(OUT,'html','.'+p,p.endsWith('/')?'index.html':'');const base=path.resolve(OUT,'html')+path.sep;if(!dest.startsWith(base))throw Error('Unsafe output');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,html);}}
 else if(job.kind==='special'&&row.status===200&&/\.txt$/.test(new URL(job.url).pathname)){fs.writeFileSync(path.join(OUT,path.basename(new URL(job.url).pathname)),await r.text());}else await r.body?.cancel();
 }catch(e){row.error=e.message;}row.ms=Date.now()-start;fs.appendFileSync(file,JSON.stringify(row)+'\n');if(++count%100===0)console.log(count+'/'+jobs.size);}}
await Promise.all(Array.from({length:NS},work));
fs.writeFileSync(path.join(OUT,'crawl-complete.json'),JSON.stringify({finishedAt:new Date().toISOString(),total:jobs.size,sitemap:manifest.length}));console.log('Bitti',jobs.size);
