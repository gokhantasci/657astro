# Araç kullanım sayaçları — 07.11.2026

Ana sitede yayımlanmış **83 aracın tamamında** günlük, haftalık, yıllık ve toplam kullanım sayacı var. Gösterim ortak sayfa şablonundan yapılır. Sayfa görüntülenme sayacı ayrıdır; açılış, URL’deki seçimlerin geri yüklenmesi, sıfırlama ve sonuç göstermeyen hata durumları kullanım oluşturmaz.

Katalogdaki diğer iki kayıt ayrı uygulamalardır: Dikte oturum/bağlantı/kelime istatistiklerini kalıcı veritabanında, Barkod okunan barkod toplamını kalıcı dosyada tutmaktadır. Mevcut çalışan sayaçları doğrulandı; bu uygulamaların sayaçları ana siteye kopyalanmadı veya sıfırlanmadı.

## Ölçüm

- Hesaplayıcılar: kullanıcı işlemiyle tamamlanan geçerli sonuç. Hızlı yazım tek sonuca birleştirilir, aynı girdinin tekrar gösterilmesi yeniden sayılmaz.
- Dosya araçları: doğrulanıp tamamlanan okuma/analiz veya çıktı hazırlama. Yalnız dosya seçmek veya işleme hatası sayılmaz. Çok adımlı terfi ve kesinleştirme araçlarında tamamlanan cetvel/son adım sayılır.
- Sözlük, adli çevre, konsolosluk ve tarifeler: kullanıcı sorgusu; sonuç bulunmaması geçerli bir sorgu olabilir. Mülakatta cevabı açmak/otomatik çalışmayı başlatmak, haritada seçim yapmak kullanım oluşturur.
- Rehberlerde başarıyla alınan şablon, hukuk araç dizininde hesap seçimi sayılır.

İstemcide giriş/sonuç tekrarını ayırt etmek için kullanılan değerler bellekte kalır. Sunucuya yalnız kayıtlı araç anahtarı ve rastgele işlem kimliği gider. Tutar, kişi bilgisi, sorgu, dosya adı ve dosya içeriği gönderilmez. Aynı kimlikli ağ tekrarları sunucuda tek işlemdir.

## Geçiş

İstemci ve servis `services/oneriler/arac-sayaclari.json` kaydını paylaşır. Katalogla eşleşmesi test edilir. Eski `enflasyon`, `maas`, `kesinlesme`, `yargilama` anahtarları korundu; tablo ve sayılar sıfırlanmadı. Servis kaynağı ve veritabanı yedeklenip güncellenirken toplam **379 → 379** kaldı. Her aracın ölçüm başlangıcı ayrı saklanır; eski dört araç eski başlangıcı kullanır. Gün/hafta/yıl Türkiye saatine göredir.

## Doğrulama

- 83 araçta tek sayaç, doğrulanmış sıfırların görünmesi ve açılışta artış olmaması kontrol edildi.
- Son geniş tarayıcı koşusunda **158 test** geçti: yeni kullanım sayaçları, önceki dört sayaç, teftiş işlevleri ve tema testleri. Paylaşılan hesap adresinin açılışını saymama kontrolü ayrıca geçti.
- **18 servis testi** geçti; her araç için bağımsız artış, yeniden deneme tekilleştirmesi, yeniden başlatmada kalıcılık ve katalog kapsamı dahil.
- Üç araçta iki tema ve 320/1440 piksel genişlikte 12 görünümde yatay taşma yok.
- Astro tip kontrolünde sıfır hata ve sıfır uyarı var; üretim derlemesi tamamlandı.

Günlükler ve ekran görüntüleri yerel `artifacts/arac-kullanim-*` dosyalarındadır. Canlıya çıkış GitHub Pages iş akışıyla yapılır; sayaç servisi ayrıca doğrulanarak yayımlanmıştır.

Canlı kontrolde 83 sayaç alanı ve yedi farklı gerçek işlem doğrulandı; yeniden yükleme kullanım oluşturmadı. Dikte arayüzünde 689 oturum, Barkod arayüzünde 1.115 okuma mevcut kalıcı servisleriyle eşleşti. Kira hesabında isteğe bağlı sözleşme oranının ortak alan bileşeni yüzünden zorunlu olması ayrıca düzeltildi; boş oranla hesaplama/sayım için regresyon testi geçti. Diğer alanların varsayılan zorunluluğu korundu.
