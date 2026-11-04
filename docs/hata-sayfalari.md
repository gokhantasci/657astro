# HTTP hata sayfaları

`src/data/hata-durumlari.json` ortak kaydından 48 açıklama üretilir: IANA 4xx/5xx durumları (418 ve eski 510 için de genel metin dahil) ile Cloudflare 520–526/530. Diğer 4xx/5xx kodları aile belgesiyle karşılanır; HTTP durum kodu korunur.

- Ortak görünüm: `src/components/HataSayfasi.astro`.
- Önizleme dizini: `/hatalar/`. `/hatalar/407/` gibi tasarım önizlemeleri 200 döndürür ve önizleme olduğunu belirtir; böylece tarayıcının kendisi tarafından ele alınan ağ doğrulama kodları da incelenebilir. `/400/`, `/403/`, `/404/`, `/429/`, `/500/`, `/502/`, `/503/`, `/504/`, `/525/` gibi test adresleri gerçek hata kodunu döndürür.
- Derleme: her kod için `<kod>.html`; ayrıca `4xx.html` ve `5xx.html`.
- Hepsi noindex; hata belgeleri ve önizleme dizini sitemap'e eklenmez.
- Stil HTML içinde; JavaScript, ayrı CSS ve font indirmeden okunur. Açık/koyu tema ve telefon ekranları desteklenir.
- İstek, yetki, büyük dosya, doğrulama, hız sınırı, sunucu, zaman aşımı ve güvenli bağlantı sorunlarında farklı metinler. Hata ayrıntısı, istek adresi, gizli bilgi veya stack trace gösterilmez.
- 429/503 için Retry-After: 60; hata belgelerinde Cache-Control: no-store. Otomatik yenileme yok.

## Yerel çalışma

`npm run dev` Astro geliştirme sunucusudur. `npm run preview`, `scripts/onizleme.mjs` ile Vite'ın statik sunucusunu kullanır; Astro'nun standart statik önizlemesinde desteklenmeyen özel HTTP durumları gerçek kodlarıyla sınanır. `scripts/yerel-baslat.ps1` aynı önizlemeyi 4322'de başlatır.

48 kod geliştirmede ve önizlemede sınanır. HEAD yanıtları, geçersiz yöntemde 405, bilinmeyen 599 için genel belge ve API JSON hata yanıtının korunması önizlemede ayrıca sınanır. Normal sayfalar 200 döndürür. Tasarımları incelemek gerçek kesinti oluşturmaz.

## Canlı sunucu

`deploy/nginx-static-errors.conf` ortak kayıttan her derlemede üretilir. Yalnız yeni Astro sitesinin Nginx server bloğunda, root derleme çıktısını gösterecek şekilde kullanılmalıdır. Her kod korunarak kendi belgesine, diğer kodlar aile belgesine yönlenir. Mevcut WordPress üzerinde etkinleştirilmedi.

API konumlarında JSON yanıtları için proxy_intercept_errors off korunmalıdır. HTML sunan bir proxy konumunda üst servis hatalarını yakalamak gerekiyorsa yalnız orada proxy_intercept_errors on kullanılmalıdır. Kimlik doğrulama ve Allow gibi başlıkları asıl uygulama belirler; tasarım yetki kurallarını değiştirmez.

GitHub Pages yalnız özel 404.html bağlamasını destekler; diğer durumları yakalama ve HTTP kodunu ayarlama işi Nginx/ters proxy katmanındadır. Cloudflare kaynak bağlantı hatalarının belgeleri hazırdır; otomatik kullanım Cloudflare Custom Errors ayarı gerektirir. Kaynağa erişilemeyince oradaki HTML kendi başına sunulamaz. Tarayıcı sertifika uyarısı ve kopmuş bağlantı HTTP sayfasıyla geçersiz kılınamaz. Nginx 444/499 gibi kapanmış bağlantılara belge gönderilemez. Canlı yapılandırma değiştirilmedi.

Kaynaklar: [IANA](https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml), [Cloudflare](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/).
