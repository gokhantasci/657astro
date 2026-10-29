import {test,expect} from '@playwright/test';
import data from './fixtures/cok-kaynak-hesap.json' with {type:'json'};
import pk from '../src/data/personel-kurallari.json' with {type:'json'};
import {maliKurallar} from '../src/lib/mali-veri';
import {hukukTarifeSec} from '../src/lib/hukuk-veri';
import {smmHesap,faizHesap,type SmmGirdi,type FaizGirdi} from '../src/lib/mali-hesap';
import {davaAcilis,type DavaAcilisGirdi} from '../src/lib/dava-acilis';
import {yillikIzin,ikmBoyKilo,type IzinGirdi} from '../src/lib/personel-hesap';
for(const f of data.ornekler)test(`canlı kaynak kaydı: ${f.id}`,()=>{
 let r:unknown;
 if(f.arac==='smm')r=smmHesap(f.girdi as SmmGirdi);
 else if(f.arac==='faiz')r=faizHesap(f.girdi as FaizGirdi,maliKurallar.faiz);
 else if(f.arac==='dava')r=davaAcilis(f.girdi as DavaAcilisGirdi,hukukTarifeSec(data.tarih).h,{...maliKurallar.dava,posta:300,kesif:5188});
 else if(f.arac==='izin')r=yillikIzin(f.girdi as IzinGirdi,pk.izin);
 else r=ikmBoyKilo(f.girdi as {cinsiyet:'erkek'|'kadin';boy:number;kilo:number},pk.ikm);
 expect(r).toMatchObject(f.beklenen);
});
