// Derlenmiş bütün sözlük/mülakat kayıtlarında kaynak ve tarih bütünlüğü.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const sources=await read('src/data/sozluk-kaynaklari.json');
const records=[...(await read('src/data/sozluk.json')).map(t=>({...t,kind:'sozluk'})),...(await read('src/data/mulakat.json')).map(t=>({...t,kind:'mulakat'}))];
let cursor=0;const counts={dates:0,citations:0,without_citation:0};
async function worker(){while(cursor<records.length){const t=records[cursor++],p=`dist/${t.kind==='sozluk'?'kelime/':''}${t.slug}/index.html`;
 const h=await fs.readFile(p,'utf8');
 const ld=[...h.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].flatMap(m=>JSON.parse(m[1]));
 const web=ld.find(x=>x['@type']==='WebPage');
 assert.equal(web.datePublished,t.tarih,p);assert.equal(web.dateModified,undefined,p);assert.equal(web.author,undefined,p);assert.ok(h.includes('data-kayit-bilgisi'),p);
 if(t.kind==='sozluk'){const source=sources[t.slug];if(source){assert.deepEqual(web.citation,[source.url],p);assert.ok(h.includes(source.url),p);counts.citations++;}else{assert.equal(web.citation,undefined,p);counts.without_citation++;}}
 if(++counts.dates%500===0)console.log('Doğrulandı',counts.dates+'/'+records.length);
}}
await Promise.all(Array.from({length:12},worker));
await fs.access('dist/icerik-kaynaklari/index.html');assert.ok((await fs.readFile('dist/sitemap-sayfalar.xml','utf8')).includes('https://657.com.tr/icerik-kaynaklari/'));
await fs.writeFile('artifacts/geo-iyilestirme-20261104/uretim-dogrulamasi.json',JSON.stringify(counts,null,1));console.log(JSON.stringify(counts));
