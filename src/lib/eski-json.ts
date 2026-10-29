import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import yollar from '../data/eski-json-manifest.json' with {type:'json'};
import {ayarlar} from './settings';
import tatiller from '../data/tatiller.json' with {type:'json'};
import tebligat from '../data/tebligat-ucretleri.json' with {type:'json'};
import yolluk from '../data/yolluk.json' with {type:'json'};
import {hukukTarifeSec} from './hukuk-veri';
export {yollar as eskiJsonYollari};
export function eskiJson(yol:string){
 if(!yollar.includes(yol))throw new Error('Bilinmeyen uyumluluk verisi.');
 const raw=JSON.parse(readFileSync(join(process.cwd(),'src/data/eski-json',yol),'utf8'));
 if(yol.endsWith('/tatiller.json'))return {data:tatiller.tatiller.map((t,i)=>({id:String(i+1),tur:t.yarim?'2':'1',tarih:t.tarih.split('-').reverse().join('.'),aciklama:t.ad}))};
 if(yol.endsWith('/tebligatlar.json'))return {...raw,version:tebligat.surum,tables:Object.fromEntries(Object.entries(tebligat.tablolar).map(([k,rows])=>[k,rows.map(r=>({amount:r.tutar,from:r.baslangic,to:r.bitis}))]))};
 if(yol.endsWith('/veriler.json')){
  const g=yolluk.gundelikler;raw[0].yolluk[yolluk.yil]={mudur:g[1].tutar,birden4dereceyekadar:g[1].tutar,besvesonrasi:g[0].tutar};
  const {h,v}=hukukTarifeSec('2026-01-08');
  raw[0].harclar['2026'].asliye.asgarivekalet=v.mahkemeler.find(m=>m.id==='asliye')!.maktu;
  raw[0].harclar['2026'].asliye.maktu=h.maktu;
  raw[0].harclar['2026'].aile.asgarivekalet=v.mahkemeler.find(m=>m.id==='aile')!.maktu;
  raw[0].harclar['2026'].kesif.kesif=tebligat.tablolar.kesifharci.find(r=>r.baslangic==='2026-01-01')!.tutar;
 }
 if(yol.endsWith('/nispivekalet.json')){
  const {v}=hukukTarifeSec('2026-01-08');
  const ids:Record<string,string>={asliye:'asliye',icra_takip:'icra-takip',icra_mah_takip:'icra-is',icra_mah_durusmali:'icra-durusmali',tahliye:'icra-tahliye',sulh:'sulh',tuketici:'tuketici',fikri:'fikri',agir_ceza:'agir-ceza',idare_durusmasz:'idare-durusmasiz',idare_durusmali:'idare-durusmali',bolge_ilk:'bolge-ilk',bolge_istinaf_1:'bolge-istinaf-tek',bolge_istinaf_fazla:'bolge-istinaf-cok',yargitay:'temyiz'};
  for(const m of raw['2026'].mahkemeler)m.maktu=v.mahkemeler.find(k=>k.id===ids[m.key])!.maktu;
  let alt=0;raw['2026'].basamaklar=v.basamaklar.map(b=>{const ust=b.miktar===null?null:alt+b.miktar;const satir={alt,ust,yuzde:b.oran/100};alt=ust??alt;return satir;});
 }
 if(yol.endsWith('/katsayilar.json')){
  const d=[...ayarlar.donemler].sort((a,b)=>b.baslangic.localeCompare(a.baslangic))[0];
  const suan=raw.find((r:{durum:string})=>r.durum==='suan');
  Object.assign(suan,{aylik_katsayi:d.memur_maas_aylik_katsayi,taban_ayligi_katsayi:d.taban_aylik_katsayi,yan_odeme_katsayi:d.yan_odeme_katsayi,gelir_vergisi_istisna:d.gelir_vergisi_istisna,damga_vergisi_istisna:d.damga_vergisi_istisna,asgari_ucret:d.asgari_ucret});
 }
 return raw;
}
