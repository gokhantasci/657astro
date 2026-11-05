import fs from 'node:fs';
import path from 'node:path';
import {parse} from 'parse5';
import {tarihMetni} from '../../src/lib/tarih-metni.ts';
const root=path.resolve(process.argv[2]||'dist'),out=path.resolve('artifacts/tarih-bicimi-denetimi.json');
const files=[];function list(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())list(p);else if(e.name.endsWith('.html'))files.push(p);}}list(root);
const skip=new Set(['script','style','code','pre','textarea']),issues=[];
for(const file of files){
 const doc=parse(fs.readFileSync(file,'utf8'));
 function check(s,where){const after=tarihMetni(s);if(s!==after)issues.push({file:path.relative(root,file),where,before:s.trim().slice(0,180),after:after.trim().slice(0,180)});}
 function walk(n){if(skip.has(n.nodeName))return;if(n.nodeName==='#text')check(n.value,'text');for(const a of n.attrs||[])if(['placeholder','title','aria-label','alt'].includes(a.name))check(a.value,a.name);for(const c of n.childNodes||[])walk(c);}walk(doc);
}
fs.writeFileSync(out,JSON.stringify({pages:files.length,issues},null,2));console.log(JSON.stringify({pages:files.length,issues:issues.length,examples:issues.slice(0,8)}));if(issues.length)process.exitCode=1;
