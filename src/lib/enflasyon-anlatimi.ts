import type {EnflasyonGirdi,EnflasyonSonuc} from './enflasyon';
import {yuzde,ondalik,katsayi,tl} from './bicim.ts';
export function enflasyonAnlatimi(g:EnflasyonGirdi,r:EnflasyonSonuc,sonraki:string,tamam:boolean){
 return [
  `Dönem başındaki ${ondalik(g.bazEndeks)} düzeyindeki TÜFE endeksi, bu tabloda ${ondalik(r.sonEndeks)} seviyesine ulaşıyor. Aylık oranların düz toplamı ${yuzde(r.aylikToplam)} olsa da bileşik endeks artışı ${yuzde(r.endeksArtisi)} olarak hesaplanıyor. SGK ve Bağ-Kur emeklilerinin dönemlik maaş artışında işte bu ${yuzde(r.endeksArtisi)} oranındaki bileşik endeks artışı esas alınıyor.`,
  r.fark>0
   ? `Memur ve memur emeklilerinde dönem başında verilen ${yuzde(g.topluSozlesmeZam)} oranındaki toplu sözleşme zammı, endeks artışından bölme yoluyla arındırılıyor. Bu hesaba göre ${yuzde(r.fark)} düzeyinde pozitif enflasyon farkı oluşuyor; ${sonraki} dönemi için öngörülen ${yuzde(g.sonrakiZam)} toplu sözleşme zammı eklendiğinde toplam artış ${yuzde(r.kumulatifZam)} seviyesine çıkıyor.`
   : `Memur ve memur emeklilerinde dönem başında verilen ${yuzde(g.topluSozlesmeZam)} oranındaki toplu sözleşme zammı, endeks artışından bölme yoluyla arındırılıyor. Mevcut verilere göre henüz enflasyon farkı oluşmuyor; farkın devreye girmesi için yaklaşık ${yuzde(r.gerekenEnflasyon)} ek enflasyon gerekiyor. Bu tabloda ${sonraki} dönemi için yalnızca ${yuzde(g.sonrakiZam)} toplu sözleşme zammı uygulanıyor.`,
  `Bu artış oranı katsayılara yansıtıldığında; memur aylık katsayısının ${katsayi(r.yeni.aylik)}, taban aylık katsayısının ${katsayi(r.yeni.taban)}, yan ödeme katsayısının ise ${katsayi(r.yeni.yanOdeme)} olması bekleniyor.`,
  `Yeni katsayılarla birlikte bedelli askerlik ücretinin ${tl(r.yeni.bedelli)}, 375 sayılı KHK kapsamındaki seyyanen ilave ödemenin ise ${tl(r.yeni.seyyanen)} düzeyine çıkacağı hesaplanıyor. Muhtar aylığı ise ${tl(r.yeni.muhtar)} olarak görülüyor${r.yeni.muhtarAsgaride?' (damga vergisi sonrası mevcut asgari ücretin altında kaldığı için asgari ücrete tamamlanıyor)':''}.`,
  tamam
   ? 'Altı aylık TÜFE verilerinin tamamı açıklanmış durumda. Kesin maaş ve ödeme tutarları, Hazine ve Maliye Bakanlığı’nın yayımlayacağı resmî katsayı genelgesiyle yürürlüğe girer.'
   : 'Altı aylık dönem henüz tamamlanmadı; açıklanmayan aylar için girdiğiniz oranlar kendi beklenti senaryonuz olarak hesaplanır. Resmî TÜİK verileri açıklandıkça tablo otomatik olarak güncellenir.',
 ];
}
