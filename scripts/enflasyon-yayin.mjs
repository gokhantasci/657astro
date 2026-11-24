// Ortak yönetim kaydı -> idempotent aylık yazı ve yarıyıl arşivi. Ziyaretçi tahminleri okunmaz.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {enflasyonFarki} from '../src/lib/enflasyon.ts';
import {enflasyonDonemleri} from '../src/lib/enflasyon-veri.ts';
import {enflasyonAnlatimi} from '../src/lib/enflasyon-anlatimi.ts';
import {parasalGostergeler} from '../src/lib/parasal-gostergeler.ts';
const root=new URL('../',import.meta.url);
// Yeni döneme geçilmeden önceki her başarılı derleme, o günkü ortak kaydı arşivler.
// Temmuzdan sonra Ocak–Haziran kaydı yeniden güncel katsayılarla uydurulmaz.
await writeFile(new URL('src/data/enflasyon-arsivi.json',root),JSON.stringify(enflasyonDonemleri,null,1)+'\n');
const ayarlar=JSON.parse(await readFile(new URL('src/data/ayarlar.json',root),'utf8'));
const adlar=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const sluglar=['ocak','subat','mart','nisan','mayis','haziran','temmuz','agustos','eylul','ekim','kasim','aralik'];
const fmt=n=>n.toLocaleString('tr-TR',{maximumFractionDigits:2,minimumFractionDigits:2});
const yol=new URL('src/content/yazilar/',root);await mkdir(yol,{recursive:true});
let count=0;
async function yaz(slug,title,description,date,body,kaynak){
 const url=new URL(slug+'.md',yol);let eski='';try{eski=await readFile(url,'utf8');}catch{}
 if(eski&&!eski.includes('<!-- 657:enflasyon-otomatik -->'))throw Error('Elle yazılmış içerik üzerine yazılmaz: '+slug);
 const originalDate=eski.match(/^date: "([^"]+)"$/m)?.[1]??date;
 const front={title,description,date:originalDate,...(originalDate!==date?{updated:date}:{}),kategori:['Ekonomi','Enflasyon'],kaynak,gorsel:'./gorseller/haziran-ayi-enflasyon-rakamlari-aciklandi-2.jpg',gorselAlt:'Gıda ürünleri ve fiyat artışını temsil eden kırmızı ok'};
 const text='---\n'+Object.entries(front).map(([k,v])=>k+': '+JSON.stringify(v)).join('\n')+'\n---\n<!-- 657:enflasyon-otomatik -->\n\n'+body.trimEnd()+'\n';
 if(eski!==text)await writeFile(url,text);count++;
}
for(const d of enflasyonDonemleri){
 const ilk=d.aylar[0],tarih=`${ilk.yil}-${String(ilk.ay).padStart(2,'0')}-01`;
 const k=ayarlar.donemler.find(k=>k.baslangic<=tarih&&k.bitis>=tarih);
 if(!k)throw Error('Enflasyon döneminin katsayısı eksik: '+tarih);
 const bilinen=d.aylar.filter(a=>a.endeks!==undefined);
 for(const a of bilinen){
  const sg=parasalGostergeler(new Date(Date.UTC(a.yil,a.ay,0)).toISOString().slice(0,10),`${d.sonraki_zam.yil}-${String(d.sonraki_zam.ay).padStart(2,'0')}-01`,ayarlar.sabitler);
  const aylar=d.aylar.map(x=>x.ay<=a.ay?{degisim:x.degisim??0,endeks:x.endeks}:{degisim:0});
  const r=enflasyonFarki({bazEndeks:d.baz_endeks.deger,topluSozlesmeZam:d.toplu_sozlesme.zam,sonrakiZam:d.sonraki_zam.zam,aylar},k,sg);
  const tamam=a.ay===d.aylar.at(-1).ay;
  const aciklananAylar=d.aylar.filter(x=>x.ay<=a.ay);
  const aySayisi=aciklananAylar.length;
  const sonrakiAd=`${adlar[d.sonraki_zam.ay-1]} ${d.sonraki_zam.yil}`;
  const title=tamam
   ? `${adlar[a.ay-1]} ${a.yil} Enflasyon Rakamları Açıklandı: Memur ve Emekli Zammı Netleşti`
   : `${adlar[a.ay-1]} ${a.yil} Enflasyon Rakamları Açıklandı: ${aySayisi} Aylık Memur Enflasyon Farkı Belli Oldu`;
  const description=`TÜİK’in açıkladığı ${adlar[a.ay-1]} ${a.yil} verilerine göre aylık enflasyon %${fmt(a.degisim)}, ${aySayisi} aylık bileşik enflasyon %${fmt(r.endeksArtisi)} oldu. İşte memur ve emekli zammı, yeni katsayılar ve bağlı ödemeler.`;
  const aylikAnlatim=aciklananAylar.map(x=>`${adlar[x.ay-1]} ayında **%${fmt(x.degisim)}** (endeks: ${fmt(x.endeks)})`).join(', ');
  const body=[
   `Türkiye İstatistik Kurumu (TÜİK) tarafından açıklanan **${adlar[a.ay-1]} ${a.yil}** verileriyle birlikte, memur ve emeklilerin **${sonrakiAd}** maaş artışı için ${tamam?'6 aylık tablo tamamen netleşti':`${aySayisi} aylık görünüm ortaya çıktı`}.`,
   `Kendi beklenti senaryonuzu denemek için [Enflasyon Farkı Hesaplama Robotu](/enflasyon-farki-hesaplama-robotu/) sayfasını, yeni katsayılarla net bordronuzu görmek için [Memur Maaş Hesaplama](/memur-maas-hesaplama/) aracını kullanabilirsiniz.`,
   `## ${adlar[a.ay-1]} ${a.yil} İtibarıyla TÜFE Verileri`,
   `TÜİK verilerine göre bu dönemde ${aylikAnlatim} olarak gerçekleşti. Dönem öncesi baz endeks **${fmt(d.baz_endeks.deger)}** iken, ${adlar[a.ay-1]} ayı itibarıyla ${d.endeksTabani} bazlı genel endeks **${fmt(a.endeks)}** düzeyine ulaştı.`,
   `| Ay | Aylık TÜFE | Genel Endeks (${d.endeksTabani}) |\n|---|---:|---:|\n${aciklananAylar.map(x=>`| ${adlar[x.ay-1]} | %${fmt(x.degisim)} | ${fmt(x.endeks)} |`).join('\n')}`,
   `## Memur ve Emekli Maaşlarına Etkisi`,
   ...enflasyonAnlatimi({bazEndeks:d.baz_endeks.deger,topluSozlesmeZam:d.toplu_sozlesme.zam,sonrakiZam:d.sonraki_zam.zam,aylar},r,sonrakiAd,tamam),
   `## Beklenen Yeni Katsayılar ve Bağlı Ödemeler`,
   `Oluşan artış oranı maaş katsayılarına uygulandığında ortaya çıkan mevcut ve beklenen tutarlar aşağıda özetlenmiştir:`,
   `| Kalem | Mevcut Dönem | Beklenen (${sonrakiAd}) |\n|---|---:|---:|\n| Memur aylık katsayısı | ${k.memur_maas_aylik_katsayi.toFixed(6)} | ${r.yeni.aylik.toFixed(6)} |\n| Taban aylık katsayısı | ${k.taban_aylik_katsayi.toFixed(6)} | ${r.yeni.taban.toFixed(6)} |\n| Yan ödeme katsayısı | ${k.yan_odeme_katsayi.toFixed(6)} | ${r.yeni.yanOdeme.toFixed(6)} |\n| Bedelli askerlik (${sg.bedelli_askerlik_gosterge.toLocaleString('tr-TR')} gösterge) | ${fmt(r.mevcut.bedelli)} TL | ${fmt(r.yeni.bedelli)} TL |\n| Seyyanen ilave ödeme (brüt) | ${fmt(r.mevcut.seyyanen)} TL | ${fmt(r.yeni.seyyanen)} TL |\n| Muhtar aylığı | ${fmt(r.mevcut.muhtar)} TL | ${fmt(r.yeni.muhtar)} TL |`,
   `Bedelli askerlik ücreti, yürürlükteki **${sg.bedelli_askerlik_gosterge.toLocaleString('tr-TR')}** gösterge rakamının memur aylık katsayısıyla çarpılmasıyla belirleniyor (17/04/2026 tarihli 7577 sayılı Kanun ile 240.000’den 300.000’e çıkarılmıştır). Muhtar aylığı ise damga vergisi sonrası mevcut asgari ücretin altında kaldığında asgari ücret düzeyine tamamlanıyor.`,
   `## Kendi Maaşınızı Nasıl Hesaplarsınız?`,
   `Katsayı artışı bordrodaki tüm kalemlere aynı oranda yansımaz; gelir vergisi dilimi, aile yardımı, sendika, hizmet yılı ve tabi olunan sosyal güvenlik kanunu (5434/5510) net maaşı doğrudan etkiler. Kişisel bordronuzu [Kadrolu Memur Maaş Hesaplama](/memur-maas-hesaplama/), [4/B Sözleşmeli Maaş Hesaplama](/sozlesmeli-memur-maas-hesaplama/) veya [Emekli Memur Maaş Hesaplama](/emekli-memur-maas-hesaplama/) araçlarından hemen görebilirsiniz.`,
   `## Hesaplama Notu ve Kaynak`,
   `${d.kaynak}`,
   `[TÜİK / Resmî Kaynak](${d.kaynakUrl}) · [Hesaplama Yöntemi](/enflasyon-nasil-hesaplaniyor/) · [Enflasyon Farkı Robotu](/enflasyon-farki-hesaplama-robotu/) · [${ilk.yil} Yarıyıl Özeti](/${ilk.yil}-${ilk.ay===1?'ocak-haziran':'temmuz-aralik'}-enflasyon-ozeti/)`,
  ].join('\n\n');
  await yaz(`${a.yil}-${sluglar[a.ay-1]}-ayi-enflasyon-verileri`,title,description,d.kayitTarihi,body,d.kaynakUrl);
 }
 if(!bilinen.length)continue;
 const slug=`${ilk.yil}-${ilk.ay===1?'ocak-haziran':'temmuz-aralik'}-enflasyon-ozeti`;
 const body=`${d.baslik} için ${bilinen.length}/6 aylık kayıt bulunuyor. ${bilinen.length<6?'Eksik aylar için kesin sonuç üretilmez.':'Altı aylık kayıt tamamlandı.'}\n\n| Ay | Aylık TÜFE | Endeks (${d.endeksTabani}) |\n|---|---:|---:|\n${d.aylar.map(a=>`| ${adlar[a.ay-1]} | ${a.degisim===undefined?'Henüz girilmedi':'%'+fmt(a.degisim)} | ${a.endeks===undefined?'—':fmt(a.endeks)} |`).join('\n')}\n\n${bilinen.map(a=>`- [${adlar[a.ay-1]} ${a.yil} hesabı](/${a.yil}-${sluglar[a.ay-1]}-ayi-enflasyon-verileri/)`).join('\n')}\n\n${d.kaynak}\n\n[Kaynak](${d.kaynakUrl}) · [Güncel hesaplama robotu](/enflasyon-farki-hesaplama-robotu/)`;
 await yaz(slug,`${d.kisa} enflasyon özeti`,`${d.baslik} TÜFE oranları, endeksler ve aylık maaş zammı hesapları.`,d.kayitTarihi,body,d.kaynakUrl);
}
console.log(`${count} enflasyon yazısı ve dönem özeti hazır.`);
