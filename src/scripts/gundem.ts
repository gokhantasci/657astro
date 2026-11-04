import type data from '../data/gundem.json';
import {gun} from '../lib/bicim';
const el=document.querySelector('#gundem-veri');
if(el){
 const d=JSON.parse(el.textContent!) as typeof data,il=document.querySelector<HTMLSelectElement>('#yakit-il')!,ilce=document.querySelector<HTMLSelectElement>('#yakit-ilce')!,hava=document.querySelector<HTMLSelectElement>('#hava-il')!;
 const fiyatlar=()=>{const c=d.yakit.iller.find(c=>c.kod===il.value)?.ilceler.find(c=>c.kod===ilce.value),dl=document.querySelector('[data-yakit-sonuc]')!;dl.replaceChildren();if(!c)return;for(const p of d.yakit.urunler){const fiyat=(c.fiyatlar as Record<string,number>)[p.kod];if(!Number.isFinite(fiyat))continue;const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=p.ad;dd.textContent=fiyat.toLocaleString('tr-TR',{minimumFractionDigits:2})+' TL';div.append(dt,dd);dl.append(div);}};
 const ilceler=()=>{const c=d.yakit.iller.find(c=>c.kod===il.value);ilce.replaceChildren(...(c?.ilceler??[]).map(c=>new Option(c.ad,c.kod)));fiyatlar();};
 const havayiGoster=()=>{const c=d.hava.iller[Number(hava.value)];document.querySelector('[data-hava-sonuc]')!.textContent=`${c.temperature_2m.toLocaleString('tr-TR')} °C · ${gun(c.time.slice(0,10))} ${c.time.slice(11,16)}`;};
 il.addEventListener('change',ilceler);ilce.addEventListener('change',fiyatlar);hava.addEventListener('change',havayiGoster);ilceler();havayiGoster();
 const dates=[d.doviz.guncelleme,d.hava.guncelleme,d.yakit.guncelleme],old=dates.some(x=>Date.now()-Date.parse(x)>36*3600000),t=new Date(dates.sort()[0]),tarih=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul'}).format(t);document.querySelector('[data-gundem-tarih]')!.textContent=(old?'Önbellekteki eski veriler gösteriliyor. ':'')+'Veri kontrolü: '+gun(tarih)+' '+t.toLocaleTimeString('tr-TR',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit'});
}
