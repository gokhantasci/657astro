# Hesaplama sayaçlarının sıfırlanması — 5 Kasım 2026

> Güncel durum: geçici kapatma sona erdi; sayaçlar kalıcı servisle geri açıldı. [Yeni sayaç düzeni](hesaplama-sayaclari-20261105.md). Aşağıdaki kayıt ilk sıfırlama işlemini belgeler.

Kullanıcı başlangıç istatistiklerinin kaynağını bilmediğini ve gerekirse sıfırlanabileceğini belirtti. Dört aracın toplam, yıl, hafta ve gün değerleri sıfırlandı; eski değerler Git geçmişinde kalır.

Canlı `/api/hesaplama` ve `/_657-servis/api/hesaplama` uçları 404 verdiğinden, `src/data/hesaplama-sayaclari.json` içindeki `aktif` alanı `false` yapıldı. Ana sayfa kartları ve araçların sayaç şeritleri bu alanla gizlenir. İstemci kodu bu durumda API isteği göndermez ve yerel sayıları artırmaz. Hesaplama sonuçları, GA4, okunma ve indirme sayaçları bu bayrağa bağlı değildir.

Sayaçları yeniden açmadan önce kalıcı sunucu kaydı, gün/hafta/yıl sınırları (Europe/Istanbul), doğrulanmış sıfır başlangıcı ve yalnız gerçek tamamlanan hesaplamalarda artış test edilmelidir. Ön yüzde `aktif: true` yapmak tek başına çalışan bir sayaç servisi kurmaz. Kaynağı doğrulanamayan eski sayılar aktarılmamalıdır.

Doğrulama: üretim derlemesi (17.927 sayfa) başarılı; beş sayfada sayaç alanı/API isteği bulunmadı, maaş formu etkileşimi geçti. GitHub yayını 41976847074 başarılı, commit 40458f7. Canlı yeni sürüm de beş sayfada aynı kontrolleri geçti (önbellekten bağımsız `?sayac=40458f7` sorgusuyla). Ana sayfa, kesinleşme ve yargılama giderinin sorgusuz adreslerinde Cloudflare HIT yanıtı eski kopyayı tuttu; yayın sonrası purge secret’ları eksik. Yerel eski Wrangler OAuth kaydı süresi dolmuş ve Cloudflare API isteği 403 verdi. Cloudflare önbelleği bu oturumda temizlenemedi. Sorgulu yeni sürümün doğrulanması, eski sorgusuz önbelleğin temizlendiği anlamına gelmez.
