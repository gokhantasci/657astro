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
  const title=`${adlar[a.ay-1]} ${a.yil} enflasyon verileri ve memur zammı hesabı`;
  const description=`Ortak veri kaydında ${adlar[a.ay-1]} ${a.yil} TÜFE değişimi %${fmt(a.degisim)}; dönem başından beri endeks artışı %${fmt(r.endeksArtisi)}.`;
  const body=`${description}\n\nBu sayfa ${d.kayitTarihi.split('-').reverse().join('/')} tarihli yönetim kaydından otomatik hazırlanmıştır; yeni bir TÜİK duyurusunun yayım tarihi olduğu anlamına gelmez.\n\n## Dönem hesabı\n\n${d.endeksTabani} bazlı ${a.endeksHesaplandi?"oranlardan hesaplanan yaklaşık endeks":"resmî endeks"} **${fmt(a.endeks)}**; dönem öncesi baz **${fmt(d.baz_endeks.deger)}**. Endeks artışı **%${fmt(r.endeksArtisi)}**, aylık oranların aritmetik toplamı **%${fmt(r.aylikToplam)}**. Maaş farkında aritmetik toplam kullanılmaz.\n\nDönem başı sözleşme zammı %${fmt(d.toplu_sozlesme.zam)}. Pozitif enflasyon farkı **%${fmt(Math.max(0,r.fark))}**; sonraki sözleşme zammıyla bileşik artış **%${fmt(r.kumulatifZam)}**. ${tamam?'Altı ayın tamamı kayıtta bulunduğundan dönem özeti tamamdır.':'Henüz girilmeyen sonraki aylar sıfır varsayılmıştır. Bu oran dönem sonu kesin zammı değildir.'}\n\n${r.fark<=0?`Fark oluşması için yaklaşık **%${fmt(r.gerekenEnflasyon)}** ek enflasyon gerekir.\n\n`:''}## Kaynak ve hesaplama\n\n${d.kaynak}\n\n[Kaynak kayıt](${d.kaynakUrl}) · [Hesap yöntemini okuyun](/enflasyon-nasil-hesaplaniyor/) · [Güncel enflasyon robotu](/enflasyon-farki-hesaplama-robotu/) · [${ilk.yil} yarıyıl özeti](/${ilk.yil}-${ilk.ay===1?'ocak-haziran':'temmuz-aralik'}-enflasyon-ozeti/)`;
  const ayrinti=`\n\n## ${adlar[a.ay-1]} ayına kadar açıklanan TÜFE verileri\n\n| Ay | Aylık değişim | Resmî genel endeks (${d.endeksTabani}) |\n|---|---:|---:|\n${d.aylar.filter(x=>x.ay<=a.ay).map(x=>`| ${adlar[x.ay-1]} | %${fmt(x.degisim)} | ${fmt(x.endeks)} |`).join('\n')}\n\n## Memur ve emekli maaşlarına etkisi\n\n${enflasyonAnlatimi({bazEndeks:d.baz_endeks.deger,topluSozlesmeZam:d.toplu_sozlesme.zam,sonrakiZam:d.sonraki_zam.zam,aylar},r,`${adlar[d.sonraki_zam.ay-1]} ${d.sonraki_zam.yil}`,tamam).join('\n\n')}\n\n## Sonraki dönem katsayı ve ödeme örnekleri\n\n| Kalem | Mevcut dönem | Bu verilere göre sonraki dönem |\n|---|---:|---:|\n| Aylık katsayı | ${k.memur_maas_aylik_katsayi.toFixed(6)} | ${r.yeni.aylik.toFixed(6)} |\n| Taban aylık katsayısı | ${k.taban_aylik_katsayi.toFixed(6)} | ${r.yeni.taban.toFixed(6)} |\n| Yan ödeme katsayısı | ${k.yan_odeme_katsayi.toFixed(6)} | ${r.yeni.yanOdeme.toFixed(6)} |\n| Seyyanen ilave brüt | ${fmt(r.mevcut.seyyanen)} TL | ${fmt(r.yeni.seyyanen)} TL |\n| Muhtar aylığı (mevcut asgari ücret korunarak) | ${fmt(r.mevcut.muhtar)} TL | ${fmt(r.yeni.muhtar)} TL |\n\nBedelli askerlik için ortak kayıttaki yürürlük göstergesi **${sg.bedelli_askerlik_gosterge}** kullanıldığında mevcut hesap **${fmt(r.mevcut.bedelli)} TL**, katsayı projeksiyonu **${fmt(r.yeni.bedelli)} TL** olur. 17/04/2026 tarihli değişiklikten itibaren 300.000 gösterge yürürlüktedir; önceki aylar için 240.000 gösterge kullanılır.\n\n## Kendi maaşımı nasıl hesaplarım?\n\nNet maaş, tüm bordro kalemlerinin aynı oranda artırılmasıyla bulunmaz. Vergi dilimi, istisnalar, aile yardımı, hizmet yılı ve tabi olunan emeklilik kanunu sonucu değiştirir. [Memur maaş hesabında](/memur-maas-hesaplama/) kendi profilinizi seçin; [emekli maaş hesabını](/emekli-memur-maas-hesaplama/) ayrıca inceleyin. Altı ayın tamamı resmî veya tahmini olarak girilirse memur maaş sayfası 14 günlük katsayı farkını da gösterir.\n\n## Enflasyon farkı neden aylık oranların toplamı değildir?\n\nAylık değişimler birbirini çarpar: (1 + ay1/100) × … × (1 + ay6/100). Genel endeks yayımlandığında bu yuvarlanmış oranlar yerine resmî son endeks / resmî baz endeks oranı esas alınır. Dönem başında verilen sözleşme artışı bu orandan bölünerek çıkarılır; negatif sonuç enflasyon farkı ödemesi doğurmaz.\n\n${tamam?'Dönem verileri tamamlanmıştır. Resmî katsayı genelgesi, vergi ve diğer bordro düzenlemeleri ayrıca esas alınır.':'Sonraki ayların verisi henüz yoktur; bu yazıdaki ileri dönem tutarları eksik aylarda %0 varsayan bir senaryodur. [Robot üzerinden](/enflasyon-farki-hesaplama-robotu/) aylık beklentilerinizi girebilirsiniz.'}\n`;
  await yaz(`${a.yil}-${sluglar[a.ay-1]}-ayi-enflasyon-verileri`,title,description,d.kayitTarihi,body+ayrinti,d.kaynakUrl);
 }
 if(!bilinen.length)continue;
 const slug=`${ilk.yil}-${ilk.ay===1?'ocak-haziran':'temmuz-aralik'}-enflasyon-ozeti`;
 const body=`${d.baslik} için ${bilinen.length}/6 aylık kayıt bulunuyor. ${bilinen.length<6?'Eksik aylar için kesin sonuç üretilmez.':'Altı aylık kayıt tamamlandı.'}\n\n| Ay | Aylık TÜFE | Endeks (${d.endeksTabani}) |\n|---|---:|---:|\n${d.aylar.map(a=>`| ${adlar[a.ay-1]} | ${a.degisim===undefined?'Henüz girilmedi':'%'+fmt(a.degisim)} | ${a.endeks===undefined?'—':fmt(a.endeks)} |`).join('\n')}\n\n${bilinen.map(a=>`- [${adlar[a.ay-1]} ${a.yil} hesabı](/${a.yil}-${sluglar[a.ay-1]}-ayi-enflasyon-verileri/)`).join('\n')}\n\n${d.kaynak}\n\n[Kaynak](${d.kaynakUrl}) · [Güncel hesaplama robotu](/enflasyon-farki-hesaplama-robotu/)`;
 await yaz(slug,`${d.kisa} enflasyon özeti`,`${d.baslik} TÜFE oranları, endeksler ve aylık maaş zammı hesapları.`,d.kayitTarihi,body,d.kaynakUrl);
}
console.log(`${count} enflasyon yazısı ve dönem özeti hazır.`);
