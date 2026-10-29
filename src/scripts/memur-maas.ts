import { memurMaas, type MaasGirdi, type MaasKatsayilari, type MaasParametreleri, type DereceSatiri, type Satir } from '../lib/memur-maas';
import {donemAylari} from '../lib/maas-donemi';
import { tl, katsayi, sayiOku } from '../lib/bicim';

const form=document.querySelector<HTMLFormElement>('#maas-form');
if(form){
 const data=JSON.parse(document.querySelector('#maas-veri')!.textContent!) as {
  girdi:MaasGirdi; parametreler:MaasParametreleri; dereceler:DereceSatiri[];
  donemler:{baslangic:string;bitis:string;maas:MaasKatsayilari;fark14:MaasKatsayilari|null}[];
  secenekler:{unvanlar:{kod:number;ad:string}[];sablonlar:{id:string;unvan:number;profil:string}[]};
 };
 const field=(name:string)=>form.elements.namedItem(name) as HTMLInputElement|HTMLSelectElement;
 const value=(name:string)=>field(name).value;
 const num=(name:string)=>Number(value(name));
 const bool=(name:string)=>value(name)==='1';
 const out=(s:string)=>document.querySelector<HTMLElement>(`[data-m-${s}]`)!;
 const hata=out('hata');
 function renderSatirlar(satirlar:Satir[]){
  const rows=satirlar.map(s=>{const tr=document.createElement('tr');
   for(const [i,v] of [s.ad,s.oran||'—',tl(s.tutar)].entries()){const cell=document.createElement(i===0?'th':'td');if(i===0)cell.setAttribute('scope','row');else cell.className='num';cell.textContent=v;tr.append(cell);}return tr;
  });out('satirlar').replaceChildren(...rows);
 }
 function hesapla(){
  const u=data.secenekler.unvanlar[num('unvan')];
  out('ogretmen').hidden=u.kod!==50;
  try{
   if(!form!.checkValidity())throw new Error('Hizmet yılını 0–60 arasında tam sayı olarak girin.');
   const haciz=sayiOku(value('haciz'));
   if(!Number.isFinite(haciz)||haciz<0)throw new Error('Haciz / nafaka için sıfır veya pozitif bir tutar girin.');
   const vergiAlanlari=Object.fromEntries(['oncekiMatrah','kullanilanGvIstisna','kullanilanDvIstisna'].map(s=>[s,sayiOku(value(s))]));
   if(Object.values(vergiAlanlari).some(v=>!Number.isFinite(v)||v<0))throw new Error('Vergi matrahı ve kullanılan istisnalar sıfır veya pozitif sayı olmalıdır.');
   const g:MaasGirdi={kip:value('kip') as MaasGirdi['kip'],unvan:u.kod,derece:value('derece'),hizmetYili:num('hizmetYili'),mezuniyet:num('mezuniyet') as 1|2,kanun:num('kanun') as 5510|5434,
    esCalismiyor:bool('esCalismiyor'),cocuk:{kucuk:num('kucuk'),buyuk:num('buyuk'),engelliKucuk:num('engelliKucuk'),engelliBuyuk:num('engelliBuyuk')},sendika:bool('sendika'),polsan:bool('polsan'),ilksan:bool('ilksan'),tasinirYetkili:bool('tasinirYetkili'),bes:bool('bes'),gorevYeri:value('gorevYeri') as MaasGirdi['gorevYeri'],yabanciDil:value('yabanciDil') as MaasGirdi['yabanciDil'],haciz,ogretmen:{kariyer:num('kariyer') as 1|2|3,belletici:bool('belletici'),altGorev:num('altGorev'),alan:num('alan')}};
   Object.assign(g,vergiAlanlari,{ay:num('ay'),engellilikDerecesi:num('engellilikDerecesi'),unvanKosulu:value('unvanKosulu'),dilKurumYararlaniyor:bool('dilKurumYararlaniyor')});
   const d=data.donemler.find(d=>d.baslangic===value('donem'))!,k=d[g.kip];
   if(!k)throw new Error('Bu dönem için 14 günlük fark katsayıları girilmemiş.');
   const r=memurMaas(g,k,data.parametreler,data.dereceler);
   if(r.eksik)throw new Error(r.eksikNedeni);
   if(!Number.isFinite(r.net))throw new Error('Bilgileri kontrol edin; maaş hesaplanamadı.');
   hata.hidden=true;
   out('net').textContent=tl(r.net);out('gelir').textContent=tl(r.gelir);out('kesinti').textContent=tl(r.kesinti);out('katsayi').textContent=katsayi(k.aylik);
   out('vergiMatrahi').textContent=tl(r.vergiMatrahi);out('gelirVergisi').textContent=tl(r.gelirVergisi);
   out('etiket').textContent=g.kip==='maas'?'Net aylık maaş':'Net 14 günlük fark';
   const kosul=data.parametreler.unvanKurallari?.[u.kod]?.varyantlar?.[g.unvanKosulu??''];
   out('aciklama').textContent=`${u.ad}${kosul?' · '+kosul.ad:''} · ${g.derece} · ${g.kanun}`;
   renderSatirlar([...r.gelirler,...r.kesintiler.map(s=>({...s,tutar:-s.tutar}))]);
  }catch(e){hata.textContent=(e as Error).message;hata.hidden=false;for(const s of ['net','gelir','kesinti','vergiMatrahi','gelirVergisi'])out(s).textContent='—';out('aciklama').textContent='Hesaplama tamamlanamadı.';out('satirlar').replaceChildren();}
 }
 function aylariGuncelle(){
  const d=data.donemler.find(d=>d.baslangic===value('donem'))!,ay=field('ay') as HTMLSelectElement,onceki=ay.value;
  ay.replaceChildren(...donemAylari(d).map(a=>new Option(a.label,String(a.value))));
  if(Array.from(ay.options).some(o=>o.value===onceki))ay.value=onceki;
 }
 field('donem').addEventListener('input',aylariGuncelle);
 function kosullariGuncelle(){
  const kural=data.parametreler.unvanKurallari?.[data.secenekler.unvanlar[num('unvan')].kod],select=field('unvanKosulu') as HTMLSelectElement;
  const varyantlar=Object.entries(kural?.varyantlar??{});
  select.replaceChildren(...(varyantlar.length?varyantlar.map(([id,v])=>new Option(v.ad,id)):[new Option('Standart profil','')]));
  out('kosul').hidden=!varyantlar.length;out('kosul-not').textContent=kural?.aciklama??'';
 }
 function girisiGuncelle(){
  const ana=data.parametreler.unvanKurallari?.[data.secenekler.unvanlar[num('unvan')].kod],kural=ana?.varyantlar?.[value('unvanKosulu')]??ana;
  if(kural){field('mezuniyet').value=String(kural.mezuniyet);if(!kural.dereceler[value('derece').split('/')[0]])field('derece').value=`${Math.max(...Object.keys(kural.dereceler).map(Number))}/1`;}
 }
 field('sablon').addEventListener('change',()=>{
  const s=data.secenekler.sablonlar.find(s=>s.id===value('sablon'));if(!s)return;
  form.reset();aylariGuncelle();field('sablon').value=s.id;
  field('unvan').value=String(data.secenekler.unvanlar.findIndex(u=>u.kod===s.unvan));
  const yuksek=s.profil==='en-yuksek',mudur=s.profil==='en-dusuk-mudur';
  const preset:Record<string,string>={kanun:yuksek?'5434':'5510',mezuniyet:yuksek?'1':'2',derece:yuksek?'1/4':mudur?'6/1':'13/3',hizmetYili:yuksek?'30':mudur?'6':'1',esCalismiyor:yuksek?'1':'0',engelliKucuk:yuksek?'3':'0',sendika:yuksek?'1':'0',tasinirYetkili:yuksek?'1':'0',bes:yuksek?'0':'1',gorevYeri:yuksek?'istanbul':'diger',yabanciDil:yuksek?'A1':''};
  for(const [k,v] of Object.entries(preset))field(k).value=v;
  kosullariGuncelle();out('profil').hidden=!yuksek;hesapla();
 });
 field('unvan').addEventListener('input',()=>{
  kosullariGuncelle();girisiGuncelle();
 });
 field('unvanKosulu').addEventListener('input',girisiGuncelle);
 form.addEventListener('input',e=>{if((e.target as HTMLElement).id==='sablon')return;field('sablon').value='';out('profil').hidden=true;hesapla();});
 form.addEventListener('submit',e=>{e.preventDefault();hesapla();});
 // Hesaplama ayı açılışta ve sıfırlamada bugünkü aya gelir; ay dönem dışındaysa derlemedeki ay kalır.
 const buAy=()=>{const ay=field('ay') as HTMLSelectElement,v=String(new Date().getMonth()+1),d=data.donemler.find(d=>d.baslangic===value('donem'))!;
  if(new Date().getFullYear()===Number(d.baslangic.slice(0,4))&&Array.from(ay.options).some(o=>o.value===v)&&ay.value!==v){ay.value=v;return true;}return false;};
 out('sifirla').addEventListener('click',()=>{form.reset();aylariGuncelle();buAy();kosullariGuncelle();out('profil').hidden=true;hesapla();});
 kosullariGuncelle();
 if(buAy())hesapla();
}
