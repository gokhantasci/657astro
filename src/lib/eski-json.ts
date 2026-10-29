import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import yollar from '../data/eski-json-manifest.json' with {type:'json'};
import {ayarlar} from './settings';
import tatiller from '../data/tatiller.json' with {type:'json'};
import tebligat from '../data/tebligat-ucretleri.json' with {type:'json'};
import yolluk from '../data/yolluk.json' with {type:'json'};
export {yollar as eskiJsonYollari};
export function eskiJson(yol:string){
 if(!yollar.includes(yol))throw new Error('Bilinmeyen uyumluluk verisi.');
 const raw=JSON.parse(readFileSync(join(process.cwd(),'src/data/eski-json',yol),'utf8'));
 if(yol.endsWith('/tatiller.json'))return {data:tatiller.tatiller.map((t,i)=>({id:String(i+1),tur:t.yarim?'2':'1',tarih:t.tarih.split('-').reverse().join('.'),aciklama:t.ad}))};
 if(yol.endsWith('/tebligatlar.json'))return {...raw,version:tebligat.surum,tables:Object.fromEntries(Object.entries(tebligat.tablolar).map(([k,rows])=>[k,rows.map(r=>({amount:r.tutar,from:r.baslangic,to:r.bitis}))]))};
 if(yol.endsWith('/veriler.json')){
  const g=yolluk.gundelikler;raw[0].yolluk[yolluk.yil]={mudur:g[1].tutar,birden4dereceyekadar:g[1].tutar,besvesonrasi:g[0].tutar};
 }
 if(yol.endsWith('/katsayilar.json')){
  const d=[...ayarlar.donemler].sort((a,b)=>b.baslangic.localeCompare(a.baslangic))[0];
  const suan=raw.find((r:{durum:string})=>r.durum==='suan');
  Object.assign(suan,{aylik_katsayi:d.memur_maas_aylik_katsayi,taban_ayligi_katsayi:d.taban_aylik_katsayi,yan_odeme_katsayi:d.yan_odeme_katsayi,gelir_vergisi_istisna:d.gelir_vergisi_istisna,damga_vergisi_istisna:d.damga_vergisi_istisna,asgari_ucret:d.asgari_ucret});
 }
 return raw;
}
