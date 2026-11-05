import type {Tarife} from '../lib/tarife-arsivi';
const raw=document.querySelector('#tarife-veri')?.textContent;
if(raw){
 const t:Tarife=JSON.parse(raw),year=document.querySelector<HTMLSelectElement>('[data-tarife-yil]')!,item=document.querySelector<HTMLSelectElement>('[data-tarife-kalem]')!;
 const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
 function render(){
  const y=year.value;let shown=0;
  document.querySelectorAll<HTMLElement>('[data-tarife-kayit]').forEach(el=>{el.hidden=y!=='hepsi'&&(el.dataset.baslangic!>`${y}-12-31`||Boolean(el.dataset.bitis&&el.dataset.bitis<`${y}-01-01`));if(!el.hidden)shown++;});
  document.querySelector<HTMLElement>('[data-tarife-yok]')!.hidden=shown>0;
  const all=t.kayitlar.map(r=>({...r,k:r.kalemler.find(k=>k.ad===item.value)}));
  const records=all.filter(r=>y==='hepsi'||r.baslangic<=`${y}-12-31`&&(!r.bitis||r.bitis>=`${y}-01-01`));
  const max=Math.max(1,...records.map(r=>r.k?.tutar??0));
  document.querySelector('[data-tarife-grafik]')!.innerHTML=records.map(r=>`<div class="tarife-cubuk"><span>${r.baslangic}</span><span class="tarife-cubuk__iz"><span class="tarife-cubuk__dolgu" style="width:${(r.k?.tutar??0)/max*100}%"></span></span><span class="num">${r.k?r.k.tutar.toLocaleString('tr-TR')+' '+esc(r.k.birim):'Kayıt yok'}</span></div>`).join('');
  document.querySelector('[data-tarife-grafik]')!.setAttribute('aria-label',item.value+'; '+records.map(r=>r.baslangic+': '+(r.k?.tutar??'kayıt yok')).join('; '));
  document.querySelector('[data-tarife-karsilastirma]')!.innerHTML=records.map(r=>{const idx=all.indexOf(r),prev=all[idx-1]?.k;const change=r.k&&prev&&prev.tutar>0&&prev.birim===r.k.birim?(r.k.tutar/prev.tutar-1)*100:null;return `<tr><th scope="row">${r.baslangic}</th><td>${r.k?r.k.tutar.toLocaleString('tr-TR')+' '+esc(r.k.birim):'Kayıt yok'}</td><td>${change===null?'—':(change>0?'+':'')+change.toLocaleString('tr-TR',{maximumFractionDigits:2})+'%'}</td></tr>`;}).join('');
  const url=new URL(location.href);url.searchParams.set('yil',y);history.replaceState(null,'',url);
 }
 const y=new URL(location.href).searchParams.get('yil');if(y&&[...year.options].some(o=>o.value===y))year.value=y;
 year.addEventListener('change',render);item.addEventListener('change',render);render();
}
