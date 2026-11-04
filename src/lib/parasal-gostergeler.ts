import bedelli from '../data/bedelli-gostergeleri.json' with {type:'json'};
import type {Sabitler} from './enflasyon.ts';
export function bedelliGostergesi(tarih:string){const d=bedelli.find(d=>d.baslangic<=tarih&&(!d.bitis||d.bitis>=tarih));if(!d)throw Error('Bu tarih için bedelli göstergesi yok.');return d.gosterge;}
export function parasalGostergeler(tarih:string,hedef:string,s:Sabitler):Sabitler{return {...s,bedelli_askerlik_gosterge:bedelliGostergesi(tarih),sonraki_bedelli_askerlik_gosterge:bedelliGostergesi(hedef),yeni_bedelli_askerlik_gosterge:bedelliGostergesi(hedef)};}
