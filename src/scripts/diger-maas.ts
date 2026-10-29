import { sozlesmeliMaas, emekliMaas, type DigerParametreler } from '../lib/diger-maas';
import type { MaasKatsayilari, DereceSatiri } from '../lib/memur-maas';
import { tl, sayiOku } from '../lib/bicim';
const form=document.querySelector<HTMLFormElement>('#diger-maas-form');
if(form){
 const d=JSON.parse(document.querySelector('#diger-maas-veri')!.textContent!) as {tur:string;k:MaasKatsayilari;parametreler:DigerParametreler;dereceler:DereceSatiri[];unvanlar:{id:string;ucret:number;ekOdemeOran:number}[]};
 const field=(s:string)=>form.elements.namedItem(s) as HTMLInputElement|HTMLSelectElement;
 const val=(s:string)=>field(s).value;
 const num=(s:string)=>sayiOku(val(s));
 const out=(s:string)=>document.querySelector<HTMLElement>(`[data-d-${s}]`)!;
 function hesapla(){
  try{
   if(!form!.checkValidity())throw new Error('Yıl alanlarına belirtilen aralıkta tam sayı girin.');
   if(d.tur==='sozlesmeli' && ['ucret','ekOdemeOran','oncekiMatrah','kullanilanGv','kullanilanDv','digerKesinti'].some(s=>!Number.isFinite(num(s))||num(s)<0))throw new Error('Ücret ve oran için sıfır veya pozitif sayı girin.');
   if(d.tur==='sozlesmeli'&&val('ucret').trim()==='')throw new Error('Sözleşmenizdeki güncel brüt ücreti girin.');
   const r=d.tur==='sozlesmeli'?sozlesmeliMaas({ucret:num('ucret'),ekOdemeOran:num('ekOdemeOran'),esCalismiyor:val('esCalismiyor')==='1',sendika:val('sendika')==='1',kucuk:num('kucuk'),buyuk:num('buyuk'),engelliKucuk:num('engelliKucuk'),engelliBuyuk:num('engelliBuyuk'),ay:num('ay'),oncekiMatrah:num('oncekiMatrah'),kullanilanGv:num('kullanilanGv'),kullanilanDv:num('kullanilanDv'),besOran:num('besOran'),ilksan:num('ilksan') as 0|1|2,engellilikDerecesi:num('engellilikDerecesi'),digerKesinti:num('digerKesinti')},d.k,d.parametreler):emekliMaas({unvan:num('unvan'),kadroDerece:val('kadroDerece'),derece:val('derece'),mezuniyet:num('mezuniyet') as 1|2,hizmetYili:num('hizmetYili'),hizmetAyi:num('hizmetAyi'),kidemYili:num('kidemYili'),ikramiyeYili:num('ikramiyeYili')},d.k,d.parametreler,d.dereceler);
   if(!Number.isFinite(r.net))throw new Error('Bilgileri kontrol edin.');
   out('hata').hidden=true;out('net').textContent=tl(r.net);out('gelir').textContent=tl(r.gelir);
   if('kesinti'in r)out('kesinti').textContent=tl(r.kesinti);
   else{
    out('baglama').textContent=`%${(r.baglama*100).toLocaleString('tr-TR',{maximumFractionDigits:2})}`;out('ekGosterge').textContent=`${r.ekGosterge} · %${r.ozelHizmetOrani}`;
    for(const s of ['ikramiye','ikramiyeAylik','ikramiyeTaban','ikramiyeKidem','yolluk'] as const)out(s).textContent=tl(r[s]);
   }
   out('satirlar').replaceChildren(...r.satirlar.map(s=>{const tr=document.createElement('tr');for(const [i,v]of[s.ad,s.oran||'—',tl(s.tutar)].entries()){const td=document.createElement(i===0?'th':'td');if(i===0)td.setAttribute('scope','row');else td.className='num';td.textContent=v;tr.append(td);}return tr;}));
  }catch(e){out('hata').textContent=(e as Error).message;out('hata').hidden=false;out('net').textContent='—';for(const s of ['gelir','kesinti','baglama','ekGosterge','ikramiye','ikramiyeAylik','ikramiyeTaban','ikramiyeKidem','yolluk']){const el=document.querySelector(`[data-d-${s}]`);if(el)el.textContent='—';}out('satirlar').replaceChildren();}
 }
 if(d.tur==='sozlesmeli')field('unvan').addEventListener('input',()=>{const u=d.unvanlar.find(u=>u.id===val('unvan'));if(!u)return;field('ucret').value='';field('ekOdemeOran').value=String(u.ekOdemeOran);});
 form.addEventListener('input',hesapla);form.addEventListener('submit',e=>{e.preventDefault();hesapla();});out('sifirla').addEventListener('click',()=>{form.reset();hesapla();});
}
