import {normalize} from './normalize';
export interface KonsoloslukKaydi{ulke:string;temsilcilik:string;bolge:string;sehir:string;posta:string;}
const kod=(s:string)=>String(s).replace(/\s/g,'').toUpperCase();
export function postaEslesir(query:string,source:string){
 const q=kod(query);if(!q)return true;
 return kod(source).split(/[,;]/).some(part=>{
  if(q===part)return true;
  const range=part.match(/^([A-Z]*)(\d+)[–-]([A-Z]*)(\d+)$/),value=q.match(/^([A-Z]*)(\d+)$/);
  if(!range||!value)return false;
  const prefix=range[1],lastPrefix=range[3]||prefix;
  return prefix===lastPrefix&&value[1]===prefix&&Number(value[2])>=Number(range[2])&&Number(value[2])<=Number(range[4]);
 });
}
export function konsoloslukAra(rows:KonsoloslukKaydi[],ulke:string,posta:string,ara=''){
 if(!ulke)return [];
 const q=normalize(ara);
 return rows.filter(r=>r.ulke===(ulke==='__BOS__'?'':ulke)&&postaEslesir(posta,r.posta)&&(!q||normalize([r.temsilcilik,r.bolge,r.sehir].join(' ')).includes(q)));
}
