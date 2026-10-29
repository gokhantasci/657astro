import { unvanEkGostergesi, emekliOzelHizmetOrani, type MaasKatsayilari, type MaasParametreleri, type DereceSatiri, type Satir } from './memur-maas';
import {aylikVergi,vergiIstisnasi,yuvarla} from './vergi';
export type DigerParametreler=MaasParametreleri & {
 sozlesmeli_sendika_ikramiye_gosterge:number;sozlesmeli_emekli_kesenek_oran:number;sozlesmeli_gss_oran:number;sozlesmeli_sgk_tavan_kat:number;
 emekli_yolluk_tazminat_gosterge:number;emekli_ek_odeme_oran:number;emekli_ek_7456_oran:number;
};
const r2=(n:number)=>Number(n.toFixed(2));
export interface SozlesmeliGirdi { ucret:number;ekOdemeOran:number;esCalismiyor:boolean;sendika:boolean;kucuk:number;buyuk:number;engelliKucuk:number;engelliBuyuk:number;ay?:number;oncekiMatrah?:number;kullanilanGv?:number;kullanilanDv?:number;besOran?:number;ilksan?:0|1|2;engellilikDerecesi?:number;digerKesinti?:number; }
export function sozlesmeliMaas(g:SozlesmeliGirdi,k:MaasKatsayilari,p:DigerParametreler){
 if([g.ucret,g.ekOdemeOran,g.besOran??0,g.digerKesinti??0].some(n=>!Number.isFinite(n)||n<0)||(g.besOran??0)>100)throw new Error('Ücret, oran ve kesintileri kontrol edin.');
 const es=r2((g.esCalismiyor?p.es_yardimi_gosterge:0)*k.aylik);
 const cocuk=r2((g.kucuk*p.cocuk_0_6_gosterge+g.buyuk*p.cocuk_6_ust_gosterge+g.engelliKucuk*p.engelli_cocuk_0_6_gosterge+g.engelliBuyuk*p.engelli_cocuk_6_ust_gosterge)*k.aylik);
 const ek=r2(p.maas_hesaplama_gosterge*g.ekOdemeOran*k.aylik/100);
 const seyyanen=r2(p.seyyanen_zam_gosterge*k.aylik);
 const sendika=g.sendika?r2(k.aylik*p.sozlesmeli_sendika_ikramiye_gosterge):0;
 const sendikaKes=g.sendika?r2((g.ucret+ek+seyyanen+sendika)*(p.sendika_kesinti_oran/100)):0;
 const pek=k.vergi?Math.min(g.ucret,k.vergi.asgariBrut*p.sozlesmeli_sgk_tavan_kat):g.ucret;
 const gss=r2((p.sozlesmeli_gss_oran/100)*pek),emekli=r2((p.sozlesmeli_emekli_kesenek_oran/100)*pek);
 const bes=Math.floor(pek*(g.besOran??0)/100),ilksan=r2(pek*p.ilksan_oran/100*(g.ilksan??0)),diger=g.digerKesinti??0;
 const ist=k.vergi?vergiIstisnasi(g.ay??7,k.vergi):{gelir:k.gelirVergisiIstisna,damga:k.damgaVergisiIstisna};
 const dvIst=k.vergi?k.vergi.asgariBrut*k.vergi.damgaOrani/1000:ist.damga;
 // 375 ek 40 ilavesi ve toplu sözleşme ikramiyesi damga vergisine tabidir.
 const damga=Math.max(0,yuvarla((g.ucret+ek+seyyanen+sendika)*(p.damga_vergisi_oran_binde/1000)-Math.max(0,dvIst-(g.kullanilanDv??0))));
 // Seyyanen ayrı ve vergiden müstesna bir gelir; sözleşme ücretinin içinde olmadığı
 // için ücretin matrahından bir kez daha düşülmez (eski hesap bunu yapıyordu).
 const vergiMatrahi=Math.max(0,yuvarla(g.ucret-emekli-gss-sendikaKes-(k.vergi?.engellilikIndirimleri[g.engellilikDerecesi??0]??0)));
 const hamGv=k.vergi?aylikVergi(vergiMatrahi,g.oncekiMatrah??0,k.vergi):vergiMatrahi*p.gelir_vergisi_oran/100;
 const gv=Math.max(0,yuvarla(hamGv-Math.max(0,ist.gelir-(g.kullanilanGv??0))));
 // Bilinçli düzeltme: kaynak kod çocuk yardımını gelirde, damga vergisini kesintide iki kez topluyordu.
 const gelir=r2(g.ucret+sendika+es+cocuk+ek+seyyanen),kesinti=r2(gv+damga+emekli+gss+sendikaKes+bes+ilksan+diger);
 const satirlar:Satir[]=[{ad:'Sözleşme ücreti',oran:'',tutar:g.ucret},{ad:'Aile yardımı (eş)',oran:'',tutar:es},{ad:'Aile yardımı (çocuk)',oran:'',tutar:cocuk},{ad:'Ek ödeme',oran:`%${g.ekOdemeOran}`,tutar:ek},{ad:'Seyyanen ödeme',oran:'',tutar:seyyanen},{ad:'Sendika ikramiyesi',oran:'',tutar:sendika},{ad:'Gelir vergisi',oran:'',tutar:-r2(gv)},{ad:'Damga vergisi',oran:'',tutar:-damga},{ad:'Emekli keseneği',oran:'',tutar:-emekli},{ad:'GSS primi',oran:'',tutar:-gss},{ad:'Sendika kesintisi',oran:'',tutar:-sendikaKes}];
 satirlar.push({ad:'BES kesintisi',oran:`%${g.besOran??0}`,tutar:-bes},{ad:'İLKSAN aidatı',oran:g.ilksan===2?'Çift aidat':'Tek aidat',tutar:-ilksan},{ad:'Diğer kesinti',oran:'',tutar:-diger});
 return {gelir,kesinti,net:r2(gelir-kesinti),vergiMatrahi,pek,satirlar:satirlar.filter(s=>s.tutar!==0)};
}
// 5434'e tabi (01.10.2008 öncesi) memurun emekli aylığı, ikramiyesi ve emeklilik tazminatı (EMIHEP ve Memurlar.net ile sağlandı).
// Gösterge emekliliğe esas derece/kademeden (EKEA), ek gösterge kadro derecesinden (KHA) ve unvandan alınır; maaş motorunun
// unvanEkGostergesi() kuralı kullanılır. Bağlama oranı %50 + hizmet yılı + ay/12 (en çok %100); kalemler bağlama oranıyla
// çarpılıp ayrı ayrı yuvarlanarak gösterilir. Kıdem aylığı en çok 25 yıl üzerinden hesaplanır.
// Bilinçli düzeltme: önceki sürüm ikramiyeye ek ödemeyi de katıyordu; emekli ikramiyesi gösterge + ek gösterge + özel hizmet,
// taban ve kıdem aylıklarının hizmet yılıyla çarpımıdır (EMIHEP 1/4 öğretmen, 25 yıl: 1.408.011,50 TL).
export interface EmekliGirdi { unvan:number;unvanKosulu?:string;kadroDerece:string;derece:string;mezuniyet:1|2;hizmetYili:number;hizmetAyi?:number;kidemYili:number;ikramiyeYili:number; }
export function emekliMaas(g:EmekliGirdi,k:MaasKatsayilari,p:DigerParametreler,dereceler:DereceSatiri[]){
 const d=dereceler.find(d=>d.derece===g.derece);if(!d)throw new Error('Emekliliğe esas derece bulunamadı.');
 const ay=g.hizmetAyi??0;
 if(![g.hizmetYili,ay,g.kidemYili,g.ikramiyeYili].every(n=>Number.isInteger(n)&&n>=0)||ay>11)throw new Error('Yıl ve ay alanlarına tam sayı girin (ay 0–11).');
 const eg=unvanEkGostergesi({unvan:g.unvan,unvanKosulu:g.unvanKosulu,derece:g.kadroDerece,mezuniyet:g.mezuniyet},p,dereceler);
 if(eg===null)throw new Error('Bu unvanın kadro derecesi ve öğrenimi için doğrulanmış ek gösterge yok.');
 const oran=emekliOzelHizmetOrani(eg,p);
 const gosterge=d.gosterge*k.aylik,ekGosterge=eg*k.aylik,taban=p.taban_ayligi_gosterge*k.taban,kidem=p.kidem_ayligi_gosterge*Math.min(25,g.kidemYili)*k.aylik;
 const oh=p.maas_hesaplama_gosterge*k.aylik*oran/100;
 // EMIHEP: toplamda ek ödeme ve ilave ödeme kuruşa yuvarlanır, döküm satırı yuvarlanmamış tutarın bağlanmış hâlidir.
 const esas=gosterge+ekGosterge+taban+kidem+oh,ekHam=esas*(p.emekli_ek_odeme_oran/100),ek=r2(ekHam);
 const ilaveHam=(esas+ekHam)*(p.emekli_ek_7456_oran/100),ilave=r2((esas+ek)*(p.emekli_ek_7456_oran/100));
 const baglama=Math.min(100,50+g.hizmetYili+ay/12)/100;
 const b=(n:number)=>r2(n*baglama);
 const satirlar:Satir[]=[{ad:'Temel aylık (gösterge + ek gösterge)',oran:`${d.gosterge} + ${eg}`,tutar:b(gosterge+ekGosterge)},{ad:'Taban aylık',oran:'',tutar:b(taban)},{ad:'Kıdem aylığı',oran:`${Math.min(25,g.kidemYili)} yıl`,tutar:b(kidem)},{ad:'Özel hizmet aylığı',oran:`%${oran}`,tutar:b(oh)},{ad:'Ek aylık (ek ödeme)',oran:`%${p.emekli_ek_odeme_oran}`,tutar:b(ekHam)},{ad:'İlave ödeme (5434 ek md. 86)',oran:`%${String(p.emekli_ek_7456_oran).replace('.',',')}`,tutar:b(ilaveHam)}];
 // Toplam, kalemlerin değil yuvarlanmamış toplamın bağlama oranıyla çarpımıdır (EMIHEP); kalem toplamından 1 kuruş sapabilir.
 const net=r2((esas+ek+ilave)*baglama),gelir=r2(esas+ek+ilave);
 const y=g.ikramiyeYili,ikramiyeAylik=r2((gosterge+ekGosterge+oh)*y),ikramiyeTaban=r2(taban*y),ikramiyeKidem=r2(kidem*y);
 const ikramiye=r2(ikramiyeAylik+ikramiyeTaban+ikramiyeKidem);
 const yollukBrut=r2(p.emekli_yolluk_tazminat_gosterge*k.aylik),yollukDamga=r2(yollukBrut*p.damga_vergisi_oran_binde/1000),yolluk=r2(yollukBrut-yollukDamga);
 return {gelir,net,baglama,ekGosterge:eg,ozelHizmetOrani:oran,ikramiye,ikramiyeAylik,ikramiyeTaban,ikramiyeKidem,yollukBrut,yollukDamga,yolluk,satirlar};
}
