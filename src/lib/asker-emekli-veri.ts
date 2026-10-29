import {z} from 'zod';
import raw from '../data/asker-emekli.json' with {type:'json'};
const n=z.number().nonnegative();
export const askerVeri=z.object({tarih:z.iso.date(),kaynak:z.url(),rutbeler:z.array(z.object({id:z.string(),ad:z.string(),kosullar:z.array(z.string()),dereceler:z.record(z.string(),n),makam:n,gorev:n,temsil:n,kadrosuzluk:n}))}).parse(raw);
if(new Set(askerVeri.rutbeler.map(u=>u.id)).size!==askerVeri.rutbeler.length)throw new Error('Yinelenen asker emekli rütbesi.');
