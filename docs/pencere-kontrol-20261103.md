# 03/11/2026 akşam talimatları — uygulama ve doğrulama

Yeni ön yüz yerelde hazırlanmıştır; GitHub'a gönderilmemiş ve canlı WordPress yerine yayımlanmamıştır. Önceden yetkilendirilmiş ayrı `657-oneri` servisine yalnız indirme sayacı eklenmiştir. WordPress, DNS ve diğer uygulamalar değiştirilmemiştir.

| İstek | Sonuç |
|---|---|
| Anasayfa | Düzenlenebilir araç bağlantıları, tam genişlikte 2×2 duyurular, solda on yazılık slider ve sağda bakanlık haberleri. Eski Uygulamalar kartı kaldırıldı. |
| Yazılar | Dört sıralama paneli, resimli üç sütunlu kartlar, kategori bağlantıları, arama ve 50 kayıtlık sayfalama. Araç araması yazıları da getirir. |
| İçerik | Sosyal medya temsilcilikleri ve basit yargılama listesi dahil uygun popüler yazılar aktarıldı. Kararname ve kişisel listeler kaldırıldı; içe aktarma ve derleme filtresi eklendi. Aktarım izi `src/data/yazi-aktarim-denetimi.json`. |
| HSK | Malkara, Gelibolu ve Eceabat'ın Keşan ağır ceza bağlantısı; Eceabat'ın Gelibolu adliye bağlantısı; Çerkeş, Malatya BAM ve doğrulanmış diğer çevreler tarihli düzeltmelerle işlendi. Özel mahkeme çevreleri ayrı kayıtlardır. Yeni kararlar izleme listesine alınır; kapsamı doğrulanmadan kendiliğinden yorumlanmaz. |
| TÜFE | Resmî Excel dosyasından 262 aylık endeks/oran kaydı. Ekim 2026 endeksi 140,77, aylık değişim %2,58. Endeks yuvarlanmış aylık oranlardan türetilmez. |
| Enflasyon haberleri | Ortak veriden aylık ayrıntılı haberler ve yarıyıl özetleri: kaynak tablo, yöntem, memur/emekli farkları, katsayılar ve ilişkili araçlar. |
| Beklentiler | Açıklanmayan aylar için ortak, kaynak/tarih bilgili beklenti JSON'u ve ziyaretçi senaryosu. Resmî aylar tahminle değiştirilmez. |
| Maaş | Gelirler yeşil, kesintiler kırmızı; ek alanlar hizalı; tahmin kartı Maaş özeti altında. Altı aylık veri tamamlanınca varsayımları belirtilen 14 günlük fark gösterilir. |
| Sözleşmeli unvanlar | Memurlar.net'in 03/11/2026 tarihli 58 unvanının tamamı yerel 60 seçenek içinde. MAHEP 4/B doğrudan brüt ücret alır. Envanter kontrolü tüm kişisel bordroların sayısal doğrulaması değildir. |
| Geçmiş tarifeler | 2024–2025 harçları, 2024'ü kapsayan AAÜT dönemleri ve geçiş günleri. Karar tarihi 2024'ten seçilebilir. Harç ve AAÜT farklı tarihlerde değişir. |
| CMK / AAÜT | CMK 2024–2026 ve tarihli AAÜT araçları, resmî kaynaklar ve arşiv. Eski 2024 yazı yolları ilgili araca yönlenir. |
| Açılır listeler | Menü gövdeye taşınır; kartların altında kalmaz, ekran sınırlarına yerleşir. Katalogdaki görünür seçimler gerçek tıklama/hit-test ile taranır. |
| Teftiş | Kaynak rehberler, dosya bırakma/seçme, sonuç alanları, geniş sayfalar. Jrobot boş ekranındaki yatay taşma, mobil tarih alanları ve kanun yolu düğme kontrastı düzeltildi. |
| Asistan | Anlaşılır hata, model manifesti/önbellek kontrolleri ve yeniden deneme. Gerçek WebGPU yükleme/yanıt testi yapıldı. Her cihazda GPU desteği garanti edilmez. |
| Hava / döviz / Shell | TCMB gösterge kuru, Open-Meteo hava ve Shell il/ilçe ürün fiyatları ortak önbellekten. Kaynak zamanı ve eski veri durumu görünür. Ziyaretçi tarayıcısı bu kaynaklara sorgu göndermez. |
| Özel günler | Diyanet kaynaklı 2026–2031 dini günler; millî günler, Anneler/Babalar Günü, 5 Nisan ve 8 Aralık. Önceki gün ve aynı gün mesajları; metinler `/ozel-gunler/` ve düzenlenebilir JSON'da. |
| Dosyalar | Dokuz uygulamanın kullanım bilgileri ve yeni indirme yolları; site dosyalarına ortak API sayacı. Sayılan olay başlatılan indirmedir. Kişisel yüklemeler ve tarayıcıda üretilen özel çıktılar sayılmaz. |
| Tarihler / SEO | Görünen geçerli tarihler gg/aa/yyyy; URL/datetime/veri ISO kalır. RSS `/feed.xml`, sitemap, canonical ve yapılandırılmış veri kontrolleri. İki bölüm dizini üretildi; 36 yazının eski etiket bağlantıları çalışan aramaya çevrildi. Maaş yazılarının kaynakta bilinen dönem tarihleri ve yayıncı bilgileri şemaya eklendi. SEO/AEO/GEO düzenlemeleri sıralama garantisi değildir. |
| Veri girişi | `/veri-guncelleme/` tarife, TÜFE, beklenti, katsayı ve mesaj dosyalarının düzenleme yerini açıklar. |

## Aktarım ve sağlamanın sınırı

Katalog 83 kayıt: 81 yerel araç yolu, mevcut dikte ve barkod uygulamaları iki alt alan adında. 12 teftiş ekranı/rehberi, birleşik HMK formu, nüfus analizi, genel konsolosluk arşivi ve bağımsız gider kontrolü dahil taşınabilir ekranlar eklendi. [Teftiş aktarımı](teftis-aktarimi.md).

17 canlı Adliyeci örneği ve 12 karar türünün tarife sınırı tarayıcı testleri bulunur. Altı seçilmiş dalda tam hüküm metni eşitliği kontrol edilir. Kaynaktaki eksik nafaka paragrafı, `-Label` ve eski/hatalı tarife kuralları kopyalanmaz. Adliyeci 03/11 tarihinde hâlâ 45.000 TL asliye tabanı döndürürken yeni araç resmî yeni dönemi uygular.

Konsolosluk arşivi 44.218 kayıt, 122 dolu ülke ve ülkesi belirtilmeyen sekiz kayıt içerir; güncel Dışişleri teyidi değildir. Kaynakta bulunmayan boşanma hükmü üretimi vaat edilmez.

Önceki [maaş kapsamı](maas-saglama.md) ve [araç kapsamı](arac-tasima-kapsami.md) sınırlamaları geçerlidir: tarihsel 4/C, bütün kurum TİS'leri ve tüm kişisel maaş kombinasyonları doğrulanmış kabul edilmez.

## Son doğrulama

`npm run build` ve Astro tür denetimi geçti: 17.568 sayfa. Tam Playwright çalışması: **607 geçti, 1 atlandı, başarısız test yok** (3,3 dakika). Atlanan test isteğe bağlı ses modeli indirmesidir. Gerçek WebGPU modeli yükleyip yanıt verdi (27,9 saniye). Servis birim/entegrasyon testleri: **11/11**. Canlı sayaç salt okunur sorgusu ve CPU/bellek sınırları doğrulandı.

Son bölüm/bağlantı ve şema düzeltmelerinden sonra **31 ilgili ekran testi de geçti**. Metadata taraması: **17.628 HTML, 6.946 sitemap adresi, sıfır hata**. Bu tarama başlık/canonical/açıklama/JSON-LD/alt ve sitemap hedeflerini denetler; sıralama veya tüm içeriklerin doğruluğuna dair puan değildir. Köke bağlı gezinme bağlantıları ayrıca tarandı; bulunan iki eski haber bağlantısı çalışan araçlara çevrildi.

Son çıktıdaki **17.628 HTML dosyasında köke bağlı gezinme hedefi hatası sıfır** (`artifacts/baglanti-teslim.log`). İki son bağlantı değişikliğinin ardından beş hedefli test daha geçti. Haricî sitelerin sürekli erişilebilirliği bu taramanın kapsamı değildir.

Ayrıntılı günlükler `artifacts/test-bitirme-tumu.log`, `artifacts/test-kapanis-degisen.log`, `artifacts/test-teslim-son.log`, `artifacts/seo-kapanis.log` ve `artifacts/baglanti-teslim.log` dosyalarındadır. Yerel adresler: `http://127.0.0.1:4321/` ve `http://127.0.0.1:4322/`.
