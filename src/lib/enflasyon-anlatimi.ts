import type {EnflasyonGirdi,EnflasyonSonuc} from './enflasyon';
import {yuzde,ondalik,katsayi,tl} from './bicim.ts';
export function enflasyonAnlatimi(g:EnflasyonGirdi,r:EnflasyonSonuc,sonraki:string,tamam:boolean){
 return [
  `Baz endeks ${ondalik(g.bazEndeks)}, hesaplanan son endeks ${ondalik(r.sonEndeks)}. Aylık oranların toplamı ${yuzde(r.aylikToplam)}; bileşik endeks artışı ${yuzde(r.endeksArtisi)}. SGK ve Bağ-Kur emeklilerinin bu dönem TÜFE artışı için temel alınan oran ikincisidir.`,
  `Dönem başında verilen ${yuzde(g.topluSozlesmeZam)} sözleşme zammı endeks artışından bölme yoluyla arındırılır. Enflasyon farkı = max(0; (son endeks / baz endeks / (1 + sözleşme zammı / 100) − 1) × 100).`,
  r.fark>0?`Bu hesapta pozitif enflasyon farkı ${yuzde(r.fark)}. ${sonraki} sözleşme zammı ${yuzde(g.sonrakiZam)} ile çarpılarak toplam ${yuzde(r.kumulatifZam)} artış elde edilir.`:`Bu hesapta enflasyon farkı henüz oluşmuyor; eşik için ${yuzde(r.gerekenEnflasyon)} ek enflasyon gerekir. ${sonraki} için yalnız ${yuzde(g.sonrakiZam)} sözleşme zammı uygulanır.`,
  `Toplam zam = ((1 + pozitif fark / 100) × (1 + sonraki sözleşme zammı / 100) − 1) × 100. Katsayı projeksiyonunda toplam oran yüzde iki basamakta yukarı yuvarlanır. Aylık katsayı ${katsayi(r.yeni.aylik)}, taban aylık katsayısı ${katsayi(r.yeni.taban)}, yan ödeme katsayısı ${katsayi(r.yeni.yanOdeme)} olur.`,
  `Hedef dönemde yürürlükte olan göstergeyle bedelli askerlik ${tl(r.yeni.bedelli)}, seyyanen ilave ${tl(r.yeni.seyyanen)} olur. Muhtar net aylığı ${tl(r.yeni.muhtar)}${r.yeni.muhtarAsgaride?'; damga vergisinden sonra mevcut asgari ücretin altında kaldığı için asgari ücrete tamamlanır':''}. Sonraki dönemin asgari ücreti burada mevcut tutarda tutulmuştur.`,
  tamam?'Altı ayın tamamı ortak kayıtta bulunuyor. Resmî maaş katsayıları yayımlandığında ortak katsayı kaydı ayrıca güncellenir.':'Dönem tamamlanmadı. Boş aylar sıfır, girilen tahminler sizin senaryonuz olarak kullanılır. Görünen tutarlar kesinleşmiş dönem sonu ödemesi değildir.',
 ];
}
