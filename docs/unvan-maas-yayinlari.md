# Unvan maaşları ve geçmiş yıllar

`/unvan-maaslari/` en yeni kayıtlı katsayı döneminin düşük maaş örneklerini listeler. 85 unvanın profili `src/data/unvan-profilleri.json` içindedir. Bir profil, katsayı, vergi veya hesap kuralı değiştiğinde sonraki `npm run build` sayfa tutarlarını yeniden üretir. Statik GitHub Pages sitesinde değişikliğin görünmesi için derleme ve yayın gerekir.

Her yılın listesi `/unvan-maaslari/2026/` biçimindedir. Ayrıntı sayfaları mevcut WordPress düzenini korur: `/zabit-katibi-maasi-2026/`. Yeni yıl geldiğinde yeni adresler otomatik oluşur; önceki yıl adresleri aynı kalır. Aynı yılın Ocak/Temmuz dönemleri aynı yıllık sayfada ayrı tablolarla görünür. Dönemler ve hesaplanan tutarlar HTML içindedir; JavaScript gerekmez. Canonical ve site haritası da otomatik üretilir.

## Güncelleme

1. `src/data/ayarlar.json` içinde yeni dönemi `donemler` listesine **ekleyin**, önceki dönemi silmeyin/üzerine yazmayın. Yeni yıl için `vergi.json` da güncellenmelidir; eksik yılda hesap hata vererek durur.
2. Ödeme mevzuatı değiştiyse hesap motoru/parametreleri ve ilgili profilleri güncelleyin. Katsayı artışı, bütün unvanların ödeme oranlarının doğrulandığı anlamına gelmez.
3. `npm run test:e2e` ve `npm run build` çalıştırın. Başarılı derlemenin son adımı güncel sonuçları, profil girdilerini ve hesap bağlamını `src/data/maas-arsivleri/YYYY-AA-GG.json` dosyasına kaydeder. Aynı dönem güncellenebilir; kapanmış dönemler tekrar hesaplanmaz.
4. Oluşan arşiv JSON dosyasını diğer veri değişiklikleriyle birlikte depoya ekleyin. CI makinesindeki geçici dosya tek başına kalıcı arşiv değildir. Önceki dönem arşivi olmadan yeni döneme geçilirse derleme durur. Böylece bir dosyayı eklemeyi unutmak eski yılın sessizce kaybolmasına yol açmaz.

`/unvan-maaslari/yayin.json` o derlemede hesaplanan güncel yayını içerir. `scripts/archive-unvan-build.mjs` yalnızca bu yerel derleme çıktısını okur ve yerel arşivi yazar; canlı siteye ya da GitHub'a yazmaz. Geçmiş tutarları bugünkü vergi tarifesiyle yeniden üretmez.

## Aktarılan eski kaynaklar

- **2024 Ocak–Haziran:** eski.657.com.tr arşivinden tutarı okunabilen 35 unvan. Her kayıtta özgün kaynak bağlantısı ve profil metni vardır. Örneğin Arşiv Memuru 31.422,18 / 40.614,56 TL. Erişilemeyen veya tablosu okunamayan kaynaklar için değer tahmin edilmedi.
- **2025:** yerel WordPress yedeğindeki `maaslar.xml`, 76 unvan. 06.12.2025 tarihli WP All Import 2 numaralı işlem kaydı, 2025 başlıklı maaş yazılarını doğrular. XML ay belirtmediğinden yayın `2025 · yayımlanan arşiv (ay belirtilmemiş)` olarak tutulur. Kaynak dosya `public/kaynaklar/maas/2025-maaslar.xml`, SHA-256 arşiv JSON'unda kayıtlıdır. Tablodaki değerlerin yeni motorla doğrulandığı iddia edilmez.
- **2026 Ocak:** önceki aktarımın 76 yazısındaki yayımlanmış değerler korunur. Bugünkü hesapla karıştırılmaz.
- **2026 Temmuz–Aralık:** mevcut ortak maaş motoru, katsayılar ve vergi tarifesiyle üretilir. Cezaevi müdürünün lise ve yükseköğrenim oranları 1–6. dereceler için tamamlandı; sayfa 6/1, 6 yıl, yükseköğrenim giriş örneğini kullanır. Formdaki ayrı “özel +13” seçeneği henüz hesap göstermez.

Kaynakta “en yüksek” tutarın düşük tutardan küçük olduğu Terzi/Hizmetli gibi kayıtlar aynen korunur ve bu çelişki sayfada açıklanır. Tutarlar sessizce yer değiştirmez.

## Profilin anlamı

Düşük örnek, tanımlı derece/eğitim/hizmet profili için hesaplanan net maaştır; mevzuattaki mutlak asgari ücret değildir. Profiller dosyadan değiştirilebilir. Öğretmen ve arkeolog 9/1, avukat 9/3 lisans profili kullanır; müdürlerde 6/1 ve diğer kaynak profillerinde 13/3 şablonu vardır. Kıdemli örnek de belirtilmiş aile/engelli çocuk/sendika varsayımlarına bağlıdır; yasal azami maaş olarak sunulmaz.

Yeni motorla hesaplanmamış eski arşivlerin doğruluk statüsü farklıdır. Eski yıl sayfalarının varlığı, eski bordroların bütün mevzuat ve kişisel kesintilerinin doğrulandığı anlamına gelmez.

## Doğrulama

`tests/unvan-maas.spec.ts` katsayı değişiminde yalnız güncel tutarın değişmesini, 2027 sentetik yayınının yeni adresleri üretmesini, eski adreslerin korunmasını ve derleme arşivinin önceki dosyaya dokunmamasını sınar. Şema hataları, kaynak tutarları, yıl/dönem geçişi, sitemap/canonical, JavaScriptsiz görünüm ve iki temada dar ekranlar da test edilir.

Başarılı gerçek statik derleme 2026-07-01 döneminin 85 unvanını arşive kaydetti. Bu kayıtlar kaynak depoda saklanır; yeni dönem eklenirken önceki dönem JSON dosyası korunmalıdır. Vergi tarifesi de `src/data/vergi-arsivleri/YYYY.json` dosyasına yazılır; eski katsayı dönemleri kendi yıllarının tarifesiyle çalışır. Yılı eksik tarife tahmin edilmez. Eklenen teknik unvanların kaynak kapsamı ve yuvarlama farkları `docs/maas-saglama.md` içindedir.
