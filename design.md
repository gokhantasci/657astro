# 657.com.tr — Hizmet portalı tasarım sistemi

Kullanıcının `ornekler` klasöründeki B anasayfa ve maaş aracı tasarımları esas alınır. Bu belge tüm sayfa türlerinin ortak görsel dilidir.

## Görsel dil

Lacivert üst menü ve sonuç başlığı; 657 kırmızısı eylem/vurgu. Düz açık gri zemin, beyaz yüzeyler, ince gri sınırlar. Koyu tema aynı hiyerarşiyi korur. Excel ızgarası ve hareketli aktif hücre bu tasarımda kullanılmaz.

Renkler ve ölçüler `src/styles/tokens.css` içindedir. Referans: açık zemin #f3f5f8, yüzey #ffffff, metin/lacivert #132036, ikincil metin #34425a, sınır #dfe3ea, vurgu #c8102e. Koyu zemin #0d1420, yüzey #141d2c, metin #edf1f7, sınır #27324a. Renkler bileşenlere kopyalanmaz.

## Yazı ve ölçüler

Red Hat Display 600/700 başlıklar; Red Hat Text 400/500 gövde; Red Hat Mono yalnız kod/kısayol. Normal başlık, dengeli 1.15–1.3 satır aralığı, -0.015em harf aralığı. Sayılarda tabular-nums. İçerik yaklaşık 1280 px, geniş teftiş ve gider çalışma alanları daha geniş. Mobil kenarlar 16 px, masaüstü 24 px; ana kart aralığı 24 px, form alanları 16–20 px. Kartlar 10 px, alanlar/düğmeler 8 px; filtreler kapsül.

## Sayfa aileleri

- Anasayfa: beyaz arama/başlangıç alanı; altı araç alanı; 2×2 düzenlenebilir duyurular. Duyurular bir kez gösterilir. İşlem sayaçları kompakt bir şerittir. Altında gerçek görseli varsa görsel kullanan, görseli yoksa metin olarak tasarlanan yazı seçkisi ve kaynak filtreli bakanlık haberleri; ardından yazılar, dönemsel okunma listeleri ve kaynak/hesaplama sınırları yer alır. Haber panelinde yalnız geçerli sayfanın satırları DOM’a yazılır; bütün kayıtlar sayfalı kurum haberleri arşivinde taranabilir. Mevcut kullanıcı işlevleri korunur.
- Hesaplayıcılar: sayfa başlığı, sol girdi kartları, sağ lacivert sonuç özeti ve altında tahmin/yardım. Uzun maaş formu numaralı açılır bölümlerdir. Gelir ve kesinti tabloları ayrı, yeşil/kırmızı tutarlar.
- Teftiş: geniş çalışma alanı, beyaz kartlar, aynı alan/düğme/yazı dili; iframe içi kaynak araçlar da aynı temayı kullanır.
- İçerik/dizinler: okunaklı başlık ve gövde; satır ve kartlarda ince sınır, tutarlı meta/arama/filtreler. Sözlük, mülakat, adli çevre, dosyalar ve asistan aynı ortak kabuğu kullanır.
- Hata sayfaları: bağımsız açılabilir, aynı düz zemin, renkler ve düğmeler.

## Etkileşim

Liste aramaları görünür etiketin altında, en fazla 44rem genişliğinde ve mobilde tam genişlikte düzenlenir. Arama yüksekliği en az 48px, tarife ve bölüm dizinlerinde 52px olur. Unvan dizini kadrolu, sözleşmeli ve emekli sayfalarını birlikte arar; örnek tutarların kapsamı ve varsayımları sayfa üzerinde açıklanır.

Anlamlı bağlantılar; 44 px dokunma alanı; görünür klavye odağı; aramalı select gövde üzerinde açılır. Details/summary klavyeyle açılır ve alan değerlerini korur. Açık/koyu tema ve azaltılmış hareket tercihi desteklenir. Önce 320/375/414/768 px ve masaüstü doğrulanır. Mobilde sonuç ve tablolar tek sütuna iner; tüm sayfa yatay kaymaz, büyük veri tabloları kendi alanında kayabilir.

## Uygulama sınırı

Astro bileşenleri, adresler, hesap motorları, ortak JSON verileri, SEO ve sayaçlar korunur. Örnekteki sabit tutarlar veya yer tutucular kopyalanmaz; gerçek veriler ve mevcut hesap motorları kullanılır. React örnek çalışma zamanı üretime taşınmaz. Ortak görünüm `src/styles/portal.css` dosyasında, bileşene özel yapılar ilgili Astro dosyasında tutulur.

## 08.11.2026 okuma ve yanıt erişimi

Uzun yazılarda görünen kısa açıklama, gerçek güncelleme tarihi varsa tarih, yayıncı ve kaynak politikası gösterilir. Yayıncı bilgisi uzman incelemesi iddiası değildir. Özgün hukuk belgesine eklenen metin özgün metinden ayrılır. Makale ve görüş gövdesi yaklaşık 70–80 karakterlik okunabilir satırlara göre sınırlandırılır; kaynak tabloları kendi içinde kayar. SEO ve yanıt motoru çalışmaları ölçüm ve kaynakla raporlanır; otomatik 100/100, sıralama veya alıntılanma garantisi verilmez.

## 10.11.2026 · Astryx'ten uyarlanan etkileşimler

Mevcut Astro yapısı ve 657 görsel kimliği korunur. Astryx'in Selector, FileInput ve durum gösterimi yaklaşımı davranış referansıdır; React çalışma zamanı eklenmez.

- Ortak seçim menüsü: 44 px seçenek hedefi, seçili işareti, devre dışı seçenekleri atlayan klavye gezintisi, sonuç sayısı, Escape/dışarı tıklamayla kapatma. Arama yazısı hesap girdisi değildir; yalnız kesinleşen seçim input/change olayını üretir.
- Dosya alanı: `DosyaBirak.astro`; dosya adı ve boyutu, görünür klavye odağı, sürükleme ve devre dışı durum. Başarı yalnız dosya gerçekten işlendikten sonra gösterilir.
- İşlem durumu: `IslemDurumu.astro` ve `islem-durumu.ts`; boş/hazır, işleniyor, başarı ve hata için metin + simge. Renk tek başına anlam taşımaz; azaltılmış hareket tercihi korunur.
- UDF çalışma alanı: solda belge ve çıktılar; sağda önizleme, etiketli arama, görünüm seçimi, sığdırma/yakınlaştırma. Mobilde tek sütun; belge yazıları belgeye ait renk ve fontları kullanır. Form metinlerini yeniden yazmak veya belge görünümünü değiştirmek kullanım sayacına ek işlem yazmaz.
- Yeni etkileşimlerde durum, klavye odağı ve hesap/sayaç davranışı birlikte test edilir. 320/375/414/768 px, açık/koyu tema ve gerçek belge örneği kontrol edilir.
