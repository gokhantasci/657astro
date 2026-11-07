# 7 Kasım 2026 pencere işleri

> Belge yayını güncellendi: DPB ve genelgeler artık ayrı Markdown belgeleri olarak sunulur. [Güncel biçim ve kontroller](belge-markdown-yayini-20261107.md). Aşağıdaki ilk aktarım notları önceki PDF gömülü sürümü belgeler.

- Maaş ve Harç menüleri `/bolum/maas/`, `/bolum/harc/` sayfalarına;
  Teftiş menüsü `/bolum/teftis/` sayfasına gider. Tarifeler sayfasındaki
  bölüm/panel/arama düzeni kullanılır.
- Bütün Araçlar'ın her grubu kendi içinde toplam kullanıma göre sıralanır.
  İlk HTML gerçek sayaç anlık görüntüsünü kullanır; açılışta 83 site aracının
  canlı toplamları güncellenir. Dikte/Barkod kendi gerçek sayaçlarından her
  yayında alınır. Eşitlikte Türkçe alfabetik sıra uygulanır. Arama ve Masam
  durumları düğümler taşınırken korunur. Liste okumak kullanımı artırmaz.
- Sözlükte 24, mülakatta 12 en çok okunan içerik gösterilir. Sıralama arşiv
  tabanı + ortak okunma servisine dayanır; kart seçimi bağlantıları korunur.
- `/rakamlarla-657/`: içerik adetleri, arşiv + canlı görüntülenme, bugünkü
  görüntülenme ve 83 aracın işlem toplamı. Tekil ziyaretçi iddiası yapılmaz;
  Dikte oturumları ve Barkod aktarımları ayrı gösterilir.
- `/#duyurular` görünür başlığı olan bir bölüme gider; mobil menü kapanır,
  hedef odaklanır ve sabit başlığın altında görünür.
- Modelin tüm ağırlıkları ve WASM dosyası tam aktarım + SHA256 ile kontrol
  edildi. Gerçek Edge/WebGPU üzerinde indirme, model açılışı ve yanıt üretimi
  denendi. Geçici ağ hataları tamamlanan Cache API parçaları korunarak
  yeniden denenir; tekrarlayan Cache.add aktarım hatasında yalnız bu modelin
  önbelleği temizlenip OPFS denenir. İlgisiz kaynak eşleşmeleri azaltıldı.

## Belge arşivinde metin sadakati

DPB: 576 kaynak kaydının 1.411 sayfası yerel PDF SHA256 değerleriyle
eşleştirildi. Özgün metin üstte, belgeye özel soru-cevap bölümü alttadır.
Kaynak tarih/sayı, PDF bağlantısı ve her sayfanın sırası korunur. Site geneli
tarih biçimleyicisi özgün metni ve alıntıları değiştirmez. Aynı kaydın mevcut
URL'si ve görüntülenme sayacı korunmuştur; haber şablonu kullanılmaz.

Genelgeler: `https://adalet.gov.tr/genelgeler` dizinindeki 138 kayıt 136 ayrı
PDF olarak arşivlendi. Tekrarlanan PDF'ler tek kanonik sayfaya bağlanır.
171 sayılı genelgenin kırık bağlantısı ilgili birimin resmî kopyasıyla;
İç Denetim 1 sayılı genelgesi özgün resmî PDF'nin 23.10.2014 arşiv kopyasıyla
karşılandı. Dizindeki yanlış 68/1 -> 63/2 bağlantısı doğru resmî 68/1 kaydıyla
eşleştirildi; bu durumlar belge künyesinde açıklanır.

**Doğrulanmamış OCR yayına verilmez.** 136 belgenin 12'si tamamen seçilebilir
metindir; 124'ünde taranmış sayfa vardır. Taranmış sayfalarda üstte özgün PDF
gösterilir; yalnız güvenilir PDF metni seçilebilir olarak gösterilir. Bu 124
belgenin tamamının birebir düz metne dönüşümü henüz doğrulanmış değildir.
Ham OCR denemeleri sadece aktarım önbelleğinde kalır. Kaynağa sadakat, hatalı
OCR metnini SEO amacıyla yayınlamaya tercih edilmiştir.

Soru-cevaplar doğrulanabilir kaynak cümle/paragraflarından alıntıdır; seçilebilir
metni olmayan belgelerde yalnız resmî dizinin doğrulanmış konu başlığı kullanılır.
OCR'den hukuk yorumu/cevap uydurulmaz. DigitalDocument/FAQPage işaretlemeleri
görünen içerikle eşleşir. Arşiv ve belge sayfaları normal haberlerden ayrıdır.

## Servis ve doğrulama

- Kaynak PDF'ler SHA256 kimliğiyle salt okunur aynı-origin uçtan sunulur:
  `/_657-servis/belgeler/<sha256>.pdf`. Range/206 ve değişmez önbellek desteği.
  Tüm 136 dosya sunucuda tekrar hash ile doğrulandı.
- SQLite ve servis kaynağı yedeklendi; araç toplamı 397 olarak korundu.
- 21 servis testi; 39 yerel tarayıcı/birim kontrolü geçti. Gerçek GPU kontrolü
  büyük indirme gerektirdiğinden ayrı yürütülür. Beş genişlikte iki tema,
  kaynak metnin değişmezliği, tüm alıntıların kaynağa bağlılığı, duyuru odağı,
  sıralamalar, sabitleme, ağ/kota hataları ve OPFS kurtarma kapsanır.
- `astro check`: 0 hata, 0 uyarı; önceki 3 bilgi notu.

## Canlı yayın sonucu

Son görünüm 42385688776 numaralı üretim derlemesi ve Pages yayınıyla doğrulandı.
Ana sayfa sıralamaları ikili gruplara ayrıldı; satırlar subgrid ile hizalanır,
okunma sayısı sağda, ölçüm açıklaması alttadır. Mobilde tek sütun kullanılır.
Sıra numaraları font değişiminde de kırılmaz. 11 ek yerel görünüm/dönem testi;
canlıda iki tema × 375/1440 px × dört dönem, her durumda 20 doğru bağlantı
ve yan yana satır hizaları doğrulandı.

Canlı Edge/WebGPU testinde model tamamen kendi alan adımızdan indirildi,
açıldı ve yanıt üretti: 1 gerçek model testi, 32,2 saniye (toplam 33,8 saniye).
Ayrı canlı denetimde üç bölüm ve 85 araç, 24 sözlük/12 soru sıralaması,
paylaşılan mülakat kartı, Rakamlarla sayfası, duyuru odağı, iki DPB belgesinin
birebir DOM metni, üç kaynak PDF'nin tam aktarım SHA256 değeri ve özgün PDF'nin
yerinde görüntülenmesi doğrulandı. Canlı toplamlar servis verileriyle eşleşir.
