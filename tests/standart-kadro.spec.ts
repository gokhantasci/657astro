import {test,expect} from '@playwright/test';
import fixtures from './fixtures/standart-kadro-bordrolari.json' with {type:'json'};
import cross from './fixtures/standart-kadro-cift-kaynak.json' with {type:'json'};
import {memurMaas} from '../src/lib/memur-maas';
import {baslangicGirdi,maasKatsayilari,donem,parametreler,dereceler} from '../src/lib/maas-veri';
import {yuvarla} from '../src/lib/vergi';

test('MAHEP standart kadrolar: tüm kaydedilmiş derece ve kurum/öğrenim bordroları',()=>{
 const differences:unknown[]=[];
 for(const f of fixtures){
  const rule=parametreler.unvanKurallari[f.kod].varyantlar![f.kosul];
  const result=memurMaas({...baslangicGirdi,unvan:f.kod,unvanKosulu:f.kosul,derece:f.derece,mezuniyet:rule.mezuniyet,hizmetYili:0,bes:false,ay:10},maasKatsayilari(donem,'maas'),parametreler,dereceler);
  if(result.eksik){differences.push({key:f.key,eksik:result.eksikNedeni});continue;}
  const actual={gelir:result.gelir,emKes:result.kesintiler.find(x=>x.ad==='Emekli keseneği')?.tutar??0,gss:result.kesintiler.find(x=>x.ad==='GSS primi')?.tutar??0,damga:result.damga,gv:result.gelirVergisi,net:result.net};
  for(const k of ['gelir','emKes','gss','damga','gv','net'] as const)if(Math.abs(actual[k]-f[k])>.005)differences.push({key:f.key,kalem:k,kaynak:f[k],yerel:Math.round(actual[k]*100)/100});
 }
 expect(differences).toEqual([]);
});
test('Memurlar.net: aynı ödeme oranları, gelir ve bütün net farkının kalem bazında uzlaştırılması',()=>{
 const errors:unknown[]=[];
 for(const f of cross){
  const v=parametreler.unvanKurallari[f.kod].varyantlar![f.kosul];
  const r=memurMaas({...baslangicGirdi,unvan:f.kod,unvanKosulu:f.kosul,derece:f.derece,mezuniyet:v.mezuniyet,hizmetYili:0,bes:false,ay:10},maasKatsayilari(donem,'maas'),parametreler,dereceler);
  if(r.eksik)throw Error(f.key);
  const m=f.memurlar, prim=r.kesintiler.find(x=>x.ad==='Emekli keseneği')?.tutar??0,gss=r.kesintiler.find(x=>x.ad==='GSS primi')?.tutar??0;
  // Kaynak istisna matrahı 33.000; 657 GİB'in 33.030 TL asgari brütünü kullanır.
  // Bu ayrı kontrol, neti sonradan bir toleransla eşitlemek yerine farkın nedenini sınar.
  const expectedSourceDv=yuvarla((m.gelir-33000)*.00759);
  const dr=v.dereceler[f.derece.split('/')[0]],kat=maasKatsayilari(donem,'maas');
  const rawBase=(dereceler.find(d=>d.derece===f.derece)!.gosterge+dr.ekGosterge)*kat.aylik+1000*kat.taban+9500*kat.aylik*(dr.ozelHizmet+(dr.denetim??0))/100;
  const checks={gelir:Math.abs(r.gelir-m.gelir),damgaNedeni:Math.abs(m.damga-expectedSourceDv),myoNedeni:Math.abs(m.emKes-yuvarla(rawBase*.09)),gssNedeni:Math.abs(m.gss-yuvarla(rawBase*.05)),netKapanis:Math.abs(r.net-(m.net+m.damga-r.damga+m.emKes-prim+m.gss-gss+m.gv-r.gelirVergisi))};
  for(const [k,d] of Object.entries(checks))if(d>(k==='gelir'||k==='netKapanis'?.021:.011))errors.push({key:f.memurlarKey,kalem:k,fark:yuvarla(d)});
 }
 expect(errors).toEqual([]);
});
test('yeni unvan ve öğrenim/kurum koşulları formda seçilir',async({page})=>{
 await page.goto('/memur-maas-hesaplama/');
 const f=fixtures.find(x=>x.ad==='Ambar Memuru')!;
 const data=JSON.parse(await page.locator('#maas-veri').textContent()??'{}');
 const index=data.secenekler.unvanlar.findIndex((u:{kod:number})=>u.kod===f.kod);
 await page.locator('#unvan').selectOption(String(index));
 await expect(page.locator('#unvanKosulu option')).not.toHaveCount(0);
 await page.locator('#unvanKosulu').selectOption(f.kosul);
 await expect(page.locator('[data-m-hata]')).toBeHidden();
});
