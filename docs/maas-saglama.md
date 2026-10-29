# Maaş hesabı dış kaynak sağlaması · 29 Ekim 2026

İlk sürüm eski 657 fonksiyonunu 784 örnekte aynen üretiyordu. Bu, bağımsız bordro doğrulaması değildi. Kullanıcının verdiği dört dış kaynakla yapılan yeni karşılaştırma aşağıdadır. Dış sitelerin kodu, tasarımı ve metinleri ürüne kopyalanmadı; hesaplar kendi TypeScript motorumuzda uygulanır.

## Aynı öğretmen profili

Ekim 2026, lisans, öğretmen (kariyer basamağı yok), maaş/kadro 9/1, kıdem 0, 5510, bekâr, çocuksuz, sendika/İLKSAN/BES yok, alan/alt görev ek ödemesi yok, kullanılan istisnalar 0. Kimseye ait kişisel bordro verisi kullanılmadı.

| Kaynak | Net TL | Gözlem |
| --- | ---: | --- |
| OzkanSoft MAHEP | 71.527,87 | ÖHT %105,56; damga 340,02; kişi MYÖ 3.831,42; GSS 2.128,56 |
| Memurlar.net | 71.527,65 | Gelir kalemleri aynı; damga 340,24. 22 kuruşluk fark zorla eşitlenmedi. |
| Memur Özlük | 71.527,86 | Gösterilen kalemlerin toplamıyla toplam gelir arasında 2 kuruş yuvarlama farkı; damga 340,01 |
| Kadim Hukuk | 73.441,61 | Aynı 9/1 seçiminde ÖHT %120,56 gösterdi; 15 puanlık oran farkı sonucu artırıyor. Referans olarak aynen alınmadı. |
| Yeni 657 hesabı | 71.527,87 | Kalem bazında MAHEP örneğiyle eşleşir. Otomatik test vardır. |

MAHEP'te ikinci profili seçip hesaplama denemesinde site “Yetkisiz erişim reddedildi” cevabı verdi. Erişim kısıtlaması aşılmadı. Sonraki çalışmada OzkanSoft 4/C ve 4/D'nin normal herkese açık formlarından örnekler alınabildi; seçicilerin her değişimde formu otomatik gönderdiği görüldü. Bu durum önceki reddin nedenini kesinleştirmez. Sonraki normal form kontrollerinde arşiv memurunun sendika, dil ve aile varyantları ile 4/B örnekleri de doğrulanabildi; yalnız kaydedilen profiller doğrulanmış sayılır.

## Kâtip karşılaştırması

13/3, lise, 1 yıl, 5510, bekâr, çocuksuz profilinde iki kaynakta da %61 esas tazminat + 15 puan ilave karşılığı 76.577,25 TL gelir gözlendi. Memurlar.net %3 BES ve 330,75 TL damga ile 69.778,16 TL; Memur Özlük BES olmadan 330,52 TL damga ile 70.919,39 TL gösterdi. Memur Özlük'te “Diğer İller” seçilmesine rağmen çıkan oran Ankara/İstanbul/İzmir grubuna karşılık geliyor. Ayrıca açıkça Ankara grubu ve BES seçilen yeni 657 hesabı 69.778,39 TL verir: aynı gelirler, aynı 1.141 TL BES, 330,52 TL damga. Memurlar.net netinden 23 kuruş fazladır. Bu yüzden bu gözlem, bizim “Diğer İller” profilinin doğrulandığı şeklinde kullanılmaz. Görev yeri varsayımı eşleşmeden net tutar karşılaştırılmaz.

## Yapılan düzeltmeler

- [HMB 03.07.2026 genelgesi](https://ms.hmb.gov.tr/uploads/2026/07/2026-Yili-Temmuz-Ayina-Ait-Mali-ve-Sosyal-Haklara-Iliskin-Genelge-9b5304ed658d77cb.pdf) ilk sayfa görselinden katsayılar doğrulandı: aylık 1,575512; taban 25,794915; yan ödeme 0,499649. Eski 657 kaydındaki son basamak farkları düzeltildi.
- Gelir vergisinin koşulsuz sıfırlanması kaldırıldı. [GİB 2026 ücret tarifesi](https://gib.gov.tr/mevzuat/kanun/433/madde/6937) ile kümülatif matrah ve ay içinde dilim geçişi hesaplanır. Asgari ücret istisnası ay bazında bulunur; başka ödemede kullanılan istisna düşülebilir.
- Damga vergisi istisnası hesap sırasında erken yuvarlanmaz.
- 14 günlük farkta tam aylık katsayısının 14/30'u kullanılmıyor. HMB Ocak ve Temmuz kayıtlarının katsayı farkı kullanılıyor: 0,187641 / 3,072122 / 0,059508. Bu yol katsayı farkı hesabıdır; terfi, kıst maaş ve dönem içinde değişen şahsi durumların tamamını kapsamaz.
- Eski 784 kayıt `tests/fixtures/memur-maas.json` dosyasında geçmiş karşılaştırma verisi olarak saklanır. Yeni doğruluk iddiası değildir ve yeni motorun bu hatalı kayıtlara uyması beklenmez.

- OKS/BES katkısında kuruşlar yukarı yuvarlanmaz, atılır. [Resmî otomatik katılım SSS, 27. soru](https://www.anadoluhayat.com.tr/Documents/PDF%20Files/OtomatikKatilim/SSS-10-01-2017.pdf) esas alındı.
- 4/B ücretinin matrahından seyyanen ödemenin ikinci kez düşülmesi kaldırıldı; kümülatif tarife ve kullanılan istisna alanları eklendi. Bu sayısal hata için test vardır; bütün sözleşmeli unvan/kurum rejimleri dış kaynakla doğrulanmış sayılmaz.

## Ek araçların kapsamı

Kendi hesap motorumuzla öğretmen ve normal öğretim akademik ek ders, tek tür ek ders ücretinden saat, İLKSAN, bileşik enflasyon, muhtar ödeneği, 68/B hizmet, genel lojman puanı ve yurt içi geçici/sürekli yolluk araçları eklendi. Belediye başkanı hesabı nüfus göstergesini üretir; K cetveli ek göstergesi ve kişisel prim kullanıcı girdisidir.

Yollukta görev tarihinin gündeliği ve konaklama tavanı girilir; bütün kurumların tarifeleri otomatik seçilmez. Ek ders modeli kadrolu öğretmen içindir; normal ücretli öğretmen için ayrı SGK/destek saati modeli eklendi, öz gelirli/II. öğretim akademik varyantları henüz tamamlanmadı. 4/D için kullanıcı, verilen kaynak örneklerinin esas alınmasını istedi; OzkanSoft örneği Sağlık Bakanlığı TİS modelidir. 4/C adıyla sunulan geçiş rejimi hesabı ve rütbe/cetvel bazlı asker emekliliği henüz uygulanmadı. Bu araçlar tamamlanmış gibi dizine eklenmez.

Kaynak envanteri: [OzkanSoft araçları](https://www.ozkansoft.com/mahep.php), [Memurlar.net araçları](https://www.memurlar.net/maasrobot/), [Memur Özlük](https://memurozluk.com/memur-maas-hesaplama), [Kadim Hukuk](https://kadimhukuk.com.tr/memur-maasi-hesaplama/).


## Kaynak aracı → yerel karşılık

| Kaynak | Yerel karşılık | Durum |
| --- | --- | --- |
| MAHEP / Memurlar maaş | `/memur-maas-hesaplama/` | Öğretmen ve kâtip profillerinin yukarıdaki sağlaması var; bütün unvanların tam eşliği iddia edilmez |
| 4BMAHEP / sözleşmeli | `/sozlesmeli-memur-maas-hesaplama/` | Mevcut 657 modeli ve vergi düzeltmesi; kurum çeşitleri açık |
| EMİHEP / emekli | `/emekli-memur-maas-hesaplama/` | Mevcut 5434 modeli; kaynakların bütün emekli unvanları henüz yok |
| EDUHEP | Öğretmen ve akademik ek ders sayfaları | Normal öğretim; ücretli öğretmen, kurum öz gelirli dersler açık |
| UTEDESHEP | `/ek-ders-ucretinden-saat-hesaplama/` | Tek ücret türü için yaklaşık ters çözüm |
| İLKSAN EYHEP | `/ilksan-emekli-yardimi-hesaplama/` | Resmî 2026 eşik ve yöntemleri |
| ENOHEP | `/enflasyon-orani-hesaplama/` | Altı ay bileşik oran |
| YOHEP / harcırah | Sürekli ve geçici yolluk sayfaları | Gündelik/tavan elle; bütün tarifeler otomatik değil |
| Memurlar muhtar | `/muhtar-maasi-hesaplama/` | Gösterge, damga ve net asgari tabanı |
| Memurlar belediye başkanı | `/belediye-baskani-maasi-hesaplama/` | Nüfus göstergesi; K ilavesi/prim elle |
| Memurlar hizmet | `/68-b-hizmet-hesaplama/` | Genel 68/B hizmet koşulları |
| Memurlar lojman | `/lojman-puani-hesaplama/` | Genel cetvel; kuruma özel puanlar hariç |
| 4DMAHEP | `/4d-isci-maas-hesaplama/` | Sağlık örnek tutarlarıyla düzenlenebilir brüt bordro; 2026 yemek istisnası düzeltildi. TİS kıdem/görev/mesai cetvellerinin tamamı otomatik değil |
| 4CMAHEP | Henüz yok | Kaynak 4/C adıyla 2026 hesabı sunuyor; eski 4/C’den 4/B’ye geçişteki ücret rejimi ayrıca doğrulanmalı |
| Memurlar asker emekli | Henüz yok | Rütbe/görev/makam/kadrosuzluk cetvelleri bağımsız doğrulanmalı |

Asker örneği de tarayıcıda incelendi: Temmuz–Aralık 2026, albay/asker alma bölge başkanı, 1/1, 25 yıl; net 85.553,55 TL. Bu tutar henüz yerel bir hesap doğrulaması değildir. Rütbe cetvelini tahmin ederek aynı neti üretme yoluna gidilmedi.

4/C statüsünün kaldırılması, kaynaktaki “4C MAHEP” etiketinin otomatik olarak arşiv sayılması anlamına gelmez. Kaynak 2026 dönemini de seçtiriyor. [KHK 696 yasama kaydı](https://www5.tbmm.gov.tr/develop/owa/khk_sd.onerge_bilgileri?kanunlar_sira_no=221646) ile statü geçişi ayrıştırılmalı; ad benzerliğinden maaş formülü türetilmemelidir.

4/D kaynağının mevcut formunda Sağlık Bakanlığı seçeneği var. Bakanlık açıklamasına göre ilgili TİS 28.08.2025 imzalı, 01.01.2025–31.12.2026 yürürlük dönemli. Tam sözleşmenin ücret/yardım cetvelleri olmadan genel çerçeve protokolünü bütün kurumlara uygulamak doğru olmaz.

## Son kontroller

Güncel test ve derleme sonucu aşağıdaki çalışma kaydına eklenir. Testlerin geçmesi, açık bırakılan mevzuat ve kurum varyantlarını doğrulanmış hâle getirmez.

## 29.10.2026 genişletmesi

Kaynak seçicilerinde OzkanSoft 270, Memurlar.net 240 seçenek sunuyor. Yazım farklarıyla birleştirilen envanterde 335 ad bulunuyor; bu sayı 335 farklı hukuki kadro demek değildir. `src/data/maas-kaynak-envanteri.json` karşılaştırma envanteridir, bütün bu adların motor tarafından desteklendiği anlamına gelmez. Eski sitenin 79 seçeneğine dokuz gerçek oran tablosuyla unvan eklendi; form 88 seçenek, yıllık yayın 85 unvan profili içeriyor.

- Mühendis, mimar, iç mimar, peyzaj mimarı, bölge plancısı ve şehir plancısı: teknik lisans, 1–8. derece. Mühendis 1–8/1 için tam bordro örnekleri; diğer beş unvan için 1/1 ve 8/1 karşılaştırmaları yapıldı. 9/1 mühendis kaynakta sonuç vermedi; tablo uydurulmadı.
- İstatistikçi: 1–9. dereceler ayrı kaynak gözlemlerinden çıkarıldı.
- Tekniker ve programcı: iki yıllık, dört yıllık, lisans, mühendislik üst öğrenimi, teknik öğretmen üst öğrenimi ve önlisans seçenekleri ayrı tutulur. Her unvan için 55 derece/koşul bordrosu test verisidir. Giriş örneği iki yıllık öğrenim, 10/1; mühendislik üst öğrenimi 8/1 sınırındadır. Koşullar forma açık seçim olarak eklendi.
- Derecesi/öğrenimi doğrulanmamış yeni unvan kombinasyonlarında başka unvanın tutarı kullanılmaz; açıklamalı hata gösterilir.
- Cezaevi müdürü: mevcut 10 numaralı kodun eksik oranları 12 kaynak bordrosuyla tamamlandı; lise/yükseköğrenim, 1–6. derece. Yıllık maaş sayfası artık hesap üretir. Ayrı 11 numaralı “özel +13” koşulu tahmin edilmez.

Memurlar.net'in 240 unvanı ilk aşamada 1/1, kıdem 0 ve yıllık matrah alanı 1 ile bileşen envanteri için gezildi. Bu aşama tam net maaş doğrulaması **değildir**: alan, cari ayı da içeren yıllık matrahtır. Testlere alınan yeni derece bordroları Ekim 2026, işe giriş 01.10.2026, kıdem 0, BES yok ve yıllık matrah alanı boş profilleridir. Girdi derecesiyle sonuç derecesi uyuşmayan geçici tarayıcı çıktıları veri üretiminde reddedilir.

Memurlar.net damga tutarları 33.000 TL istisna matrahıyla yaklaşık örtüşür; motorumuz GİB'in 33.030 TL brüt asgari ücretini kullanır. Kaynakta gelir toplamı, prim ve GV matrahının yuvarlama sırası da bazı örneklerde 1–2 kuruş fark yaratır. Tekniker/programcı testleri her gelir kalemini ayrı karşılaştırır, kaynaktaki primin yuvarlanmamış matrahını sınar ve net farkını gelir/prim/damga kalemleriyle açıkça uzlaştırır. Bu farklar genel bir yüzdelik toleransla gizlenmez.

### 4/D örneğinin istisna farkı

OzkanSoft 4D MAHEP v0.1 (TEST), Sağlık Bakanlığı, Temmuz–Aralık 2026, Ekim, diğer/kıdemli işçi, kıdem 0; 31 ücret günü, 30 prim günü, 21 yemek, servis, BES yok, %15 GV örneği:

| Kalem | Kaynak örneği | Güncel kuralla 657 |
| --- | ---: | ---: |
| Brüt sözleşme ücreti | 83.020,48 | 83.020,48 |
| Hizmet primi | 13.283,28 | 13.283,28 |
| Sosyal yardım | 5.584,13 | 5.584,13 |
| Nakit yemek | 6.929,37 | 6.929,37 |
| Yemek SGK / vergi istisnası | 3.318,00 | 6.300,00 |
| Çalışan SGK | 14.769,90 | 14.352,42 |
| Çalışan işsizlik | 1.054,99 | 1.025,17 |
| Sendika aidatı | 2.678,08 | 2.678,08 |
| GV matrahı | 86.996,29 | 84.461,59 |
| Gelir vergisi | 7.434,34 | 7.054,14 |
| Damga | 550,04 | 527,41 |
| Net | 82.329,91 | 83.180,04 |

Kaynak örneği günlük 158 TL'yi hem prim hem vergi istisnasında kullanıyor. [7577 sayılı Kanun, madde 10 ve 14](https://cdn.tbmm.gov.tr/KKBSPublicFile/D28/Y4/KanunMetni/b462ed83-523b-4301-a0ba-e50b92580ea7.htm) işyerinde yemek verilmeyen günler için 300 TL prim istisnası getirir; [GİB 2026 ücret rehberi](https://intvrg.gib.gov.tr/hazirbeyan/assets/pdf/DUYURU_UNIVERSAL_2026_2026_Ucret_Geliri.pdf) nakdi yemek vergi istisnasını günlük 300 TL açıklar. Eski 158 TL kuralı yalnız kaynak sonucunu yeniden üretmek için testte kullanılır; kullanıcı hesabında seçilmez. Prim tavanı 9 kat ve çalışan %14 SGK + %1 işsizlik, SGK'nın resmî 2026 tablolarından gelir.

Yeni 4/D sayfası Temmuz–Aralık 2026 normal 4/a çalışan bordrosudur. Kaynak örneğinin günlük 2.678,08 TL ücreti, %16 hizmet primi, 5.584,13 TL sosyal yardım ve 329,97 TL yemek bedeli düzenlenebilir başlangıç girdileridir; bağımsız doğrulanmış bütün TİS cetveli olarak sunulmaz. Tediye/ikramiyede hak edilen gün girilir; tarih ve kıdemden hak ediş otomatik türetilmez. Önceki ay içi PEK, kullanılan istisna, kümülatif vergi matrahı ve BES alanları vardır. SGDP ve ücret dışı PEK'in sonraki iki aya otomatik devri kapsam dışıdır.

### Dönem güvenliği

Vergi tarifeleri `src/data/vergi-arsivleri/YYYY.json` içinde yıl bazında korunur. Döneme ait tarife yoksa güncel yılın tarifesi sessizce uygulanmaz. Derleme maaş yılıyla vergi yılının uyuşmasını denetler; maaş çıktısı değişmese de eksik vergi arşivini tekrar yazar. Ana maaş, 4/B ve ek araçların ay seçenekleri dönemden üretilir. 4/D'nin doğrulanmış 2026 dönemi ayrıca sabittir; ileride eklenen memur katsayısı bu örneğin ücretlerini kendiliğinden büyütmez.

Sonraki YOHEP, UTEDESHEP ve belediye başkanı kontrolleri; site düzeltmeleri ve açık kapsam: [29 Ekim devam kaydı](devam-29-ekim.md).
