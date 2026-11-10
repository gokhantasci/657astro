import {readFileSync,existsSync} from 'node:fs';
import {bultenGorusleriniDenetle} from './dpb-bulten-gorusleri.mjs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const dpb=read('../src/data/dpb-gorusleri.json');
const raw=read('../src/data/adalet-genelgeleri.json');
const seen=new Set();const genelgeler=raw.filter(g=>!seen.has(g.sha256)&&seen.add(g.sha256));
let pages=0;
for(const [tur,rows]of [['dpb',dpb],['genelge',genelgeler]])for(const r of rows){
 const path=new URL(`../src/content/belgeler/${tur}/${r.id}.md`,import.meta.url);
 if(!existsSync(path))throw new Error(`Markdown eksik: ${tur}/${r.id}`);
 const text=readFileSync(path,'utf8');
 if(text.includes('\uFFFD'))throw new Error(`Okunamayan karakter var: ${r.id}`);
 if(!text.includes(`sha256: "${r.sha256}"`))throw new Error(`Kaynak kimliği farklı: ${r.id}`);
 if(/<(?:iframe|embed|object|script|pre|details)\b/i.test(text))throw new Error(`Belge gövdesi Markdown olmalı: ${r.id}`);
 if(!text.includes('id="belge-sayfa-1"'))throw new Error(`Belge başlangıcı eksik: ${r.id}`);
 if(tur==='genelge')for(const p of r.sayfalar)if(!text.includes(`data-kaynak-sayfa="${p.no}"`))throw new Error(`Genelge sayfası eksik: ${r.id}/${p.no}`);
 pages+=(text.match(/data-kaynak-sayfa=/g)??[]).length;
}
// Önceki, bağımsız PDF metin çıkarımıyla sözcük/sayı koruma kontrolü.
const dpbSayfalari=read('../src/data/dpb-sayfa-metinleri.json');
const kelimeler=s=>{
 const t=s.replace(/(?<=[a-zçğıöşü])-\s+(?=[a-zçğıöşü])/g,'').normalize('NFKC');
 const out=new Map();for(const w of t.match(/[\p{L}\p{N}_]+/gu)??[])out.set(w,(out.get(w)??0)+1);return out;
};
for(const r of dpb){
 let md=readFileSync(new URL(`../src/content/belgeler/dpb/${r.id}.md`,import.meta.url),'utf8').replace(/\r\n/g,'\n').replace(/^---\n[\s\S]*?\n---\n/,'');
 md=md.replace(/<div class="kaynak-sayfa-no"[^>]*>[\s\S]*?<\/div>/g,'').replace(/!\[[^\]]*\]\([^)]+\)/g,'').replace(/\[([^\]]*)\]\([^)]+\)/g,'$1').replace(/<[^>]*>/g,'').replace(/\\([\\`*\[\]_|.])/g,'$1').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
 const original=dpbSayfalari[r.id].map(p=>p.metin.replace(new RegExp(`^\\s*${p.no}\\s*$`,'gm'),'')).join('\n\n');
 const expected=kelimeler(original),actual=kelimeler(md);
 for(const [w,n]of expected)if(actual.get(w)!==n)throw new Error(`DPB kaynak metni değişti: ${r.id}: ${w}`);
 for(const [w,n]of actual)if(expected.get(w)!==n)throw new Error(`DPB kaynağında olmayan metin: ${r.id}: ${w}`);
}
const cozumle=s=>s.replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const anahtar=s=>cozumle(s.replace(/<[^>]+>/g,' ')).replace(/[^\p{L}\p{N}_]/gu,'').toLowerCase();
const kontroller=[...read('../src/data/belge-fark-kontrolleri.json').map(r=>({...r,metin:r.dogru})),...Object.values(read('../src/data/belge-gorsel-kontrolleri.json'))];
for(const r of kontroller){
 const g=genelgeler.find(g=>g.sha256===r.sha256);if(!g)throw new Error(`Görsel kontrolün kaynak belgesi yok: ${r.sha256}`);
 const md=readFileSync(new URL(`../src/content/belgeler/genelge/${g.id}.md`,import.meta.url),'utf8');
 const page=md.match(new RegExp(`<section class="kaynak-sayfa" id="belge-sayfa-${r.sayfa}"[^>]*>([\\s\\S]*?)</section>`))?.[1]??'';
 if(!anahtar(page).includes(anahtar(r.metin)))throw new Error(`Görsel kontrolde doğrulanan metin eksik: ${g.id}/${r.sayfa}: ${r.metin}`);
}
console.log(`Belge Markdown denetimi: ${dpb.length} DPB, ${genelgeler.length} genelge, ${pages} kaynak sayfası.`);
bultenGorusleriniDenetle();
