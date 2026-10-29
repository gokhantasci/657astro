import {emekliOzelHizmetOrani,type MaasKatsayilari,type DereceSatiri,type Satir} from './memur-maas';
import type {DigerParametreler} from './diger-maas';
export interface AskerRutbe {id:string;ad:string;kosullar:string[];dereceler:Record<string,number>;makam:number;gorev:number;temsil:number;kadrosuzluk:number;}
export type AskerParametreleri=DigerParametreler&{asker_emekli_ek81:number;asker_emekli_ek85:number};
export interface AskerEmekliGirdi {rutbe:string;derece:string;kadroDerece?:string;hizmetYili:number;hizmetAyi:number;kidemYili:number;ikramiyeYili:number;makamHakki:boolean;kadrosuzlukHakki:boolean;emsalTavan:number;}
const r2=(n:number)=>Number(n.toFixed(2));
/** 5434 kapsamındaki subay için, hak kazanılmış tazminatlar kullanıcı tarafından seçilir. */
export function askerEmekli(g:AskerEmekliGirdi,k:MaasKatsayilari,p:AskerParametreleri,dereceler:DereceSatiri[],rutbeler:AskerRutbe[]){
 const u=rutbeler.find(u=>u.id===g.rutbe),d=dereceler.find(d=>d.derece===g.derece);
 if(!u||!d)throw new Error('Rütbe ve derece/kademeyi kontrol edin.');
 const eg=u.dereceler[(g.kadroDerece??g.derece).split('/')[0]];
 if(eg===undefined)throw new Error('Bu rütbe ve derece için kaynakta doğrulanmış ek gösterge yok.');
 if(![g.hizmetYili,g.hizmetAyi,g.kidemYili,g.ikramiyeYili].every(n=>Number.isInteger(n)&&n>=0)||g.hizmetYili>50||g.hizmetAyi>11||g.kidemYili>50||g.ikramiyeYili>50)throw new Error('Yılları 0–50, ayı 0–11 arasında tam sayı girin.');
 if(!Number.isFinite(g.emsalTavan)||g.emsalTavan<0)throw new Error('Emsal tavanı geçersiz.');
 const oran=emekliOzelHizmetOrani(eg,p),baglama=Math.min(100,50+g.hizmetYili+g.hizmetAyi/12)/100;
 const temel=(d.gosterge+eg)*k.aylik,taban=p.taban_ayligi_gosterge*k.taban,kidem=Math.min(25,g.kidemYili)*p.kidem_ayligi_gosterge*k.aylik,oh=p.maas_hesaplama_gosterge*k.aylik*oran/100;
 const esas=temel+taban+kidem+oh,gostergeAylik=r2(d.gosterge*k.aylik*baglama),ekGostergeAylik=r2(eg*k.aylik*baglama);
 // Kaynak bordroda her aylık kalemi kuruşa yuvarlanır, net bu kalemlerin toplamıdır.
 const aylik=r2(gostergeAylik+ekGostergeAylik+r2(taban*baglama)+r2(kidem*baglama)+r2(oh*baglama));
 const makam=g.makamHakki?r2(u.makam*k.aylik):0,gorev=g.makamHakki?r2(u.gorev*k.aylik):0,temsil=g.makamHakki?r2(u.temsil*k.aylik):0;
 const kadroHam=g.kadrosuzlukHakki?r2(p.maas_hesaplama_gosterge*k.aylik*u.kadrosuzluk/100):0;
 // 926/49 emsal sınırlaması için SGK'nın belirlediği ödenebilir tazminat üst tutarı alınır.
 // Görevdeki emsalin net maaşı bu emeklilik motorundan çıkarılamaz. 0, sınırlama uygulanmamasıdır.
 const kadrosuzluk=g.emsalTavan>0?Math.min(kadroHam,g.emsalTavan):kadroHam;
 const toplam=aylik+makam+gorev+temsil+kadrosuzluk,ek=r2(toplam*p.emekli_ek_odeme_oran/100),ek81=makam===0?(eg<3600?p.asker_emekli_ek85:p.asker_emekli_ek81):0;
 // 5434 ek 81/85: makam tazminatı almayanın 100/1200 TL ilavesi %4 matrahına girmez.
 const ilave=r2((toplam+ek+ek81)*p.emekli_ek_7456_oran/100);
 const net=r2(toplam+ek+ek81+ilave),ikramiye=r2(esas*g.ikramiyeYili);
 const satirlar:Satir[]=[
  {ad:'Gösterge aylığı',oran:String(d.gosterge),tutar:gostergeAylik},
  {ad:'Ek gösterge aylığı',oran:String(eg),tutar:ekGostergeAylik},
  {ad:'Taban aylık',oran:'',tutar:r2(taban*baglama)},
  {ad:'Kıdem aylığı',oran:`${Math.min(25,g.kidemYili)} yıl`,tutar:r2(kidem*baglama)},
  {ad:'Özel hizmet aylığı',oran:`%${oran}`,tutar:r2(oh*baglama)},
  {ad:'Makam tazminatı',oran:String(u.makam),tutar:r2(makam)},
  {ad:'Görev tazminatı',oran:String(u.gorev),tutar:r2(gorev)},
  {ad:'Temsil tazminatı',oran:String(u.temsil),tutar:r2(temsil)},
  {ad:'Kadrosuzluk tazminatı',oran:`%${u.kadrosuzluk}`,tutar:r2(kadrosuzluk)},
  {ad:'Ek ödeme',oran:`%${p.emekli_ek_odeme_oran}`,tutar:ek},
  {ad:`İlave ödeme (5434 ek ${eg<3600?'85':'81'})`,oran:'',tutar:ek81},
  {ad:'İlave ödeme (5434 ek 86)',oran:`%${p.emekli_ek_7456_oran}`,tutar:ilave},
 ];
 return {net,ikramiye,satirlar:satirlar.filter(s=>s.tutar!==0),ekGosterge:eg,oran,baglama,kadrosuzluk:r2(kadrosuzluk),tavanUygulandi:kadrosuzluk<kadroHam};
}
