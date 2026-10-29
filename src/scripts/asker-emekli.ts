import {askerEmekli,type AskerRutbe,type AskerEmekliGirdi,type AskerParametreleri} from '../lib/asker-emekli';
import type {MaasKatsayilari,DereceSatiri} from '../lib/memur-maas';
import {sayiOku,tl,donemAraligi} from '../lib/bicim';
const form=document.querySelector<HTMLFormElement>('#asker-emekli-form');
if(form){
 const veri=JSON.parse(document.querySelector('#asker-emekli-veri')!.textContent!) as {rutbeler:AskerRutbe[];dereceler:DereceSatiri[];p:AskerParametreleri;donemler:{baslangic:string;bitis:string;k:MaasKatsayilari}[]};
 const field=(id:string)=>form.elements.namedItem(id) as HTMLInputElement|HTMLSelectElement;
 const out=(id:string)=>document.querySelector<HTMLElement>(`[data-ae-${id}]`)!;
 function hesapla(){try{
  if(!form!.checkValidity())throw new Error('Alanları ve sayı aralıklarını kontrol edin.');
  const u=veri.rutbeler.find(u=>u.id===field('rutbe').value)!;
  out('kosullar').textContent=u.kosullar.length?u.kosullar.join('; '):u.ad;
  const g:AskerEmekliGirdi={rutbe:u.id,derece:field('derece').value,kadroDerece:field('kadroDerece').value,hizmetYili:sayiOku(field('hizmetYili').value),hizmetAyi:sayiOku(field('hizmetAyi').value),kidemYili:sayiOku(field('kidemYili').value),ikramiyeYili:sayiOku(field('ikramiyeYili').value),makamHakki:field('makamHakki').value==='1',kadrosuzlukHakki:field('kadrosuzlukHakki').value==='1',emsalTavan:sayiOku(field('emsalTavan').value)};
  const d=veri.donemler.find(d=>d.baslangic===field('donem').value)!;
  const r=askerEmekli(g,d.k,veri.p,veri.dereceler,veri.rutbeler);
  out('net').textContent=tl(r.net);out('ikramiye').textContent=tl(r.ikramiye);out('oran').textContent=`Bağlama oranı %${(r.baglama*100).toLocaleString('tr-TR',{maximumFractionDigits:4})} · Ek gösterge ${r.ekGosterge.toLocaleString('tr-TR')}`;
  out('donem').textContent=donemAraligi(d);out('uyari').textContent=g.kadrosuzlukHakki&&u.kadrosuzluk>0?(g.emsalTavan===0?'Kadrosuzluk tazminatına üst tutar sınırlaması uygulanmadı.':r.tavanUygulandi?'Kadrosuzluk tazminatı girilen üst tutarla sınırlandı.':'Girilen tazminat üst tutarı aşılmadı.'):'';
  out('satirlar').replaceChildren(...r.satirlar.map(s=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=`${s.ad}${s.oran?' ('+s.oran+')':''}`;dd.className='num';dd.textContent=tl(s.tutar);div.append(dt,dd);return div;}));out('hata').hidden=true;
 }catch(e){out('hata').textContent=(e as Error).message;out('hata').hidden=false;out('net').textContent='—';out('ikramiye').textContent='—';out('satirlar').replaceChildren();out('oran').textContent='';out('uyari').textContent='';}}
 form.addEventListener('input',hesapla);form.addEventListener('change',hesapla);form.addEventListener('submit',e=>{e.preventDefault();hesapla();});document.querySelector('[data-ae-sifirla]')!.addEventListener('click',()=>{form.reset();setTimeout(hesapla);});
}
