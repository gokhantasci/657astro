# 657.com.tr öneri ve sayaç servisi

30/10/2026 tarihinde kullanıcının “Ayrı servisi canlıya kur” onayıyla kuruldu.

- Yönetim: `https://657.com.tr/_657-servis/`
- Öneri: `https://657.com.tr/_657-servis/api/oneriler`
- Sayaç: `https://657.com.tr/_657-servis/api/okunma`
- Yönetici parolası yalnız yerel, Git tarafından dışlanan `artifacts/oneri-canli/yonetici-girisi.txt` dosyasında. Depoya ve bu belgeye yazılmaz.
- WordPress dosyaları değiştirilmedi. Hestia HTTPS sunucusunun özel include dosyasında yalnız yeni yollar bağlandı.
- Ayrı kullanıcı, loopback 4326, systemd `657-oneri`, CPU %25 ve bellek 128 MB sınırı. Veritabanı `/var/lib/657-oneri/oneriler.sqlite3`.
- Onaylı JSON yayını depoya özel yazma deploy anahtarıyla; kişisel GitHub erişim anahtarı sunucuya taşınmadı. `push --dry-run` geçti; test önerisi yayımlanmadı.
- Turnstile sunucu doğrulaması: başarı, alan adı ve `proposal` action kontrol edilir. Anahtar yoksa veya doğrulama çalışmazsa yeni öneri kabul edilmez. Anahtarlar mevcut sitenin ayarlarından alındı, gizli anahtar yalnız özel servis ortamında.
- Turnstile widget'ı Cloudflare'ın `challenges.cloudflare.com` adresinden yüklenir; Cloudflare'ın desteklediği entegrasyon bunu gerektirir. Öneri, yönetim, sayaç ve uygulama indirmeleri 657.com.tr üzerindedir. İşyerinin Cloudflare doğrulama alanına erişimi ayrıca gerçek ağda sınanmalıdır.
- GitHub Actions değişkenleri `PUBLIC_ONERI_API`, `PUBLIC_OKUNMA_API`, `PUBLIC_TURNSTILE_SITE_KEY` ayarlandı.
- Kontroller: 10 birim/entegrasyon testi; canlı yönetici girişi ve prefix oturumu; sayaç 1→2; doğrulamasız öneri 400; SSH repo erişimi ve değişiklik yapmayan push sınaması.
- Kurulum öncesi/sonrası mevcut ingestion/webhook süreç kimlikleri değişmedi; viewer coverage sağlıklı, event/chat/spool kayıp ve hata sayaçları sıfır kaldı.

## Uygulama dosyaları

Dokuz haberle ilişkilendirilen Windows/arşiv uygulaması `/opt/657-dosyalar/uygulamalar/` altına kopyalandı. Yeni bağlantı kökü `https://657.com.tr/dosyalar/uygulamalar/`; dosya listesi, boyut ve SHA-256 `src/data/dosyalar.json` içinde. İndirme cevapları attachment ve nosniff; programlar sunucuda çalıştırılmaz. Kullanım yazıları ve tarayıcı karşılıkları `/dosyalar/` dizininde.

Geri alma: yalnız `657-oneri` servisini durdurup ilgili özel Nginx include içindeki bu yolları kaldırmak ve `nginx -t` sonrası graceful reload yeterlidir. Öneri veritabanını silmeyin; korunmuş özel kayıttır.

## Model dosyaları

## 03/11/2026 indirme sayacı

Mevcut ayrı servise `/api/indirme` GET/POST eklendi. Yeni ön yüzde yol `https://657.com.tr/_657-servis/api/indirme` olur. GET yalnız sayıyı okur; POST izin verilen origin ve dosya kimliğiyle başlatılan indirmeyi artırır. Tamamlanmış dosya aktarımı ölçülmez. Dokuz uygulama kimliği ve herkese açık dosya yollarının SHA-256 kimlikleri desteklenir; dosya içeriği ve kişisel yüklemeler gönderilmez. IP düz metin saklanmaz; kısa ömürlü HMAC ile hız sınırı uygulanır.

11 yerel servis testi geçti. Canlı salt okunur sayaç kontrolü yapıldı; sahte indirme eklenmedi. CPU %25 / RAM 128 MB sınırları korunur. Değişiklik öncesi uygulama kopyası `app.py.before-indirme-20261103`; geri alma bu kopyayı yerine koyup yalnız `657-oneri` servisini yeniden başlatmaktır. Veritabanı korunmalıdır. Yeni ön yüz henüz canlıya yayımlanmadığından yeni düğmeler yerel sürümdedir.

Herkese açık indirme sayısının GET yanıtı `Access-Control-Allow-Origin: *` taşır; yerel önizleme de okuyabilir. POST ve öneri uçlarında izinli origin denetimi korunur. Canlı sayaçta deneme indirmesi üretilmemiştir; yerel artış davranışı ayrı geçici test veritabanında doğrulanır.

`/opt/657-modeller/` yalnız statik dosya klasörüdür. `/modeller/` Nginx alias'ı WASM/JSON doğru MIME türü, CORS ve noindex başlıklarını ekler. 357.885.721 baytlık 19 model/tokenizer/WASM/lisans dosyasının sunucuda SHA-256 kontrolü geçti. GPU çıkarımı sunucuda çalışmaz. Kurulum sonrası veri toplama süreçleri aynı PID'lerle aktif, viewer coverage sağlıklı ve kayıp/hata sayaçları sıfır.

## 04/11/2026 Piper sesli okuma dosyaları

Kullanıcının "bu dosyaları 657.com.tr sunucumuzda yerleştir" talebiyle Piper dosyaları `/opt/657-modeller/piper/` altına kopyalandı (root:root, klasör 755, dosya 644). Nginx, WordPress ve mevcut model dosyalarına dokunulmadı; mevcut `/modeller/` alias'ı yeni klasörü de sunar. Kaynak ve özetler `public/modeller/piper/hazir.json` içinde; dosyalar `node scripts/piper-dosyalarini-indir.mjs` ile yeniden üretilir.

- `voices/tr/tr_TR/fahrettin/medium/tr_TR-fahrettin-medium.onnx` (+ `.onnx.json`): Hugging Face `diffusionstudio/piper-voices`
- `ort/ort-wasm-simd.wasm`, `ort/ort-wasm.wasm`: onnxruntime-web 1.18.0
- `phonemize/piper_phonemize.wasm`, `.data`: `@diffusionstudio/piper-wasm` 1.0.0

Sunucudaki altı dosyanın SHA-256 değeri yerel kopyayla eşleşti; `https://657.com.tr/modeller/piper/hazir.json` 200 döner. `src/scripts/piper.worker.ts` önce bu klasörü dener, yoksa asıl CDN'lere döner. Geri alma: `rm -r /opt/657-modeller/piper`.
