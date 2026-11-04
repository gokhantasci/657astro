import {z} from 'zod';
import raw from '../data/katsayi-gecmisi.json' with {type:'json'};
import {ayarlar} from './settings';
const schema=z.array(z.object({baslangic:z.iso.date(),bitis:z.iso.date(),aylik:z.number().positive(),taban:z.number().positive(),yanOdeme:z.number().positive(),kaynak:z.url()}));
const current=ayarlar.donemler.map(d=>({baslangic:d.baslangic,bitis:d.bitis,aylik:d.memur_maas_aylik_katsayi,taban:d.taban_aylik_katsayi,yanOdeme:d.yan_odeme_katsayi,kaynak:d.kaynak}));
export const katsayiGecmisi=schema.parse([...raw.filter(d=>!current.some(c=>c.baslangic===d.baslangic)),...current]).sort((a,b)=>a.baslangic.localeCompare(b.baslangic));
for(let i=0;i<katsayiGecmisi.length;i++){const d=katsayiGecmisi[i];if(d.bitis<d.baslangic||i&&d.baslangic<=katsayiGecmisi[i-1].bitis)throw Error('Geçmiş katsayı dönemleri çakışıyor.');}
export type GecmisKatsayi=typeof katsayiGecmisi[number];
/** Dönem bordrosundaki göstergeler üzerinden brüt bileşen hesabı; net maaş diye sunulmaz. */
export function katsayiBilesenleri(k:GecmisKatsayi,g:{gosterge:number;ekGosterge:number;hizmet:number;yanOdeme:number;ozelHizmet:number;ekOdeme:number}){
 if(Object.values(g).some(x=>!Number.isFinite(x)||x<0))throw Error('Göstergeleri ve oranları sıfır veya pozitif sayı girin.');
 if(!Number.isInteger(g.hizmet)||g.hizmet>60)throw Error('Hizmet yılını 0–60 arasında tam sayı girin.');
 const r=(x:number)=>Math.round((x+1e-8)*100)/100;
 const satirlar=[{ad:'Gösterge aylığı',tutar:r(g.gosterge*k.aylik)},{ad:'Ek gösterge aylığı',tutar:r(g.ekGosterge*k.aylik)},{ad:'Taban aylığı',tutar:r(1000*k.taban)},{ad:'Kıdem aylığı',tutar:r(Math.min(25,g.hizmet)*20*k.aylik)},{ad:'Yan ödeme',tutar:r(g.yanOdeme*k.yanOdeme)},{ad:'Özel hizmet tazminatı',tutar:r(9500*k.aylik*g.ozelHizmet/100)},{ad:'Ek ödeme',tutar:r(9500*k.aylik*g.ekOdeme/100)}];
 return {satirlar,toplam:r(satirlar.reduce((a,b)=>a+b.tutar,0))};
}
