# Tarayıcı asistanı ve enflasyon yayını

30.10.2026. `/asistan/`, bütün yerel yazı/sözlük/mülakat/adli çevre/araç ve maaş sayfalarını kapsayan `/asistan/indeks.json` verisini cihazda arar. Maaş ve CMK süre soruları mevcut saf hesap motorlarına gider. Varsayımlar yazılır, bağlantı aynı girdileri formda açar. Belirsiz yargı türü veya süre için kesinleşme tarihi uydurulmaz. Tarihsel net maaş bugünkü kurallarla üretilmez.

İsteğe bağlı model: Qwen3 0.6B q4f16_1, Apache-2.0. WebLLM 0.2.86 işçisiyle GPU'da çalışır. Yaklaşık 342 MB indirme; shader-f16 ve yaklaşık 1,4 GB GPU belleği gerekir. Model yokken arama ve motor hesapları çalışır. Model yanıtı HTML olarak çalıştırılmaz; kaynak bağlantıları yerel dizinden gelir. Küçük modelin Türkçe ve genel bilgi doğruluğu sınırlıdır.

`node scripts/asistan-modellerini-indir.mjs` sürümü sabitlenmiş model/tokenizer/WASM/lisans dosyalarını `public/modeller/resolve/<id>/` altına indirir; boyut ve SHA-256 kaydı üretir. Ağırlıklar Git'e konmaz. Canlı model dosyaları `/opt/657-modeller/` altında; `https://657.com.tr/modeller/resolve/<id>/` yoluyla statik sunulur. Aktarılan 19 dosyanın boyut ve SHA-256 değerleri doğrulandı. GitHub Pages yayını model dosyalarını tekrar paketlemez; yayın kodu model indirmelerini 657.com.tr adresine yönlendirir. Yerel geliştirmede varsayılan yerel varlıklar kullanılabilir; `PUBLIC_ASISTAN_MODEL_ORIGIN=https://657.com.tr` ile canlı dosyalar sınanır. CORS yalnız herkese açık model varlıkları için açıktır. Gerçek Edge/WebGPU testinde 657.com.tr'den indirme, GPU yükleme ve yanıt üretme 31,5 saniyede geçti. Hugging Face/GitHub/CDN çalışma anı isteği yoktu.

Arama dizini ayrıca 576 DPB belge kaydının 575 tekil görüş metnini kapsar; büyük özel bültenin yinelenen metni model bağlamına tekrar eklenmez. Kaynak PDF'leri ve tarihsel görüş uyarısı her görüş sayfasındadır.

## Enflasyon kaydı ve otomatik yazılar

Güncel giriş `src/data/enflasyon.json`. Aylık oran girilir; resmî genel endeks varsa ayrıca yazılır. Endeks yoksa önceki endeks ve aylık oranla hesaplanır ve yaklaşık olduğu işaretlenir; dönem Ocak/Temmuz başlangıçlı altı ardışık ay olmalıdır. Sözleşme zamları ve baz ay doğrulanır. Aylık veri aralarında boşluk reddedilir. Kayıt tarihi, endeks tabanı ve kaynak URL zorunludur.

`node scripts/enflasyon-yayin.mjs`, `npm run dev` ve `npm run build` öncesinde çalışır. Güncel dönemi `enflasyon-arsivi.json` dosyasına da kaydeder. Sonraki döneme geçildiğinde önceki altı ayın kaydı korunur; ortak kayıttaki her dolu ay için yazı ve yarıyıl özeti üretilir. Temmuz sonrası önceki Ocak–Haziran özeti bu arşivden gelir. Aynı veriyi yeniden derlemek aynı dosyaları üretir. İlk yayım tarihi korunur; veri kaydı güncellenince güncelleme tarihi eklenir. Ziyaretçinin localStorage tahmini haber kaynağı değildir.

Eksik aylarda sıfır senaryosu açıkça belirtilir; dönem sonu kesin zam diye yayımlanmaz. Katsayılar, bedelli göstergeleri, muhtar/asgari ücret ve seyyanen gösterge ortak ayarlardan gelir. Muhtar projeksiyonunda damga düşülür ve net asgari ücret tabanı uygulanır. Yeni dönem asgari ücreti/vergi tarifesi henüz girilmediyse bunlar mevcut kabul edilir.

2026 Ocak–Haziran kaydı sahibinin Haziran yazısından aktarıldı. Yazının tablo sonundaki 129,9, aynı yazının hesap bölümündeki ve Temmuz bazındaki 129,99 ile düzeltildi. Bağımsız TÜİK bülteni doğrulaması yapılmış gibi gösterilmez. Yeni yazılar bu kaynak sınırlamasını taşır. Güncel anlatım, endeks değişimi ile aylık oranların toplamını ve farkın bölme/bileşik zam yöntemini ayırır.
