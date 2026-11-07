// Statik çıktı denetimi. Sıralama veya Core Web Vitals puanı üretmez.
import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join,relative,resolve} from 'node:path';
const root=resolve(process.argv[2]||'dist'),files=[];
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory()&&!['og','_astro'].includes(e.name))walk(p);else if(e.name==='index.html')files.push(p);}}
walk(root);const titles=new Map(),missing=[],ldErrors=[];let indexable=0;
for(const f of files){
 const h=readFileSync(f,'utf8'),path='/'+relative(root,f).replace(/\\/g,'/').replace(/index\.html$/,'');
 if(/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(h)||/<meta\b[^>]*http-equiv="refresh"/i.test(h))continue;
 indexable++;const title=h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],description=h.match(/<meta name="description" content="([^"]*)"/i)?.[1],canonical=h.match(/rel="canonical" href="([^"]*)"/i)?.[1],h1=(h.match(/<h1(?:\s|>)/g)??[]).length;
 if(!title||!description||!canonical||h1!==1)missing.push({path,title:!!title,description:!!description,canonical:!!canonical,h1});
 if(title){const a=titles.get(title)??[];a.push(path);titles.set(title,a);}
 for(const m of h.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi))try{JSON.parse(m[1]);}catch{ldErrors.push(path);}
}
const duplicates=[...titles].filter(([,paths])=>paths.length>1);
const result={kontrolTarihi:new Date().toISOString(),htmlDosyalari:files.length,indexlenebilir:indexable,eksikMetaVeyaBaslik:missing.length,eksikler:missing,gecersizJsonLd:ldErrors,yinelenenBaslikGrubu:duplicates.length,yinelenenBaslikliSayfa:duplicates.reduce((n,[,a])=>n+a.length,0),yinelenenBasliklar:duplicates.map(([baslik,yollar])=>({baslik,yollar}))};
if(process.argv[3])writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,yinelenenBasliklar:result.yinelenenBasliklar.slice(0,4)},null,2));
