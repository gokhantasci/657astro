import { sozlesmeliMaas, sozlesmeliOncekiMatrah, emekliMaas, type SozlesmeliGirdi, type DigerParametreler } from '../lib/diger-maas';
import {sozlesmeliTarife,type SozlesmeliUnvan} from '../lib/sozlesmeli-tarife';
import type { MaasKatsayilari, DereceSatiri } from '../lib/memur-maas';
import { tl, sayiOku } from '../lib/bicim';
import {maasTahmininiGuncelle,maasTahmininiTemizle} from './maas-tahmini';
import {tahminKatsayilari,tahminVergiGirdisi} from '../lib/maas-tahmini';
import {yuvarla} from '../lib/vergi';
const form=document.querySelector<HTMLFormElement>('#diger-maas-form');
if(form){
 const d=JSON.parse(document.querySelector('#diger-maas-veri')!.textContent!) as {tur:string;k:MaasKatsayilari;parametreler:DigerParametreler;dereceler:DereceSatiri[];unvanlar:SozlesmeliUnvan[];kaynakAylik:number;ayKatsayilari:{ay:number;k:MaasKatsayilari}[]};
 const field=(s:string)=>form.elements.namedItem(s) as HTMLInputElement|HTMLSelectElement;
 const val=(s:string)=>field(s).value;
 const num=(s:string)=>sayiOku(val(s));
 const out=(s:string)=>document.querySelector<HTMLElement>(`[data-d-${s}]`)!;
 const unvan=()=>d.unvanlar.find(u=>u.id===val('unvan'))!;
 function sozlesmeliGirdi():SozlesmeliGirdi{
  const otomatik=val('ucretYontemi')==='otomatik';
  for(const id of ['ucret','ekOdemeOran'])(field(id) as HTMLInputElement).readOnly=otomatik;
  (field('oncekiMatrah') as HTMLInputElement).readOnly=val('matrahYontemi')==='otomatik';
  if(otomatik){
   field('ucret').value='';field('ekOdemeOran').value='';
   const t=sozlesmeliTarife(unvan(),val('varyant'),num('hizmetYili'),d.k.aylik,d.kaynakAylik);
   field('ucret').value=String(t.ucret).replace('.',',');field('ekOdemeOran').value=String(t.ekOdemeOran).replace('.',',');
  }
  if(['ucret','ekOdemeOran','oncekiMatrah','kullanilanGv','kullanilanDv','digerKesinti'].some(s=>val(s).trim()===''||!Number.isFinite(num(s))||num(s)<0))throw new Error('Ücret, oran ve kesintiler için sıfır veya pozitif sayı girin.');
  const g:SozlesmeliGirdi={ucret:num('ucret'),ekOdemeOran:num('ekOdemeOran'),esCalismiyor:val('esCalismiyor')==='1',sendika:val('sendika')==='1',kucuk:num('kucuk'),buyuk:num('buyuk'),engelliKucuk:num('engelliKucuk'),engelliBuyuk:num('engelliBuyuk'),ay:num('ay'),istisnaBaslangicAyi:num('sozlesmeAyi'),oncekiMatrah:num('oncekiMatrah'),kullanilanGv:num('kullanilanGv'),kullanilanDv:num('kullanilanDv'),besOran:num('besOran'),ilksan:num('ilksan') as 0|1|2,engellilikDerecesi:num('engellilikDerecesi'),digerKesinti:num('digerKesinti')};
  if(val('matrahYontemi')==='otomatik'){
   g.oncekiMatrah=sozlesmeliOncekiMatrah(g,num('sozlesmeAyi'),d.k,d.ayKatsayilari,d.parametreler);
   field('oncekiMatrah').value=String(g.oncekiMatrah).replace('.',',');
  }
  out('matrah').textContent=tl(g.oncekiMatrah!);
  return g;
 }
 function hesapla(){
  try{
   const sg=d.tur==='sozlesmeli'?sozlesmeliGirdi():null;
   if(!form!.checkValidity())throw new Error('Yıl alanlarına belirtilen aralıkta tam sayı girin.');
   const eg=sg?null:{unvan:num('unvan'),kadroDerece:val('kadroDerece'),derece:val('derece'),mezuniyet:num('mezuniyet') as 1|2,hizmetYili:num('hizmetYili'),hizmetAyi:num('hizmetAyi'),kidemYili:num('kidemYili'),ikramiyeYili:num('ikramiyeYili')};
   const r=sg?sozlesmeliMaas(sg,d.k,d.parametreler):emekliMaas(eg!,d.k,d.parametreler,d.dereceler);
   if(!Number.isFinite(r.net))throw new Error('Bilgileri kontrol edin.');
   out('hata').hidden=true;out('net').textContent=tl(r.net);out('gelir').textContent=tl(r.gelir);
   if('kesinti'in r)out('kesinti').textContent=tl(r.kesinti);
   else{
    out('baglama').textContent=`%${(r.baglama*100).toLocaleString('tr-TR',{maximumFractionDigits:2})}`;out('ekGosterge').textContent=`${r.ekGosterge} · %${r.ozelHizmetOrani}`;
    for(const s of ['ikramiye','ikramiyeAylik','ikramiyeTaban','ikramiyeKidem','yolluk'] as const)out(s).textContent=tl(r[s]);
   }
   out('satirlar').replaceChildren(...r.satirlar.map(s=>{const tr=document.createElement('tr');for(const [i,v]of[s.ad,s.oran||'—',tl(s.tutar)].entries()){const td=document.createElement(i===0?'th':'td');if(i===0)td.setAttribute('scope','row');else td.className='num';td.textContent=v;tr.append(td);}return tr;}));
   maasTahmininiGuncelle(t=>{
    const kt=tahminKatsayilari(d.k,t);
    if(sg)return {net:sozlesmeliMaas({...tahminVergiGirdisi(sg,t,d.k.vergi!.yil),istisnaBaslangicAyi:t.hedefYil!==d.k.vergi!.yil?1:sg.istisnaBaslangicAyi,ucret:yuvarla(sg.ucret*kt.aylik/d.k.aylik)},kt,d.parametreler).net,not:'Sözleşme ücreti katsayı artışıyla aynı oranda artırılmıştır.'};
    const n=emekliMaas(eg!,kt,d.parametreler,d.dereceler);return {net:n.net,ikramiye:n.ikramiye};
   });
  }catch(e){maasTahmininiTemizle();out('hata').textContent=(e as Error).message;out('hata').hidden=false;out('net').textContent='—';for(const s of ['gelir','kesinti','matrah','baglama','ekGosterge','ikramiye','ikramiyeAylik','ikramiyeTaban','ikramiyeKidem','yolluk']){const el=document.querySelector(`[data-d-${s}]`);if(el)el.textContent='—';}out('satirlar').replaceChildren();}
 }
 function varyantlariYenile(){const s=field('varyant') as HTMLSelectElement;s.replaceChildren(...unvan().varyantlar.map(v=>new Option(v.ad,v.id)));s.value=unvan().varyantlar[0].id;}
 if(d.tur==='sozlesmeli')field('unvan').addEventListener('input',varyantlariYenile);
 form.addEventListener('input',hesapla);form.addEventListener('submit',e=>{e.preventDefault();hesapla();});out('sifirla').addEventListener('click',()=>{form.reset();if(d.tur==='sozlesmeli')varyantlariYenile();hesapla();});
 hesapla();
}
