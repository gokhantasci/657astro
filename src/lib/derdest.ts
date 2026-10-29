// Kaynak: 657.com.tr/derdest.html. B sütunundaki yıl, sonraki boş yıl satırlarında sürer.
// TOPLAM sütunu ve sağı dosya numarası değildir. Yalnız dolu hücreler gezilir;
// biçimlendirilmiş boş satır/sütunlar büyük bir dikdörtgen diziye dönüştürülmez.
export interface EsasDosya {yil:number;numara:number}
export interface DerdestVerisi {dosyalar:EsasDosya[];beklenen:Record<string,number>;genelToplam:number|null;sayfalar:string[]}
interface Kitap {SheetNames:string[];Sheets:Record<string,Record<string,unknown>>}
const metin=(v:unknown)=>String(v??'').replace(/\u00a0/g,' ').trim();
const sayi=(v:unknown)=>{const s=metin(v).replace(/\s/g,'');const n=Number(s);return /^\d+(\.0+)?$/.test(s)&&Number.isSafeInteger(n)&&n>0?n:null;};
function satirlariOku(sheet:Record<string,unknown>){
 const rows=new Map<number,Map<number,unknown>>();
 for(const [adres,cell] of Object.entries(sheet)){
  const a=adres.match(/^([A-Z]+)([1-9]\d*)$/);if(!a||!cell||typeof cell!=='object'||!('v'in cell))continue;
  let col=0;for(const ch of a[1])col=col*26+ch.charCodeAt(0)-64;
  const r=Number(a[2]);if(!rows.has(r))rows.set(r,new Map());rows.get(r)!.set(col-1,(cell as {v:unknown}).v);
 }
 return [...rows].sort(([a],[b])=>a-b).map(([,cells])=>new Map([...cells].sort(([a],[b])=>a-b)));
}
export function derdestOku(kitap:Kitap):DerdestVerisi{
 const parcalar=[];
 for(const ad of kitap.SheetNames){
  const rows=satirlariOku(kitap.Sheets[ad]??{});let sinir=Infinity,yil:number|null=null,grand:number|null=null;
  for(const cells of rows)for(const [c,v] of cells)if(c>=2&&metin(v).toLocaleLowerCase('tr-TR')==='toplam')sinir=Math.min(sinir,c);
  const found:EsasDosya[]=[],expected:Record<string,number>={};
  for(const cells of rows){
   const footer=[...cells].find(([,v])=>/^toplam\s+dosya/i.test(metin(v))||/^genel\s+toplam/i.test(metin(v)));
   if(footer){for(const [c,v] of cells)if(c>footer[0]&&sayi(v)!==null){grand=sayi(v);break;}continue;}
   if(/^(19|20)\d{2}(\.0+)?$/.test(metin(cells.get(1))))yil=Number(metin(cells.get(1)).slice(0,4));
   if(yil===null)continue;
   for(const [c,v] of cells){const n=sayi(v);if(c>=2&&c<sinir&&n!==null)found.push({yil,numara:n});}
   if(sinir!==Infinity)for(const [c,v] of cells)if(c>=sinir&&sayi(v)!==null){expected[yil]=(expected[yil]??0)+sayi(v)!;break;}
  }
  if(found.length)parcalar.push({ad,found,expected,grand});
 }
 const dosyalar=parcalar.flatMap(p=>p.found),beklenen:Record<string,number>={};
 const yillar=[...new Set(dosyalar.map(d=>d.yil))];
 for(const y of yillar){const ilgili=parcalar.filter(p=>p.found.some(d=>d.yil===y));if(ilgili.every(p=>p.expected[y]!==undefined))beklenen[y]=ilgili.reduce((s,p)=>s+p.expected[y],0);}
 // Eksik toplamı olan bir sayfa, diğer sayfaların toplamına bakılarak doğrulanmış sayılmaz.
 const genelToplam=!parcalar.length?null:parcalar.every(p=>p.grand!==null)?parcalar.reduce((s,p)=>s+p.grand!,0):yillar.every(y=>beklenen[y]!==undefined)?Object.values(beklenen).reduce((s,n)=>s+n,0):null;
 return {dosyalar,beklenen,genelToplam,sayfalar:parcalar.map(p=>p.ad)};
}
export function derdestListe(dosyalar:EsasDosya[],sirala:boolean,tekil:boolean){
 const seen=new Set<string>();const liste=dosyalar.filter(d=>{const key=`${d.yil}/${d.numara}`;if(tekil&&seen.has(key))return false;seen.add(key);return true;});
 if(sirala)liste.sort((a,b)=>a.yil-b.yil||a.numara-b.numara);
 return liste.map(d=>`${d.yil}/${d.numara}`);
}
