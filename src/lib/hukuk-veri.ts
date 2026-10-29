import {z} from 'zod';
import raw from '../data/hukuk-tarifeleri.json' with {type:'json'};
const n=z.number().nonnegative(),tarih=z.iso.date();
const tarihler={baslangic:tarih,bitis:tarih.nullable(),kaynak:z.url()};
export const hukukTarifeleri=z.object({
 harclar:z.array(z.object({...tarihler,maktu:n,basvuruAsliye:n,basvuruSulh:n,istinafBasvuru:n,temyizBasvuru:n,temyizMaktu:n,nisbiBinde:n,nafakaBinde:n,pesinPayda:z.number().positive(),cismaniPesinPayda:z.number().positive()})),
 vekalet:z.array(z.object({...tarihler,maneviSinirKalkis:tarih,basamaklar:z.array(z.object({miktar:z.number().positive().nullable(),oran:n.max(100)})),mahkemeler:z.array(z.object({id:z.string(),ad:z.string(),maktu:n}))}))
}).parse(raw);
export function hukukTarifeSec(t:string){
 const h=hukukTarifeleri.harclar.find(d=>d.baslangic<=t&&(!d.bitis||d.bitis>=t));
 const v=[...hukukTarifeleri.vekalet].reverse().find(d=>d.baslangic<=t&&(!d.bitis||d.bitis>=t));
 if(!h||!v)throw new Error('Bu tarih için doğrulanmış harç ve vekâlet tarifesi yok.');
 return {h,v};
}
