export interface ModelManifest{ id:string;modelSurumu:string;files:Record<string,{hash:string}>; }
export async function modelKaynagi(bases:string[],id:string,surum:string,request:typeof fetch=fetch){
 let last='Model dosyaları alınamadı.';
 for(const base of [...new Set(bases)]){
  try{
   const response=await request(base+'hazir.json',{cache:'no-cache',signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error(`Model dosyaları bulunamadı (HTTP ${response.status}).`);
   const ready=await response.json() as ModelManifest;
   if(ready.id!==id||ready.modelSurumu!==surum)throw Error('Model dosyalarının sürümü uyuşmuyor.');
   if(['mlc-chat-config.json','model.wasm','tokenizer.json'].some(k=>typeof ready.files?.[k]?.hash!=='string'||!ready.files[k].hash))throw Error('Model dosya listesi eksik.');
   return {base,ready};
  }catch(e){last=(e as Error).name==='TimeoutError'?'Model sunucusu zamanında yanıt vermedi.':(e as Error).message;}
 }
 throw Error(last+' Site araması ve hesaplar kullanılabilir.');
}
