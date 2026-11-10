# Tüm sayfalarda görüntülenme sayacı — 07.11.2026

Sayfa görüntülenme sayacı ortak `Layout.astro` şablonuna taşındı. Ana sayfa, hesaplama/teftiş araçları, dizinler, tarifeler, kurumsal sayfalar ve içerik sayfaları aynı üst alanda **Bugün** ve **Toplam** değerlerini gösterir. Yazı, sözlük, soru ve adli çevre şablonlarındaki eski gösterimler kaldırılarak sayfa başına tek gösterim sağlandı. Mülakat kartının kendi soru sayacı ayrı kalır.

Sayaç anahtarı, sayfanın canonical adresinin yoludur. Sorgular, bağlantıdaki hesap seçimleri ve URL parçaları ayrı sayaç oluşturmaz. Türkçe/özel karakterler standart URL kodlamasıyla gönderilir. WordPress/GA arşiv tabanı korunur; yeni görüntülemeler ortak SQLite servisine eklenir. Yerel ziyaretlerden genel toplam üretilmez; servis hatasında mevcut arşiv açıklaması gösterilir.

Serviste `/` ana sayfa yolunun yanlışlıkla reddedilmesi düzeltildi. Mevcut adres denetimi, tekrar istek kimliğiyle çift sayımı engelleme, günlük Türkiye saati ve erişim sınırlaması korunur. Servis kaynağı ve veritabanı yedeklenerek yalnız bu düzeltme yayımlandı; sayaçlar sıfırlanmadı. Gizlilik açıklaması mevcut ortak sayaç davranışıyla eşitlendi.

## Kontroller

- 17.987 HTML çıktısının envanterinde ortak site şablonunu kullanan 7.213 sayfanın tamamında tek sayaç var. 10.617 yönlendirme belgesi ayrı sayfa görüntülemesi oluşturmaz.
- Envanterde saptanan `₺` karakterli eski yol standart URL kodlamasıyla düzeltildi ve tarayıcıda ayrıca doğrulandı. En uzun sayaç yolu 200 karakterdir.
- Son kaynak üzerinde 112 tarayıcı testi geçti: tüm araçlar, ana dizinler, eski içerik türleri, arşiv toplamı, günlük sayı, yeniden deneme, kart geçişi, yenileme ve kalıcı adres kullanımı.
- 16 servis testi geçti; ana sayfa için okuma/yazma, aynı istek kimliğiyle yeniden deneme ve geçersiz yollar dahil.
- Dört sayfada açık/koyu tema ve 320/1440 piksel genişlikte 16 görünüm kontrolünde sayaç görünür ve yatay taşma yok.
- Astro tip kontrolünde sıfır hata ve sıfır uyarı var. Tam üretim yayını GitHub Actions üzerinden yapılır.

Yerel test günlükleri, envanter ve ekran görüntüleri `artifacts/tum-sayac-*` ve `artifacts/tum-sayfa-sayac-*` dosyalarındadır.
