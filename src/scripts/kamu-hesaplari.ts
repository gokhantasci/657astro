import {aracSonucu} from './arac-kullanim';
import {kamuHesapla,type HesapBaglami} from '../lib/kamu-hesaplari';
import type {KamuAraci} from '../lib/kamu-katalog';
import {sayiOku,ondalik,gun} from '../lib/bicim';
import {maasTahmininiGuncelle,maasTahmininiTemizle} from './maas-tahmini';
import {kamuMaasTahmini,TAHMINLI_KAMU_ARACLARI} from '../lib/kamu-maas-tahmini';
import {unvanEkGostergesi,type MaasParametreleri,type DereceSatiri} from '../lib/memur-maas';
const form=document.querySelector<HTMLFormElement>('#kamu-form');
if(form){
 const data=JSON.parse(document.querySelector('#kamu-veri')!.textContent!) as {arac:KamuAraci;baglam:HesapBaglami;donemler:{baslangic:string;bitis:string;baglam:HesapBaglami}[];yolluk?:{parametreler:MaasParametreleri;dereceler:DereceSatiri[]}};
 const {arac}=data;let baglam=data.baglam;
 const out=(s:string)=>document.querySelector<HTMLElement>(`[data-kamu-${s}]`)!;
 // Para ve oran alanları Türkçe ondalığı da kabul etsin; tam sayı alanları native doğrulanır.
 for(const f of arac.fields){const input=form.elements.namedItem(f.id) as HTMLInputElement;if(!f.options){input.step=String(f.step??.01);if(f.step!==1){input.type='text';input.inputMode='decimal';}}}
 const hesapla=()=>{try{
  const period=form.elements.namedItem('butceDonemi') as HTMLSelectElement|null;
  if(period){const d=data.donemler.find(d=>d.baslangic===period.value);if(!d)throw Error('Doğrulanmış bir bütçe dönemi seçin.');baglam=d.baglam;out('donem').textContent=`${gun(d.baslangic)} – ${gun(d.bitis)}`;}
  if(data.yolluk){const n=(id:string)=>{const v=(form.elements.namedItem(id) as HTMLInputElement).value;return v.trim()===''?NaN:sayiOku(v);};if(n('yollukYontemi')===1){const d=n('yollukDerece'),kd=n('yollukKadroDerece'),eg=n('yollukEkGosterge');if(!Number.isFinite(eg)||eg<0||eg>15000)throw Error('Kadro ek göstergesini kontrol edin.');(form.elements.namedItem('gundelik') as HTMLSelectElement).value=String(eg>=8000?890:eg>=6400?880:eg>=3600?870:Math.min(d,kd)<=4?860:850);}}
  const v=Object.fromEntries(arac.fields.map(f=>{const input=form.elements.namedItem(f.id) as HTMLInputElement;const n=input.value.trim()===''?NaN:sayiOku(input.value);if(!Number.isFinite(n)||n<(f.min??0)||n>(f.max??1e8)||(f.step===1&&!Number.isInteger(n)))throw new Error(`${f.label}: belirtilen aralıkta geçerli ${f.step===1?'tam ':''}sayı girin.`);return[f.id,n];}));
  const r=kamuHesapla(arac.id,v,baglam);out('hata').hidden=true;out('deger').textContent=`${ondalik(r.deger)} ${r.birim}`;out('not').textContent=r.not??'';
  if(arac.id==='belediye-baskani'){const prim=form.elements.namedItem('prim') as HTMLInputElement;prim.readOnly=v.primYontemi===1;if(prim.readOnly)prim.value=String(r.satirlar.find(s=>s.ad==='Girilen çalışan prim/kesenek')!.deger).replace('.',',');}
  if(TAHMINLI_KAMU_ARACLARI.includes(arac.id))maasTahmininiGuncelle((t,tis)=>kamuMaasTahmini(arac.id,v,baglam,t,tis));
  out('satirlar').replaceChildren(...r.satirlar.map(s=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=s.ad;dd.className='num';dd.textContent=`${ondalik(s.deger)} ${s.birim??''}`;div.append(dt,dd);return div;}));
 aracSonucu(form!);
 }catch(e){maasTahmininiTemizle();out('hata').hidden=false;out('hata').textContent=(e as Error).message;out('deger').textContent='—';out('not').textContent='';out('satirlar').replaceChildren();}};
 let oncekiAy=Number((form.elements.namedItem('ay') as HTMLInputElement|null)?.value);
 if(TAHMINLI_KAMU_ARACLARI.includes(arac.id))hesapla();
 form.addEventListener('submit',e=>{e.preventDefault();hesapla();});form.addEventListener('input',e=>{
  if(data.yolluk){
   const id=(e.target as HTMLElement).id;
   if(id==='gundelik')(form.elements.namedItem('yollukYontemi') as HTMLSelectElement).value='0';
   if(['yollukUnvan','yollukKadroDerece'].includes(id)){
    const unvan=Number((form.elements.namedItem('yollukUnvan') as HTMLSelectElement).value),degree=(form.elements.namedItem('yollukKadroDerece') as HTMLSelectElement).value,rule=data.yolluk.parametreler.unvanKurallari?.[unvan];
    const eg=unvanEkGostergesi({unvan,derece:degree+'/1',mezuniyet:rule?.mezuniyet??1},data.yolluk.parametreler,data.yolluk.dereceler);
    (form.elements.namedItem('yollukEkGosterge') as HTMLInputElement).value=eg===null?'':String(eg);
   }
  }
  if((e.target as HTMLElement).id==='butceDonemi'){
   const d=data.donemler.find(d=>d.baslangic===(e.target as HTMLSelectElement).value),ay=form.elements.namedItem('ay') as HTMLSelectElement|null;
   if(d&&ay){const ilk=Number(d.baslangic.slice(5,7)),son=Number(d.bitis.slice(5,7)),old=ay.value;ay.replaceChildren(...Array.from({length:son-ilk+1},(_,i)=>new Option(new Intl.DateTimeFormat('tr-TR',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2026,ilk+i-1,1))),String(ilk+i))));ay.value=Array.from(ay.options).some(o=>o.value===old)?old:String(ilk);}
  }
  if(arac.id==='isci-4d'&&(e.target as HTMLElement).id==='ay'){
   const ay=Number((e.target as HTMLInputElement).value),gun=form.elements.namedItem('ucretGun') as HTMLInputElement;
   if(Number(gun.value)===new Date(Date.UTC(baglam.vergi.yil,oncekiAy,0)).getUTCDate())gun.value=String(new Date(Date.UTC(baglam.vergi.yil,ay,0)).getUTCDate());
   oncekiAy=ay;
  }
  hesapla();
 });out('sifirla').addEventListener('click',()=>{form.reset();oncekiAy=Number((form.elements.namedItem('ay') as HTMLInputElement|null)?.value);hesapla();});
}
