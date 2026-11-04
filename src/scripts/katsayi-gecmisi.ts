import {katsayiBilesenleri,type GecmisKatsayi} from '../lib/katsayi-gecmisi';
import {sayiOku,tl} from '../lib/bicim';
const form=document.querySelector<HTMLFormElement>('#katsayi-gecmisi-form');
if(form){
 const periods=JSON.parse(document.querySelector('#katsayi-gecmisi-veri')!.textContent!) as GecmisKatsayi[];
 const field=(id:string)=>form.elements.namedItem('kg-'+id) as HTMLInputElement|HTMLSelectElement;
 const error=document.querySelector<HTMLElement>('[data-kg-hata]')!,out=document.querySelector('[data-kg-toplam]')!,rows=document.querySelector('[data-kg-satirlar]')!;
 const run=()=>{try{
  const k=periods.find(d=>d.baslangic===field('donem').value)!;
  const n=(id:string)=>field(id).value.trim()===''?NaN:sayiOku(field(id).value);
  const r=katsayiBilesenleri(k,{gosterge:n('gosterge'),ekGosterge:n('ekGosterge'),hizmet:n('hizmet'),yanOdeme:n('yanOdeme'),ozelHizmet:n('ozelHizmet'),ekOdeme:n('ekOdeme')});
  error.hidden=true;out.textContent=tl(r.toplam);rows.replaceChildren(...r.satirlar.map(s=>{const d=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=s.ad;dd.textContent=tl(s.tutar);d.append(dt,dd);return d;}));
 }catch(e){error.hidden=false;error.textContent=(e as Error).message;out.textContent='—';rows.replaceChildren();}};
 form.addEventListener('input',run);form.addEventListener('submit',e=>{e.preventDefault();run();});
}
