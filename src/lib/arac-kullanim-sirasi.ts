import veri from '../data/arac-kullanim-sirasi.json';
import type {Arac} from './tools';
export const kullanimSayilari:Record<string,number>=Object.assign({},...Object.values(veri.kaynaklar).map(k=>k.sayilar));
export const siralamaTarihi=Object.values(veri.kaynaklar).map(k=>k.tarih).sort()[0];
export const kullanimSirasi=(liste:Arac[])=>[...liste].sort((a,b)=>(kullanimSayilari[b.id]??0)-(kullanimSayilari[a.id]??0)||a.title.localeCompare(b.title,'tr')||a.id.localeCompare(b.id));
