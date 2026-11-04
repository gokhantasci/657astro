import {z} from 'zod';
import raw from '../data/enflasyon-beklentileri.json' with {type:'json'};
export const beklentiler=z.object({aciklama:z.string(),kaynak:z.url().nullable(),tarih:z.iso.date().nullable(),aylar:z.array(z.object({yil:z.number().int(),ay:z.number().int().min(1).max(12),degisim:z.number().gt(-100).max(100).nullable()}))}).parse(raw);
if(beklentiler.aylar.some(a=>a.degisim!==null)&&(!beklentiler.kaynak||!beklentiler.tarih))throw Error('Ortak beklentinin kaynağı ve tarihi girilmelidir.');
export const aylikBeklenti=(yil:number,ay:number)=>beklentiler.aylar.find(a=>a.yil===yil&&a.ay===ay)?.degisim??undefined;
