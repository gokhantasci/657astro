import raw from '../data/haberler.json' with {type:'json'};
import {yayinDisi} from './yayin-filtresi';
export const kurumHaberleri=[...new Map(raw.filter(h=>h.source==='Personel'||!yayinDisi(h.title)).map(h=>[h.source==='Personel'?h.url:h.title,h])).values()].sort((a,b)=>b.date.localeCompare(a.date));
export const haberKaynaklari=[...new Set(kurumHaberleri.map(h=>h.source))];
export const kaynakSlug=(s:string)=>s.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]+/g,'-');
export const HABER_SAYFA_BOYU=30;
export const haberArsivYolu=(kaynak='',sayfa=1)=>`/kurum-haberleri/${kaynak?kaynakSlug(kaynak)+'/':''}${sayfa>1?sayfa+'/':''}`;
export const haberArsivleri=['',...haberKaynaklari].flatMap(kaynak=>{
 const rows=kurumHaberleri.filter(h=>!kaynak||h.source===kaynak),toplam=Math.max(1,Math.ceil(rows.length/HABER_SAYFA_BOYU));
 return Array.from({length:toplam},(_,i)=>({kaynak,sayfa:i+1,toplam,adet:rows.length,haberler:rows.slice(i*HABER_SAYFA_BOYU,(i+1)*HABER_SAYFA_BOYU),path:haberArsivYolu(kaynak,i+1)}));
});
