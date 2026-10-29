import {davaAcilis,type DavaAcilisGirdi} from '../lib/dava-acilis';
import type {HarcTarifesi} from '../lib/hukuk-hesap';
import type {UcretSatiri} from '../lib/yargilama-gideri';
import {tl,sayiOku} from '../lib/bicim';
const form=document.querySelector<HTMLFormElement>('#dava-acilis');
if(form){
 const data=JSON.parse(document.querySelector('#dava-acilis-veri')!.textContent!) as {d:{baslangic:string;bitis:string;tarafTebligat:number;vekaletSuret:number};harclar:(HarcTarifesi&{baslangic:string;bitis:string|null})[];posta:UcretSatiri[];kesif:UcretSatiri[]};
 const field=(id:string)=>form.elements.namedItem(id) as HTMLInputElement|HTMLSelectElement,n=(id:string)=>{const val=field(id).value;if(!val.trim())throw new Error('Tutar alanlarını boş bırakmayın.');return sayiOku(val);},out=(id:string)=>document.querySelector<HTMLElement>(`[data-da-${id}]`)!;
 function hesapla(){try{
  if(!form!.checkValidity())throw new Error('Tarih ve alanları kontrol edin.');const t=field('tarih').value,h=data.harclar.find(h=>h.baslangic<=t&&(!h.bitis||h.bitis>=t));
  if(!h||t<data.d.baslangic||t>data.d.bitis)throw new Error('Bu tarih için açılış tarifesi eksik.');
  const bul=(s:UcretSatiri[])=>{const d=[...s].sort((a,b)=>b.baslangic.localeCompare(a.baslangic)).find(d=>d.baslangic<=t&&(!d.bitis||d.bitis>=t));if(!d)throw new Error('Bu tarih için posta / keşif ücreti eksik.');return d.tutar;};
  const g:DavaAcilisGirdi={deger:n('deger'),taraf:n('taraf'),diger:n('diger'),bilirkisi:n('bilirkisi'),tanik:n('tanik'),arac:n('arac'),parasal:n('parasal')===1,cismani:n('cismani')===1,sulh:n('sulh')===1,harcMuaf:n('harcMuaf')===1,vekil:n('vekil')===1,kesif:n('kesif')===1};
  const r=davaAcilis(g,h,{...data.d,posta:bul(data.posta),kesif:bul(data.kesif)});out('toplam').textContent=tl(r.toplam);out('not').textContent=`Harç ${tl(r.harc)} · Avanslar ${tl(r.gider)}`;
  out('satirlar').replaceChildren(...r.satirlar.map(s=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=s.ad;dd.className='num';dd.textContent=tl(s.tutar);row.append(dt,dd);return row;}));out('hata').hidden=true;
 }catch(e){out('hata').textContent=(e as Error).message;out('hata').hidden=false;out('toplam').textContent='—';out('not').textContent='';out('satirlar').replaceChildren();}}
 form.addEventListener('input',hesapla);form.addEventListener('change',hesapla);form.addEventListener('submit',e=>{e.preventDefault();hesapla();});document.querySelector('[data-da-sifirla]')!.addEventListener('click',()=>{form.reset();setTimeout(hesapla);});
}
