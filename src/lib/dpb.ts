import raw from '../data/dpb-gorusleri.json' with {type:'json'};
export const dpbGorusleri=raw;
export const dpbYol=(id:string)=>`/dpb-gorusleri/${id}/`;

// Aynı görüşün iki PDF kopyası: başlığı aynı olan kayıtlarda ilki asıl, sonrakiler kopyadır (noindex, site haritası dışı).
const ilkKayit=new Map<string,string>();for(const g of raw)if(!ilkKayit.has(g.baslik))ilkKayit.set(g.baslik,g.id);
export const dpbKopyaMi=(g:{id:string;baslik:string})=>ilkKayit.get(g.baslik)!==g.id;
// Konusu boş başlık ("(09/04/2010-5663)") metnin ilk cümlesiyle tamamlanır.
export const dpbBaslik=(g:{id?:string;baslik:string;metin:string})=>g.id==='dpb_mutalaa_ozel'?'Mütalaalar Özel Bülteni · Temmuz 2013':/^\(\d/.test(g.baslik.trim())?`${g.metin.replace(/\s+/g,' ').trim().slice(0,90).replace(/\s+\S*$/,'')}… ${g.baslik.trim()}`:g.baslik;

// Görüş künyesi: başlıktaki "(04/06/2014-2768)", "( 14.3.2001-21.bülten…)" ya da "(15923, 06/09/2005)" kalıplarından tarih ve sayı.
// Tarih ya da sayı başlıkta yoksa o satır gösterilmez; tahmin yapılmaz.
const iki=(n:string)=>n.padStart(2,'0');
export function dpbTarihSayi(baslik:string):{tarih?:string;sayi?:string}{
 const t=baslik.replace(/ /g,' ');
 const m=[...t.matchAll(/(\d{1,2})[./](\d{1,2})[./](\d{4})/g)].at(-1);
 if(!m)return {};
 const [g,a,y]=[+m[1],+m[2],+m[3]];
 const d=new Date(Date.UTC(y,a-1,g));
 if(y<1980||y>2030||d.getUTCMonth()!==a-1||d.getUTCDate()!==g)return {};
 const sonra=t.slice(m.index!+m[0].length).match(/^\s*-\s*(\d{2,6})\b(?!\.\s*b[üu]lten)/i);
 const once=t.slice(0,m.index).match(/\(\s*(\d{3,6})\s*,\s*$/);
 return {tarih:`${y}-${iki(m[2])}-${iki(m[1])}`,sayi:sonra?.[1]??once?.[1]};
}
export function dpbKunye(g:{baslik:string;sayfa?:number;kaynak:string}){
 const {tarih,sayi}=dpbTarihSayi(g.baslik);
 const bulten=g.baslik.match(/(\d+)\.\s*b[üu]lten/i)?.[1];
 return {tarih,sayi,bulten,sayfa:g.sayfa};
}
