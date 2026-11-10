// Resmî sözlükle yalnız terim VE tanımı eşleşen kayıtlara kaynak izi ekler.
// Kaynak metnini kopyalamaz; mevcut içeriği değiştirmez ve uzman incelemesi iddia etmez.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parse} from 'parse5';
const dir='artifacts/geo-iyilestirme-20261104';fs.mkdirSync(dir,{recursive:true});
const terms=JSON.parse(fs.readFileSync('src/data/sozluk.json','utf8'));
const text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join(' ');
const classes=n=>(n.attrs?.find(a=>a.name==='class')?.value||'').split(/\s+/);
const norm=s=>s.normalize('NFKC').toLocaleLowerCase('tr-TR').replace(/[’‘`]/g,"'").replace(/\s+/g,' ').trim().replace(/[.\s]+$/,'');
const name=s=>norm(s).replaceAll('ı','i');
const letters=[...'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZÂÎÛ'];
const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul'}).format(new Date());
const sources={},evidence=[];
function extract(html){const found=[];function walk(n){if(classes(n).includes('terim')){const cells=(n.childNodes||[]).filter(c=>c.tagName==='div');if(cells.length>=2)found.push({name:text(cells[0]).trim(),definition:text(cells[1]).trim()});}for(const c of n.childNodes||[])walk(c);}walk(parse(html));return found;}
function match(found,url){for(const item of found){for(const t of terms){if(name(t.terim)===name(item.name)&&norm(t.anlam)===norm(item.definition))sources[t.slug]={ad:'Adalet Bakanlığı Hukuk Sözlüğü — '+item.name,url,eslestirmeTarihi:date,metinSha256:createHash('sha256').update(norm(t.anlam)).digest('hex')};}}}
for(const letter of letters){
 const url='https://sozluk.adalet.gov.tr/Harf/'+encodeURIComponent(letter);const cache=dir+'/sozluk-'+letter+'.html';
 let html;
 if(fs.existsSync(cache))html=fs.readFileSync(cache,'utf8');else{const r=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error(url+' '+r.status);html=await r.text();fs.writeFileSync(cache,html);}
 const found=extract(html);match(found,url);
 evidence.push({url,records:found.length,htmlSha256:createHash('sha256').update(html).digest('hex')});console.log(letter,found.length,Object.keys(sources).length);
}
if(process.argv.includes('--deep')){
 const remaining=[...new Map(terms.filter(t=>!sources[t.slug]).map(t=>[name(t.terim),t.terim])).values()];let cursor=0,done=0;
 async function worker(){while(cursor<remaining.length){const term=remaining[cursor++];const url='https://sozluk.adalet.gov.tr/'+encodeURIComponent(term.toLocaleLowerCase('tr-TR'));const cache=dir+'/arama-'+createHash('sha256').update(term).digest('hex').slice(0,20)+'.html';try{let html;if(fs.existsSync(cache))html=fs.readFileSync(cache,'utf8');else{const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('HTTP '+r.status);html=await r.text();fs.writeFileSync(cache,html);}const found=extract(html);match(found,url);evidence.push({url,records:found.length,htmlSha256:createHash('sha256').update(html).digest('hex')});}catch(e){evidence.push({url,error:e.message});}if(++done%100===0)console.log('Arama',done+'/'+remaining.length,'eşleşen',Object.keys(sources).length);}}
 await Promise.all(Array.from({length:3},worker));
}
fs.writeFileSync('src/data/sozluk-kaynaklari.json',JSON.stringify(sources,null,1)+'\n');
fs.writeFileSync(dir+'/sozluk-kaynak-kaniti.json',JSON.stringify({date,method:'Normalized exact term AND definition match; not legal expert review',total:terms.length,matched:Object.keys(sources).length,sources:evidence},null,1));
