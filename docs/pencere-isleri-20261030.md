# Pencere çalışma listesi

Son kontrol tarihi: 30.10.2026. Bir ekranın bulunması, bütün kaynak ve profillerin doğrulandığı anlamına gelmez.

| İstek | Durum / kanıt |
|---|---|
| Bordro neti, BES kapalı / sendika açık, nafakaya ikinci kez harç eklenmemesi | Tamamlandı, 4f96d71; iki giriş biçimi de yerel tarayıcıda aynı net |
| Sonraki dönem enflasyon farkı + zamla net maaş | Tamamlandı, 4f96d71; ortak enflasyon kaydı ve ayrı TİS senaryosu |
| Tüm unvanlar için standart düşük/yüksek örnekleri, Seçiniz | Uygulandı; yeni başlayan bekâr ile evli iki çocuklu 30 yıl; 19 ilgili kontrol geçti |
| Otomatik unvan yazıları, eski dönem kıyasları, yıllık grafik ve sitemap | Uygulandı; tüm form unvanları otomatik dahil; 281 unvanla 16.811 sayfa derlendi, sonrasında 27 Memurlar.net unvanı daha eklendi |
| Son 10 yılın katsayıları | 2017–2026, 20 resmî kaynaklı dönem. Geçmiş dönem brüt bileşen hesabı eklendi. Geçmiş netlerde unvana özgü dönem mevzuatı henüz tamamlanmadı |
| Sözlük ana okunma sayacı | Ortak sayaç 657.com.tr/_657-servis/api/okunma üzerinden canlıya alındı; gerçek ardışık isteklerde artış doğrulandı |
| Yazılar kategorileri | Sekiz konu, tür filtresi, arama ve ortak 50 kayıt pager eklendi; kontroller geçti |
| 2035 dahil tatiller.json | Kontrol edildi: 2024–2035. 19 Mayıs 2027 çift bayram kaydı süre hesabında tek gün; tüm eski JSON uçları ortak veri kullanır |
| Maaş/yolluk/katsayı kullanan hesaplarda unvan ve bütçe dönemi | Çalışılıyor; yalnız doğrulanmış tarife dönemleri seçilebilecek |
| 68/B unvan grupları ve doğum izni | Kaynaktaki iki grup eklendi; sınırsız özel sektör istisnası ve izin alanı bağlandı; kontroller geçti |
| Belediye türleri | Beş tür ve türe göre 1/1, 5510, 0 yıl prim örneği eklendi; kaynak/yerel fark testi bekleniyor |
| Yargılama gideri, hızlı beş sütun ve dönem sayfalama | Beş sütun, 5 dönem pager, hızlı adetler, sağda özet/yükleme; Excel ve döküm testleri geçti |
| Enflasyon açıklaması, aylık haber ve önceki yarıyıl otomasyonu | Dinamik anlatım, ortak veri, dönemi kalıcı arşivleme, dokuz aylık yazı ve iki yarıyıl özeti; negatif TÜFE destekli; testler geçti |
| SEO, AIO, GEO, AEO | WebSite/WebPage/Article/Breadcrumb, paylaşım görseli, kaynak dizini ve llms.txt genişletildi. 16.812 HTML ve 6.292 sitemap hedefi denetlendi, hata yok. Sıralama/alıntılanma garantisi değildir |
| Tarayıcı WebGPU asistanı, aynı domainden model | Asistan ve yerel model sunumu uygulandı; gerçek WebGPU yükleme/yanıt testi geçti. Çalışma anında model CDN isteği yok; canlı alan adı geçişi ayrı |
| Adliyeci.org kaynak karşılaştırmaları | HTTP WebForms çalıştı; 17 örnek gönderildi ve form geri dönüşleri doğrulandı. Feragat, nafaka ve manevi tazminat farkları kayıtlı. Kasa yalnız Excel indirme, genel konsolosluk ayrı kapsam |
| MAHEP / Memurlar.net tüm unvan ve program karşılaştırmaları | 5.026 MAHEP kaynak profili; 4.744 temel + 548 kişisel yerel profil; 679 çift kaynak uzlaştırması. Eski 122 ret çözüldü. 27 ek Memurlar.net unvanında 215 derece/koşul bileşeni. 666/2802 ve bazı programlar/historik rejimler henüz tamamlanmadı |
| Öneri kuyruğu ve yönetici onayı sonrası GitHub yayını | Kullanıcının açık onayıyla 657.com.tr/_657-servis altında canlıya kuruldu; 10 test, canlı giriş/sayaç ve depoya özel anahtar ile dry-run geçti. Turnstile zorunlu, yönetici onayı olmadan Git yayını yok |
| Gerekçeli karar ve UDF metin araçları | Gerekçeli karar XLS/XLSX, arama/filtre ve yerel DOCX eklendi. Dört UDF yalın metin ekranı var; biçim/görsel/imza/resmî editör doğrulaması eksik |
| Kick Türkçe harita Reels hatası | D:/kicks içinde fea39a21 ve c8aa477f düzeltmeleri zaten var; hata sayfasını reddetme ve harita hazır olmadan çekmeme kontrolleri, gerçek tarayıcı dahil iki testte geçti. Canlı dağıtım/yeni paylaşım yapılmadı |
| Pencerenin önceki taşıma maddeleri | Önceki commitler ve docs/hesap-dogrulama-envanteri.json ile son toplu denetimde tek tek kontrol edilecek |

Kimlik bilgileri, bordro görüntüsü ve geçici kaynak form belirteçleri yayımlanmaz. Önceden değiştirilmiş `mahep-oranlar.py` ve `memurlar-oranlar.py` korunur.

## Son eklenen istekler

- Görünen tarihler son istek uyarınca gg/aa/yyyy. HTML metin düğümleri dönüştürülür; URL, datetime, JSON-LD ve kod değerleri değişmez. Takvim girişi ve dinamik hesaplar da ortak biçimde.
- Yazılar listesinde iki sütunlu kompakt satırlar ve siteyle uyumlu arama/seçim alanları. Mobil görsel denetim son derlemede yapılacak.
- Model yüklemesinde başlangıç durumu, manifest zaman aşımı, HTTP hata bilgisi ve yeniden deneme eklendi. Önceki gerçek üretim WebGPU testi geçti; son derleme sonrası tekrar sınanacak.
- 9 uygulama yeni 657.com.tr indirme bağlantılarına taşındı; dosyalar dizini ve kaynak kullanım yazıları eklendi.
- DPB: 576 benzersiz PDF/metin aktarıldı. Ege arşivinde 404 olan iki görüş Bartın Üniversitesi resmî arşivinden tamamlandı. Tam metin, yerel PDF, görüş sayfaları, sitemap ve asistan araması var.
- İddianame, tensip ve hedef süre: eski aracın D3/C12 ve sabit sütunlarına göre gerçek Excel okuma, bildirilen/takvim günü ayrımı, arama/eşik, 50'li pager ve yerel Word çıktısı eklendi. Diğer teftiş araçları henüz tamamlanmadı.
- Yargılama gideri: 86 tarife dönemi tek A4 yatay PDF; ortak JSON'dan derlemede yenilenir. Tek sayfa ve Türkçe metin doğrulandı; PNG görsel kontrolü yapıldı.
- Hukuk hüküm metninde tam/kısmi kabul ve açılmamış sayılma için altı kaynak örneğinde boşluklar normalize edilerek birebir eşitlik sağlandı. Diğer bütün metin dalları henüz tamamlanmadı; sayısal 17 kaynak örneği ve bilinen mevzuat farkları ayrı kayıtlı.

## 03/11/2026 yerel kararlılık kontrolü

Kullanıcının son talebiyle yeni site canlıya taşınmadı. Geliştirme 4321, üretim önizlemesi 4322. Yeni AAÜT 03/11/2026 yürürlük tarihiyle eklendi, eski kayıt 02/11/2026'da kapandı. Ekim TÜFE %2,58 resmî oran olarak girildi; erişilemeyen genel endeks oranlardan türetilip yaklaşık diye işaretlendi. Güncelleme yerleri docs/veri-guncelleme.md içinde.

Geliştirme sunucusundaki 504 Outdated Optimize Dep hatası, dosya kütüphanelerinin başlangıçta optimize edilmesiyle giderildi. Son toplu yerel kontrolde 539 test geçti; isteğe bağlı Piper testi ayrıca geliştirme ve üretim önizlemesinde gerçek WAV üretti. Piper sonrası dokuz belge/derdest kontrolü de geçti. Üretim derlemesi 17.434 sayfa; SEO denetimi 17.435 HTML, 6.915 sitemap hedefi ve sıfır hata.

Eksik kalan bütün kaynak/unvan kombinasyonları, geçmiş net bordro rejimleri, kalan teftiş ve diğer araçlar hâlâ tamamlanmış sayılmaz. Mevcut araç dizininde 81 kaydın 63'ü etkin.

Yerel başlatıcı: `pwsh -NoProfile -File scripts/yerel-baslat.ps1`. Portları kontrol eder, bu projeye ait çalışan süreçleri yeniden başlatmaz, önizleme sürecini test koşucusundan bağımsız gizli pencerede açar. 4321/4322 ve beş temel sayfa HTTP 200 ile doğrulandı. Başka uygulamanın kullandığı porttaki süreç durdurulmaz.

## Yeni devam kontrolü

03/11/2026 tarihli yeni teftiş aktarımı, model indirme yedeği, birleşik HMK, nüfus ve konsolosluk araçları ile doğrulama kanıtları [son kontrol kaydında](pencere-kontrol-20261103.md). Yukarıdaki “kalan teftiş” ve 63 etkin kayıt ifadeleri o tarihteki durumun kaydıdır.
