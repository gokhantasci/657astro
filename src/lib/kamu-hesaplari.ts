import { aylikVergi,vergiIstisnasi,yuvarla,type VergiTarifesi } from './vergi';
import type Kurallar from '../data/kamu-kurallari.json';
import {isciMaas,type IsciGirdi} from './isci-maas';
import isciKurallari from '../data/isci-kurallari.json' with {type:'json'};
export interface HesapBaglami {aylik:number;asgariNet:number;muhtarGosterge:number;vergi:VergiTarifesi;kurallar:typeof Kurallar;}
export interface HesapSonucu {deger:number;birim:'TL'|'puan'|'gün'|'saat'|'%';satirlar:{ad:string;deger:number;birim?:string}[];not?:string;}
export type Degerler=Record<string,number>;
const row=(ad:string,deger:number,birim='TL')=>({ad,deger:yuvarla(deger),birim});
function dersBrut(v:Degerler,k:HesapBaglami,saat?:number){
 const temel=(saat??v.saat)*v.gosterge*k.aylik;
 // Artırımlar birbirinin üzerine çarpılmaz; her biri asıl gösterge üzerinden eklenir.
 return yuvarla(temel*(1+(v.egitimArtis+v.gorevArtis)/100));
}
function ekDersNet(brut:number,v:Degerler,k:HesapBaglami){
 const ist=vergiIstisnasi(v.ay,k.vergi);
 const gv=Math.max(0,aylikVergi(brut,v.oncekiMatrah,k.vergi)-Math.max(0,ist.gelir-v.kullanilanGv));
 const dv=Math.max(0,yuvarla(brut*k.vergi.damgaOrani/1000-Math.max(0,k.vergi.asgariBrut*k.vergi.damgaOrani/1000-v.kullanilanDv)));
 return {net:yuvarla(brut-gv-dv),gv,dv};
}
export function kamuHesapla(tur:string,v:Degerler,k:HesapBaglami):HesapSonucu{
 if(Object.values(v).some(n=>!Number.isFinite(n)))throw new Error('Bütün alanlara geçerli sayı girin.');
 if(Object.entries(v).some(([key,n])=>n<0 && !key.startsWith('enf')))throw new Error('Negatif değer girilemez.');
 if(tur==='ucretli-ogretmen'){
  const u=k.kurallar.ucretliOgretmen;
  if(k.vergi.yil!==u.yil)throw new Error('Ücretli öğretmen prim kuralları bu vergi yılı için doğrulanmadı.');
  if(!Number.isInteger(v.gunduzSaat)||!Number.isInteger(v.geceSaat)||v.gunduzSaat+v.geceSaat>u.azamiFiiliSaat)throw new Error('Fiilî ders saatlerini toplam en fazla 200 olacak şekilde tam sayı girin.');
  const destek=Math.floor((v.gunduzSaat+v.geceSaat)/u.destekBoleni),saat=v.gunduzSaat+v.geceSaat+destek;
  // EDUHEP: destek saatinin tamamı gündüz göstergesinden; tek saat artığı sonraki aya taşınmaz.
  const gunduz=yuvarla((v.gunduzSaat+destek)*k.kurallar.ekDers.gunduz*k.aylik),gece=yuvarla(v.geceSaat*k.kurallar.ekDers.gece*k.aylik),brut=yuvarla(gunduz+gece);
  const gun=Math.min(u.azamiPrimGun,Math.ceil(saat/u.gunSaat));
  const pek=yuvarla(Math.min(brut,k.vergi.asgariBrut/30*gun*u.pekTavanKat)),sgk=yuvarla(pek*u.calisanPrimOran/100),matrah=yuvarla(brut-sgk);
  // Takvim ayına göre Ocak'tan beri ücret alındığı varsayılmaz: önceki istisna matrahı ayrıca girilir.
  const gvIst=aylikVergi(k.vergi.asgariBrut*(1-k.vergi.isciPrimOrani/100),v.oncekiAsgariMatrah,k.vergi);
  const gv=yuvarla(Math.max(0,aylikVergi(matrah,v.oncekiMatrah,k.vergi)-Math.max(0,gvIst-v.kullanilanGv)));
  const dv=yuvarla(Math.max(0,brut*k.vergi.damgaOrani/1000-Math.max(0,vergiIstisnasi(1,k.vergi).damga-v.kullanilanDv)));
  return {deger:yuvarla(brut-sgk-gv-dv-v.digerKesinti),birim:'TL',satirlar:[row('Eğitim öğretime destek saati',destek,'saat'),row('Toplam ödenen ders saati',saat,'saat'),row('Destek dahil gündüz brüt',gunduz),row('Gece brüt',gece),row('Brüt ücret toplamı',brut),row('SGK prim ödeme günü',gun,'gün'),row('Prime esas kazanç',pek),row('Çalışan SGK primi',sgk),row('Gelir vergisi matrahı',matrah),row('Bu ödeme öncesi aylık GV istisna hakkı',gvIst),row('Gelir vergisi',gv),row('Damga vergisi',dv),row('Diğer kesinti',v.digerKesinti)],not:'Emekli olmayan, resmî görevi bulunmayan MEB ücretli öğretmeni içindir. Her iki fiilî saate bir tam destek saati eklenir; destek gündüz ücretindendir. %14 çalışan primi kesilir; işsizlik primi kesilmez. İlk örnekte yıl içi önceki matrahlar sıfırdır. İstisna matrahını ve bu ay başka ödemede kullanılan istisnayı bordronuzdan girin; birden fazla işverende istisna yalnızca en yüksek ücrete uygulanır. Haftalık ders görevi hakkını belirlemez. Usta/uzman öğretici, emekli, DYK ve özel eğitim kapsam dışıdır.'};
 }
 if(tur==='isci-4d'){
  const r=isciMaas(v as unknown as IsciGirdi,k.vergi,isciKurallari);
  return {deger:r.net,birim:'TL',satirlar:[row('Brüt sözleşme ücreti',r.ucret),row('Hizmet primi',r.hizmet),row('Sosyal yardım',v.sosyalYardim),row('Yemek yardımı',r.yemek),row('Nakdi yol yardımı',v.nakitYol),row('İlave tediye',r.tediye),row('İkramiye',r.ikramiye),row('Fazla çalışma ve diğer brüt',v.fazlaCalismaBrut+v.digerBrut),row('Brüt gelir toplamı',r.gelir),row('Yemek SGK istisnası',r.yemekSgkIstisna),row('Yemek GV/DV istisnası',r.yemekVergiIstisna),row('Bu ödemenin prime esas kazancı',r.pek),row('Tavanı aşan PEK (takip ayrıca gerekir)',r.devredenPek),row('Çalışan SGK primi',r.sgk),row('Çalışan işsizlik primi',r.issizlik),row('Gelir vergisi matrahı',r.matrah),row('Gelir vergisi',r.gv),row('Damga vergisi',r.dv),row('Sendika / dayanışma aidatı',v.sendikaAidati),row('BES',r.bes),row('Diğer kesinti',v.digerKesinti),row('Kesintiler toplamı',r.kesinti)],not:'Temmuz–Aralık 2026 için normal 4/a çalışan hesabıdır. Başlangıç ücretleri OzkanSoft Sağlık Bakanlığı örneğidir; güncel sözleşmenizdeki tutarları girin. Kıdem/şoför/mesai oranları ve tediye hak edişi otomatik belirlenmez. Tavanı aşan ücret dışı ödemelerin sonraki aylara devri ayrıca izlenmelidir. İşveren payları net ücrete eklenmez. Emekli çalışan SGDP hesabını kapsamaz.'};
 }
 if(tur==='akademik-ek-ders'){
  const a=k.kurallar.akademik;
  const ders=yuvarla(v.gosterge*k.aylik*(v.gunduzSaat+v.geceSaat*a.geceCarpan));
  const sinav=yuvarla(Math.ceil(Math.min(v.ogrenci,a.sinavAzamiOgrenci)/a.sinavOgrenciGrubu)*a.sinavGosterge*k.aylik);
  const brut=yuvarla(ders+sinav),r=ekDersNet(brut,v,k);
  return {deger:r.net,birim:'TL',satirlar:[row('Brüt ek ders',ders),row('Tek dersin brüt final sınav ücreti',sinav),row('Toplam brüt',brut),row('Gelir vergisi',r.gv),row('Damga vergisi',r.dv)],not:'Kadrolu akademik personelin normal öğretimi içindir. Ödenecek ders yükü dışı saatleri girin. %60 artırım yalnızca 2914/11 şartlarını sağlayan dersler içindir. II. öğretim, uzaktan öğretim ve öz gelirli programlar ayrı hesaplanır. Sınav alanı tek bir dersin finali içindir; ara sınav/bütünleme girilmez.'};
 }
 if(tur==='ek-ders'||tur==='ek-ders-saat'){
  if(tur==='ek-ders-saat'){
   if(v.net<=0)throw new Error('Aranan net tutar sıfırdan büyük olmalıdır.');
   let lo=0,hi=10000;
   if(ekDersNet(dersBrut(v,k,hi),v,k).net<v.net)throw new Error('Tutar desteklenen 10.000 saat sınırını aşıyor.');
   for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(ekDersNet(dersBrut(v,k,mid),v,k).net<v.net)lo=mid;else hi=mid;}
   const saat=yuvarla((lo+hi)/2),hesap=ekDersNet(dersBrut(v,k,saat),v,k);
   return {deger:saat,birim:'saat',satirlar:[row('Bu saatin hesaplanan neti',hesap.net),row('Bir saat brüt',dersBrut(v,k,1))],not:'Sonuç tek ücret türüne göre bulunur. Farklı ücret türleri birlikte ödenmişse saat sayısı tek bir net tutardan kesin olarak bulunamaz.'};
  }
  const brut=dersBrut(v,k),r=ekDersNet(brut,v,k);
  return {deger:r.net,birim:'TL',satirlar:[row('Brüt ek ders',brut),row('Gelir vergisi',r.gv),row('Damga vergisi',r.dv),row('Bir saat brüt',dersBrut(v,k,1))],not:'Kadrolu öğretmenin ek ders ödemesi içindir. Öğrenim artırımı yalnızca toplu sözleşmenin kapsadığı fiilî ders/yönetim görevi için seçilir. Ücretli öğretmen SGK kesintisi ve ilave ders saati hesabı bu modelde yer almaz.'};
 }
 if(tur==='ilksan'){
  const il=k.kurallar.ilksan;
  if(v.aylar<il.asgariAy)throw new Error('Emekli yardımı için en az 120 ay aidat şartı vardır. Aidat iadesi ayrı bir işlemdir.');
  const yil=Math.floor(v.aylar/12),yeni=v.donem===2026&&yil>=il.yeniEsikYil;
  const a=v.toplamAidat*(yeni?il.yeniAidatCarpani:il.eskiAidatCarpani),b=v.sonAidat*(yeni?il.yeniSonAidatCarpani:il.eskiSonAidatCarpani),c=v.sonAidat*(yeni?il.yeniYilCarpani:il.eskiYilCarpani)*yil;
  return {deger:yuvarla(a+b+c),birim:'TL',satirlar:[row('Toplam aidat ve artırım',a),row('Son aidat üzerinden sabit yardım',b),row('Üyelik yılına bağlı yardım',c)],not:'SGK emeklilik şartlarının sağlandığı varsayılır. Terfi ayında çift kesinti varsa tek aidat tutarını girin. Tam üyelik yılları esas alınır.'};
 }
 if(tur==='enflasyon-orani'){
  const oranlar=Array.from({length:6},(_,i)=>v['enf'+i]);if(oranlar.some(n=>n<=-100))throw new Error('Aylık değişim −%100’den büyük olmalıdır.');
  const carpan=oranlar.reduce((s,n)=>s*(1+n/100),1),oran=(carpan-1)*100;
  return {deger:yuvarla(oran),birim:'%',satirlar:[row('Oranların aritmetik toplamı',oranlar.reduce((s,n)=>s+n,0),'%'),row('Dönem başı 100 endeksin son değeri',carpan*100,'endeks')],not:'Aylık oranlar bileşik çarpılır. Bu sonuç tek başına memurun enflasyon farkı değildir.'};
 }
 if(tur==='muhtar'){
  const brut=yuvarla(k.muhtarGosterge*k.aylik),damga=yuvarla(brut*k.vergi.damgaOrani/1000),ilave=Math.max(0,k.asgariNet-(brut-damga));
  return {deger:yuvarla(brut-damga+ilave),birim:'TL',satirlar:[row('Gösterge × aylık katsayısı',brut),row('Damga vergisi',damga),row('Asgari ücrete tamamlama',ilave)]};
 }
 if(tur==='hizmet-68b'){
  if(![1,2,3,4].includes(v.derece))throw new Error('68/B hesabı 1–4. derece kadrolar içindir.');
  const h=k.kurallar.hizmet68b,ozel=v.ustKadro===1?v.ozelGun:Math.min(h.ozelAzamiGun,v.ozelGun*h.ozelCarpan);
  const toplam=Math.floor(v.kamuGun+v.askerlikGun+ozel),yil=(v.derece===1&&v.ekGosterge>=h.yuksekEkGosterge?h.sureler[0]:v.derece<=2?h.sureler[1]:h.sureler[2])+(v.ogrenim===2?h.kisaOgrenimIlaveYil:0);
  return {deger:toplam,birim:'gün',satirlar:[row('Gerekli hizmet',yil*h.yilGun,'gün'),row('Değerlendirilen özel sektör süresi',ozel,'gün'),row('Eksik hizmet',Math.max(0,yil*h.yilGun-toplam),'gün')],not:toplam>=yil*h.yilGun?'Hizmet süresi şartı sağlanıyor. Eğitim/sağlık sınıfı istisnaları, unvan koşulları ve atama yetkisi ayrıca değerlendirilir.':'Hizmet süresi şartı henüz sağlanmıyor. Özel sektör süresine yalnızca yükseköğrenim sonrası çalışmalar girilir.'};
 }
 if(tur==='lojman'){
  const l=k.kurallar.lojman;
  const hizmet=(v.hizmetYil+v.hizmetAy/12+v.hizmetGun/360)*l.hizmetYil,oturma=(v.oturmaYil+v.oturmaAy/12+v.oturmaGun/360)*l.oturmaYil;
  const gelir=l.gelirKati*Math.floor(v.digerGelir/k.asgariNet),satirlar=[row('Başarı/sicil',v.basari*l.basari,'puan'),row('Kamu hizmeti',hizmet,'puan'),row('Önceki konut kullanımı',oturma,'puan'),row('Eş',v.es*l.es,'puan'),row('Çocuklar',v.cocuk*l.cocuk,'puan'),row('Diğer aile fertleri',v.aile*l.digerAile,'puan'),row('Diğer gelirler',gelir,'puan'),row('Bekleme süresi',v.beklemeYil*l.beklemeYil,'puan'),row('Aynı yerdeki konutlar',l.yakinKonut*v.yakinKonut,'puan'),row('Diğer konutlar',l.uzakKonut*v.uzakKonut,'puan')];
  return {deger:yuvarla(satirlar.reduce((s,r)=>s+r.deger,0)),birim:'puan',satirlar,not:'Kamu Konutları Yönetmeliği sıra tahsisli konut cetveli temel alınır. Kuruma özgü ek puanlar ve mahkeme kararları bu genel hesaba dahil değildir.'};
 }
 if(tur==='surekli-yolluk'){
  const y=k.kurallar.yolluk,kisi=v.aile+1,ulasim=v.tasit*kisi,gundelik=v.gundelik*v.yolGun*kisi,sabit=v.gundelik*(y.kisiSabitKat+Math.min(y.aileAzamiKat,y.aileSabitKat*v.aile)),degisken=v.km*v.gundelik*y.mesafeOrani*(v.esDurumu===1?.5:1),damga=yuvarla(v.dvMatrah*k.vergi.damgaOrani/1000);
  return {deger:yuvarla(ulasim+gundelik+sabit+degisken-damga),birim:'TL',satirlar:[row('Taşıt gideri',ulasim),row('Yol gündeliği',gundelik),row('Yer değiştirme sabit unsuru',sabit),row('Mesafeye bağlı unsur',degisken),row('Bildirilen matrahın damga vergisi',damga)],not:'Gündelik tutarı ve hak sahibi aile sayısı görevlendirme belgenizden girilir. Eşin değişken unsurunda yarım ödeme yalnızca 6245/45 kapsamındaki aynı güzergâh durumunda seçilir.'};
 }
 if(tur==='gecici-yolluk'){
  const gunluk=v.gundelik*(v.tamGun+v.ucIkiGun*2/3+v.ucBirGun/3),otel=Math.min(v.otel,v.otelLimit)*v.gece,damga=yuvarla(v.dvMatrah*k.vergi.damgaOrani/1000);
  return {deger:yuvarla(gunluk+otel+v.tasit-damga),birim:'TL',satirlar:[row('Gündelikler',gunluk),row('Limit dahilinde konaklama',otel),row('Taşıt gideri',v.tasit),row('Bildirilen matrahın damga vergisi',damga)],not:'Konaklama üst sınırı ve gündelik, görev tarihindeki bütçe cetveli ile görevlendirme belgesinden girilir. Uzun süreli görevlerin süre indirimleri bu kısa görev modelinde otomatik uygulanmaz.'};
 }
 if(tur==='belediye-baskani'){
  const b=k.kurallar.belediye,sinirlar=[...b.nufusSinirlari,Infinity];
  let g=b.gostergeler[sinirlar.findIndex(s=>v.nufus<=s)];if(v.ilMerkezi===1&&v.nufus<50001)g=Math.max(g,b.ilMerkeziAsgariGosterge);
  const brut=yuvarla((g+v.ekGosterge)*k.aylik),r=ekDersNet(Math.max(0,brut-v.prim),v,k);
  if(v.prim>brut)throw new Error('Prim/kesenek brüt ödenekten büyük olamaz.');
  const dv=Math.max(0,yuvarla(brut*k.vergi.damgaOrani/1000-Math.max(0,k.vergi.asgariBrut*k.vergi.damgaOrani/1000-v.kullanilanDv)));
  return {deger:yuvarla(brut-v.prim-r.gv-dv),birim:'TL',satirlar:[row('5393/39 gösterge',g,'gösterge'),row('Brüt ödenek',brut),row('Girilen prim/kesenek',v.prim),row('Gelir vergisi',r.gv),row('Damga vergisi',dv)],not:'Brüt ödenek 5393/39 nüfus cetvelinden üretilir. Bütçe K cetveli ek göstergesi ve prim/kesenek tutarı ayrıca girilmelidir. Net, girilen kesinti bilgileriyle tahmindir.'};
 }
 throw new Error('Desteklenmeyen hesap.');
}
