// Yalnız öneri üretir; site/Worker/yönlendirme kaydına yazmaz.
import fs from 'node:fs';import path from 'node:path';
const out=path.resolve(process.argv[2]);const read=p=>JSON.parse(fs.readFileSync(path.join(out,p),'utf8'));
const latest=new Map(fs.readFileSync(path.join(out,'http.jsonl'),'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).map(x=>[decodeURIComponent(new URL(x.url).pathname),x]));
const known=new Set(read('manifest.json').map(x=>decodeURIComponent(new URL(x.url).pathname)));
const log=read('origin-404-live.json');
const candidates=new Map(log.filter(x=>x.status===404).map(x=>[x.path,{path:x.path,requests:x.requests}]));
for(const x of latest.values())if(x.kind==='legacy'&&x.status===404)candidates.set(new URL(x.url).pathname,{path:new URL(x.url).pathname,requests:0});
const plan=[];
const fixed={'/kesinleşme/':'/kesinlesme/','/tuketici-hakem-heyeti-bilirkisi-ucreti-hesaplama/':'/tuketici-hakem-heyeti-bilirkisi-ucret-hesaplama/','/https-657-com-tr-enflasyon-farki-hesaplama-robotu/':'/enflasyon-farki-hesaplama-robotu/'};
for(const x of candidates.values()){
 let p=decodeURIComponent(x.path),target=fixed[p],action='İçerik kararı',reason='İlgili içerik veya gerçek eşdeğer hedef incelenmeli; ana sayfaya toplu yönlendirme yapılmamalı.';
 if(!target&&p.startsWith('/kelimeler/')){const exact=p.replace('/kelimeler/','/kelime/');const base=exact.replace(/-2\/$/,'/');if(known.has(exact))target=exact;else if(known.has(base))target=base;reason='Eski sözlük yolunun mevcut terim karşılığı var; -2 kopyasının anlamı eşleşmeli.';}
 if(!target&&p.startsWith('/adlicevre/')){const t=p.replace('-adli-yargi-cevresi/','-adliyesi-yargi-cevresi/');if(known.has(t))target=t;}
 if(p==='/kelime/arazi-i-mezru\u0091a-ne-demek/'){target='/kelime/arazi-i-mezrua-ne-demek/';reason='Eski adreste bozuk karakter var.';}
 if(target){action='301 önerisi';if(reason.startsWith('İlgili'))reason='Mevcut sayfaya ad/yol varyantı.';}
 if(p.includes('/wp-content/uploads/')){action='Görsel kurtarma incelemesi';reason='Eski sunucudaki dosya da 404. Arşivde özgün görsel varsa aynı yola geri konmalı; olmayan görseller alakasız görsele yönlendirilmemeli.';}
 if(['/duyuru.txt','/duyurular.json'].includes(p)){action='Eski uygulama uyumluluğu';reason='Bugünkü istek var; eski istemci bu uç noktaları kullanıyorsa aynı biçimde veri sunulması değerlendirilmeli.';}
 if(p==='/ads.txt'){action='Reklam kullanılıyorsa ekle';reason='Reklam hesabı olmadan ads.txt içeriği uydurulmaz; sayfa taşıma işi değildir.';}
 if(p==='/cagri-karsilama-memuru-maas-2024/'){action='Tarihsel içerik kararı';reason='Eski kuralın hedefi artık yok. 2024 kaydı doğrulanmadan 2025/2026 maaşına yönlendirilmemeli.';}
 if(p==='/posts/vekalet-ucret-2023/'){action='Tarihsel tarife kararı';reason='2023 adresi eski kuralda 2024 tarifesine bağlanmış; doğru yılın içeriği doğrulanmalı.';}
 if(p.includes('adalet-bakanligi-2025-havuz-tayinleri')){action='Kaldırma gerekçesini incele';reason='Eski yönlendirme hedefi kategori. Kişisel içerik nedeniyle kaldırıldıysa 410; aksi halde uygun içerik kararı.';}
 plan.push({...x,decoded:p,action,target:target||'',targetStatus:target?latest.get(target)?.status??null:null,reason});
}
const esc=v=>'"'+String(v??'').replaceAll('"','""')+'"';const keys=['path','requests','action','target','targetStatus','reason'];
fs.writeFileSync(path.join(out,'tasima-onerileri.csv'),'\ufeff'+[keys.map(esc).join(','),...plan.map(x=>keys.map(k=>esc(x[k])).join(','))].join('\n'));
fs.writeFileSync(path.join(out,'tasima-onerileri.json'),JSON.stringify(plan,null,1));
// Yönlendirmelerin hedef yolunu doğrula. Sorgu ve fragment istemci filtreleri ayrıca anlamsal değerlendirme gerektirir.
const targets=new Map();for(const x of latest.values())if(x.status>=300&&x.status<400&&x.location){const u=new URL(x.location,x.url);u.search='';u.hash='';if(u.origin==='https://657.com.tr')targets.set(u.href,{url:u.href});}
for(const x of log)if(x.status>=300&&x.status<400&&x.location){const u=new URL(x.location,'https://657.com.tr');u.search='';u.hash='';if(u.origin==='https://657.com.tr')targets.set(u.href,{url:u.href});}
const list=[...targets.values()];let cursor=0;
async function worker(){while(cursor<list.length){const x=list[cursor++];const existing=latest.get(decodeURIComponent(new URL(x.url).pathname));if(existing?.status===200){x.status=200;x.evidence='crawl';continue;}try{const r=await fetch(x.url,{signal:AbortSignal.timeout(25000)});x.status=r.status;x.finalUrl=r.url;await r.body?.cancel();}catch(e){x.error=e.message;}}}
await Promise.all(Array.from({length:4},worker));fs.writeFileSync(path.join(out,'yonlendirme-hedefleri.json'),JSON.stringify(list,null,1));
console.log(JSON.stringify({proposals:plan.length,redirectProposals:plan.filter(x=>x.action==='301 önerisi').length,targets:list.length,badTargets:list.filter(x=>x.status!==200)},null,1));
