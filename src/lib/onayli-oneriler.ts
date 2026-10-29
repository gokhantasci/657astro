import {readdirSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {z} from 'zod';

export const onayliOneriSchema=z.object({id:z.uuid(),tur:z.enum(['sozluk','mulakat']),slug:z.string().regex(/^[a-z0-9-]+$/).max(160),baslik:z.string().min(2).max(200),aciklama:z.string().min(2).max(3000),kaynak:z.string().max(300),tarih:z.iso.date()}).strict();
const klasor=resolve('src/data/onayli-oneriler');
export const onayliOneriler=readdirSync(klasor).filter(f=>f.endsWith('.json')).sort().map(f=>onayliOneriSchema.parse(JSON.parse(readFileSync(join(klasor,f),'utf8'))));
if(new Set(onayliOneriler.map(o=>o.id)).size!==onayliOneriler.length)throw new Error('Yinelenen öneri kaydı.');
