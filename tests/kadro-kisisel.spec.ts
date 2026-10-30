import {test,expect} from '@playwright/test';
import fixtures from './fixtures/kadro-kisisel-profiller.json' with {type:'json'};
import {memurMaas,type MaasGirdi} from '../src/lib/memur-maas';
import {baslangicGirdi,maasKatsayilari,donem,parametreler,dereceler} from '../src/lib/maas-veri';
import {sayiOku} from '../src/lib/bicim';
import {yuvarla} from '../src/lib/vergi';
test('her standart unvan: 5510 aile/sendika/BES ve 5434 kıdem/engellilik/çocuk profilleri',()=>{
 const errors:unknown[]=[];
 for(const f of fixtures){
  const source=f.sonuclar as Record<string,string>,n=(key:string)=>sayiOku(source[key]??'0');
  const r=memurMaas({...baslangicGirdi,...f.girdi} as MaasGirdi,maasKatsayilari(donem,'maas'),parametreler,dereceler);
  if(r.eksik){errors.push({id:f.id,eksik:r.eksikNedeni});continue;}
  const t=(ad:string)=>r.kesintiler.find(x=>x.ad===ad)?.tutar??0;
  const actual={gelir:r.gelir,net:r.net,gv:r.gelirVergisi,damga:r.damga,sendika:t('Sendika kesintisi'),bes:t('BES kesintisi'),gss:t('GSS primi'),emKes:t('Emekli keseneği')};
  const expected={gelir:yuvarla(n('GelirlerToplami')-n('MalulYasVeOlDevletGelir')-n('GenSagSigPirDevletGelir')-n('EmKesKarsiligi')),net:yuvarla(n('GelirlerToplami')-n('KesintilerToplami')),gv:n('GelirVergisi'),damga:n('DamgaVergisi'),sendika:n('SendikaAidati'),bes:n('BESKesintisi'),gss:n('GenSagSigPirKisi'),emKes:n(f.girdi.kanun===5510?'MalulYasVeOlKisi':'EmekliKesenegiKisi')};
  for(const k of Object.keys(actual) as (keyof typeof actual)[])if(Math.abs(actual[k]-expected[k])>.005)errors.push({id:f.id,kalem:k,kaynak:expected[k],yerel:yuvarla(actual[k])});
 }
 expect(errors).toEqual([]);
});
