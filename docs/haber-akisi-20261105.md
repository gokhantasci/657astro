# Kurum haberleri — 5 Kasım 2026

Resmî Bakanlık arşivinde 5 Kasım haberleri varken kayıtlı akışın son tarihi 4 Kasım'dı. GitHub'ın saatlik tam yayın işi 5 Kasım'da 03:25 ve 12:09 UTC gibi aralıklı zamanlarda çalışmıştı; cron tanımı kesin çalışma saati garantisi vermiyor. Eski ön yüz yalnız derleme sırasında JSON okuyordu; açık sayfa yeni haber sorgulamıyordu. Cloudflare önbelleği de HTML'in eski sürümünü tutabiliyor.

`scripts/haberler.mjs` artık eski listeyle birlikte `src/data/haber-akisi.json` dosyasına son kaynak kontrol zamanı, kaynak başarı/hata sonuçları ve haberleri yazar. Okunamayan kaynakların önceki kayıtları korunur; hiçbir kaynak okunamazsa mevcut akış değiştirilmez ve iş hata verir.

`.github/workflows/haberler.yml` her saatin 19 ve 49. dakikalarında yalnız haber verisini yenilemek üzere planlanır; tam site derlemesini beklemez. Veri commit'i `[skip ci]` içerir. Asıl yayın işi de aynı akışı üretip saklar. Ortak `yayin` concurrency grubu iki işin birbirinin veri değişikliğini ezmesini önler. GitHub planlı işleri geciktirebilir; bu bir gerçek zaman garantisi değildir.

Ön yüz, açık sayfada beş dakikada bir ve sekmeye dönüldüğünde depodaki güncel akışı kontrol eder. Kaynak `raw.githubusercontent.com/gokhantasci/657astro/main/src/data/haber-akisi.json`; bu servis erişilemezse sitedeki `/haber-akisi.json` yedeği kullanılır. Beş dakikalık sorgu anahtarı CDN'deki önceki kontrol kopyasından ayrılır. İki kaynağa da erişilemezse mevcut liste korunur ve açıklama gösterilir. “Son kaynak kontrolü” sunucunun resmî kaynakları kontrol ettiği zamandır; tarayıcının yenile düğmesine basılma zamanı değildir. İki saatten eski kontrolde gecikme uyarısı gösterilir.

Yeni kayıtlar yalnız bilinen kurum kaynaklarından ve HTTPS resmî kurum alan adlarından kabul edilir; başlıklar HTML olarak çalıştırılmaz. Kaynak filtresi ve beşli sayfalama yeni veriye uygulanmaya devam eder. En güncel aynı başlık tekilleştirilir. Daha eski bir akışla mevcut yeni haberler geri alınmaz.

Cloudflare API erişimi bu oturumda yok: mevcut Wrangler oturumu süresi dolmuş ve yenilenemiyor. Yayın sonrası önbellek temizleme secret'ları da eksik. Yeni ön yüzün mevcut eski HTML önbelleğine hemen ulaşması için Cloudflare'de HTML önbelleğinin temizlenmesi gerekir; yeni sürüm sorgulu adresle ayrıca doğrulanabilir.

Doğrulama: üretim derlemesi başarılı (17.927 sayfa); otomatik beş dakika yenileme, manuel yenileme/güvenilmeyen bağlantı, filtre-sayfalama, hata halinde listeyi koruma ve mevcut ayrıştırıcı testi geçti. Site yayını 42076562143 ve ayrı haber yenileme işi 42076622786 başarılı. Ayrı iş, 5 Kasım 2026 20:44 (Europe/Istanbul) kontrol zamanını depoya yazdı; 10/10 kaynak başarılı. Canlı sorgulu yeni sürümde 5 Kasım haberi, PGM filtresi ve 375 px yatay taşma kontrolü geçti. Normal ana sayfa eski Cloudflare HIT kopyasını döndürmeye devam ediyor; temizlendiği iddia edilmedi. GitHub raw CDN akışı da kısa süre önceki kontrol kopyasını tutabilir; başarısız/eski akışta yerel yedek kullanılır.
