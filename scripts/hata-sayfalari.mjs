import {readFile,copyFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {hataDurumlari,hataBasliklari} from '../src/lib/hata-durumlari.ts';
const known=new Set(hataDurumlari.map(h=>h.kod));
const belge=kod=>known.has(kod)?String(kod):kod<500?'4xx':'5xx';

export function hataSayfalariPlugin(){
 let base='/',outDir='';
 return {name:'657-hata-sayfalari',enforce:'pre',
  configResolved(config){base=config.base;outDir=resolve(config.root,config.build.outDir);},
  async configurePreviewServer(server){
   const pages=new Map();
   for(const kod of [...known,'4xx','5xx'])pages.set(String(kod),await readFile(resolve(outDir,kod+'.html')));
   const send=(req,res,kod,sayfa=belge(kod))=>{
    const html=pages.get(sayfa);res.statusCode=kod;
    res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Length',html.length);
    for(const [name,value]of Object.entries(hataBasliklari(kod)))if(!res.hasHeader(name))res.setHeader(name,value);
    res.end(req.method==='HEAD'?undefined:html);
   };
   server.middlewares.use((req,res,next)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(!pathname.startsWith(base))return next();
    const path=pathname.slice(base.length);
    // Gerçek API yanıtları uygulama/proxy katmanına aittir.
    if(/^(?:api|_657-servis)(?:\/|$)/.test(path))return next();
    const match=path.match(/^([45]\d{2}|[45]xx)(?:\/(?:index\.html)?|\.html)?$/);
    if(match){const kod=match[1]==='4xx'?400:match[1]==='5xx'?500:Number(match[1]);send(req,res,kod,match[1].endsWith('xx')?match[1]:belge(kod));return;}
    if(!['GET','HEAD','OPTIONS'].includes(req.method)){send(req,res,405);return;}
    next();
   });
   return ()=>server.middlewares.use((req,res,next)=>{
    const end=res.end;
    res.end=function(...args){
     const kod=this.statusCode;
     const json=String(this.getHeader('Content-Type')??'').toLowerCase().includes('json');
     if(kod>=400&&kod<=599&&!this.headersSent&&!json){
      const html=pages.get(belge(kod));this.setHeader('Content-Type','text/html; charset=utf-8');
      this.setHeader('Content-Length',html.length);
      for(const [name,value]of Object.entries(hataBasliklari(kod)))if(!this.hasHeader(name))this.setHeader(name,value);
      return end.call(this,req.method==='HEAD'?undefined:html);
     }
     return end.apply(this,args);
    };
    next();
   });
  }
 };
}
export async function hataSayfalariniHazirla(dir){
 for(const kod of [...known,'4xx','5xx']){
  if([404,500].includes(kod))continue;
  await copyFile(new URL(kod+'/index.html',dir),new URL(kod+'.html',dir));
 }
 await hataSunucuAyariniHazirla();
}
export async function hataSunucuAyariniHazirla(){
 const lines=['# Ortak hata-durumlari.json kaydından üretilir; elle düzenlemeyin.',
  '# Yalnız yeni Astro statik sitesinin server bloğunda, root dist/ olacak şekilde kullanın.',
  '# Mevcut WordPress üzerinde etkinleştirilmez. API JSON yanıtlarında proxy_intercept_errors off kalmalıdır.'];
 for(const kod of known){
  lines.push(`error_page ${kod} /${kod}.html;`,`location = /${kod}.html {`,
   '    internal;','    add_header Cache-Control "no-store" always;','    add_header X-Robots-Tag "noindex" always;',
   ...([429,503].includes(kod)?['    add_header Retry-After "60" always;']:[]),'}',`location = /${kod}/ { return ${kod}; }`);
 }
 for(const group of [4,5]){
  const codes=Array.from({length:100},(_,i)=>group*100+i).filter(k=>!known.has(k)&&![444,499].includes(k));
  lines.push(`error_page ${codes.join(' ')} /${group}xx.html;`,`location = /${group}xx.html {`,
   '    internal;','    add_header Cache-Control "no-store" always;','    add_header X-Robots-Tag "noindex" always;','}',
   `location = /${group}xx/ { error_page ${group*100} /${group}xx.html; return ${group*100}; }`);
 }
 lines.push('# 444 ve 499 bağlantı kapanmasını ifade eder; kapalı bağlantıya HTML gönderilemez.','');
 await writeFile(new URL('../deploy/nginx-static-errors.conf',import.meta.url),lines.join('\n'));
}
