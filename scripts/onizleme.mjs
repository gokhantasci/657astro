import {preview,loadEnv} from 'vite';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {hataSayfalariPlugin} from './hata-sayfalari.mjs';
import {paylasimPlugin} from './paylasim-yollari.mjs';
import {hataDurumlari} from '../src/lib/hata-durumlari.ts';

const args=process.argv.slice(2);
const option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const root=process.cwd(),outDir=resolve(root,option('--outDir','dist'));
const port=Number(option('--port','4322'));
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Geçerli bir önizleme portu girin.');
if([...hataDurumlari.map(h=>h.kod),'4xx','5xx'].some(k=>!existsSync(resolve(outDir,k+'.html'))))throw Error('Önce npm run build çalıştırın.');
const base=process.env.BASE_PATH||loadEnv('production',root,'BASE_PATH').BASE_PATH||'/';
const server=await preview({configFile:false,root,base,appType:'mpa',
 build:{outDir},preview:{host:'127.0.0.1',port,strictPort:true},plugins:[paylasimPlugin(),hataSayfalariPlugin()]});
server.printUrls();
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{server.close().finally(()=>process.exit(0));});
