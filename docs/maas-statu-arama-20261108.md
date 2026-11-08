# Maaş türleri ve arşiv araması — 08.11.2026

Güncel maaş kataloğundaki 308 unvanın her biri için emekli sayfası, sözleşmeli cetveldeki 60 unvanın her biri için sözleşmeli sayfası otomatik üretilir. Kadrolu sayfalar korunur. Yeni unvan cetvele eklendiğinde sayfası ayrıca elle yazılmadan oluşur. Birbirine karşılık gelen unvanların kadrolu, sözleşmeli ve emekli sayfaları arasında bağlantı bulunur.

Örnek adresler: `/sozlesmeli-zabit-katibi-maasi-2026/` ve `/emekli-zabit-katibi-maasi-2026/`. Bütün bağlantılar `/unvan-maaslari/`, maaş yazıları dizini, site içi asistan arama indeksi ve `sitemap-maas.xml` içinde yer alır. Yeni türlerde doğrulanmış geçmiş yıl cetveli olmadan tarihî tutar üretilmez.

Sözleşmeli örnekler mevcut ücret cetveli ve hesap motorunu kullanır. Her öğrenim/kurum koşulu, 0 ve 25 yıl hizmet için ayrı gösterilir. Dönemin ilk ayı, ocaktan itibaren aynı sözleşme, bekâr/çocuksuz/sendikasız profil varsayımları görünürdür. Kaynakta olmayan birleşim için ücret doldurulmaz. Karşılaştırma cetvelinin resmî kaynak olmadığı açıkça belirtilir.

Emekli örnekleri aktif maaşın oranından türetilmez; mevcut 5434 motoruyla hesaplanır. Katalogdaki doğrulanmış kıdemli profilin kadro, öğrenim ve koşulu korunur. 25/30 yıl örnekleri, ikramiye ve kapsam açıklamaları birlikte gösterilir. 5510'a dayalı kişisel aylık, makam/temsil/görev tazminatları ve kişisel intibak bu örneklerin kapsamında değildir. Doğrulanmış profili olmayan unvanda tutar yerine açıklama gösterilir. Resmî SGK kapsam sayfası ve katsayı genelgesi bağlantısı bulunur.

Hesaplama bağlantıları tanımlı unvan/koşul/derece seçeneklerini seçer. URL'den ücret veya sonuç kabul edilmez. Zabıt katibinin iki türünde de sayfadaki ilk örnek ile bağlantıdan açılan hesaplayıcının sonucu eşitliği tarayıcıda doğrulanır.

Tarife ve bölüm araç aramaları etiketin altında, masaüstünde en fazla 44rem genişliğinde, mobilde kullanılabilir alanın tamamında ve 52px yükseklikte gösterilir. Site genelindeki ana içerik aramalarının asgari yüksekliği 48px olur. Unvan dizininde üç maaş türünde birlikte arama vardır. Türkçe karakterler ve aksansız yazım aynı sonucu verir.

Doğrulama: yeni 6 test ve mevcut `diger-maas`, `sozlesmeli-tarife`, `unvan-maas` dosyalarındaki 29 test geçti (toplam 35). Açık/koyu tema × 320/375/414/768/1440px × 6 sayfa ailesi için taşma ve arama alanı ölçümleri yapıldı. Astro kontrolünde 0 hata, 0 uyarı; önceden bulunan 2 ipucu var. Bu kontroller SEO sıralaması veya emekli aylığı hak sahipliği doğrulaması değildir.
