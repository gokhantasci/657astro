import {yardimciHesap,type YardimciTur,type HukukAlan} from '../lib/hukuk-yardimci';
import {sayiOku,tl} from '../lib/bicim';
import type {HarcTarifesi,VekaletTarifesi} from '../lib/hukuk-hesap';
const form=document.querySelector<HTMLFormElement>('#hukuk-yardimci');
if(form){
 const d=JSON.parse(document.querySelector('#hukuk-yardimci-veri')!.textContent!) as {tur:YardimciTur;alanlar:HukukAlan[];tarifeler:{harclar:(HarcTarifesi&{baslangic:string;bitis:string|null})[];vekalet:(VekaletTarifesi&{baslangic:string;bitis:string|null})[]}};
 const out=(id:string)=>document.querySelector<HTMLElement>(`[data-hy-${id}]`)!;
 const field=(id:string)=>form.elements.namedItem(id) as HTMLInputElement|HTMLSelectElement;
 function hesapla(){try{
  if(!form!.checkValidity())throw new Error('Alanları boş bırakmayın; tarih aralığını kontrol edin.');
  const g=Object.fromEntries(d.alanlar.map(a=>{const val=field(a.id).value;if(!val.trim())throw new Error('Tutarları boş bırakmayın.');return [a.id,a.secenekler?val:sayiOku(val)];}));
  const tarih=field('tarih')?.value??d.tarifeler.harclar.at(-1)!.baslangic;
  const h=d.tarifeler.harclar.find(t=>t.baslangic<=tarih&&(!t.bitis||t.bitis>=tarih)),v=[...d.tarifeler.vekalet].reverse().find(t=>t.baslangic<=tarih&&(!t.bitis||t.bitis>=tarih));
  if(!h||!v)throw new Error('Bu tarih için tarife yok.');
  const kisiler=[...form!.querySelectorAll<HTMLElement>('[data-hy-kisi]')].map(row=>({ad:row.querySelector<HTMLInputElement>('[data-k-ad]')!.value,pay:sayiOku(row.querySelector<HTMLInputElement>('[data-k-pay]')!.value)}));
  const r=yardimciHesap(d.tur,g,h,v,kisiler);out('ana').textContent=tl(r.ana);out('etiket').textContent=r.etiket;out('metin').textContent=r.metin;out('hata').hidden=true;
  out('satirlar').replaceChildren(...r.satirlar.map(s=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=s.ad;dd.className='num';dd.textContent=tl(s.tutar);div.append(dt,dd);return div;}));
 }catch(e){out('hata').textContent=(e as Error).message;out('hata').hidden=false;out('ana').textContent='—';out('metin').textContent='';out('satirlar').replaceChildren();}}
 const liste=document.querySelector<HTMLElement>('[data-hy-kisiler]'),ilk=liste?.innerHTML;
 document.querySelector('[data-hy-ekle]')?.addEventListener('click',()=>{if(!liste||liste.children.length>=100)return;const row=liste.firstElementChild!.cloneNode(true) as HTMLElement;row.querySelector<HTMLInputElement>('[data-k-ad]')!.value='';row.querySelector<HTMLInputElement>('[data-k-pay]')!.value='0';liste.append(row);hesapla();});
 liste?.addEventListener('click',e=>{const b=(e.target as Element).closest('[data-k-sil]');if(b&&liste.children.length>1){b.closest('[data-hy-kisi]')!.remove();hesapla();}});
 out('sifirla').addEventListener('click',()=>{form.reset();if(liste&&ilk)liste.innerHTML=ilk;setTimeout(hesapla);});
 form.addEventListener('input',hesapla);form.addEventListener('submit',e=>{e.preventDefault();hesapla();});
 out('kopyala').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(out('metin').textContent??'');out('durum').textContent='Döküm kopyalandı.';}catch{out('durum').textContent='Metni seçerek kopyalayabilirsiniz.';}});
}
