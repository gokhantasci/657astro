# Hesaplama sayaçlarının sıfırlanması — 5 Kasım 2026

Kullanıcı başlangıç istatistiklerinin kaynağını bilmediğini ve gerekirse sıfırlanabileceğini belirtti. Dört aracın toplam, yıl, hafta ve gün değerleri sıfırlandı; eski değerler Git geçmişinde kalır.

Canlı `/api/hesaplama` ve `/_657-servis/api/hesaplama` uçları 404 verdiğinden, `src/data/hesaplama-sayaclari.json` içindeki `aktif` alanı `false` yapıldı. Ana sayfa kartları ve araçların sayaç şeritleri bu alanla gizlenir. İstemci kodu bu durumda API isteği göndermez ve yerel sayıları artırmaz. Hesaplama sonuçları, GA4, okunma ve indirme sayaçları bu bayrağa bağlı değildir.

Sayaçları yeniden açmadan önce kalıcı sunucu kaydı, gün/hafta/yıl sınırları (Europe/Istanbul), doğrulanmış sıfır başlangıcı ve yalnız gerçek tamamlanan hesaplamalarda artış test edilmelidir. Ön yüzde `aktif: true` yapmak tek başına çalışan bir sayaç servisi kurmaz. Kaynağı doğrulanamayan eski sayılar aktarılmamalıdır.
