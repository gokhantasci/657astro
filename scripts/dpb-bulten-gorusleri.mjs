import {readFileSync,writeFileSync,mkdirSync,existsSync,unlinkSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const source=new URL('../src/content/belgeler/dpb/dpb_mutalaa_ozel.md',import.meta.url);
const manifest=new URL('../src/data/dpb-bulten-gorusleri.json',import.meta.url);
const folder=new URL('../src/content/dpb-bulten/',import.meta.url);
const norm=s=>s.replace(/\r\n/g,'\n');
export function bulteniBol(markdown){
 const rows=[];let current,kategori='';
 const finish=()=>{if(!current)return;current.metin=current.metin.join('\n').trim();if(!current.metin)throw Error('Boş görüş: '+current.title);rows.push(current);current=undefined;};
 for(const m of norm(markdown).matchAll(/<section class="kaynak-sayfa"[^>]*data-kaynak-sayfa="(\d+)"[^>]*>([\s\S]*?)<\/section>/g)){
  const no=Number(m[1]);if(no<25)continue;
  const body=m[2].replace(/<div class="kaynak-sayfa-no"[^>]*>[\s\S]*?<\/div>/g,'');
  // 524'te son görüş biter; 525 yalnız matbaanın baskı künyesidir.
  if(no===525&&body.trim().startsWith('Baskı:')){finish();continue;}
  for(const line of body.split('\n')){
   if(/^## /.test(line)){finish();kategori=line.slice(3).trim();continue;}
   const summary=line.replace(/^\*\*|\*\*$/g,'').match(/^(?:### )?Özet\s*[:;]\s*(.+)$/);
   if(summary){finish();current={title:summary[1].trim(),kategori,sira:rows.length+1,pdfBaslangic:no,pdfBitis:no,metin:[]};continue;}
   if(current){current.metin.push(line);if(line.trim())current.pdfBitis=no;}
  }
 }
 finish();const used=new Set();
 return rows.map(r=>{const prefix=r.title.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90).replace(/-?[^-]*$/,'');const digest=createHash('sha256').update(r.title+'\n'+r.metin).digest('hex').slice(0,10);let id=`${prefix}-${digest}`;if(used.has(id))id+=`-${r.sira}`;used.add(id);return {id,...r};});
}
export function gorusMarkdown(g,sha256){
 const {metin,id,...meta}=g;
 return '---\n'+Object.entries({...meta,bultenId:'dpb_mutalaa_ozel',sha256}).map(([k,v])=>`${k}: ${JSON.stringify(v)}`).join('\n')+'\n---\n\n'+metin+'\n';
}
export function bultenVerisi(){
 const md=readFileSync(source,'utf8'),sha256=md.match(/^sha256: "([a-f0-9]{64})"/m)?.[1];
 if(!sha256)throw Error('Bülten kaynak kimliği yok');const gorusler=bulteniBol(md);
 if(gorusler.length!==336)throw Error(`Bültendeki özet sayısı değişti: ${gorusler.length}`);
 return {sha256,gorusler};
}
export function bultenGorusleriniDenetle(){
 const {sha256,gorusler}=bultenVerisi();
 const expected={bultenId:'dpb_mutalaa_ozel',sha256,gorusler:gorusler.map(({metin,...r})=>r)};
 if(JSON.stringify(JSON.parse(readFileSync(manifest,'utf8')))!==JSON.stringify(expected))throw Error('Bülten görüş dizini kaynaktan farklı');
 for(const g of gorusler)if(norm(readFileSync(new URL(g.id+'.md',folder),'utf8'))!==gorusMarkdown(g,sha256))throw Error('Bölünmüş görüş kaynak metninden farklı: '+g.id);
 if(readdirSync(folder).filter(f=>f.endsWith('.md')).length!==gorusler.length)throw Error('Görüş klasöründe fazladan Markdown var');
 console.log(`${gorusler.length} bülten görüşünün başlığı ve özgün metni ayrı Markdown dosyalarında doğrulandı.`);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const {sha256,gorusler}=bultenVerisi();mkdirSync(folder,{recursive:true});
 const previous=existsSync(manifest)?JSON.parse(readFileSync(manifest,'utf8')).gorusler:[];
 for(const old of previous)if(/^[a-z0-9-]+$/.test(old.id)&&!gorusler.some(g=>g.id===old.id)){const p=new URL(old.id+'.md',folder);if(existsSync(p))unlinkSync(p);}
 for(const g of gorusler)writeFileSync(new URL(g.id+'.md',folder),gorusMarkdown(g,sha256));
 writeFileSync(manifest,JSON.stringify({bultenId:'dpb_mutalaa_ozel',sha256,gorusler:gorusler.map(({metin,...r})=>r)},null,1)+'\n');
 bultenGorusleriniDenetle();
}
