// Model, tokenizer ve WASM birlikte aynı origin altında sunulur. Çalışma anında CDN kullanılmaz.
import {readFile,writeFile,mkdir,stat,rename} from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {resolve,join,basename} from 'node:path';
const config=JSON.parse(await readFile(new URL('../src/data/asistan-modeli.json',import.meta.url),'utf8'));
const root=resolve(process.env.ASISTAN_MODEL_KLASORU||'public/modeller'),folder=join(root,'resolve',config.id);
await mkdir(folder,{recursive:true});
const base=`https://huggingface.co/${config.modelDeposu}/resolve/${config.modelSurumu}/`;
const hash=async file=>{const h=createHash('sha256');for await(const b of createReadStream(file))h.update(b);return 'sha256-'+h.digest('base64');};
let previous={};try{previous=JSON.parse(await readFile(join(folder,'hazir.json'),'utf8'));}catch{}
const files={};
async function download(name,url,expectedBytes){
 if(basename(name)!==name)throw Error('Model dosya adı geçersiz.');
 const file=join(folder,name);
 try{const s=await stat(file);if(previous.files?.[name]?.hash===await hash(file)&&(!expectedBytes||s.size===expectedBytes)){files[name]={hash:previous.files[name].hash,bytes:s.size};return;}}catch{}
 const response=await fetch(url,{signal:AbortSignal.timeout(240000)});if(!response.ok)throw Error(`${name}: HTTP ${response.status}`);
 const tmp=file+'.tmp';await pipeline(Readable.fromWeb(response.body),createWriteStream(tmp));
 const s=await stat(tmp);if(expectedBytes&&s.size!==expectedBytes)throw Error(`${name}: dosya boyutu doğrulanamadı.`);
 files[name]={hash:await hash(tmp),bytes:s.size};await rename(tmp,file);console.log(`${name}: ${s.size} bayt`);
}
await download('tensor-cache.json',base+'tensor-cache.json');
const tensors=JSON.parse(await readFile(join(folder,'tensor-cache.json'),'utf8'));
const names=['mlc-chat-config.json','ndarray-cache.json','tokenizer.json','tokenizer_config.json','vocab.json','merges.txt','README.md'];
for(const name of names)await download(name,base+name);
for(const r of tensors.records)await download(r.dataPath,base+r.dataPath,r.nbytes);
await download('model.wasm',`https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/${config.kutuphaneSurumu}/${config.kutuphaneYolu}`);
await download('LICENSE','https://huggingface.co/Qwen/Qwen3-0.6B/resolve/main/LICENSE');
const result={id:config.id,lisans:config.lisans,modelSurumu:config.modelSurumu,kutuphaneSurumu:config.kutuphaneSurumu,bytes:Object.values(files).reduce((s,f)=>s+f.bytes,0),files};
await writeFile(join(folder,'hazir.json'),JSON.stringify(result,null,1)+'\n');
console.log(`Model hazır: ${Math.ceil(result.bytes/1024/1024)} MB. ${folder}`);
