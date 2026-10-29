import {kamuHesapla,type HesapBaglami} from '../lib/kamu-hesaplari';
import type {KamuAraci} from '../lib/kamu-katalog';
import {sayiOku,ondalik} from '../lib/bicim';
const form=document.querySelector<HTMLFormElement>('#kamu-form');
if(form){
 const {arac,baglam}=JSON.parse(document.querySelector('#kamu-veri')!.textContent!) as {arac:KamuAraci;baglam:HesapBaglami};
 const out=(s:string)=>document.querySelector<HTMLElement>(`[data-kamu-${s}]`)!;
 // Para ve oran alanları Türkçe ondalığı da kabul etsin; tam sayı alanları native doğrulanır.
 for(const f of arac.fields){const input=form.elements.namedItem(f.id) as HTMLInputElement;if(!f.options){input.step=String(f.step??.01);if(f.step!==1){input.type='text';input.inputMode='decimal';}}}
 const hesapla=()=>{try{
  const v=Object.fromEntries(arac.fields.map(f=>{const input=form.elements.namedItem(f.id) as HTMLInputElement;const n=input.value.trim()===''?NaN:sayiOku(input.value);if(!Number.isFinite(n)||n<(f.min??0)||n>(f.max??1e8)||(f.step===1&&!Number.isInteger(n)))throw new Error(`${f.label}: belirtilen aralıkta geçerli ${f.step===1?'tam ':''}sayı girin.`);return[f.id,n];}));
  const r=kamuHesapla(arac.id,v,baglam);out('hata').hidden=true;out('deger').textContent=`${ondalik(r.deger)} ${r.birim}`;out('not').textContent=r.not??'';
  out('satirlar').replaceChildren(...r.satirlar.map(s=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=s.ad;dd.className='num';dd.textContent=`${ondalik(s.deger)} ${s.birim??''}`;div.append(dt,dd);return div;}));
 }catch(e){out('hata').hidden=false;out('hata').textContent=(e as Error).message;out('deger').textContent='—';out('not').textContent='';out('satirlar').replaceChildren();}};
 let oncekiAy=Number((form.elements.namedItem('ay') as HTMLInputElement|null)?.value);
 form.addEventListener('submit',e=>{e.preventDefault();hesapla();});form.addEventListener('input',e=>{
  if(arac.id==='isci-4d'&&(e.target as HTMLElement).id==='ay'){
   const ay=Number((e.target as HTMLInputElement).value),gun=form.elements.namedItem('ucretGun') as HTMLInputElement;
   if(Number(gun.value)===new Date(Date.UTC(baglam.vergi.yil,oncekiAy,0)).getUTCDate())gun.value=String(new Date(Date.UTC(baglam.vergi.yil,ay,0)).getUTCDate());
   oncekiAy=ay;
  }
  hesapla();
 });out('sifirla').addEventListener('click',()=>{form.reset();oncekiAy=Number((form.elements.namedItem('ay') as HTMLInputElement|null)?.value);hesapla();});
}
