# Açık ve koyu tema kontrolü — 07.11.2026

## Düzeltmeler

- Terfi cetveli dahil 11 izole teftiş aracı, kaydedilmiş tercih yokken sistem temasını izler. Sistem tercihi değiştiğinde tema güncellenir; kullanıcının açık/koyu seçimi önceliklidir.
- İç araç hazır olduğunda üst sayfadan tema ister. Geç yüklenen iframe ve tema dinleyicisinin yüklenme sırası tema eşleşmesini bozmaz. Tema değişiminde araç yeniden yüklenmez ve form bilgileri korunur.
- Maaş tahmini uyarısı ve teftiş uyarıları ortak uyarı renklerini kullanır. Sistem koyu teması için ayrıca kullanıcı seçimi gerekmez.
- Yargı haritasındaki mevcut mahkeme ve başsavcılık rozetleri iki tema için ortak durum renklerine bağlandı.
- Ana sayfadaki seçili slayt düğmesinde, koyu temada kırmızı zemin üzerindeki koyu yazı yerine beyaz eylem metni kullanılır.

## Kapsam ve yöntem

Üretim çıktısındaki 17.987 HTML dosyası envantere alındı. Ortak sayfa kabuğunu kullanan ve yönlendirme olmayan sayfalar, başlıklarındaki stil dosyaları ve gömülü CSS üzerinden 21 stil grubuna ayrıldı. Her stil grubunun bir temsilcisi ve taşınmış bütün araçlar birleştirilerek 94 adres kontrol edildi. Bu yöntem bütün içerik sayfalarında tek tek etkileşim testi yapıldığı anlamına gelmez.

94 adres × iki sistem teması × 320 ve 1440 piksel genişlik: 376 tarayıcı görünümü. Görünür metinler, zeminler, sayfa taşması ve gömülü belgeler kontrol edildi. Büyük metinde 3:1, normal metinde 4,5:1 kontrast eşiği kullanıldı; görsel/gradyan zeminler ayrıca ekran görüntülerinden incelendi. Taramada bulunan seçili slayt düğmesi düzeltildikten sonra ilgili dört görünüm tekrar kontrol edildi.

11 gömülü araç için sistem değişimi, kullanıcı seçimi, yeniden yükleme ve tercih önceliği otomatik test edildi. Terfi sihirbazında tema değişiminden sonra girilmiş adın korunduğu ve yerel Excel/Word işlevlerinin çalıştığı doğrulandı.

Genel tablo testi, önceki içerik düzenlemesinde tablosu arşive taşınan tarife yazısı yerine mevcut 140 mahkemelik listeyi kullanacak şekilde güncellendi. Sayfa boyu ve arama davranışı aynı testte korunur.

Son test koşusunda `tema.spec.ts`, `teftis-aktarim.spec.ts` ve `site-ozellikleri.spec.ts` kapsamındaki 55 test geçti. Astro tip kontrolünde sıfır hata ve sıfır uyarı var. İlk tam taramadan sonra düzeltilen ana sayfa düğmesi için dört görünümün tekrarında kontrast/taşma bulgusu kalmadı.

Kontrol betiklerinin çıktıları ve açık/koyu masaüstü/mobil ekran görüntüleri yerel `artifacts/tema-*` dosyalarındadır. Üretilmiş iframe HTML dosyaları derleme sırasında yeniden hazırlanır; kaynak motorların iş kuralları değiştirilmedi.
