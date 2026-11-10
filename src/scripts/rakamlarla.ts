import {takvimTarihi} from '../lib/bicim';
const root=document.querySelector<HTMLElement>('[data-rakamlarla]');
if(root){
 const status=root.querySelector<HTMLElement>('[data-istatistik-durum]')!,retry=root.querySelector<HTMLButtonElement>('[data-istatistik-tekrar]')!;
 async function load(){
  retry.hidden=true;
  try{
   const r=await fetch('/_657-servis/api/istatistik',{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();const j=await r.json();
   for(const key of ['goruntulenme','bugun','kullanim'])if(!Number.isSafeInteger(j[key])||j[key]<0)throw Error();
   root!.querySelector('[data-rakam-goruntulenme]')!.textContent=(Number(root!.dataset.arsiv)+j.goruntulenme).toLocaleString('tr-TR');
   root!.querySelector('[data-rakam-bugun]')!.textContent=j.bugun.toLocaleString('tr-TR');
   root!.querySelector('[data-rakam-kullanim]')!.textContent=j.kullanim.toLocaleString('tr-TR');
   status.textContent=`Günlük görüntülenme ölçümü: ${takvimTarihi(j.okunmaBaslangic)} · Araç kullanımı ölçümü: ${takvimTarihi(j.kullanimBaslangic)}. Gün sınırı Türkiye saatine göredir.`;
  }catch{status.textContent='Canlı sayaçlar alınamadı. İçerik adetleri son yayın kaydına aittir.';retry.hidden=false;}
 }
 retry.addEventListener('click',()=>void load());void load();
}
