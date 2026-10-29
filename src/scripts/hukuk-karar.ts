import {kararHesap,type KararGirdi,type HarcTarifesi,type VekaletTarifesi} from '../lib/hukuk-hesap';
import {tl,sayiOku} from '../lib/bicim';
const form=document.querySelector<HTMLFormElement>('#hukuk-form');
if(form){
 const d=JSON.parse(document.querySelector('#hukuk-veri')!.textContent!) as {g:KararGirdi;tarifeler:{harclar:(HarcTarifesi&{baslangic:string;bitis:string|null})[];vekalet:(VekaletTarifesi&{baslangic:string;bitis:string|null})[]}};
 const out=(id:string)=>document.querySelector<HTMLElement>(`[data-h-${id}]`)!;
 const alan=(id:string)=>form.elements.namedItem(id) as HTMLInputElement|HTMLSelectElement;
 const val=(id:string)=>alan(id).value;
 function hesapla(){try{
  if(!form!.checkValidity())throw new Error('Tarih ve alanları kontrol edin.');
  const g={...d.g,tarih:val('tarih'),mahkeme:val('mahkeme')};
  for(const key of ['dava','kabul','pesin','tamamlama','islah','basvuru','kesifHarci','kesif','bilirkisi','posta','davaliGider','arabuluculuk','sulhDavaliPay'] as const){if(!alan(key))continue;if(val(key).trim()==='')throw new Error('Tutar alanlarını boş bırakmayın.');g[key]=sayiOku(val(key));}
  for(const key of ['parasal','davaciVekil','davaliVekil','onIncelemeOnce','ilkCelse','harcMuaf','giderDavacida','davaciCok','davaliCok'] as const)if(alan(key))g[key]=val(key)==='1';
  const h=d.tarifeler.harclar.find(t=>t.baslangic<=g.tarih&&(!t.bitis||t.bitis>=g.tarih));const v=[...d.tarifeler.vekalet].reverse().find(t=>t.baslangic<=g.tarih&&(!t.bitis||t.bitis>=g.tarih));
  if(!h||!v)throw new Error('Bu tarih için doğrulanmış tarife yok.');
  const r=kararHesap(g,h,v);out('ana').textContent=tl(r.harc);out('metin').textContent=r.taslak;out('hata').hidden=true;
  out('ozet').replaceChildren(...r.satirlar.filter(s=>s.tutar>0).map(s=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=s.ad;dd.className='num';dd.textContent=tl(s.tutar);div.append(dt,dd);return div;}));
 }catch(e){out('hata').textContent=(e as Error).message;out('hata').hidden=false;out('ana').textContent='—';out('metin').textContent='';out('ozet').replaceChildren();}}
 form.addEventListener('input',hesapla);form.addEventListener('submit',e=>{e.preventDefault();hesapla();});out('sifirla').addEventListener('click',()=>{form.reset();setTimeout(hesapla);});out('kopyala').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(out('metin').textContent??'');out('durum').textContent='Döküm kopyalandı.';}catch{out('durum').textContent='Kopyalanamadı; dökümü seçerek kopyalayabilirsiniz.';}});
}
