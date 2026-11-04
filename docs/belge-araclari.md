# Tarayıcı belge araçları

30.10.2026. Belgeler sunucuya gönderilmez, kalıcı depolamaya yazılmaz.

## Gerekçeli karar

`/gerekcelikarar/`: eski 657 aracının C/G/I/K/L/N alanları başlıklardan eşlenir. Esas, karar türü, kısa/gerekçeli tarih, bildirilen gecikme ve hâkim okunur. StyleSheet/ilk sayfa seçimi korunur. Arama, ortak 50'li pager, minimum gün filtresi ve filtredeki bütün kayıtları içeren yerel DOCX çıktısı vardır. Word üretimi eski `/api/gerekcelikarar_writer.php` servisine bağlı değildir.

Eski kodun mutlak tarih farkı yerine işaretli takvim günü gösterilir; ters tarihler uyarılır. 31 Şubat gibi tarihler reddedilir. Raporun bildirdiği gecikme üzerine tatil veya kanuni süre varsayımı eklenmez; takvim farkı ayrı sütundur. Sentetik 55 satırla Excel, filtre, pager, XSS metni, DOCX içeriği ve temizleme testleri geçti.

## UDF yalın metin

`/udf-donusturucu/`, `/udf-goruntuleyici/`, `/udf-editor/`, `/udf-birlestirme/`: content.xml metnini okuma, UTF-8 TXT, düzenleme, sırayla yalın metin birleştirme, arama, TXT/DOCX, yeni 1.8 metin UDF ve tarayıcı yazdırma/PDF akışı. Türkçe, emoji, CDATA sonlandırıcısı, XML'e uygun olmayan karakterler ve UTF-16 aralıkları kontrol edilir. XML DTD/dış varlık reddedilir; arşiv ve dosya boyutları sınırlıdır. Önizleme HTML olarak çalıştırılmaz.

Bu sürüm biçim/görsel/tablo/sayfa düzenini korumaz; elektronik imzayı yeni çıktıya taşımaz. Görselden OCR, görsel ekleme ve biçim koruyan belge dönüşümü tamamlanmadı. Yeni UDF kendi okuyucusunda round-trip testini geçti; resmî UYAP Editörü açılış testi henüz yapılmadı. Tam UYAP uyumluluğu iddia edilmez ve ekranda bu sınır açıklanır.

fflate 0.8.3 ve docx 9.15.0 MIT lisanslıdır. Yalnız kullanıldığı zaman yüklenen paketler derlemeden sunulur; kullanıcı dosyası üçüncü tarafa gönderilmez.
