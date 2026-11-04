import {test,expect} from '@playwright/test';
import fixtures from './fixtures/memurlar-ek-bordrolar.json' with {type:'json'};
import {memurMaas} from '../src/lib/memur-maas';
import {baslangicGirdi,donem,maasKatsayilari,parametreler,dereceler} from '../src/lib/maas-veri';
import {yuvarla} from '../src/lib/vergi';
test('Memurlar.net ek standart unvanlar: gelir, prim ve net farkının uzlaşması',()=>{
 const errors:unknown[]=[];const kat=maasKatsayilari(donem,'maas');
 for(const f of fixtures){
  const v=parametreler.unvanKurallari[f.kod].varyantlar![f.kosul];
  const r=memurMaas({...baslangicGirdi,unvan:f.kod,unvanKosulu:f.kosul,derece:f.derece,mezuniyet:v.mezuniyet,hizmetYili:0,ay:10,bes:false},kat,parametreler,dereceler);
  if(r.eksik){errors.push({key:f.key,neden:r.eksikNedeni});continue;}
  const dr=v.dereceler[f.derece.split('/')[0]],raw=(dereceler.find(d=>d.derece===f.derece)!.gosterge+dr.ekGosterge)*kat.aylik+1000*kat.taban+9500*kat.aylik*dr.ozelHizmet/100;
  const prim=r.kesintiler.find(x=>x.ad==='Emekli keseneği')?.tutar??0,gss=r.kesintiler.find(x=>x.ad==='GSS primi')?.tutar??0;
  const checks={gelir:Math.abs(r.gelir-f.gelir),myo:Math.abs(f.emKes-yuvarla(raw*.09)),gss:Math.abs(f.gss-yuvarla(raw*.05)),damga:Math.abs(f.damga-yuvarla((f.gelir-33000)*.00759)),netUzlasma:Math.abs(r.net-(f.net+f.damga-r.damga+f.emKes-prim+f.gss-gss+f.gv-r.gelirVergisi))};
  for(const [k,d]of Object.entries(checks))if(d>(k==='gelir'||k==='netUzlasma'?.021:.011))errors.push({key:f.key,kalem:k,fark:yuvarla(d)});
 }
 expect(errors).toEqual([]);
});
