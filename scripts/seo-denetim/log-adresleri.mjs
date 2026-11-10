// Günlüklerden yalnız makul içerik/varlık yollarını doğrula; saldırı sorgularını tekrar oynatma.
import fs from 'node:fs';import path from 'node:path';
const out=path.resolve(process.argv[2]);const data=JSON.parse(fs.readFileSync(path.join(out,'origin-logs.json'),'utf8'));
const known=new Set(JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8')).map(x=>new URL(x.url).pathname));
const rows=data.not_found.filter(x=>{
 const p=x.path;if(/[?<>;]|%20|%3[bBcC]|\.php|\.env|https?:|\/\./i.test(p))return false;
 return /^\/wp-content\/uploads\/\d{4}\/\d{2}\/[\w%.-]+\.(?:png|webp|jpg|jpeg|gif|pdf)$/i.test(p)||/^\/(?:duyuru\.txt|duyurular\.json|ads\.txt)$/.test(p)||known.has(p)||/^\/(?:tag|category|kelimeler|kelime|adlicevre|tags)\/[\w%/-]+\/$/.test(p)||/^\/[a-z0-9%-]+(?:maasi-\d{4}|hesaplama|kesinle%C5%9Fme)\/$/i.test(p)||p==='/kesinle%C5%9Fme/';
});
let cursor=0;const results=[];
async function worker(){while(cursor<rows.length){const x=rows[cursor++];let r={...x};try{const y=await fetch('https://657.com.tr'+x.path,{redirect:'manual',signal:AbortSignal.timeout(25000)});r.status=y.status;r.location=y.headers.get('location');await y.body?.cancel();}catch(e){r.error=e.message;}results.push(r);}}
await Promise.all(Array.from({length:4},worker));fs.writeFileSync(path.join(out,'origin-404-live.json'),JSON.stringify(results,null,1));console.log('Günlük adayları doğrulandı:',results.length);
