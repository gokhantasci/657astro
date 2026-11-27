/** Worker hata adını korumaz; WebLLM hatayı metin olarak iletir. */
export function kotaHatasi(hata:unknown,derinlik=0):boolean{
 if(derinlik>4)return false;
 if(typeof hata==='string')return /QuotaExceededError|quota\s+(?:has\s+been\s+)?exceeded/i.test(hata);
 if(!hata||typeof hata!=='object')return false;
 const h=hata as {name?:unknown;message?:unknown;cause?:unknown;error?:unknown};
 return [h.name,h.message,h.cause,h.error].some(v=>kotaHatasi(v,derinlik+1));
}
export const MB=(n:number)=>Math.round(n/1048576).toLocaleString('tr-TR');
/** WebLLM'in İngilizce yükleme ilerleme metinlerini Türkçeye çevirir. */
export function ilerlemeTurkce(r:{progress?:number;text?:string}):string{
 const metin=(r.text??'').trim();
 const yuzde=Math.max(0,Math.min(100,Math.round((Number.isFinite(r.progress)?r.progress!:0)*100)));
 const parca=metin.match(/\[(\d+\/\d+)\]/);
 const mb=metin.match(/(\d+(?:[.,]\d+)?)\s*MB/i);
 const sure=metin.match(/(\d+)\s*secs?\s*elapsed/i);
 const detay=[parca?.[1],mb?`${mb[1]} MB`:null,`%${yuzde}`,sure?`${sure[1]} sn`:null].filter(Boolean).join(' · ');
 if(/fetching param cache/i.test(metin)){
  return `Model dosyaları indiriliyor (${detay}). İlk indirme tek seferliktir; sonraki açılışlar önbellekten hızlı başlar.`;
 }
 if(/loading model from cache/i.test(metin)){
  return `Model önbellekten yükleniyor (${detay})…`;
 }
 if(/gpu shader|shader module/i.test(metin)){
  return `GPU gölgelendiricileri hazırlanıyor (${detay})…`;
 }
 if(/start to fetch/i.test(metin)){
  return 'Model dosyaları indirilmeye başlanıyor…';
 }
 if(/finish loading/i.test(metin)){
  return 'Model GPU üzerinde başarıyla yüklendi.';
 }
 if(/tokenizer/i.test(metin)){
  return `Dil sözlüğü (tokenizer) yükleniyor (%${yuzde})…`;
 }
 if(/wasm|library/i.test(metin)){
  return `Çalıştırma motoru hazırlanıyor (%${yuzde})…`;
 }
 return yuzde>0?`Model cihazınıza hazırlanıyor (%${yuzde})…`:'Model cihazınıza yükleniyor…';
}
export type AsistanOnbellek='cache'|'opfs'|'indexeddb';
/** WebLLM 0.2.86: yalnız bu modelin URL'leri; temizlik sırasında indirme yapılmaz. */
export async function modelOnbelleginiTemizle(base:string,backend:AsistanOnbellek,files:string[]){
 const prefix=new URL('./',base).href;
 const scopes=['webllm/model','webllm/config','webllm/wasm'];
 if(backend==='cache'){
  if(typeof caches==='undefined')return false;
  for(const name of await caches.keys())if(scopes.includes(name)){
   const cache=await caches.open(name);
   for(const req of await cache.keys())if(req.url.startsWith(prefix))await cache.delete(req);
  }
 }else if(backend==='opfs'){
  if(typeof navigator.storage?.getDirectory!=='function')return false;
  const root=await navigator.storage.getDirectory();
  const urls=[...new Set([...files,'tokenizer.model'].map(f=>new URL(f,prefix).href).filter(u=>u.startsWith(prefix)))];
  const hashes=await Promise.all(urls.map(async url=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(url))),b=>b.toString(16).padStart(2,'0')).join('')));
  for(const scope of scopes){
   let directory=root;
   try{for(const part of ['tvmjs-opfs-store',...scope.split('/')])directory=await directory.getDirectoryHandle(part);}catch(e){if((e as DOMException).name==='NotFoundError')continue;throw e;}
   for(const hash of hashes)for(const ext of ['.bin','.record.json']){
    try{await directory.removeEntry(hash+ext);}catch(e){if((e as DOMException).name!=='NotFoundError')throw e;}
   }
  }
 }else if(backend==='indexeddb'){
  if(typeof indexedDB==='undefined')return false;
  await Promise.all(scopes.map(name=>new Promise<void>(resolve=>{
   try{
    const req=indexedDB.deleteDatabase(name);
    req.onsuccess=()=>resolve();
    req.onerror=()=>resolve();
    req.onblocked=()=>resolve();
   }catch{resolve();}
  })));
 }
 return true;
}
/** Tüm depolama katmanlarındaki (Cache, OPFS, IndexedDB) bu modele ait kalıntıları temizler. */
export async function tumModelOnbellekleriniTemizle(base:string,files:string[]){
 const sonuclar=await Promise.allSettled([
  modelOnbelleginiTemizle(base,'cache',files),
  modelOnbelleginiTemizle(base,'opfs',files),
  modelOnbelleginiTemizle(base,'indexeddb',files),
 ]);
 return sonuclar.some(r=>r.status==='fulfilled'&&r.value);
}
export async function modeliSiraylaOnbellegeAl(
 base:string,
 files:Record<string,{hash?:string;bytes?:number;size?:number}>,
 ilerleme:(p:{indirilmis:number;toplam:number;tamamSayi:number;toplamSayi:number;dosya:string})=>void,
 toplamTahmin=0,
):Promise<boolean>{
 if(typeof caches==='undefined')return false;
 const prefix=new URL('./',base).href;
 const adlar=Object.keys(files).filter(f=>!/^(README\.md|LICENSE|hazir\.json)$/i.test(f));
 if(!adlar.length)return false;
 const boyut=(f:string)=>files[f]?.bytes??files[f]?.size??0;
 const toplam=adlar.reduce((s,f)=>s+boyut(f),0)||toplamTahmin;
 const scopeSec=(f:string)=>f==='mlc-chat-config.json'?'webllm/config':f.endsWith('.wasm')?'webllm/wasm':'webllm/model';
 const acik=new Map<string,Cache>();
 const cacheAl=async(scope:string)=>{let c=acik.get(scope);if(!c){c=await caches.open(scope);acik.set(scope,c);}return c;};
 let indirilmis=0;
 for(let i=0;i<adlar.length;i++){
  const dosya=adlar[i];
  const url=new URL(dosya,prefix).href;
  const beklenen=boyut(dosya);
  const cache=await cacheAl(scopeSec(dosya));
  const mevcut=await cache.match(url);
  if(mevcut){
   const cl=Number(mevcut.headers.get('Content-Length')||0);
   if(!beklenen||cl===beklenen){
    indirilmis+=beklenen||cl;
    ilerleme({indirilmis,toplam,tamamSayi:i+1,toplamSayi:adlar.length,dosya});
    continue;
   }
   await cache.delete(url);
  }
  let ok=false,sonHata:unknown;
  for(let deneme=0;deneme<3;deneme++){
   try{
    const res=await fetch(url,{cache:'default',credentials:'omit'});
    if(!res.ok)throw Error(`HTTP ${res.status}: ${dosya}`);
    const buf=await res.arrayBuffer();
    if(beklenen&&buf.byteLength!==beklenen)throw Error(`Eksik aktarım (${buf.byteLength}/${beklenen} bayt): ${dosya}`);
    const ct=res.headers.get('Content-Type')||(dosya.endsWith('.json')?'application/json':dosya.endsWith('.wasm')?'application/wasm':'application/octet-stream');
    await cache.put(url,new Response(buf,{status:200,headers:{'Content-Type':ct,'Content-Length':String(buf.byteLength)}}));
    indirilmis+=buf.byteLength;
    ok=true;
    break;
   }catch(e){
    sonHata=e;
    if(kotaHatasi(e))throw e;
    await new Promise(r=>setTimeout(r,800*(deneme+1)));
   }
  }
  if(!ok)throw sonHata??Error(`Dosya indirilemedi: ${dosya}`);
  ilerleme({indirilmis,toplam,tamamSayi:i+1,toplamSayi:adlar.length,dosya});
 }
 return true;
}
type Depolama=Partial<Pick<StorageManager,'estimate'|'persist'>>;
export async function depolamaHazirla(gereken:number,modeliTemizle:()=>Promise<unknown>,st:Depolama|undefined=navigator.storage){
 if(!st?.estimate)return;
 const bos=async()=>{
  try{const {quota,usage}=await st.estimate!();return typeof quota==='number'&&typeof usage==='number'&&Number.isFinite(quota)&&Number.isFinite(usage)?Math.max(0,quota-usage):undefined;}catch{return undefined;}
 };
 const pay=(Number.isFinite(gereken)&&gereken>0?gereken:360_000_000)*1.15;
 let kalan=await bos();if(kalan===undefined||kalan>=pay)return;
 try{await st.persist?.();}catch{/* Kalıcılık izni boş alan garantisi değildir. */}
 kalan=await bos();if(kalan===undefined||kalan>=pay)return;
 try{await modeliTemizle();}catch{/* Diğer site verilerine dokunulmaz. */}
 kalan=await bos();if(kalan!==undefined&&kalan<pay){
  const e=Error(`Model için tarayıcı depolama alanı yetersiz: yaklaşık ${MB(pay)} MB gerekir, kullanılabilir alan ${MB(kalan)} MB. Diskte yer açın ve normal tarayıcı penceresinde yeniden deneyin. İndirme başlatılmadı.`);
  e.name='DepolamaYetersiz';throw e;
 }
}
