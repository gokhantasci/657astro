import {hukukiHesap,type HukukiTur,type HukukiKurallar,type HukukiSonuc} from '../lib/hukuki-hesap';
import type {HukukiAlan} from '../lib/hukuki-katalog';
import {aracSonucu,aracSonucuIptal,otomatikHesapla} from './arac-kullanim';
import {tl} from '../lib/bicim';
const form=document.querySelector<HTMLFormElement>('#hukuki-form');
if(form){
 const d=JSON.parse(document.querySelector('#hukuki-veri')!.textContent!) as {tur:HukukiTur;alanlar:HukukiAlan[];kurallar:HukukiKurallar};
 const field=(id:string)=>form.elements.namedItem(id) as HTMLInputElement|HTMLSelectElement;
 const out=(id:string)=>document.querySelector<HTMLElement>(`[data-hh-${id}]`)!;
 const bicim=(n:number,birim?:string)=>birim==='TL'?tl(n):`${n.toLocaleString('tr-TR',{maximumFractionDigits:2})}${birim?' '+birim:''}`;
 let metin='';
 function gorunur(a:HukukiAlan,visited=new Set<string>()):boolean{
  if(!a.kosul)return true;if(visited.has(a.id))return false;visited.add(a.id);
  const parent=d.alanlar.find(x=>x.id===a.kosul!.alan);
  return !!parent&&gorunur(parent,visited)&&a.kosul.degerler.includes(field(parent.id).value);
 }
 function ciz(r:HukukiSonuc){
  out('etiket').textContent=r.etiket;out('ana').textContent=bicim(r.ana,r.birim);
  out('satirlar').replaceChildren(...r.satirlar.map(s=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=s.ad;dd.className='num';dd.textContent=typeof s.deger==='number'?bicim(s.deger,s.birim):s.deger;div.append(dt,dd);return div;}));
  out('notlar').replaceChildren(...r.notlar.map(n=>{const p=document.createElement('p');p.textContent=n;return p;}));
  metin=[`${r.etiket}: ${bicim(r.ana,r.birim)}`,...r.satirlar.map(s=>`${s.ad}: ${typeof s.deger==='number'?bicim(s.deger,s.birim):s.deger}`),'',...r.notlar,'','657.com.tr'].join('\n');out('metin').textContent=metin;
 }
 function hesapla(){try{
  for(const a of d.alanlar){const visible=gorunur(a);field(a.id).disabled=!visible;form!.querySelector<HTMLElement>(`[data-hh-alan="${a.id}"]`)!.hidden=!visible;}
  if(!form!.checkValidity())throw new Error('Alanları boş bırakmayın; sayıların sınırlarını ve tarihleri kontrol edin.');
  const g=Object.fromEntries(d.alanlar.map(a=>[a.id,a.secenekler||a.tip==='date'?field(a.id).value:Number(field(a.id).value)]));
  const r=hukukiHesap(d.tur,g,d.kurallar);ciz(r);out('hata').hidden=true;out('kopyala').removeAttribute('disabled');out('durum').textContent='';aracSonucu(form!);
 }catch(e){aracSonucuIptal();out('hata').textContent=(e as Error).message;out('hata').hidden=false;out('ana').textContent='—';out('satirlar').replaceChildren();out('metin').textContent='';out('notlar').replaceChildren();metin='';out('kopyala').setAttribute('disabled','');out('durum').textContent='';}}
 form.addEventListener('input',hesapla);form.addEventListener('change',hesapla);form.addEventListener('submit',e=>{e.preventDefault();hesapla();});
 out('sifirla').addEventListener('click',()=>{form.reset();setTimeout(hesapla);});
 out('kopyala').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(metin);out('durum').textContent='Hesap dökümü kopyalandı.';}catch{out('durum').textContent='Kopyalanamadı. Dökümdeki metni seçerek kopyalayabilirsiniz.';}});
 otomatikHesapla(form,hesapla);
}
