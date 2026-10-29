import {z} from 'zod';
import raw from '../data/unvan-ek-kurallari.json' with {type:'json'};
import type {MaasParametreleri} from './memur-maas';
const katsayi=z.number().nonnegative();
const aile=z.object({dereceler:z.record(z.string().regex(/^[1-9]\d?$/),z.object({ekGosterge:katsayi,yanOdeme:katsayi,ozelHizmet:katsayi,ekOdeme:katsayi})),adalet:z.boolean(),mezuniyet:z.union([z.literal(1),z.literal(2)]),aciklama:z.string().optional()});
const varyant=z.object({id:z.string().min(1),ad:z.string().min(1),aile:z.string().min(1)});
export const ekUnvanVerisi=z.object({kaynak:z.url(),gozlemTarihi:z.iso.date(),aileler:z.record(z.string(),aile),unvanlar:z.array(z.object({id:z.string(),ad:z.string(),kod:z.number().int().positive(),aile:z.string(),varyantlar:z.array(varyant).optional(),dusuk:z.object({derece:z.string(),hizmetYili:z.number().nonnegative(),mezuniyet:z.union([z.literal(1),z.literal(2)])})}))}).parse(raw);
if(new Set(ekUnvanVerisi.unvanlar.map(u=>u.kod)).size!==ekUnvanVerisi.unvanlar.length)throw new Error('Yinelenen ek unvan kodu.');
export const unvanKurallari:NonNullable<MaasParametreleri['unvanKurallari']>=Object.fromEntries(ekUnvanVerisi.unvanlar.map(u=>{
 const oku=(id:string)=>{const a=ekUnvanVerisi.aileler[id];if(!a)throw new Error('Eksik unvan kuralı: '+id);return a;};
 if(u.varyantlar&&new Set(u.varyantlar.map(v=>v.id)).size!==u.varyantlar.length)throw new Error('Yinelenen unvan koşulu: '+u.ad);
 return [u.kod,{...oku(u.aile),...(u.varyantlar?{varyantlar:Object.fromEntries(u.varyantlar.map(v=>[v.id,{...oku(v.aile),ad:v.ad}]))}:{})}];
}));
