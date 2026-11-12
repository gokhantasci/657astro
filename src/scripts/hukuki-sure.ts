import {hukukiSure,type SureTuru,type Yargi,type Birim,type TebligTuru} from '../lib/hukuki-sure';
import {noktali,gunAdi,type Tatil} from '../lib/kesinlesme';
import {aracSonucu,otomatikHesapla} from './arac-kullanim';
const kok=document.querySelector<HTMLElement>('[data-hs]'),veriEl=document.getElementById('hs-veri');
if(kok&&veriEl){
 const {tatiller,aralik,turler}:{tatiller:Tatil[];aralik:{ilk:number;son:number};turler:SureTuru[]}=JSON.parse(veriEl.textContent!);
 const $=<T extends Element=HTMLElement>(s:string)=>kok.querySelector<T>(s)!;
 const teblig=$<HTMLInputElement>('[data-hs-teblig]'),turu=$<HTMLSelectElement>('[data-hs-turu]'),sayi=$<HTMLInputElement>('[data-hs-sayi]'),birim=$<HTMLSelectElement>('[data-hs-birim]'),yargi=$<HTMLSelectElement>('[data-hs-yargi]'),tebligat=$<HTMLSelectElement>('[data-hs-tebligat]'),uyari=$('[data-hs-uyari]');
 const temizle=()=>{
  $('[data-hs-tarih]').textContent='Tarih seçin';$('[data-hs-gun]').textContent='';
  for(const k of ['esas','kesin','dayanak'])$(`[data-hs-${k}]`).textContent='-';
  $('[data-hs-notlar]').replaceChildren();$('[data-hs-notlar-bos]').hidden=true;
 };
 const hesapla=()=>{
  const ozel=turu.value==='ozel';$('[data-hs-ozel]').hidden=!ozel;
  if(!teblig.value){temizle();return;}
  try{
   const s=turler.find(t=>t.id===turu.value);
   const g={teblig:teblig.value,sayi:ozel?Math.floor(Number(sayi.value)):s!.sayi,birim:(ozel?birim.value:s!.birim) as Birim,yargi:(ozel?yargi.value:s!.yargi) as Yargi,adliTatil:ozel?yargi.value!=='diger':s!.adliTatil,tebligTuru:tebligat.value as TebligTuru};
   const r=hukukiSure(g,tatiller);
   const yil=r.son.getUTCFullYear();
   uyari.hidden=yil>=aralik.ilk&&yil<=aralik.son;
   uyari.textContent=`Tatil verisi ${aralik.ilk} ile ${aralik.son} yıllarını kapsıyor; bu aralığın dışındaki resmî tatiller hesaba katılmadı.`;
   $('[data-hs-tarih]').textContent=noktali(r.son);$('[data-hs-gun]').textContent=gunAdi(r.son);
   $('[data-hs-esas]').textContent=noktali(r.teblig);$('[data-hs-kesin]').textContent=noktali(r.kesin);
   $('[data-hs-dayanak]').textContent=ozel?'Elle girilen süre':s!.dayanak;
   $('[data-hs-notlar]').replaceChildren(...r.notlar.map(n=>{const li=document.createElement('li');li.textContent=n.metin;return li;}));
   $('[data-hs-notlar-bos]').hidden=r.notlar.length>0;
   aracSonucu(kok,[teblig.value,turu.value,sayi.value,birim.value,yargi.value,tebligat.value]);
  }catch(e){temizle();uyari.hidden=false;uyari.textContent=(e as Error).message;}
 };
 for(const el of [teblig,turu,sayi,birim,yargi,tebligat]){el.addEventListener('input',hesapla);el.addEventListener('change',hesapla);}
 otomatikHesapla(kok,hesapla);hesapla();
}
