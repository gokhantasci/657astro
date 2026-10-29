import {z} from 'zod';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import raw from '../data/vergi.json' with {type:'json'};
import type {VergiTarifesi} from './vergi';
export const vergiSchema=z.object({yil:z.number().int(),dilimler:z.array(z.object({sinir:z.number().positive().nullable(),oran:z.number().min(0).max(100)})).min(1),asgariBrut:z.number().positive(),isciPrimOrani:z.number().min(0).max(100),damgaOrani:z.number().nonnegative(),engellilikIndirimleri:z.array(z.number().nonnegative()),kaynak:z.array(z.url())}).superRefine((v,c)=>{
 let onceki=0;
 for(const [i,d] of v.dilimler.entries()){
  if(d.sinir===null?i!==v.dilimler.length-1:d.sinir<=onceki)c.addIssue({code:'custom',message:'Vergi dilimleri artan sınırlarla tanımlanmalı.'});
  onceki=d.sinir??Infinity;
 }
 if(v.dilimler.at(-1)?.sinir!==null)c.addIssue({code:'custom',message:'Son vergi dilimi üst sınırsız olmalıdır.'});
});
const folder=resolve('src/data/vergi-arsivleri');
const kayitlar=readdirSync(folder).filter(f=>f.endsWith('.json')).map(f=>vergiSchema.parse(JSON.parse(readFileSync(join(folder,f),'utf8'))));
if(new Set(kayitlar.map(v=>v.yil)).size!==kayitlar.length)throw new Error('Yinelenen vergi arşivi yılı.');
export const guncelVergi=vergiSchema.parse(raw);
export function vergiTarifesi(yil:number):VergiTarifesi{
 const t=guncelVergi.yil===yil?guncelVergi:kayitlar.find(v=>v.yil===yil);
 if(!t)throw new Error(`${yil} yılı için gelir vergisi tarifesi girilmemiş.`);
 return t;
}
