import registry from '../../services/oneriler/arac-sayaclari.json';
import {normalize} from '../lib/normalize';
const groups=[...document.querySelectorAll<HTMLElement>('[data-arac-sirasi-grup]')];
if(groups.length){
 const statuses=[...document.querySelectorAll<HTMLElement>('[data-arac-sirasi-durum]')];
 const date=statuses[0]?.textContent??'';
 function sirala(){
  for(const group of groups){
   const rows=[...group.querySelectorAll<HTMLElement>(':scope > [data-arac-sirasi-id]')];
   const onceki=[...rows];
   rows.sort((a,b)=>Number(b.dataset.kullanim)-Number(a.dataset.kullanim)||(a.dataset.baslik??'').localeCompare(b.dataset.baslik??'','tr')||(a.dataset.aracSirasiId??'').localeCompare(b.dataset.aracSirasiId??''));
   // Aynı düğümleri taşıyarak arama, sabitleme ve gizli satır durumunu koruyun.
   if(rows.some((row,i)=>row!==onceki[i])){
    const focused=document.activeElement;
    for(const row of rows)group.append(row);
    if(focused instanceof HTMLElement&&group.contains(focused))focused.focus({preventScroll:true});
   }
  }
 }
 async function yenile(){
  try{
   const r=await fetch('/_657-servis/api/hesaplama',{cache:'no-store',signal:AbortSignal.timeout(8000)});
   if(!r.ok)throw Error();
   const j=await r.json();
   const counts=registry.map(k=>[k.id,j.sayaclar?.[k.anahtar]?.toplam] as const);
   if(counts.some(([,n])=>!Number.isSafeInteger(n)||n<0))throw Error();
   for(const [id,n] of counts)for(const row of document.querySelectorAll<HTMLElement>(`[data-arac-sirasi-id="${id}"]`)){
    row.dataset.kullanim=String(n);
    const count=row.querySelector('[data-arac-kullanim]');if(count)count.textContent=`${n.toLocaleString('tr-TR')} kullanım`;
   }
   sirala();
   statuses.forEach(s=>s.textContent='Toplam kullanıma göre sıralandı. Eşit sayılarda alfabetik sıra kullanılır.'+(document.querySelector('[data-arac-sirasi-id="dikte"]')?' Bağımsız uygulamalar son doğrulanan yayın kaydına göre sıralanır.':''));
  }catch{statuses.forEach(s=>s.textContent=`${date} Canlı sayaç bağlantısı kurulamadı; son doğrulanan sıra gösteriliyor.`);}
 }
 for(const input of document.querySelectorAll<HTMLInputElement>('[data-bolum-ara]'))input.addEventListener('input',()=>{
  const bolum=input.closest('section')!;
  const terms=normalize(input.value).split(/\s+/).filter(Boolean);let shown=0;
  bolum.querySelectorAll<HTMLElement>('[data-arac-sirasi-id]').forEach(row=>{
   row.hidden=!terms.every(t=>normalize(row.dataset.aracSirasiArama??row.textContent??'').includes(t));if(!row.hidden)shown++;
  });
  const empty=bolum.querySelector<HTMLElement>('[data-bolum-bos]');if(empty)empty.hidden=shown>0;
 });
 void yenile();
}
