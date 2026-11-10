/** Worker hata adını korumaz; WebLLM hatayı metin olarak iletir. */
export function kotaHatasi(hata:unknown,derinlik=0):boolean{
 if(derinlik>4)return false;
 if(typeof hata==='string')return /QuotaExceededError|quota\s+(?:has\s+been\s+)?exceeded/i.test(hata);
 if(!hata||typeof hata!=='object')return false;
 const h=hata as {name?:unknown;message?:unknown;cause?:unknown;error?:unknown};
 return [h.name,h.message,h.cause,h.error].some(v=>kotaHatasi(v,derinlik+1));
}
export const MB=(n:number)=>Math.round(n/1048576).toLocaleString('tr-TR');
/** WebLLM 0.2.86: yalnız bu modelin URL'leri; temizlik sırasında indirme yapılmaz. */
export async function modelOnbelleginiTemizle(base:string,backend:'cache'|'opfs',files:string[]){
 const prefix=new URL('./',base).href;
 const scopes=['webllm/model','webllm/config','webllm/wasm'];
 if(backend==='cache'){
  for(const name of await caches.keys())if(scopes.includes(name)){
   const cache=await caches.open(name);
   for(const req of await cache.keys())if(req.url.startsWith(prefix))await cache.delete(req);
  }
 }else{
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
