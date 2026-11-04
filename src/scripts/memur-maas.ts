import { memurMaas, type MaasGirdi, type MaasKatsayilari, type MaasParametreleri, type DereceSatiri, type Satir } from '../lib/memur-maas';
import {donemAylari} from '../lib/maas-donemi';
import { tl, katsayi, sayiOku } from '../lib/bicim';
import {maasTahmininiGuncelle,maasTahmininiTemizle} from './maas-tahmini';
import {tahminKatsayilari,tahminVergiGirdisi} from '../lib/maas-tahmini';
import {maasOzeti} from '../lib/maas-ozeti';

const form=document.querySelector<HTMLFormElement>('#maas-form');
if(form){
 // Paylaşım adresi ipuçları (scripts/paylasim-adresi.ts): /memur-maas-hesaplama/yazi-isleri-muduru/3-1/16-yil/evli-es-calismiyor/1-cocuklu/sendika-uyesi/
 const ipucu:Record<string,Record<string,string>>={
  unvan:{paylasAnahtarsiz:'',paylasHerZaman:''},derece:{paylasAnahtarsiz:'',paylasHerZaman:''},hizmetYili:{paylasKalip:'{}-yil',paylasHerZaman:''},
  esCalismiyor:{paylasHerZaman:'',paylasDegerler:JSON.stringify({1:['evli-es-calismiyor','evli','es-yardimi'],0:['es-yardimi-yok','bekar']})},
  kucuk:{paylasKalip:'{}-kucuk-cocuklu'},buyuk:{paylasKalip:'{}-cocuklu'},engelliKucuk:{paylasKalip:'{}-engelli-kucuk-cocuklu'},engelliBuyuk:{paylasKalip:'{}-engelli-cocuklu'},
  sendika:{paylasHerZaman:'',paylasDegerler:JSON.stringify({1:['sendika-uyesi','sendikali'],0:['sendikasiz','sendika-yok']})},
  sablon:{paylasDisi:''},
 };
 for(const [ad,veri] of Object.entries(ipucu)){const el=form.elements.namedItem(ad) as HTMLElement|null;if(el)Object.assign(el.dataset,veri);}
 const data=JSON.parse(document.querySelector('#maas-veri')!.textContent!) as {
  girdi:MaasGirdi; parametreler:MaasParametreleri; dereceler:DereceSatiri[];
  donemler:{baslangic:string;bitis:string;maas:MaasKatsayilari;fark14:MaasKatsayilari|null}[];
  secenekler:{unvanlar:{kod:number;ad:string}[];sablonlar:{id:string;unvan:number;girdi?:MaasGirdi}[]};
 };
 const field=(name:string)=>form.elements.namedItem(name) as HTMLInputElement|HTMLSelectElement;
 const value=(name:string)=>field(name).value;
 const num=(name:string)=>Number(value(name));
 const bool=(name:string)=>value(name)==='1';
 const out=(s:string)=>document.querySelector<HTMLElement>(`[data-m-${s}]`)!;
 const hata=out('hata');
 function renderSatirlar(satirlar:(Satir & {tur:string})[]){
  const rows=satirlar.map(s=>{const tr=document.createElement('tr');tr.className=`maas-${s.tur}`;
   for(const [i,v] of [s.ad,s.oran||'—',tl(s.tutar)].entries()){const cell=document.createElement(i===0?'th':'td');if(i===0)cell.setAttribute('scope','row');else cell.className='num';cell.textContent=v;tr.append(cell);}return tr;
  });out('gelir-kalemleri').replaceChildren(...rows.filter(r=>r.classList.contains('maas-gelir')));out('kesinti-kalemleri').replaceChildren(...rows.filter(r=>r.classList.contains('maas-kesinti')));
 }
 function hesapla(){
  const u=data.secenekler.unvanlar[num('unvan')];
  out('ogretmen').hidden=u.kod!==50;
  try{
   if(!form!.checkValidity())throw new Error('Hizmet yılını 0–60 arasında tam sayı olarak girin.');
   const haciz=sayiOku(value('haciz'));
   const besOran=value('besOran').trim()===''?NaN:sayiOku(value('besOran'));
   if(!Number.isFinite(besOran)||besOran<0||besOran>100)throw new Error('BES oranını 0–100 arasında girin.');
   if(!Number.isFinite(haciz)||haciz<0)throw new Error('Haciz / nafaka için sıfır veya pozitif bir tutar girin.');
   const vergiAlanlari=Object.fromEntries(['oncekiMatrah','kullanilanGvIstisna','kullanilanDvIstisna'].map(s=>[s,sayiOku(value(s))]));
   if(Object.values(vergiAlanlari).some(v=>!Number.isFinite(v)||v<0))throw new Error('Vergi matrahı ve kullanılan istisnalar sıfır veya pozitif sayı olmalıdır.');
   const g:MaasGirdi={kip:value('kip') as MaasGirdi['kip'],unvan:u.kod,derece:value('derece'),hizmetYili:num('hizmetYili'),mezuniyet:num('mezuniyet') as 1|2,kanun:num('kanun') as 5510|5434,
    esCalismiyor:bool('esCalismiyor'),cocuk:{kucuk:num('kucuk'),buyuk:num('buyuk'),engelliKucuk:num('engelliKucuk'),engelliBuyuk:num('engelliBuyuk')},sendika:bool('sendika'),polsan:bool('polsan'),ilksan:bool('ilksan'),tasinirYetkili:bool('tasinirYetkili'),bes:bool('bes'),gorevYeri:value('gorevYeri') as MaasGirdi['gorevYeri'],yabanciDil:value('yabanciDil') as MaasGirdi['yabanciDil'],haciz,ogretmen:{kariyer:num('kariyer') as 1|2|3,belletici:bool('belletici'),altGorev:num('altGorev'),alan:num('alan')}};
   Object.assign(g,vergiAlanlari,{hacizHarcEkle:bool('hacizHarcEkle'),besOran,ay:num('ay'),engellilikDerecesi:num('engellilikDerecesi'),unvanKosulu:value('unvanKosulu'),dilKurumYararlaniyor:bool('dilKurumYararlaniyor')});
   if(value('gelirVergisiOrani')!=='')g.gelirVergisiOrani=num('gelirVergisiOrani');
   const d=data.donemler.find(d=>d.baslangic===value('donem'))!,k=d[g.kip];
   if(!k)throw new Error('Bu dönem için 14 günlük fark katsayıları girilmemiş.');
   const r=memurMaas(g,k,data.parametreler,data.dereceler);
   if(r.eksik)throw new Error(r.eksikNedeni);
   if(!Number.isFinite(r.net))throw new Error('Bilgileri kontrol edin; maaş hesaplanamadı.');
   hata.hidden=true;
   out('net').textContent=tl(r.net);out('gelir').textContent=tl(r.gelir);out('kesinti').textContent=tl(r.kesinti);out('katsayi').textContent=katsayi(k.aylik);
   out('vergiMatrahi').textContent=tl(r.vergiMatrahi);out('gelirVergisi').textContent=tl(r.gelirVergisi);out('gvKullanilanIstisna').textContent=tl(r.gvKullanilanIstisna);
   out('etiket').textContent=g.kip==='maas'?'Net aylık maaş':'Net 14 günlük fark';
   const kosul=data.parametreler.unvanKurallari?.[u.kod]?.varyantlar?.[g.unvanKosulu??''];
   // Özet satırı maaşı doğrudan değiştiren kişisel bilgileri gösterir; unvan formun başında ve başlıkta zaten yazılıdır.
   const ozet=maasOzeti(g,kosul?.ad);
   out('aciklama').textContent=ozet.join(' · ');
   document.querySelector<HTMLElement>('main')?.setAttribute('data-paylas-baslik',`${u.ad} maaşı ${g.derece}, ${ozet.slice(2).join(', ')}`.replace(/, $/,''));
   renderSatirlar([...r.gelirler.map(s=>({...s,tur:'gelir'})),...r.kesintiler.map(s=>({...s,tutar:-s.tutar,tur:'kesinti'}))]);
   maasTahmininiGuncelle(t=>{
    const baz=[...data.donemler].sort((a,b)=>b.baslangic.localeCompare(a.baslangic))[0];
    const yeni=memurMaas({...tahminVergiGirdisi(g,t,Number(baz.baslangic.slice(0,4))),kip:'maas'},tahminKatsayilari(baz.maas,t),data.parametreler,data.dereceler);
    if(yeni.eksik)throw Error(yeni.eksikNedeni);
    const yeniK=tahminKatsayilari(baz.maas,t);
    const fark=memurMaas({...g,kip:'fark14',ay:t.hedefAy},{...yeniK,aylik:yeniK.aylik-baz.maas.aylik,taban:yeniK.taban-baz.maas.taban,yanOdeme:yeniK.yanOdeme-baz.maas.yanOdeme},data.parametreler,data.dereceler);
    return {net:yeni.net,...(t.tam&&!fark.eksik?{fark14:fark.net}:{}),not:t.tam?'Altı ayın resmî verileri veya girdiğiniz tahminler kullanıldı. 14 günlük fark katsayı farkı üzerinden hesaplanmıştır; dönem başındaki kişisel bordro/vergi koşulları sonucu değiştirebilir.':''};
   });
  }catch(e){maasTahmininiTemizle();hata.textContent=(e as Error).message;hata.hidden=false;for(const s of ['net','gelir','kesinti','vergiMatrahi','gelirVergisi','gvKullanilanIstisna'])out(s).textContent='—';out('aciklama').textContent='Hesaplama tamamlanamadı.';out('gelir-kalemleri').replaceChildren();out('kesinti-kalemleri').replaceChildren();}
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
  select.replaceChildren(...(varyantlar.length?[...(kural?.legacyDefault?[new Option('Mevcut profil (görev yeri seçimiyle)','')]:[]),...varyantlar.map(([id,v])=>new Option(v.ad,id))]:[new Option('Standart profil','')]));
  out('kosul').hidden=!varyantlar.length;out('kosul-not').textContent=kural?.aciklama??'';
 }
 function girisiGuncelle(){
  const ana=data.parametreler.unvanKurallari?.[data.secenekler.unvanlar[num('unvan')].kod],kural=ana?.legacyDefault&&!value('unvanKosulu')?undefined:ana?.varyantlar?.[value('unvanKosulu')]??ana;
  if(kural){field('mezuniyet').value=String(kural.mezuniyet);if(!kural.dereceler[value('derece').split('/')[0]])field('derece').value=`${Math.max(...Object.keys(kural.dereceler).map(Number))}/1`;}
 }
 field('sablon').addEventListener('change',()=>{
  const s=data.secenekler.sablonlar.find(s=>s.id===value('sablon'));if(!s?.girdi)return;
  form.reset();aylariGuncelle();field('sablon').value=s.id;
  field('unvan').value=String(data.secenekler.unvanlar.findIndex(u=>u.kod===s.unvan));
  kosullariGuncelle();
  const preset={...s.girdi,...s.girdi.cocuk,...s.girdi.ogretmen,unvanKosulu:s.girdi.unvanKosulu??'',gelirVergisiOrani:''};
  for(const [key,v] of Object.entries(preset)){const el=form.elements.namedItem(key) as HTMLInputElement|HTMLSelectElement|null;if(el&&key!=='unvan'&&typeof v!=='object')el.value=typeof v==='boolean'?(v?'1':'0'):String(v);}
  out('profil').hidden=false;hesapla();
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
 buAy();
 // Asistan ve paylaşılan hesap bağlantıları yalnız tanımlı form alanlarını doldurur.
 const query=new URLSearchParams(location.search);
 const period=query.get('donem');if(period&&data.donemler.some(d=>d.baslangic===period)){field('donem').value=period;aylariGuncelle();}
 const code=query.get('unvan'),index=data.secenekler.unvanlar.findIndex(u=>String(u.kod)===code);
 if(index>=0){field('unvan').value=String(index);kosullariGuncelle();}
 for(const name of ['unvanKosulu','derece','hizmetYili','mezuniyet','kanun','esCalismiyor','kucuk','buyuk','sendika','bes','ay']){
  const v=query.get(name);if(v===null)continue;const el=field(name);
  if(el instanceof HTMLSelectElement){if(Array.from(el.options).some(o=>o.value===v&&!o.disabled))el.value=v;}
  else if(/^\d{1,3}$/.test(v))el.value=v;
 }
 hesapla();
}
