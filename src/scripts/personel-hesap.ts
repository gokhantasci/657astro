import {yillikIzin,ikmBoyKilo,type IzinKurali,type IkmKurali} from '../lib/personel-hesap';
import {sayiOku,gun} from '../lib/bicim';
const form=document.querySelector<HTMLFormElement>('#personel-hesap');
if(form){
 const data=JSON.parse(document.querySelector('#personel-hesap-veri')!.textContent!) as {tur:'izin'|'ikm';kurallar:{izin:IzinKurali;ikm:IkmKurali}},field=(id:string)=>form.elements.namedItem(id) as HTMLInputElement|HTMLSelectElement,out=(id:string)=>document.querySelector<HTMLElement>(`[data-ph-${id}]`)!;
 const n=(id:string)=>{if(!field(id).value.trim())throw new Error('Alanları boş bırakmayın.');return sayiOku(field(id).value);};
 function hesapla(){try{
  if(!form!.checkValidity())throw new Error('Alanları kontrol edin.');
  if(data.tur==='izin'){
   const r=yillikIzin({giris:field('giris').value,tarih:field('tarih').value,yas:n('yas'),yerAlti:n('yerAlti')===1,kullanilan:n('kullanilan'),devreden:n('devreden')},data.kurallar.izin);out('ana').textContent=`${r.kalan.toLocaleString('tr-TR')} gün`;out('not').textContent=`${r.yil} tam yıl · Dönemlik asgari hak ${r.hak} gün`;out('ek').textContent=`Sonraki yıl dönümü: ${gun(r.sonraki)}${r.asilan?` · Girilen kullanım toplam haktan ${r.asilan} gün fazla`:''}`;
  }else{
   const r=ikmBoyKilo({cinsiyet:field('cinsiyet').value as 'erkek'|'kadin',boy:n('boy'),kilo:n('kilo')},data.kurallar.ikm);out('ana').textContent=r.uygun?'Aralık içinde':'Aralık dışında';out('not').textContent=`Asgari boy ${r.asgari} cm · Kilo aralığı ${r.alt}–${r.ust} kg`;out('ek').textContent=`Boy: ${r.boyUygun?'aralık içinde':'asgari boyun altında'} · Kilo: ${r.kiloUygun?'aralık içinde':'aralık dışında'}. İlanın yalnız boy/kilo koşulları değerlendirilir.`;
  }out('hata').hidden=true;
 }catch(e){out('hata').textContent=(e as Error).message;out('hata').hidden=false;out('ana').textContent='—';out('not').textContent='';out('ek').textContent='';}}
 form.addEventListener('input',hesapla);form.addEventListener('change',hesapla);form.addEventListener('submit',e=>{e.preventDefault();hesapla();});document.querySelector('[data-ph-sifirla]')!.addEventListener('click',()=>{form.reset();setTimeout(hesapla);});
}
