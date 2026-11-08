import rehber from '../data/idari-yargi-rehberi.json' with {type:'json'};
import geo from '../data/yargi-haritasi.json' with {type:'json'};
import {normalize} from './normalize';

const mahkemeler=rehber.mahkemeler;
export const idariYargiKaynagi={url:rehber.kaynak,sayfa:rehber.kaynakSayfa,tarih:rehber.kaynakTarihi};
const ayni=(a:string,b:string)=>normalize(a)===normalize(b);
export const idariIller=Object.values(geo.iller).map(il=>{
 const kendi=mahkemeler.find(m=>m.tur==='idare'&&ayni(m.merkez,il.ad));
 const hizmet=(tur:'idare'|'vergi')=>{
  const yerel=mahkemeler.filter(m=>m.tur===tur&&m.faal&&ayni(m.merkez,il.ad));
  const adaylar=yerel.length?yerel:mahkemeler.filter(m=>m.tur===tur&&m.faal&&m.ekIller.some(a=>ayni(a,il.ad)));
  if(adaylar.length!==1)throw new Error(`${il.ad}: ${tur} mahkemesi tekil eşleşmedi.`);
  return adaylar[0];
 };
 const idare=hizmet('idare'),vergi=hizmet('vergi');
 if(kendi&&!ayni(kendi.bim,idare.bim))throw new Error(`${il.ad}: idare mahkemesi/BİM çevresi uyuşmuyor.`);
 const durum=kendi?(kendi.faal?'faal':'faal-degil'):'yok';
 return {il:il.ad,plaka:il.plaka,durum,
  durumMetni:kendi?`${kendi.merkez} İdare Mahkemesi — ${kendi.faal?'faal':'HSK rehberinde faal değil (FD)'}`:'İlde kurulu idare mahkemesi rehberde yer almıyor',
  idareMahkemesi:`${idare.merkez} İdare Mahkemesi`,vergiMahkemesi:`${vergi.merkez} Vergi Mahkemesi`,
  bim:`${idare.bim} Bölge İdare Mahkemesi`,bimKisa:`${idare.bim} BİM`,kaynak:idariYargiKaynagi,
  cevreKarari:rehber.yargiCevresiKararlari.find(k=>ayni(k.il,il.ad))};
});
export function idariIlBilgisi(il:string){return idariIller.find(k=>ayni(k.il,il));}
