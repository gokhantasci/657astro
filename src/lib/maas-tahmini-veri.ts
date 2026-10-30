import {enflasyon,donemBaslangici} from './enflasyon-veri';
import {ayarlar,getKatsayilar} from './settings';
import {maasTahmini,type MaasTahminVerisi} from './maas-tahmini';
import vergi from '../data/vergi.json' with {type:'json'};
const k=getKatsayilar(donemBaslangici());
export const maasTahminVerisi:MaasTahminVerisi={donem:enflasyon.kisa,girdi:{bazEndeks:enflasyon.baz_endeks.deger,topluSozlesmeZam:enflasyon.toplu_sozlesme.zam,sonrakiZam:enflasyon.sonraki_zam.zam,aylar:enflasyon.aylar.map(a=>({degisim:a.degisim??0,endeks:a.endeks}))},katsayi:k,sabitler:ayarlar.sabitler,hedefAy:enflasyon.sonraki_zam.ay,hedefYil:enflasyon.sonraki_zam.yil,vergiYili:vergi.yil};
export const varsayilanMaasTahmini=maasTahmini(maasTahminVerisi);
