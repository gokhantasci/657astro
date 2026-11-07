import {test,expect} from '@playwright/test';
import {kotaHatasi,depolamaHazirla} from '../src/lib/asistan-depolama';
import model from '../src/data/asistan-modeli.json' with {type:'json'};

test('kota hatası Worker metni, DOMException ve iç içe hata olarak tanınır',()=>{
 for(const e of ['QuotaExceededError: Quota exceeded.',new DOMException('Quota exceeded.','QuotaExceededError'),{cause:{error:'QuotaExceededError: Failed to execute add on Cache'}}])expect(kotaHatasi(e)).toBe(true);
 expect(kotaHatasi('TypeError: Failed to fetch')).toBe(false);
 const cycle:{cause?:unknown}={};cycle.cause=cycle;expect(kotaHatasi(cycle)).toBe(false);
});

test('alan yetersizse yalnız model temizliği denenir; ölçüm yoksa sahte sıfır üretilmez',async()=>{
 let temizlenen=0;const temizle=async()=>{temizlenen++;};
 await expect(depolamaHazirla(360_000_000,temizle,{estimate:async()=>({quota:500,usage:490})})).rejects.toMatchObject({name:'DepolamaYetersiz'});
 expect(temizlenen).toBe(1);
 await depolamaHazirla(360_000_000,temizle,{estimate:async()=>({})});
 await depolamaHazirla(360_000_000,temizle,{estimate:async()=>{throw Error('izin yok');}});
 expect(temizlenen).toBe(1);
});

test('OPFS temizliği yalnız model dosyalarını kaldırır; diğer modeller korunur',async({page})=>{
 await page.goto('/asistan/');
 const result=await page.evaluate(async()=>{
  const modulePath='/src/lib/asistan-depolama.ts';const {modelOnbelleginiTemizle}=await import(/* @vite-ignore */ modulePath);
  const base=location.origin+'/modeller/resolve/test-model/';
  const root=await navigator.storage.getDirectory();let dir=root;
  for(const name of ['tvmjs-opfs-store','webllm','model'])dir=await dir.getDirectoryHandle(name,{create:true});
  const hash=async(url:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(url))),b=>b.toString(16).padStart(2,'0')).join('');
  const target=await hash(base+'params_shard_0.bin'),other=await hash(location.origin+'/modeller/resolve/other/params_shard_0.bin');
  for(const name of [target+'.bin',target+'.record.json',other+'.bin']){const file=await dir.getFileHandle(name,{create:true});const stream=await file.createWritable();await stream.write('koru');await stream.close();}
  await modelOnbelleginiTemizle(base,'opfs',['params_shard_0.bin']);
  let removed=false;try{await dir.getFileHandle(target+'.bin');}catch(e){removed=(e as DOMException).name==='NotFoundError';}
  let recordRemoved=false;try{await dir.getFileHandle(target+'.record.json');}catch(e){recordRemoved=(e as DOMException).name==='NotFoundError';}
  return {removed,recordRemoved,other:await (await (await dir.getFileHandle(other+'.bin')).getFile()).text()};
 });
 expect(result).toEqual({removed:true,recordRemoved:true,other:'koru'});
});

for(const durum of ['kota','opfs-basarili','opfs-kota','alan-yok','ag-basarili','ag-opfs-basarili'] as const)test(`${durum}: model yükleme ve bağımsız hesaplar`,async({page})=>{
 await page.addInitScript(({durum})=>{
  const w=window as any;w.backends=[];w.terminated=0;w.reloads=0;
  Object.defineProperty(navigator,'gpu',{value:{requestAdapter:async()=>({features:new Set(['shader-f16'])})}});
  Object.defineProperty(navigator.storage,'estimate',{value:async()=>({quota:durum==='alan-yok'?500:4_000_000_000,usage:0})});
  if(durum==='kota')Object.defineProperty(navigator.storage,'getDirectory',{value:undefined});
  class WorkerStub{
   onmessage:any;backend='';
   postMessage(m:any){
    if(m.kind==='setAppConfig'){this.backend=m.content.cacheBackend;w.backends.push(this.backend);}
    if(m.kind==='reload'){w.reloads++;queueMicrotask(()=>this.onmessage(new MessageEvent('message',{data:{uuid:m.uuid,kind:((durum==='opfs-basarili'||durum==='ag-opfs-basarili')&&this.backend==='opfs')||(durum==='ag-basarili'&&w.reloads>1)?'return':'throw',content:durum.startsWith('ag-')?"TypeError: Failed to execute 'add' on 'Cache': NetworkError":'QuotaExceededError: Quota exceeded.'}})));}
   }
   terminate(){w.terminated++;}
  }
  w.Worker=WorkerStub;
 },{durum});
 await page.route('**/modeller/resolve/**/hazir.json',r=>r.fulfill({json:{id:model.id,modelSurumu:model.modelSurumu,bytes:360_000_000,files:Object.fromEntries(['mlc-chat-config.json','model.wasm','tokenizer.json'].map(k=>[k,{hash:'sha256-test'}]))}}));
 await page.goto('/asistan/');
 await page.evaluate(async id=>{
  const site=await caches.open('657-veri-kontrol');await site.put('/korunacak',new Response('site verisi'));
  const models=await caches.open('webllm/model');await models.put('/baska-model/tokenizer.json',new Response('diğer model'));
  await models.put('/modeller/resolve/'+id+'/tokenizer.json',new Response('yarım model'));
  localStorage.setItem('657-kontrol-listesi-test','koru');
 },model.id);
 await page.locator('[data-as-model]').click();
 const status=page.locator('[data-as-model-durum]');
 if(durum==='opfs-basarili'||durum==='ag-basarili'||durum==='ag-opfs-basarili'){
  await expect(status).toHaveText('Model GPU üzerinde hazır. Genel sorularınızı yazabilirsiniz.');
  expect(await page.evaluate(()=>(window as any).backends)).toEqual(durum==='ag-basarili'?['cache','cache']:durum==='ag-opfs-basarili'?['cache','cache','opfs']:['cache','opfs']);
 }else{
  await expect(status).toContainText(durum==='alan-yok'?'İndirme başlatılmadı.':'depolama kotası');
  await expect(status).not.toContainText('Yeniden denemede');
  expect(await page.evaluate(()=>(window as any).backends)).toEqual(durum==='alan-yok'?[]:durum==='kota'?['cache']:['cache','opfs']);
  await expect(page.locator('[data-as-model]')).toBeEnabled();
  await page.getByRole('button',{name:'Yazı işleri müdürü evli 3/1 maaşı',exact:true}).click();
  await expect(page.locator('[data-as-yanitlar]')).toContainText('100.417,53 TL');
 }
 expect(await page.evaluate(async()=>({site:await (await caches.open('657-veri-kontrol')).match('/korunacak').then(Boolean),other:await (await caches.open('webllm/model')).match('/baska-model/tokenizer.json').then(Boolean),checklist:localStorage.getItem('657-kontrol-listesi-test')}))).toEqual({site:true,other:true,checklist:'koru'});
});
