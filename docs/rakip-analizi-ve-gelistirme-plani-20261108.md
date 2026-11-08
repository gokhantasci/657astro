# 657.com.tr: canlı inceleme ve geliştirme planı

İnceleme tarihi: 08.11.2026, Türkiye saati. Bu çalışma ürün ve erişim incelemesidir; rakiplerin hesap sonuçlarının doğruluğunu onaylayan bir denetim değildir. Trafik, dönüşüm veya sıralama üstünlüğü ölçülmedi.

## Canlı sitede incelenen kapsam

Anasayfa, araç dizini, memur maaşı, enflasyon farkı, yargılama gideri, kesinleşme, hukuk sözlüğü, Bilecik adli çevre, tam kabul ve tarifeler dizini. Her biri 375 ve 1440 pikselde açıldı: 20 görünümde HTTP 200, tarayıcıda yakalanan uygulama hatası yok, kök belgede yatay taşma yok. Bu, bütün site ve bütün kombinasyonların hatasız olduğu anlamına gelmez. Araç dizininde “enflasyon” araması iki ilgili araca ulaştı. İşlem sayaçlarını şişirmemek için tarayıcı kontrolündeki kullanım POST istekleri GET olarak yanıtlandı.

Ham kayıt ve ekran görüntüleri: `artifacts/canli-gezinti-20261108/`. Sitenin dizininde 85 araç bulunuyor. Araçların bütün hesap dalları bu gezintide yeniden test edilmedi.

Gözlemler:

- Anasayfada temel araçlar küçük bağlantılar halinde; duyurular, işlem sayaçları ve yazılar aynı görsel düzeyde yarışıyor. Kullanıcının önceki erişim şikâyetiyle örtüşüyor.
- Maaş sayfasında mobilde uzun form, sonuç, ayrıntılı gelir/kesinti ve genel açıklamalar art arda geliyor. Sonuca dönmek ve iki senaryoyu karşılaştırmak zorlaşıyor.
- Arama, altı kategori ve “Masam” favorileri zaten var. Yeni bir favori sistemi yazmak yerine bu erişimi anasayfaya taşımak yeterli olabilir.
- Paylaşılabilir hesap adresleri, UYAP Excel okuma, UDF araçları, tarihli tarifeler, yargı haritası, sözlük ve DPB arşivi mevcut. Bunlar yeni özellikmiş gibi tekrar önerilmemeli.
- Enflasyon sayfasında 15.11.2026 tarihli beklenti kaydı görülüyor. İnceleme günü 08.11.2026 olduğu için bu kayıt gelecekte. Kaynak belge ve yayın tarihi doğrulanmalı; doğrulanmadan “açıklanmış beklenti” olarak kullanılmamalı. Bu sorun aşağıdaki kaynak doğrulama işinin ilk örneğidir.

## Karşılaştırılan kaynaklar

| Kaynak | Gözlenen yaklaşım | 657 için çıkarım |
| --- | --- | --- |
| [MemuRobotu maaş](https://memurobotu.com/maas-hesaplama) | Statü ayrımı, alan yanında kısa yardım, desteklenen kapsam ve resmî kaynak açıklaması | Karmaşık alanı formun altında uzun metin yerine seçimin yanında açıklamak |
| [MemuRobotu araç dizini](https://memurobotu.com/hesaplama-araclari) | Maaş, sınav ve memur hakları gibi az sayıda görev grubu | Mevcut 85 aracı aynı anda göstermek yerine kullanıcının yaptığı işe göre başlangıç sunmak |
| [MemurPedia maaş farkı](https://memurpedia.com/hesapla/maas-zam-farki) | Mevcut maaş veya unvanla başlama, açıklanmış aylarla varsayımları ayırma, örnekle deneme | Mevcut maaş motoru ve enflasyon motorunu aynı senaryo ekranında birleştirmek |
| [Sigorta Analiz maaş/enflasyon](https://www.sigortaanaliz.com/hesaplama/maas-enflasyon-farki) | İki maaşın alım gücü karşılaştırması, aylık karşılık tablosu, sonuç bağlantısı | Sözleşme kaynaklı enflasyon farkından ayrı bir reel maaş değişimi aracı |
| [Türkiye Barolar Birliği](https://barobirlik.org.tr/HesaplamaAraclari) | Vekâlet, faiz ve makbuz işlemleri aynı araç merkezinde; faiz gün tabanı seçimi | Mevcut hukuk araçları arasında görev odaklı geçiş; yeni faiz motoru yazmaya gerek yok |
| [Av. Emre Arslan araçları](https://emrearslan.av.tr/hukuki-araclar/hesaplama-araclari/) | Alan yanında açıklama, kalem kalem sonuç, kopyalama, hukuki dayanak | Hesap sonucu ile dayanağın aynı görünümde bulunması |
| [Av. Zafer Kaymak araçları](https://zaferkaymak.av.tr/hesaplama/) | İş akışı rehberleri, dönem bölmeli faiz, parametre ve yürürlük bilgisi | Hesapları dava veya personel işlemi boyunca bir zincire bağlamak |
| [udf.org.tr hesaplama](https://www.udf.org.tr/hesaplama/) | Harç, vekâlet ve faiz aynı hesap masasında | Birleştirilmiş çalışma alanı; rakipte yazan tarife/oran doğrudan veri kaynağı yapılmamalı |
| [Hesapkurdu dizini](https://www.hesapkurdu.com/hesaplama-araclari) | Popüler araçlar ve ihtiyaç grupları | İşe göre kısa başlangıç ve ilgili rehber bağlantıları |

Memurlar.net maaş robotunun doğrudan sayfası web okuma aracında açılamadı; [resmî kendi güncelleme yazısı](https://www.memurlar.net/haber/1171827/memur-maas-robotu-guncellendi.html) görüldü. Robotun iç etkileşimleri karşılaştırılmış gibi kabul edilmedi. Adliyeci.org doğrudan erişimi zaman aşımına uğradı. Kullanıcının kendi adliyeci.657.com.tr sitesi önceki tasarım referansıdır; bağımsız rakip olarak sayılmadı.

## Önceliklendirilmiş eklemeler ve uygulama yöntemi

| Öncelik | İş | Mevcut temel | Ekleme yöntemi | Kabul koşulu |
| --- | --- | --- | --- | --- |
| P0 | Kaynak ve tarih doğrulama | `veri-kontrol`, ortak JSON kayıtları ve testler | Her kayıt için belge URL'si, yayın tarihi, yürürlük başlangıcı/bitişi ve son doğrulama; gelecekteki yayın tarihini aktif beklenti olarak kullanmama, henüz yürürlüğe girmemiş tutarı “gelecek dönem” diye ayırma | 15.11.2026 örneği 08.11.2026'da aktif tahmin olmaz; geçerli gelecek yürürlük kaydı silinmez, eski doğru kayıt korunur |
| P1 | Araçlara hızlı erişim | Mevcut arama, kategoriler, kullanım sıralaması, `657:masa` | Hazırlanan anasayfa önizlemesini kullanıcı değerlendirdikten sonra mevcut Astro bileşenlerine taşı; maaş/enflasyon ilk sırada, anasayfada “Masam”, hesaplayıcılarda diğer araçlara geçiş | Mobilde ana araca tek bağlantıyla ulaşma; arama, klavye ve mevcut adresler korunur |
| P1 | Maaş senaryosu karşılaştırması | `memur-maas`, `maas-tahmini`, vergi ve enflasyon motorları | A/B girdilerini bellekte ayrı tutan `MaasKarsilastirma.astro`; iki sonucu aynı motorla hesapla; net, brüt, vergi ve kalem farkını göster. Tam net maaş yalnız mevcut motorun desteklediği kapsamda üretilir | Aynı iki girdi sıfır fark verir; farklı dönemlerde doğru katsayı ve vergi tarifesi kullanılır |
| P1 | Okunur sonuç anlatımı | `enflasyon-anlatimi.ts` ve hazırlanmış karşılaştırma örneği | Önerilen metin kullanıcı tarafından seçildikten sonra ortak anlatım fonksiyonuna taşı; önce sonuç ve nedeni, formül açılır bölümde | Fark oluşan/oluşmayan senaryolar; resmî ay/tahmin ayrımı; negatif farkın zammı azaltmaması |
| P1 | İş akışı rehberleri | Dava açılışı, harç, karar, gider ve kesinleşme araçları | Yeni motor yerine `is-akislari.json` ve ortak `IsAkisi.astro`; “Dava açıyorum”, “Karar hazırlıyorum”, “Maaşımı kontrol ediyorum” başlangıçları; yalnız gerekli ve hassas olmayan parametreleri araçlar arasında aktar | Bir adımın sonucu ilgili sonraki araca taşınır; kişi/dosya içeriği URL'ye yazılmaz; adli ve idari yargı kuralları karıştırılmaz |
| P2 | Sonuç raporu | Mevcut kopyalanabilir döküm ve PDF üretim altyapısı | Ortak yazdırma bileşeni: girdiler, seçilen dönem, sonuç kalemleri, varsayımlar, kural/veri sürümü ve kaynaklar. Tarayıcıda yazdır/PDF; isteğe bağlı CSV | Ekranla çıktı tutarları aynı; uzun tablolar kesilmez; örnek ve gerçek girdi ayrılır |
| P2 | Reel maaş / alım gücü aracı | Enflasyon endeksleri ve dönem arşivi | Ayrı `reel-maas.ts`, `reel-maas-hesaplama/`; iki net veya iki brüt tutar ve ay seçimi. TÜİK resmî endeks serisi; farklı endeks tabanları aynı seriymiş gibi bölünmez | Reel değişim = (yeni/eski maaş)/(yeni/eski endeks)-1; açıklanmamış aya kesin sonuç üretilmez; nominal para birimi dönüşümüyle karıştırılmaz |
| P2 | 12 aylık net maaş ve vergi görünümü | Mevcut aylık bordro ve kümülatif vergi motoru | Bir yeni motor yerine aylık hesabı yıl içinde sırayla çalıştır; kümülatif matrahı aya devret; kullanıcı dönem değişikliklerini belirtir | Ocak ve vergi dilimi geçişleri; yıl ortası katsayı; eksik dönem verisinde açık durma/uyarı; otomatik uydurma katsayı yok |
| P3 | Yeni araç: yıllık izin ücreti | Mevcut işçi yıllık izin ve kıdem/ihbar araçları | Önce mevcut izin hakkı hesabını ücret alacağından ayır; son brüt ücret, kullanılmayan gün ve seçilen kesinti varsayımlarıyla saf fonksiyon; yürürlükteki kanun ve resmî kesinti kaynağı doğrulanır | Hak edilen gün ile parasal alacak ayrı; sözleşme sona erme ve kapsam koşulları açık; örnekler resmî dayanakla test edilir |

İlk sürüme infaz, nafaka, mal rejimi veya içtihat sonucu otomatik yorumlayan geniş hesaplar eklemek yerine mevcut kapsamın erişimini ve açıklamasını güçlendirmek önerilir. Bu alanlar farklı hukuk kuralları ve dosyaya özgü istisnalar gerektirir; ayrı kaynak ve uzman inceleme işi olarak ele alınmalıdır.

## Teknik uygulama sırası

1. Kaynak doğrulama ve mevcut hatalar: para birimi, faaliyet/yetkili mahkeme ayrımı, işlem/ziyaret ayrımı. Yeni tarih doğrulama testleri yayına alınmadan önce çalışır.
2. Kullanıcı değerlendirmesindeki anasayfa ve sonuç metni örneklerini tamamla. Global stilleri değiştirmek yerine mevcut `Layout`, `portal.css` ve token sistemine küçük bileşenler ekle. Bu iki önizleme bu yayın paketinde üretime taşınmadı.
3. A/B maaş ve iş akışı bileşenleri; mevcut motorların üstüne kur. Sonra yazdırılabilir sonuç raporu. Bu aşama yeni veri kaynağı gerektirmeden en çok yeniden kullanım sağlar.
4. Reel maaş için resmî uzun dönem TÜFE serisi ve taban geçişleri; yıllık net maaş için eksiksiz dönem/vergi verisi. Veri hazır olmadan tamamlanmış özellik olarak yayımlama.

Her iş küçük, ayrı bir değişiklik olarak; saf fonksiyon testleri, bir kullanıcı akışı, 320/375/414/768/1440 piksel kontrolü ve yayın sonrası gerçek URL doğrulamasıyla tamamlanır. Kullanım/ziyaret sayaçları işlev testleriyle yapay olarak artırılmaz. Başarı değerlendirmesi için sonradan ölçülebilecek değerler: araç aramasından sonuç bağlantısına geçiş, hesaplamayı tamamlama, tekrar kullanılan araçlar. Bunlar bu incelemede ölçülmüş performans artışı değildir.

## Bu oturumun yayın kapsamı

- Eski TL/YTL/TL dönüşümü hesap motorunda, tabloda ve tek dikey A4 PDF'de.
- Sözlükte kullanım sayacının “arama” olduğunun açık anlatımı.
- Bilecik ve diğer adli çevre sayfalarında yanıltıcı “Var/Yok” önekinin kaldırılması; Bilecik için 1746 sayılı HSK kararı ve Eskişehir bağlantısı.
- Anasayfa ve enflasyon metni tasarım önizlemeleri, `artifacts/` altında kalır.

Yayın sürümü ve canlı doğrulama sonucu tamamlandığında ayrıca kaydedilir.
