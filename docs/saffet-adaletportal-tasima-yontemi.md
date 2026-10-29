# Saffet Çelik ve AdaletPortal araçlarını ekleme yöntemi

İnceleme: 30-10-2026. Bu belge taşıma tasarımıdır; yeni araçların uygulanmış veya dış sitelerin bütün hesaplarının sayısal olarak doğrulanmış olduğu anlamına gelmez.

Canlı katalog ve menüler mevcut `src/data/araclar.json` ile eşleştirildi. Tekrarlanan işlevler birleştirildiğinde **40 hukuk/belge/rehber işlevi** çıkıyor: **30'u taşınmamış, 6'sı kısmen karşılanıyor, 4'ünün yerel karşılığı hazır**. Tam adresler, yerel araç kimlikleri, yöntem ve uygulama sırası [JSON envanterinde](yeni-kaynak-arac-envanteri.json).

[Saffet Çelik kataloğunun](https://saffetcelik.com.tr/uygulamalar) doğrudan alınan HTML'sinde 33 işlev var. Arama motorunun önbelleğinde 29 görünüyor. Üç dönüşüm yönü bağlantısı ayrı uygulama sayılmadı. [AdaletPortal](https://www.adaletportal.com/) hesaplayıcıları, Senkro ve adli rehberleri eklendi; ortak hesaplar ikinci kez sayılmadı. Bu sayı ana menü/katalog kapsamıdır; tüm site adreslerinin eksiksiz tarandığı iddia edilmez.

## Önerilen uygulama

Ekranları mevcut Astro tasarımıyla, hesapları saf TypeScript fonksiyonlarıyla geliştirelim. Dış sitelerden form alanı ve örnek sonuç karşılaştırması alalım; formül ve tarifeyi resmî kaynağıyla kurup tarihli ortak JSON verisine bağlayalım. Açık kaynak bir bileşen kullanılacaksa kendi yayımlanan deposu ve lisansı doğrulanmalı. Kaynak sitenin kapalı API'sine veya WordPress çalışmasına bağlı bir üretim sistemi kurmaya gerek yok.

| İş grubu | Bizde uygulanacak yöntem | Çalışacağı yer |
| --- | --- | --- |
| Faiz, SMM, yıllık izin, boy/kilo, harç ve tarife hesapları | Saf hesap fonksiyonu + yürürlük tarihli ortak tarife + mevcut araç bileşenleri | GitHub Pages |
| UDF okuma/dönüştürme/düzenleme | Ortak belge modeli; UDF arşivini çözme, metin/görsel/stil eşleme, tarayıcıda çıktı | GitHub Pages; uyumluluk örnekleri ayrıca doğrulanır |
| OCR | PDF sayfasını görsele çevirme + Türkçe OCR işçisi; büyük dosyada sırayla işleme | İlk tercih tarayıcı |
| Karar ve duruşma taslakları | Yerelde alan çıkarma, kullanıcıya doğrulatma ve sürümlenmiş metin şablonu | GitHub Pages |
| Adliye/cezaevi/noter/konsolosluk | Resmî kaynaktan tarihli JSON üretimi, build sırasında sayfa, tarayıcıda arama | GitHub Actions + Pages |
| Telefon–bilgisayar diktesi/transfer | Tek kullanımlık eşleştirme; WebSocket sinyalleşme, metin aktarımı ve gerektiğinde WebRTC dosya kanalı | Ayrı küçük servis + Pages arayüzü |
| Yapay zekâ ile özet | Sunucu üzerinden model çağrısı; anahtar sunucuda, belge yüklemesi kullanıcı eylemiyle | Ayrı servis + Pages arayüzü |
| İnfaz ve ceza tayini | Tarihli mevzuat karar ağacı ve her istisna için bağımsız örnekler | Hesap motoru tarayıcıda çalışabilir; hukuk kuralları tamamlanmadan hazır sayılmaz |

## İlk uygulama sırası

1. **Tarife ve basit hesaplar:** dava açılış giderleri, SMM, tarih aralığına göre faiz, işçi yıllık izni, İKM boy/kilo, mahkeme bilirkişi ücreti, tebligat ekranı, keşif gideri ve ara karar. Mevcut harç, AAÜT, tebligat, tatil ve katsayı verisi kullanılacak. Mahkeme bilirkişisi tarifesi, tüketici hakem heyeti göstergeli hesabından ayrı tutulacak. Faizde oranları tarih aralıklarına bölen döküm olacak; tek güncel oran geçmişin tamamına uygulanmayacak.
2. **Belge temeli:** önce UDF görüntüleme ve TXT çıktısı; sonra görsel → UDF, metin → UDF ve DOCX. Ardından PDF, birleştirme, resim ekleme ve editör. OCR, nüfus kaydı ve şablonlar bu ortak modele bağlanacak. Aynı metni her araçta yeniden ayrıştırmak gerekmeyecek.
3. **Kural/veri kapsamı geniş olanlar:** icra kapak hesabı, kıdem/ihbar, miras, kira, tapu döner sermayesi, adliye tarihçesi, genel konsolosluk ve iletişim rehberleri. Her hesap için desteklenen koşullar açıkça tanımlanacak; araç değer kaybında gerçek piyasa değerleri kullanıcıdan veya doğrulanmış veri kaynağından alınacak. Kaynakta bir yöntem adı geçmesi gerçek piyasa sonucunu doğrulamaz.
4. **İnfaz/ceza ve sunucu gerektirenler:** ceza tarihi, suç grubu, yaş, tekerrür, mahsup, içtima ve geçiş hükümlerini kapsayan test matrisi; ardından cihaz eşleştirme ve isteğe bağlı yapay zekâ servisi. Bunlar basit oran hesabıyla tamamlanmış sayılamaz.

Sıra, mevcut açık taşıma işlerine eklenir; önceki unvan, 4/C tarihsel hesap ve öneri servisi bağlantısı işleri silinmez.

## UDF için yapılan teknik deneme

Kaynağın kamuya açık [örnek UDF dosyası](https://saffetcelik.com.tr/udf-ornekleri/ornek-metin.udf) indirildi ve **çalıştırılmadan** Python `zipfile` ile incelendi. Geçerli bir ZIP; bu örnekte tek üye `content.xml`. İçinde `template format_id="1.8"`, metin, sayfa özellikleri, paragraf ve metin aralığı/stil tanımları var. Bu, kendi okuyucu/yazıcımızı kurmak için somut bir başlangıçtır; bütün UDF dosyalarının yalnız bu üyeden oluştuğu varsayılmaz. Örnek içerik depoya kopyalanmadı.

Uygulama için bağımsız bir `belge-modeli` (paragraf, metin parçası, görsel, tablo, sayfa ayarı) öneriyorum. UDF okuyucu ve yazıcı bu modele bağlanır. İlk sürüm basit metin ve paragrafları destekler; desteklenmeyen öğeyi sessizce düşürmek yerine kullanıcıya belirtir. Birleştirmede metin aralıkları yeniden hesaplanır; iki XML dosyasını yan yana koymak yeterli olmaz. Türkçe karakter, emoji ve satır sonlarında karakter aralığı uyumluluğu ayrıca test edilir.

PDF tarafında [Mozilla PDF.js](https://github.com/mozilla/pdf.js) okuma ve sayfa görüntüsü için adaydır. DOCX çıktısı ve PDF üretimi için ayrı yazıcı gerekir. Tarama PDF önce sayfa görseline dönüştürülür; [Tesseract.js](https://github.com/naptha/tesseract.js) doğrudan PDF okumaz. Türkçe model dosyası tembel yüklenir; kullanıcı belgesi bu mimaride sunucuya gönderilmek zorunda değildir. Paket sürümleri ve lisansları kurulum aşamasında kilitlenecek.

PDF'den düzenlenebilir metin ile sayfa görüntüsü aktarımı ayrı seçenek olmalı. İkinci yöntem görünümü korumaya yöneliktir; yazıyı düzenlenebilir hâle getirmez. UDF/PDF çıktısının resmî UYAP Editörü'nde açılması, sayfa ve metin karşılaştırması kabul koşuludur. Dönüştürülmüş belgeye elektronik imza geçerliliği vaadi verilmez. Bu incelemede henüz resmî editörde dönüşüm testi yapılmadı.

## Dikte, transfer ve özet servisleri

[Senkro sayfasının](https://www.adaletportal.com/senkro/) doğrudan HTML'si alınabildi; WordPress eklentisine ait istemci paketi bulunuyor. Sunucu protokolü, işleyişi ve veri saklama süresi doğrulanmadı. Aşağıdaki mimari kaynak uygulamanın iç yapısı hakkında iddia değil, bizim uygulamamız için öneridir.

Tek cihazda yazıya çevirme ile telefondan bilgisayara gönderme ayrı özellik olmalı. [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) bazı tarayıcılarda sesi hizmet sağlayıcısına gönderir; sadece JavaScript kullanmak çevrimdışı veya cihaz içi tanıma anlamına gelmez. Cihaz içi seçenek istenirse ayrı bir yerel konuşma modeli ve performans denemesi gerekir. Mevcut Piper/TTS uygulaması metni sese dönüştürür; ses tanıma motoru yerine geçmez.

Eşleştirme servisi QR/kısa kod ve geçici oda ile çalışabilir. Yazı WebSocket üzerinden gönderilebilir; dosyalar için [WebRTC veri kanalı](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) değerlendirilebilir. Sinyalleşme ve ağ koşullarına göre TURN gerekir; her ortamda sunucusuz dosya aktarımı vaat edilmez. Aktif oturum ve model işleri için ayrı süreç önerilir; öneri kayıt servisiyle aynı makinede ayrı konteynerler kullanılabilir. GitHub Pages arayüzü sunar; API anahtarı veya WebSocket sunucusu barındırmaz.

Özetleme ayrı ve isteğe bağlıdır. Taslak üretmeden önce kaynak metin, model hizmetine aktarım ve kullanıcı eylemi belirgin olmalı; kişisel belgeler herkese açık GitHub deposuna veya haber derleme iş akışına konulmamalı. Model çıktısı kaynak metnin yerine geçirilmez. Anahtar ve sunucu seçimi yapılmadan bağlantı hazır gösterilmez.

## Doğrulama ve kapsam sınırları

Her hesap için normal örnek, sınır/eşik, geçmiş dönem ve desteklenmeyen koşul kontrolü; iki sitedeki aynı girişlerle karşılaştırma; uyuşmazlıkta resmî kaynak gerekçesi kaydı. Bu turda kataloglar ve bazı ekranlar incelendi; hesaplara veri girip uçtan uca sayısal karşılaştırma yapılmadı.

Benzer adlar eşdeğer kabul edilmedi: gerekçeli karar **süresi** taslak editörü değildir; THH bilirkişi ücreti genel mahkeme bilirkişisi değildir; adli çevre iletişim rehberi değildir; sınav diktesi konuşma tanıma değildir. Kısmen karşılanan altı işlev envanterde ayrı işaretli.

AdaletPortal'ın hava, döviz/altın/kripto, deprem, eczane, spor, gazete, yol ve namaz servisi bağlantıları bu 40 hukuk/belge işlevine dahil edilmedi. Bunları eklemek için sağlayıcı bazında resmî/açık veri veya lisanslı API ve güncelleme sıklığı belirlenir; aynı taşıma yöntemiyle haber kazıma kaynağına bağımlı kalınmaz. UYAP giriş portalları da taşınacak hesaplayıcı sayılmaz; resmî hizmet bağlantısı olarak kalır.
