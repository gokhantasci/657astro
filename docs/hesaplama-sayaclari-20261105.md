# Kalıcı hesaplama sayaçları — 5 Kasım 2026

Kaynağı bilinmeyen eski başlangıç sayıları sıfırlandıktan sonra geçici gizlenen dört sayaç geri getirildi: enflasyon farkı, memur maaşı, kesinleşme ve yargılama gideri. Yeni ölçüm başlangıcı 5 Kasım 2026; eski istatistikler yeni toplamların içine aktarılmadı.

`/_657-servis/api/hesaplama` mevcut ayrı serviste GET/POST/OPTIONS sunar. Günlük toplamlar kalıcı SQLite veritabanındaki `hesaplama_gunluk` tablosuna yazılır. Toplam, takvim yılı, pazartesi başlayan takvim haftası ve gün `Europe/Istanbul` saat diliminde hesaplanır. Sonuç, ilgili günler/yıllar değiştiğinde kendiliğinden yeni döneme geçer; geçmiş günlük toplamlar korunur. Ölçüm başlangıcı `hesaplama_ayar` tablosunda saklanır; servis yeniden başladığında değişmez.

Sayaç bir ziyaretçi sayacı değildir. Sayfa açılışında veya ilk varsayılan sonuç çizilirken artmaz. Kullanıcı girdisiyle başarıyla yeniden hesaplanan sonuçlar veya yargılama giderindeki Hesapla işlemi sayılır. Hızlı tuş girişleri 500 ms beklenerek birleştirilir; aynı araçta iki saniye içinde artış tekrarlanmaz. Geçersiz maaş/enflasyon girdileri ve eksik kesinleşme girdisi sayılmaz. Tekilleştirme kimliği aynı istek ağ hatası yüzünden yinelenirse çift kayıt oluşmasını önler (48 saat). Form içerikleri ve hesaplanan kişisel tutarlar sayaca gönderilmez.

Ön yüz yalnız sunucunun onayladığı toplamı gösterir; yerelde tahmini artış yapmaz. Yüklenirken `—`, bağlantı yoksa açıklama; daha önce okunmuşsa son doğrulanan sayı korunur. Sıfır geçerli bir sunucu yanıtıdır ve gösterilir. Her sayfada ölçüm başlangıcı belirtilir. Dakikada bir görünür sekmede toplam yeniden okunur.

Sunucu uygulaması değiştirilmeden önce dosya özeti yerel kaynakla karşılaştırıldı. Uygulama ve SQLite yedeği alındı (`before-sayac-20261105T175220Z`), yalnız `657-oneri` yeniden başlatıldı. Öneri, okunma, indirme, WordPress ve Nginx yapılandırmaları değiştirilmedi. Veritabanı ek tablolarla genişletildi; mevcut kayıtlar silinmedi.

13 servis testi geçti: yeni sayaçların kalıcılığı, aynı istek kimliğinin çift sayılmaması, origin/istek doğrulaması, İstanbul'da gece yarısı, hafta/yıl sınırları ve mevcut öneri/indirme işlevleri. Canlı GET 200 ve dört araç için sıfır başlangıcı doğrulandı; canlıya deneme POST'u gönderilmedi.
