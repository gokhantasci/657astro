import {parse} from 'parse5';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const root=new URL('../artifacts/hsk-20261104/',import.meta.url);await mkdir(root,{recursive:true});
const paths=['en-yakin-bolge-adliye-mahkemesi','en-yakin-bolge-idare-mahkemesi','en-yakin-agir-ceza-mahkemeleri','en-yakin-cocuk-mahkemeleri_1461','en-yakin-cocuk-agir-ceza-mahkemesi','en-yakin-asliye-hukuk-mahkemeleri','en-yakin-asliye-ticaret-mahkemeleri','adli-ve-idari-yargi-listesi','Arsiv/duyuru-2024','Arsiv/duyuru-2025','Arsiv/duyuru-2026'];
export const attr=(n,key)=>n.attrs?.find(a=>a.name===key)?.value??'';
export const text=n=>n.nodeName==='#text'?n.value??'':(n.childNodes??[]).map(text).join(' ').replace(/\s+/g,' ').trim();
export function find(n,p){return [...(p(n)?[n]:[]),...(n.childNodes??[]).flatMap(c=>find(c,p))];}
for(let i=0;i<paths.length;i+=4)for(const row of await Promise.all(paths.slice(i,i+4).map(async path=>{
 const url='https://hsk.gov.tr/'+path,file=new URL(path.replaceAll('/','-')+'.html',root);let html;
 try{html=await readFile(file,'utf8');}catch{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(url+' '+r.status);html=await r.text();await writeFile(file,html);}
 const dom=parse(html),body=find(dom,n=>attr(n,'class').split(' ').includes('icicerik'))[0]??dom;
 const satirlar=find(body,n=>n.nodeName==='tr').map(n=>(n.childNodes??[]).filter(c=>['td','th'].includes(c.nodeName)).map(text));
 const baglantilar=find(body,n=>n.nodeName==='a'&&attr(n,'href')).map(n=>({ad:text(n),url:new URL(attr(n,'href'),url).href})).filter(a=>path.includes('yargi-listesi')?a.url.includes('/Eklentiler/'):path.includes('Arsiv/')&&/çevre|bölge|kurulan/i.test(a.ad));
 const result={yol:path,satirlar,baglantilar};await writeFile(new URL(path.replaceAll('/','-')+'.json',root),JSON.stringify(result,null,1));return {yol:path,satir:satirlar.length,ornek:satirlar.slice(0,3),baglantilar};
})))console.log(JSON.stringify(row));
