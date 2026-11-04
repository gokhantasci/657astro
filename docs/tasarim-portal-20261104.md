# Hizmet portalı tasarım uyarlaması — 04/11/2026

Kaynak: kullanıcının `ornekler` klasöründeki B anasayfa ve maaş aracı HTML örnekleri. Renk, tipografi, kart, boşluk ve form düzenleri mevcut Astro bileşenlerine uyarlandı. Referansların sabit sayıları, yer tutucuları ve React çalışma zamanı üretime taşınmadı.

- Ortak dil `design.md`; renkler, ölçüler ve iki tema `src/styles/tokens.css`.
- Lacivert/kırmızı üst menü, düz gri zemin, ince sınırlı beyaz kartlar, kapsül filtreler ve tutarlı alanlar `src/styles/portal.css` ile bütün Layout sayfalarına uygulanır.
- Anasayfa: araç ve yazı araması, gerçek kategori sayıları, 2×2 düzenlenebilir duyurular; yazı sliderı ve kaynak filtreli haberler, son yazılar, döviz/hava/akaryakıt korunur.
- Maaş: beyaz başlık, beş numaralı açılır form bölümü, kapalı bölümde seçim özeti, lacivert net sonuç ve altındaki tahmin; gelir/kesinti ayrı tablolarda, renkler korunur. Bölüm kapatmak değer silmez. Öğretmen seçilince ilgili bölüm açılır; geçersiz alanda bölüm görünür yapılır.
- Diğer hesaplama araçları, yazılar/kategoriler, sözlük, mülakat, adli çevre, dosyalar ve asistan ortak kabuk/alan/tablo dilini alır. Hata sayfalarının bağımsız çalışması korunarak aynı zemin/renkler uygulanır.
- İzole teftiş araçları aynı token'ları kullanır. Red Hat fontlarının gerekli Latin/Türkçe alt kümeleri belgeye gömülür; dış font/ağ bağlantısı gerekmez. Ağ ve üst sayfa erişimi kapalı kalır.

Hesap formülleri ve ortak mali veri değiştirilmedi. Mevcut URL, sitemap, yapılandırılmış veri ve sayaç entegrasyonları korunur. Ön yüz yerel sürümdür; canlıya yayın yapılmadı.

## Doğrulama

`tests/tasarim-portal.spec.ts`: on iki sayfa ailesi × 320/375/414/768 px × açık/koyu tema; sayfa taşması, ızgaranın kaldırılması ve maaş bölüm/değer/döküm davranışı. Önceki hesap ve etkileşim testleri de çalıştırılır. Görseller `artifacts/arayuz-*.png`, kaynak görseller `artifacts/ornek-*.png` dosyalarındadır.

İlk hedefli çalışma: 18 test geçti. Tam çalışma: **611 geçti, 1 atlandı, başarısız test yok** (3,4 dakika). Atlanan kontrol isteğe bağlı ses modeli indirmesidir. Gerçek WebGPU modeli 21,3 saniyede yükleme/yanıt testini geçti. Katalog erişimi, aramalı seçimler, hukuk/maaş hesapları ve teftiş dosya/çıktı testleri bu çalışmaya dahildir. Son tipografi/menü ve mobil kategori düzenlemeleri ayrıca hedefli test edilir.

Son tipografi/menü ve mobil kategori düzenlemeleri sonrası **22 hedefli test geçti**. Metadata taraması **17.628 HTML ve 6.946 sitemap adresinde sıfır hata** verdi. Bu sonuç başlık, canonical, açıklama, JSON-LD, alt ve sitemap hedeflerinin teknik doğrulamasıdır. Koyu temada yazıların aktif kategori ve sıralama vurguları metin için ayrılmış açık vurgu rengine bağlandı.

Son çıktı yeniden derlendi (17.568 sayfa, Astro denetiminde hata/uyarı yok); son renk düzenlemesinin ardından iki tasarım testi de tekrar geçti. 4321 geliştirme ve 4322 önizleme adresleri çalışır durumda bırakıldı.
