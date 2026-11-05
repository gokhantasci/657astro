# Tarife, veri devamlılığı ve yargı haritası

5 Kasım 2026.

## Uygulanan düzen

- `/bolum/tarifeler/`: 15 başlık; adla arama.
- `/tarifeler/<slug>/`: takvim yılına göre yürürlükte kalan dönemler, kalem bazında nominal değişim grafiği, önceki kayda göre yüzde değişim ve resmî belgeler. Eksik değer sıfır sayılmaz.
- `/veri-guncelleme/`: eski rehberin tamamı, dönem/yıl/arama/bekleyen filtreleri, otomatik veri varlığı, ayrı manuel kaynak onayı, JSON yedeği alma/yükleme. Manuel onaylar tarayıcıya özeldir. Kaynak/değer değişikliği onayı geçersiz kılar. Tahmini yayın aralığı kesin ilan değildir.
- Geri sayım: `src/data/sayaclar.json` içinde `kaynak` ve `kaynakTarihi` desteklenir. Saatler Türkiye saatidir; etkin ve gelecekteki kayıt görünür. Rehberde etkin olmayan biçim örneği ve erteleme/iptal yöntemi vardır. Eski tarihler uydurularak geleceğe taşınmadı.
- AAÜT, CMK, THH ve iflas arşivleri hesap motorunun ortak verisini doğrudan okur. THH'nin ücretleri gösterge × yarıyıl katsayısıdır. Diğer cetveller `src/data/tarife-arsivi.json` içindedir.

## Düzeltmeler

- 2024 bilirkişi URL'sinde 2025 başlığı/cetveli vardı; 2024 resmî PDF'ine göre ayrıldı. Eski karışık yıllı bilirkişi ve uzlaştırmacı dizinleri doğrulanmış ortak arşive bağlandı.
- THH'nin “2024” yazısındaki sabit tabloda 2025 yarıyıl katsayısıyla uyuşan tutarlar vardı. Üç yılın rehberleri doğru yarıyıl tablosuna bağlandı.
- HMK haberlerinde 28 Ekim 2024 / 2025 karışıklığı ve kayıp cetvel anlatımı giderildi. Yayım günü ile uygulama yılı ayrıdır.
- Tanıklık ve CMK tanıklık aynı mevzuatın iki adıdır; HMK tanıklığı ayrıdır.
- İflas 2024 tarifesi 2025'i de kapsar. Önceki tarife hesaplayıcıya eklendi. 2026 mevcut hesabı korundu.
- Yeni/eksik tarife haberleri resmî yayım günüyle eklendi. Arşive sonradan eklendikleri ve 5 Kasım 2026 düzenlemesi içerikte açıklanır. Duyuru tarihi bilinen Sigorta Tahkim 2025/2026 haberleri de eklendi. Ayrıntı: `tarife-haber-denetimi-20261105.json`.

## Harita

Haritanın eski ayrı teşkilat kopyası yerine `adliKayitlar` kullanılır. Böylece Malatya BAM, Çerkeş, Keşan çevresi ve diğer tarihli HSK düzeltmeleri adli çevre rehberiyle aynıdır. Bartın/Zonguldak'taki açıklama biçimli eski BAM değeri 785 sayılı kararın 1 Mayıs 2025 yürürlüğüyle normalleştirildi. BAM/BİM ve faal adliye sayıları kayıttan hesaplanır. Faal adliye ile müstakil başsavcılık aynı sayı değildir.

Portal renk tokenları, beyaz yüzeyler, ortak tipografi, sade düğmeler, klavyeyle il seçimi, aramada Escape/aşağı ok ve azaltılmış hareket desteği kullanılır. Coğrafi ilçe sınırları özel mahkeme yetki alanı olarak sunulmaz. İdari mahkeme rehberinin ayrı veri olduğu açıkça belirtilir.

## Kaynak izi

- [Adalet Bakanlığı bilirkişilik arşivi](https://bilirkisilik.adalet.gov.tr/Home/SayfaDetay/bilirkisilik-asgari-ucret-tarifesi02072020031131): 2024/2025/2026 PDF cetvelleri görüntü üzerinden kontrol edildi.
- [Arabuluculuk Daire Başkanlığı](https://adb.adalet.gov.tr/Home/SayfaDetay/ucret-tarifeleri30092020013011): saatlik ücretler, asgari tutarlar ve nispi dilimler.
- [İcra İşleri resmî tarife arşivi](https://iidb.adalet.gov.tr/Home/SayfaDetay/ucret-tarifesi): yürürlük yılları, kaynak belgeler ve 2025'te ayrı iflas tebliği olmaması.
- [HSK 785 sayılı karar](https://www.hsk.gov.tr/Eklentiler/21042025101617042025-785pdf.pdf): Bartın/Zonguldak.
- [Sigorta Tahkim 2024 PDF](https://www.sigortatahkim.org/content/CmsFiles/bilirkisiucrettarifesi2024.pdf), [2025 PDF](https://www.sigortatahkim.org/content/CmsFiles/bilirkisitarifesi2025.pdf), [2026 PDF](https://www.sigortatahkim.org/content/CmsFiles/bilirkisitarife2026.pdf).

Resmî Gazete bazı doğrudan isteklerde zaman aşımına uğradı; erişilebilen Bakanlık PDF'leri ve aynı Resmî Gazete cetvelinin belge kopyaları kullanıldı. Ek-1 yediemin cetvelleri belge görüntüsünden kontrol edildi; dış belge bağlantıları arşivde asıl resmî kaynaktır. Kaynak toplama/ilk aktarım betikleri tek seferlik yardımcıdır, üretim derlemesi ağdan veri toplamaz.

**Açık sınır:** Sigorta Tahkim 2024 PDF'i 1 Şubat 2024'te yürürlüğe girer. Ocak 2024'te uygulanan 1 Ekim 2023 cetvelinin tutarları doğrulanamadığı için Ocak ayına sahte bir 2024 kaydı eklenmedi. Bu sınır ilgili dönem notunda da görünür. 2027 için henüz bulunmayan resmî değerler bekleyen bırakıldı.

## Doğrulama

`tests/tarife-arsivi.spec.ts`: kaynak cetveli tutarları, yıl kapsamı, aynı mevzuat adları, ana teşkilatla bütün faal kayıtların eşitliği, Malatya/Çerkeş/Bartın/Zonguldak düzeltmeleri, yıl/kalem grafiği, manuel onay saklama, otomatik veri kutusu, 320/375/414/768 px taşma kontrolü, açık/koyu tema ve klavye seçimi. Mevcut harita, iflas, güncel veri ve 3 Kasım tarife testleri de çalıştırılır. Üretim derlemesi tip ve kırık iç bağlantı kontrolü içerir.

Sonuç: Üretim derlemesi başarılı (17.927 sayfa, tip hatası ve kırık iç bağlantı yok). Derlenmiş sürüm üzerinde ilgili 24 testin tamamı geçti. Masaüstü açık/koyu ekran görüntüleri ve dört mobil genişlik denetlendi.
