# SEO, AIO, GEO ve AEO denetimi ve yol haritası

İlk denetim 03.11.2026'da yapıldı; 04.11.2026'da 00:04 derlemesi üzerinde yeniden ölçüldü ve canlı site haritasıyla karşılaştırıldı.

Bu belge, 657.com.tr'nin arama ve yanıt motoru çalışmaları için **tek yetkili yol haritasıdır**. `docs/seo-aio-geo-aeo-denetim-raporu.md` belgesindeki maddeler tek tek doğrulandı. Doğru olanlar buraya işlendi; hatalı ya da zararlı olanlar [§7](#7-diğer-raporun-doğrulanması)'de gerekçesiyle listelendi. O belge yol haritası olarak kullanılmamalıdır.

Puanlar bu denetimin kendi ölçeğidir; Google'ın ya da başka bir motorun verdiği bir puan değildir. Her puan aşağıdaki tarama sayılarına dayanır ve [scripts/seo-denetim/](../scripts/seo-denetim/) ile yeniden üretilebilir.

## Özet puan

| Alan | Ne ölçer | 03.11 | 04.11 |
|---|---|---|---|
| **SEO** | Klasik arama: taranabilirlik, göç sırasında adres korunması, etiketler, şema, iç bağlantı, hız, içerik | 74 | **72** |
| **AIO** | Yapay zekâ özetleri ve tarayıcıları için okunabilirlik: erişim, sunucuda üretilen içerik, varlık tanımı, tazelik | 75 | **78** |
| **GEO** | Üretken motorların (ChatGPT, Perplexity, Gemini, Claude) siteyi kaynak gösterme olasılığı | 55 | **56** |
| **AEO** | Öne çıkan snippet, "Diğer sorular" ve sesli asistanlar için doğrudan yanıt | 57 | **57** |
| **Genel** | Ağırlıklı ortalama (SEO %35, AIO %20, GEO %25, AEO %20) | 66 | **66** |

SEO puanı düzeltmelere rağmen düştü. Bunun nedeni ilk denetimde hiç bakılmamış bir alanın bu kez ölçülmesi: canlı WordPress site haritasındaki 8.844 adresin **2.924'ünün** Astro çıktısında karşılığı yok ([§5](#5-canlı-adreslerle-eşleşme)). Bu açık kapanmadan yayına geçilirse mevcut trafiğin bir kısmı kaybolur. Yol haritasının ilk maddesi budur.

### 03.11'den bu yana yapılanlar (doğrulandı)

| Yapılan | Doğrulama |
|---|---|
| `/bolum/teftis/` ve `/bolum/hesaplamalar/` sayfaları üretildi | `dist/bolum/` altında ikisi de var. |
| Yazı gövdelerindeki WordPress etiket bağlantıları temizlendi | `src/content/` altında `/tag/` geçen dosya yok. Kırık hedef 110'dan 13'e indi, kırık bağlantılı sayfa 50'den 12'ye. |
| `cdn-cgi/l/email-protection` kalıntısı kaldırıldı | Kaynakta ve çıktıda yok. |
| Unvan maaşı `Article` şemasına tarih, yazar, yayıncı ve görsel eklendi | 422 sayfanın 419'unda yazar ve yayıncı, 343'ünde `datePublished` / `dateModified` var. Tarihsiz 79 sayfa kaldı. Görsel hâlâ ortak `paylasim.png`. |
| Dokuz uygulama dosyası (`/dosyalar/uygulamalar/*.exe`, `.zip`, `.rar`) | Canlı Nginx kaynağından 200 ile sunuluyor (`docs/canli-oneri-servisi.md`). Bugün kırık değil, ama yayın geçişine bağımlı: [P0-3](#p0-yayından-önce-yapılmazsa-yayına-geçilmez). |

### Uygulama durumu (04.11.2026 gece)

Durum değerleri: **Yapıldı** (kodda var, testle ya da taramayla doğrulandı), **Kısmen**, **Açık**. Puan tablosu yeniden ölçülene kadar 04.11 değerinde kalır; yeniden ölçüm için [Ek](#ek-puanlama-ve-yeniden-ölçüm).

| Madde | Durum | Ne yapıldı / ne kaldı |
|---|---|---|
| P0-1 Canlı adresler | Kısmen | Bilinen eşleşmeler `src/data/wp-yonlendirmeler.json` dosyasında. 224 yazı aktarıldı, 47 kişisel veri yazısı 410 için işaretli. Dört araç için karar uygulandı (P1-7). **Kalan:** yayından sonra canlı site haritasının 404 taraması; 410 listesi Cloudflare'de (P0-5). |
| P0-2 Çift adresler | Yapıldı | Astro'daki sürüm ana adres, diğeri yönlendirme sayfası. GSC tıklamaları ters gösterirse üç kural çevrilir. |
| P0-3 Nginx'e bağlı yollar | Açık | Kurallar [cloudflare-yayin-kurallari.md](cloudflare-yayin-kurallari.md) belgesinde. Piper dosyaları da artık `/modeller/piper/` altında bu sunucuda. |
| P0-4 Kırık bağlantılar | Yapıldı | `wp-content` görselleri yerele alındı. `/hatalar/` sayfasındaki `/404/` ve `/500/` bağlantıları bilerek hata durumu döndürür; kırık değildir. Derleme sonunda `scripts/seo-denetim/kirik-baglanti.mjs` çalışır; kırık iç bağlantı derlemeyi durdurur. Nginx'te kalan yollar sayılmaz. |
| P0-5 Gerçek 301 | Açık | Worker taslağı [cloudflare-yayin-kurallari.md](cloudflare-yayin-kurallari.md) belgesinde. |
| P0-6 `lastmod` | Yapıldı | `lastmod` içerikteki gerçek tarihten gelir: araçlarda verinin yürürlük tarihi, DPB görüşünde görüş tarihi, adli çevrede işlenen son HSK kararı, harf ve mülakat liste sayfalarında en yeni kayıt, kategori ve bölüm sayfalarında en yeni içerik. Sözlük, mülakat ve yazılar %100; sayfalar 462/680, maaş 345/422, adli çevre 74/1.007. Kalanların verisinde tarih yok; kabul ölçütü "tarih uydurulmaz" olarak düzeltildi. Gelecek tarihli kayıt yok. |
| P0-7 Mülakat başlıkları | Kısmen | Büyük harfli başlıklar kelime başı büyük yazılır (`buyukHarfDuzelt`; cümle düzeni özel adları bozuyordu). Sonek 65 karaktere göre kısalır. Büyük harfli başlık 0. 65 karakteri aşan 803 başlık kaldı (%36); bunlarda sorunun kendisi uzun ve kural gereği soru metni kesilmez. |
| P1-1 Tazelik | Yapıldı | Araç şemasına veriden gelen `dateModified` eklendi (Layout); sayfada aynı tarih görünür satır olarak yazılır. Teftiş araçları yürürlük tarihi taşımadığı için tarihsizdir. |
| P1-2 Hakkında / profil | Yapıldı | `/gokhan-tasci-profil/` sayfası (`ProfilePage` + `Person`). Organization kaydında `founder`, `description`, `email` ve 512 piksellik PNG logo var. WebSite kaydında `creator` (KickHex). `sameAs` için doğrulanmış dış profil yok. |
| P1-3 Doğrudan yanıt | Yapıldı | Maaş, harç ve hukuk araçlarının başlık bandında ortak veriden üretilmiş tek cümle var (`src/lib/arac-olgulari.ts`, `DogrudanYanit.astro`): güncel katsayılar ya da harç ve vekâlet tutarları. Teftiş araçlarında sayısal yanıt olmadığı için cümle yok. |
| P1-4 SSS ve adımlar | Yapıldı | Bütün hesap araçlarında araca özgü SSS (`FAQPage`) ve numaralı "Hesap nasıl yapılır?" adımları var (`src/lib/arac-olgulari.ts`). Taramada SSS ve adımı olmayan hesap aracı 0. |
| P1-5 Eksik `WebApplication` | Yapıldı | Layout, şeması olmayan araçlara otomatik ekler; hukuk ve teftiş kategorisini `BusinessApplication` yapar. |
| P1-6 Resmî kaynak | Yapıldı | Bütün hesap araçlarında resmî kaynak bağlantısı var (taramada eksik 0). Teftiş araçları dayandıkları kanun maddesine (CMK 174–175, 232/2, 251–252; 5275/4; 657/64; 492; HMK 323) ya da HSK / Teftiş Kurulu sitesine bağlanır. Yazılarda metnin andığı Resmî Gazete sayısı ve kurumlar bağlantıya çevrilir (`src/lib/yazi-kaynaklari.ts`); araç rehberleri anlattıkları aracın kaynağını gösterir. Konudan tahminle kaynak eklenmez. |
| P1-7 Taşınmamış araçlar | Yapıldı | `/iflas-idare-ucreti-hesaplama/` taşındı: 20.12.2025 tarihli ve 33113 sayılı Resmî Gazete'deki 9 dilim (canlıdaki %5/%4/%3 dilimleri tebliğle uyuşmuyordu; bilinçli sapma). `/icra-faiz-hesaplama/` ve `/icra-kapak-hesabi/` kanuni faizi hesaplayan `/faiz-hesaplama/` adresine, canlıda boş olan `/sinav-yap/` `/cikmis-mulakat-sorulari/` adresine yönlenir. |
| P2-2 Açıklamalar | Kısmen | Sözlük açıklamaları en az 70 karakter. Adli çevre ve DPB açık. |
| P2-5 Koyu tema kontrastı | Yapıldı | Yeşil token koyu temada `#7fd0a5`. |
| P2-6 Tablo anlamı | Kısmen | Teftiş kayıt tabloları yatay kaydırmasız; dar ekranda etiketli kart. Yazı gövdesi tabloları açık. |
| P2-7 `llms-full.txt` ve snippet | Yapıldı | `/llms-full.txt` ortak veriden üretilir. Robots meta etiketinde `max-image-preview:large, max-snippet:-1` var. |
| P2-1 İnce içerik | Yapıldı (karar: zenginleştirme) | Sözlük ve mülakat sayfalarında çapraz bağ, "Benzer terimler" ve "Benzer sorular" (nadirlik ağırlıklı ortak kelime). 150 kelimeden kısa sayfa oranı %4,7. Kademeli noindex GSC verisi gelmeden uygulanmaz. |
| P2-3 Paylaşım görseli | Yapıldı | Derleme sonunda 7.152 sayfaya başlık ve bölüm yazılı 1200×630 görsel (`scripts/og-gorselleri.mjs`). Varsayılan görselli dizinlenebilir sayfa 1. |
| P2-8 `Dataset` | Yapıldı | Katsayı arşivi, AAÜT ve CMK tarife sayfalarında `Dataset` (dönem, resmî kaynaklar, `dateModified` son kaydın yürürlük tarihi). |
| P2-4 Ağır sayfalar | Açık | 12 sayfanın HTML'i 200 KB'ı aşıyor. |

**04.11 döngüsü (1. tur):**

- **İlgili araçlar:** "Şunlara da bakabilirsiniz" bölümü bütün araç sayfalarında (`src/data/ilgili-araclar.json`). Örneğin enflasyon sayfası kadrolu, sözleşmeli ve emekli maaşına bağlanır.
- **Sırlar:** Depoda anahtar ya da parola yok. Kaynak sunucunun IP'si iki betikten kaldırıldı; betikler adresi sunucuda çalışma anında buluyor. IP'nin girdiği yerel commit (`3cbb940`) yayından önce geçmişten temizlenecek.
- **Haberler:** Haberler artık birikiyor (kaynak başına 40 haber, son bir yıl). Haber sayısı 70'ten 109'a çıktı.
- **Analitik:** GTM ve GA yalnız `657.com.tr` alan adında yükleniyor.
- **Öneri formu:** Yerel önizlemede neden çalışmadığını açıklıyor.
- **Tasarım tutarlılığı testi:** 29 şablon × 2 genişlik × 2 tema (`tests/tasarim-tutarlilik.spec.ts`).

**04.11 döngüsü (2. tur):**

- **Puan formülü:** Puan artık `scripts/seo-denetim/puan.mjs` ile formülden hesaplanıyor. Her ölçütün formülü çıktıda yazıyor.
  - Önceki elle verilmiş puanlarla doğrudan karşılaştırılamaz.
  - Son ölçüm: SEO 89,7 · AIO 97,8 · GEO 79,8 · AEO 79,3 · genel 86,8.
- **P0-1 yazılar:** 224 yazı aktarıldı (`scripts/canli-eksik-yazilari-aktar.py`, rapor `docs/seo-yazi-aktarimi.json`).
  - 47 kişisel içerikli yazı 410 için işaretlendi.
  - 21 kopya ve 14 boş ya da mülakat kaydı asıl adrese yönlendirildi.
  - Gövdelerdeki 237 kırık bağlantı düzeltildi; düzeltme kuralları kalıcı ve tekrar çalıştırılabilir (`scripts/yazi-baglantilarini-duzelt.py`).
- **Tekrarlanan başlıklar ve açıklamalar:**
  - Aynı başlıklı yazılar tarihle, aynı yazılışlı sözlük terimleri anlam numarasıyla ayrışıyor.
  - DPB kopyaları `noindex` aldı.
  - 65 karakteri aşan `<title>` kısaltılıyor; `h1` ve `og:title` tam kalıyor.
  - Mülakat, adli çevre ve DPB açıklama şablonları yenilendi.
- **İnce içerik:** Sözlük terimi ile mülakat sorusu arasında çapraz bağ var (`src/lib/capraz.ts`).
- **Araç olguları:** Doğrudan yanıt, SSS ve "Hesap nasıl yapılır?" adımları aracın kendi kuralına göre veriliyor.
  - Harç cümlesi yalnız harç ve vekâlet hesaplayan araçlarda.
  - Kesinleşme kendi CMK kuralıyla.
- **Tablo anlamı:** Yazı ve şablon tablolarında `scope` işaretlemesi; makine okunabilirlik %36'dan %98'e.
- **Lighthouse (29 şablon, mobil + masaüstü):**
  - Ortalamalar performans 98, erişilebilirlik 96, en iyi uygulama 99,4, SEO 100.
  - Bulunan sorunlar düzeltildi: alt bilgi bağlantı ayrımı, düğme erişilebilir adları, kontrast, `aria` hatası, yerel CORS konsol hataları, bayrak görseli (WebP ve tembel yükleme), teftiş `iframe`'inin tembel yüklenmesi, mülakat ilk kartının derlemede basılması.

Bu turdaki diğer işler:

- **Paylaşılabilir hesap adresleri:** 61 araçta seçimler okunur yola yazılır, başlık seçime göre değişir.
- **Birleşik arama:** araç araması adli çevre, sözlük, mülakat ve DPB görüşlerini de kapsar.
- **Piper:** sesli okuma dosyaları kendi sunucumuzdan sunulur.
- **Tasarım:** 37 sayfa ortak başlık bandına alındı.

## Kapsam ve yöntem

- **Statik tarama:** `dist/` altındaki 17.628 HTML dosyasının tamamı tarandı. Bakılanlar: başlık, açıklama, canonical, robots, OG/Twitter, JSON-LD, başlık hiyerarşisi, görseller, iç ve dış bağlantılar, kelime sayısı, tablo, liste ve tarih öğeleri. Tarama yalnızca okur.
- **Site dosyaları:** `sitemap.xml` ve 6 grup site haritası, `robots.txt`, `llms.txt`, `feed.xml`.
- **Canlı site haritası:** `https://657.com.tr/sitemap_index.xml` altındaki 15 site haritası (8.844 adres) indirildi ve `dist/` ile karşılaştırıldı. Canlıya yalnızca okuma isteği gönderildi.
- **Lighthouse (mobil):** anasayfa ve `/memur-maas-hesaplama/`.
- **Performans izi:** `/memur-maas-hesaplama/` için 4 kat CPU yavaşlatma ve Fast 4G ağıyla.
- **Elle okuma:** mülakat, sözlük, adli çevre, unvan maaşı, DPB görüşü ve yazı örnekleri.

| Sayfa sınıfı | Adet |
|---|---|
| Toplam HTML | 17.628 |
| İndekslenebilir (site haritasında) | **6.946** |
| Eski adres yönlendirmesi (meta-refresh + noindex + canonical) | 10.523 |
| HTTP hata sayfası (`/4xx.html`, `/5xx.html`) | 48 |
| Diğer noindex | 111 |

| Site haritası grubu | Sayfa | Ortanca kelime | 150 kelimeden kısa |
|---|---|---|---|
| sozluk (`/kelime/…`, harf dizinleri) | 2.512 | 151 | 1.176 (%47) |
| mulakat (soru ve liste sayfaları) | 2.241 | 153 | 972 (%43) |
| adlicevre | 1.007 | 176 | 3 |
| sayfalar (araçlar, DPB görüşleri, kurumsal) | 679 | 471 | 29 |
| maas (unvan maaşı) | 422 | 376 | 0 |
| yazilar | 85 | 386 | 22 |

---

## 1. SEO · 72 / 100

| Ölçüt | Ağırlık | Puan | Kanıt |
|---|---|---|---|
| Taranabilirlik, indeks ve adres korunması | 15 | 6 | **Olumlu:** 6.946 indekslenebilir sayfanın hepsi site haritasında; site haritasında noindex sayfa ve olmayan adres yok. Canonical her sayfada var ve sayfanın kendisini gösteriyor. 10.523 eski adresin hepsi noindex + canonical taşıyor. **Olumsuz:** canlı 8.844 adresin 2.924'ü çıktıda yok ([§5](#5-canlı-adreslerle-eşleşme)). Site haritasında 2.149 adreste `lastmod` yok. Yönlendirmeler HTTP 301 değil, meta-refresh. |
| Başlık etiketi | 10 | 6 | Başlıksız sayfa yok, 10 başlık tekrar ediyor. 2.521 başlık 65 karakteri aşıyor; mülakatta 1.909, sayfalar grubunda 578. Mülakattaki 1.132 başlık tamamen BÜYÜK HARF. |
| Meta açıklama | 8 | 6 | Açıklamasız sayfa yok. 334 açıklama tekrar ediyor. 2.860 açıklama 70 karakterden kısa (sözlükte 1.683, ortanca 46 karakter; mülakatta 1.157). 410 açıklama 160 karakteri aşıyor. |
| Başlık hiyerarşisi | 7 | 10 | Her sayfada tek `h1` var, sıra atlayan yalnızca 5 sayfa var. `lang="tr"` her sayfada. |
| Yapılandırılmış veri | 12 | 8 | JSON-LD hatasız ayrıştırılıyor; Organization, WebSite, WebPage ve BreadcrumbList grafiği tam. Unvan maaşı `Article` şeması düzeltildi. Eksikler: taşınan 81 aracın 26'sında `WebApplication` yok; hukuk ve teftiş araçlarında `applicationCategory: FinanceApplication` yanlış. |
| İç bağlantı | 10 | 9 | Yetim sayfa yok. 13 kırık hedef kaldı: 9 indirme dosyası (canlı kaynağa bağımlı), `/hatalar/` sayfasından `/404/` ve `/500/` (bu yollarda dosya yok, `404.html` var), `/ptt-uets-ucret-tarifesi-guncellemesi-yayimladi/` içinde `/wp-content/uploads/2026/06/image.png`, teftiş uygulamasından `https://657.com.tr/denetimtutanagi.docx` (canlı kaynağa bağımlı). |
| Performans | 12 | 8 | `/memur-maas-hesaplama/`: LCP 1,28 sn, CLS 0,05. Anasayfa CLS 0,09. 11 sayfanın HTML'i 200 KB'ı aşıyor; maaş aracı 1,34 MB (gömülü JSON, sıkıştırılmış hâli yaklaşık 70 KB). Render engelleyen CSS'in maliyeti yaklaşık 143 ms. |
| Mobil ve erişilebilirlik | 8 | 9 | Lighthouse erişilebilirlik: anasayfa 100, maaş aracı 97. Koyu temada `tr.maas-gelir > th` yeşili 3,1:1 kontrastta (gereken 4,5:1). |
| Sosyal paylaşım | 5 | 6 | OG ve Twitter etiketleri her sayfada tam, ama 6.946 sayfanın 6.931'i aynı `paylasim.png` görselini kullanıyor. |
| İçerik kalitesi | 13 | 5 | Sözlük ve mülakatta yaklaşık 2.150 sayfa 150 kelimenin altında ve çok benzer kalıpta (ör. "01 ile 81 hangi illerin plakasıdır? → Adana – Düzce"). Google'ın ölçekli içerik ve faydalı içerik değerlendirmeleri için risk. |

**Ölçülüp sorun olmadığı görülenler** (ileride boşuna iş açılmasın diye):

- 354 görselde `alt` değeri boş, ama bunların tamamı yazı kartlarındaki süs görselleri ve başlıkları hemen yanında duruyor. Boş `alt` burada doğru kullanım.
- Arayüz simgeleri ([Icon.astro](../src/components/Icon.astro)) `aria-hidden="true"` taşıyor.
- Sözlükte her terim `<dfn>` ve `DefinedTerm` ile işaretli.

---

## 2. AIO · 78 / 100

| Ölçüt | Ağırlık | Puan | Kanıt |
|---|---|---|---|
| Yapay zekâ tarayıcılarının erişimi | 20 | 8 | `robots.txt` herkese açık, yalnızca `/modeller/` ve `/api/` kapalı; GPTBot, ClaudeBot, PerplexityBot ve Google-Extended için engel yok. `llms.txt` (14,5 KB) güncel katsayıları resmî genelge bağlantısıyla veriyor. `llms-full.txt` yok. Cloudflare'in yapay zekâ botu engelleme ayarı yayında doğrulanmalı. |
| İçeriğin sunucuda üretilmesi | 20 | 10 | Hesap sonuçları derlemede üretiliyor; betik çalışmasa da maaş, katsayı ve döküm HTML'de duruyor. JavaScript çalıştırmayan tarayıcılar için en güçlü taraf. |
| Varlık tanımı | 15 | 7 | `@id` ile bağlı bir Organization grafiği var. Organization'da `description`, `sameAs`, `founder` ve `contactPoint` yok; logo SVG (Google en az 112 piksellik PNG ya da JPG ister). Canlıdaki `/gokhan-tasci-profil/` sayfası taşınmamış ([§5](#5-canlı-adreslerle-eşleşme)). |
| Tazelik sinyali | 20 | 5 | Tarih var: 85 yazı, 343 unvan maaşı sayfası. Tarih yok: araçlar, adli çevre, mülakat, sözlük. Site haritasında 2.149 adreste `lastmod` yok. |
| Snippet izinleri | 10 | 9 | Kısıtlayıcı bir robots meta etiketi yok. `max-image-preview:large` açıkça verilmemiş. |
| Makinenin okuyabileceği veri | 15 | 8 | Çıktıda 1.435 tablo var: 521'inde `th scope="col"`, 422'sinde `<caption>` var (hepsi unvan maaşı), 11'inde hiç `th` yok. Yazı gövdesindeki tablolar çoğunlukla başlıksız. Katsayı arşivi ve tarifelerde `Dataset` şeması yok. |

---

## 3. GEO · 56 / 100

| Ölçüt | Ağırlık | Puan | Kanıt |
|---|---|---|---|
| Kaynak ve atıf gösterme | 25 | 5 | Resmî kaynağa (`gov.tr`, Resmî Gazete, HMB, HSK vb.) bağlantı veren sayfa oranı: sayfalar %91, unvan maaşı %73, yazılar %42, adli çevre %11, mülakat %0, sözlük %0. Taşınan 81 aracın 42'si resmî kaynak bağlantısı vermiyor. |
| Uzmanlık ve güven (E-E-A-T) | 20 | 4 | Yazar bilgisi 85 yazıda ve 419 unvan sayfasında var; ama bu yazar yalnızca kurum (`#kurulus`), bir kişi değil. Hakkında ya da künye sayfası yok; canlıdaki profil sayfası taşınmamış. Hesap yöntemini tek yerde toplayan, bağlantı verilebilir bir sayfa yok. |
| Alıntılanabilir olgu | 15 | 8 | Metinler somut sayı taşıyor ("Güncel tebligat ücreti 300,00 TL", "Memur aylık katsayısı 1,575512"). `llms.txt` aynı olguları kaynaklarıyla tekrar ediyor. |
| Özgünlük ve derinlik | 15 | 6 | Hesap araçları, teftiş kontrolleri ve adli çevre veritabanı özgün. Mülakat ve sözlük sayfaları kısa ve başka sitelerde de yaygın. |
| Tazelik | 15 | 5 | AIO'daki tazelik durumunun aynısı. |
| Marka ve varlık tutarlılığı | 10 | 7 | Marka adı her yerde aynı. Dış profillere bağlantı (`sameAs`) yok. |

---

## 4. AEO · 57 / 100

| Ölçüt | Ağırlık | Puan | Kanıt |
|---|---|---|---|
| Soru biçimli içerik | 20 | 6 | 2.241 mülakat sayfasının başlığı soru; sözlükte "X ne demek?" kalıbı var. Taşınan 81 aracın 78'inde soru biçimli ara başlık yok. |
| İlk paragrafta doğrudan yanıt | 25 | 5 | Sözlük ve mülakatta yanıt başlığın hemen altında, ama araya okunma sayısı ve sesli okuma kontrolleri giriyor. Araçlarda başlığın altında sayı içeren tek cümlelik bir yanıt yok; form hemen başlıyor. Anasayfanın ilk metni döviz kuru şeridi. |
| FAQ ve soru şeması | 15 | 6 | `FAQPage` 3.228 sayfada var: 2.219 mülakat, 1.004 adli çevre, 5 araç. Google bu zengin sonucu 2023'ten beri yalnızca resmî ve sağlık sitelerinde gösteriyor, yani görsel kazanç beklenmemeli; yine de motorların ayrıştırmasına yardım ediyor. Araçlarda SSS bölümü yok. |
| Tablo ve liste | 15 | 8 | Unvan maaşı, döküm, tarife ve adli çevre içerikleri tablo ve listeyle yapılandırılmış. |
| Adım adım anlatım | 15 | 4 | "Nasıl hesaplanır" sorusunu numaralı adımlarla anlatan araç yok. |
| Kısa özet | 10 | 5 | Sayfaların başında 40-60 kelimelik bir özet bloğu yok. |

---

## 5. Canlı adreslerle eşleşme

Bu karşılaştırmanın kaynağı canlı `sitemap_index.xml` (15 site haritası, 8.844 adres). Her adresin `dist/` içinde bir sayfası ya da yönlendirme sayfası olup olmadığına bakıldı. Eksik adreslerin tam listesi: [seo-canli-eksik-adresler.json](seo-canli-eksik-adresler.json).

| Canlı site haritası | Adres | Sayfa var | Yönlendirme var | **Eksik** |
|---|---|---|---|---|
| post (yazılar ve mülakat) | 2.690 | 2.371 | 2 | **317** |
| post_tag (etiketler) | 2.547 | 0 | 0 | **2.547** |
| kelimeler (sözlük) | 2.491 | 2.490 | 0 | **1** |
| adlicevre | 1.013 | 1.008 | 5 | 0 |
| page (sayfalar) | 47 | 39 | 0 | **8** |
| category (kategoriler) | 38 | 0 | 0 | **38** |
| teftis-pages | 17 | 5 | 0 | **12** |
| author | 1 | 0 | 0 | **1** |

Eksik adresler beş gruba ayrılıyor:

- **317 yazı.**
  - 11'i kişisel veri (ad, sicil, görev yeri listesi) içerdiği için bilinçli olarak kaldırılmış (`src/data/yazi-aktarim-denetimi.json → yayindanKaldirilan`).
  - Kalan yaklaşık 306'sı henüz taşınmamış: enflasyon açıklamaları, tarifeler (`/bilirkisi-ucret-tarifesi/`, `/hmk-gider-avansi-tarifesi/`, `/hmk-hakem-ucret-tarifesi/`), bedelli askerlik, mahkeme kuruluşları, AYM kararları. 41'i soru kalıbında; bunların çoğu mevcut mülakat sayfalarının `-2` kopyası olabilir.
- **8 sayfa.**
  - Canlıda olup Astro'da hiç olmayan araçlar: `/icra-faiz-hesaplama/`, `/icra-kapak-hesabi/`, `/iflas-idare-ucreti-hesaplama/`, `/sinav-yap/`.
  - Çift adres: `/tapu-harci-hesaplama/`, `/konsolosluk-sorgulama/` ve `/nufus-analiz-sistemi-bosanma-karari-hazirla-2/`. Canlıda hem bu adresler hem diğer sürümleri ayrı ayrı canonical, Astro'da yalnızca birer sürüm var.
  - Profil: `/gokhan-tasci-profil/`.
- **12 teftiş ve hukuk sayfası.** `/hukuk-mahkemeleri/tam-kabul/` gibi 10 alt sayfa, `/bolum/maas-islemleri/` ve `/yazılar/`. Hepsinin Astro'da karşılığı var, ama başka adreste.
- **2.547 etiket, 38 kategori, 1 yazar arşivi.** Astro bunları üretmiyor. İnce arşiv sayfaları olduğu için silinmeleri kabul edilebilir, ama aranıyorlarsa yönlendirilmeleri gerekir.
- **1 sözlük terimi.** `/kelime/arazi-i-mezrua-ne-demek/`.

---

## 6. Yol haritası

Her maddenin "Kabul" sütunu, işin bittiğini neyin kanıtlayacağını söyler. Tarama ölçütleri `node scripts/seo-denetim/tara.mjs dist <çıktı.json>` ve `ozet.mjs` ile denetlenir.

### P0: yayından önce (yapılmazsa yayına geçilmez)

| # | İş | Ayrıntı | Kabul |
|---|---|---|---|
| 1 | **Canlı adreslerin hiçbiri boşa düşmesin** | [seo-canli-eksik-adresler.json](seo-canli-eksik-adresler.json) içindeki her adres için üç yoldan biri seçilir: **(a)** sayfa taşınır (306 yazı ve 4 araç için öncelik GSC tıklamasına göre); **(b)** 301 ile en yakın sayfaya yönlendirilir; **(c)** bilinçli olarak 410 verilir (kişisel veri içeren 11 yazı). Bilinen eşleşmeler aşağıdaki tabloda. | Eksik listedeki her adres için karar dosyaya işlenmiş. Yayından sonra canlı site haritası adreslerinin hiçbiri 404 dönmüyor. |
| 2 | **Çift adresler** | `/tapu-harci-hesaplama/` ile `-2`, `/konsolosluk-sorgulama/` ile `-2`, `/nufus-analiz-sistemi-bosanma-karari-hazirla/` ile `-2`. Canlıda ikisi de kendine canonical. GSC'de tıklaması fazla olan adres ana adres olur, diğeri ona 301 ile yönlendirilir. | Her çiftte tek adres 200 dönüyor, diğeri 301. |
| 3 | **Canlı Nginx kaynağına bağlı yollar** | DNS GitHub Pages'e geçince şu yollar bugünkü sunucuya ulaşamaz: `/dosyalar/uygulamalar/*` (9 indirme), `/_657-servis/*` (öneri, okunma ve indirme sayacı), `/modeller/*` (asistan modelleri) ve `/denetimtutanagi.docx`. Cloudflare'de bu yollar Origin Rule ya da Worker ile eski sunucuya yönlendirilmeli. | Geçişten sonra bu yollar 200 (dosya) ya da beklenen API yanıtını veriyor; tara.mjs'deki 9 indirme ve `.docx` kırığı canlıda doğrulanmış. |
| 4 | **Kalan kırık bağlantılar** | `/hatalar/` sayfasından `/404/` ve `/500/` bağlantıları düzeltilir. `/ptt-uets-ucret-tarifesi-guncellemesi-yayimladi/` içindeki `wp-content` görseli yerel kopyaya bağlanır. Tarama Playwright testine çevrilir; yeni bir kırık derlemeyi durdurur. | `kirik` yalnızca P0-3'teki 10 hedefi içeriyor; test var. |
| 5 | **Gerçek 301 yönlendirmeleri** | 10.523 meta-refresh sayfası ve P0-1'deki 301'ler Cloudflare'de desen kurallarıyla kurulur: `/kelimeler/*` → `/kelime/*`, `/sozlukyeni/*`, `/posts/*`, `/tag/*`, `/category/*`. Liste tabanlı toplu yönlendirmenin planın sınırına sığıp sığmadığı ayrıca kontrol edilmeli. Meta-refresh sayfaları yedek olarak kalabilir. | Örnek 20 eski adres canlıda 301 ve doğru hedef döndürüyor. |
| 6 | **Site haritasında `lastmod`** | [sitemap-[grup].xml.ts](../src/pages/sitemap-[grup].xml.ts) sayfalar ve maaş gruplarında da `lastmod` versin. Araçlarda tarih, hesapladığı katsayı ya da tarife döneminin başlangıcından gelir; derleme tarihi kullanılmaz (CLAUDE.md). | `lastmodYok` = 0. |
| 7 | **Mülakat başlıkları** | [SoruSayfasi.astro:26](../src/components/SoruSayfasi.astro#L26) içinde soru cümle düzenine çevrilir (`toLocaleLowerCase('tr-TR')` ve ilk harf büyük); ` \| Çıkmış mülakat soruları` soneki kısaltılır ya da 65 karakteri aşan başlıklarda düşürülür. `<h1>` metni aynı kalabilir. | Mülakatta 65 karakteri aşan başlık oranı %10'un altında, büyük harfli başlık 0. |

**P0-1 için bilinen eşleşmeler:**

| Canlı adres | Önerilen hedef |
|---|---|
| `/hukuk-mahkemeleri/tam-kabul/` | `/tam-kabul-hesaplama/` |
| `/hukuk-mahkemeleri/kismen-kabul-kismen-red/` | `/kismen-kabul-hesaplama/` |
| `/hukuk-mahkemeleri/red-subut-bulmadigindan/` | `/davanin-reddi-hesaplama/` |
| `/hukuk-mahkemeleri/husumet-on-sart-nedeniyle-red/` | `/husumet-dava-sarti-hesaplama/` |
| `/hukuk-mahkemeleri/acilmamis-sayilmasina/` | `/acilmamis-sayilma-hesaplama/` |
| `/hukuk-mahkemeleri/feragat-sulh-kabul-konusuz-kalma/` | `/feragat-hesaplama/` (sulh için `/sulh-hesaplama/` da var) |
| `/hukuk-mahkemeleri/istinaf-islah-harci/` | `/islah-harci-hesaplama/` ya da `/istinaf-temyiz-harci-hesaplama/` |
| `/hukuk-mahkemeleri/kasa-hesabi/` | `/adliye-kasa-hesabi/` |
| `/hukuk-mahkemeleri/paylasim-hesabi/` | `/yargilama-gideri-paylasim-hesabi/` |
| `/hukuk-mahkemeleri/posta-kodu-ile-dis-temsilci-arama/` | `/almanya-posta-kodu-konsolosluk/` |
| `/bolum/maas-islemleri/` | `/araclar/#maas` ya da yeni bir `/bolum/maas/` |
| `/yazılar/` | `/yazilar/` |
| `/gokhan-tasci-profil/` | Taşınır ve P1-2'deki hakkında sayfasının temeli olur. |
| `/tag/*` | `/yazilar/?q=<etiket>` ya da 410 |
| `/category/*` | `/yazilar/` altında ilgili konu, yoksa `/yazilar/` |
| `/author/gokhan/` | `/gokhan-tasci-profil/` |

### P1: ilk ay

| # | İş | Ayrıntı | Kabul |
|---|---|---|---|
| 1 | **Tazelik sinyali** | Bütün araç sayfalarının `WebApplication` / `WebPage` kaydına `dateModified` eklenir; değer `getKatsayilar` döneminden ya da tarife tarihinden gelir. Sayfada "Son güncelleme: gg.aa.yyyy" satırı görünür. Tarihsiz kalan 79 unvan maaşı sayfası da tamamlanır. | Araçlarda ve unvan maaşında `dateModified` %100. |
| 2 | **Hakkında, profil ve yöntem** | `/gokhan-tasci-profil/` taşınır ya da `/hakkinda/` açılır: siteyi kimin hazırladığı, adliye deneyimi, hesapların hangi resmî kaynakla doğrulandığı (`docs/maas-saglama.md` özeti), hata bildirimi. Organization kaydına `founder` (Person, profil sayfasına bağlı), `description`, `email`, `sameAs` ve PNG `logo` eklenir ([Layout.astro:112](../src/layouts/Layout.astro#L112)). Araçlarda yazar olarak bu Person gösterilir. | Profil sayfası yayında; Organization grafiğinde `founder` ve `sameAs` var. |
| 3 | **Araçlarda doğrudan yanıt** | Her aracın başlığının altına 1-2 cümlelik, sayı içeren bir özet eklenir. Özet derleme anında hesap motorundan ve `ayarlar.json`'dan üretilir, **asla elle yazılmaz**. Örnekler: "01.07.2026 – 31.12.2026 döneminde memur aylık katsayısı 1,575512, taban aylık katsayısı 25,794915'tir." ve "Güncel tebligat ücreti 300,00 TL'dir." | 81 aracın hepsinde, `<main>` içinde formdan önce, sayı içeren bir özet paragrafı var. |
| 4 | **SSS ve adım listesi** | Her araca 3-5 soru-cevap ("… nasıl hesaplanır?", "… neden bordrodan farklı çıkar?") ve numaralı hesap adımları eklenir. Kaynak mevcut "Hesap hakkında" metinleridir. `FAQPage` şeması isteğe bağlıdır. | Soru biçimli başlığı olmayan araç sayısı 78'den 0'a. |
| 5 | **Eksik `WebApplication`** | 23 araç: `/terficetveli/`, `/karar/`, `/istinaf/`, `/durusmakacagi/`, `/byu/`, `/byu-uygulanan-dosyalar/`, `/kanunyolu/`, `/kesinlestirme/`, `/yargilama-gideri-kontrolu/`, `/kalem-denetimi/`, `/harctahsilkontrol/`, `/kesinlesmek/`, `/jrobot/`, `/hukuk-mahkemeleri/`, `/nufus-analiz-sistemi-bosanma-karari-hazirla/`, `/konsolosluk-sorgulama-2/`, `/asgari-ucret-istisna-oranlari/`, `/dava-acma-masraflari/`, `/yillik-izin-hesaplama/`, `/infaz-ve-koruma-memuru-boy-kilo-hesaplama/`, `/almanya-posta-kodu-konsolosluk/`, `/avukatlik-asgari-ucret-tarifesi/`, `/cmk-avukatlik-asgari-ucret-tarifesi/`. Hukuk ve teftiş araçlarında `applicationCategory` değeri `BusinessApplication` yapılır. | Taşınan her araçta `WebApplication` var. |
| 6 | **Resmî kaynak bağlantısı** | Kaynak göstermeyen 42 araca dayandığı mevzuat ya da tarifenin bağlantısı eklenir; Resmî Gazete ya da mevzuat.gov.tr tercih edilir. `ayarlar.json → kaynak` alanı sayfada görünür. | Resmî kaynak bağlantısı olmayan araç sayısı 42'den 0'a. |
| 7 | **Taşınmamış araçlar** | `/icra-faiz-hesaplama/`, `/icra-kapak-hesabi/`, `/iflas-idare-ucreti-hesaplama/`, `/sinav-yap/` ya taşınır ya da P0-1'deki gibi en yakın araca yönlendirilir. | Dördü için karar uygulanmış. |

### P2: sonra

| # | İş | Ayrıntı | Kabul |
|---|---|---|---|
| 1 | **İnce içerik** | Yaklaşık 2.150 kısa sözlük ve mülakat sayfası için iki yol var. Önerilen: zenginleştirme (ilgili mevzuat maddesi, örnek cümle, ilgili terim ve soru bağlantıları). Diğeri: okunması düşük ve 80 kelimenin altındaki kayıtlarda kademeli noindex. Bu bir içerik kararıdır, GSC verisi olmadan uygulanmaz. | Karar ve eşik bu belgeye işlenmiş. |
| 2 | **Açıklama şablonları** | Sözlük açıklaması en az 70 karakterlik bir kalıba oturtulur. Adli çevrede yer adı başa alınır ve tekrar eden karar metni kısaltılır. DPB ve araç açıklamalarında 160 karakter sınırı uygulanır. | Kısa açıklama < %10, tekrar eden açıklama < 50. |
| 3 | **Sayfaya özel paylaşım görseli** | Araçlar, yazılar ve unvan maaşı için derlemede başlık ve dönem yazılı OG görseli üretilir. | Varsayılan görselli sayfa oranı %50'nin altında. |
| 4 | **Ağır sayfalar ve CLS** | Maaş, emekli, sözleşmeli, asistan ve yolluk sayfalarındaki gömülü JSON tembel yüklenen ayrı uç noktaya taşınır; derlemedeki sonuç HTML'de kalır. Anasayfadaki 0,09 CLS'nin kaynağı (haber ya da geri sayım şeridi) için yer ayrılır. | 200 KB'ı aşan HTML yok; anasayfa CLS < 0,05. |
| 5 | **Koyu tema kontrastı** | `tr.maas-gelir > th` yeşili koyu temada `--color-green` token'ıyla 4,5:1'e çıkarılır. | Lighthouse erişilebilirlik iki sayfada da 100. |
| 6 | **Tablo anlamı** | Yazı gövdesindeki tablolara (WordPress'ten gelen yaklaşık 900 tablo) `th scope="col"` eklenir; mümkün olanlara `<caption>` verilir. `th` hiç olmayan 11 tablo düzeltilir. | `scope="col"` olmayan tablo < %10. |
| 7 | **`llms-full.txt` ve snippet izni** | Araçların "Hesap hakkında" metinleri, güncel katsayılar (`guncelKatsayilar()` ile) ve tarifeler tek düz metinde toplanır. Robots meta etiketine `max-image-preview:large` eklenir. | `/llms-full.txt` yayında. |
| 8 | **`Dataset` şeması** | Katsayı arşivi (`/memur-maas-katsayilari/`) ve tarife tablolarına `Dataset` kaydı eklenir: kaynak, dönem ve lisans. | İlgili sayfalarda `Dataset` var. |

Tahmin: P0 ve P1 tamamlanırsa SEO yaklaşık 84'e, AIO 86'ya, GEO 68'e, AEO 72'ye, genel puan yaklaşık 78'e çıkar. GEO'yu daha yukarı taşıyacak olan, P2-1'deki içerik kararı ve sitenin dışarıda anılmasıdır (bağlantı ve marka anılması).

---

## 7. Diğer raporun doğrulanması

`docs/seo-aio-geo-aeo-denetim-raporu.md` belgesindeki her iddia ölçümle karşılaştırıldı.

| O raporda | Durum | Gerekçe |
|---|---|---|
| Puanlar 94 / 88 / 92 / 90, hedef "100/100 kusursuz" | **Yanlış** | Bir taramaya ya da ölçüme dayanmıyor. 100/100 hedefi de ölçülebilir bir kabul ölçütü değil. |
| "LCP < 1,0 sn, CLS = 0" | **Yanlış** | Ölçülen: maaş aracında LCP 1,28 sn ve CLS 0,05, anasayfada CLS 0,09. |
| Kapsam: 1.012 adli çevre, 76 unvan maaşı, 51 yazı | **Yanlış** | Çıktıda 1.007 adli çevre sayfası (+5 yönlendirme), 422 unvan maaşı sayfası, 85 yazı var. |
| Anasayfada görünür `h1` | Düşük öncelik | Görsel olarak gizli tek bir `h1` SEO sorunu değil. Görünür başlık, anasayfa tasarımı seçilince o tasarımın parçası olarak ele alınır. "B · Hizmet portalı" tasarımı henüz seçilmedi. |
| Simgelere `aria-hidden` | **Zaten yapılmış** | [Icon.astro](../src/components/Icon.astro) bütün simgelere `aria-hidden="true"` veriyor. |
| BreadcrumbList bütün sayfalarda | Doğru, zaten var | Anasayfa dışındaki her sayfada var. |
| `llms-full.txt` | Doğru, P2-7'de | Ama o rapordaki örnek kod `ayarlar.donemler[0]` okuyor. Bu, CLAUDE.md'deki "katsayı `getKatsayilar` / `guncelKatsayilar` ile okunur" kuralına aykırı ve dönem sırası değişince yanlış katsayı yayımlar. Ayrıca içerik olarak anahtar kelime listesi değil, hesap yöntemi konmalı. |
| `robots.txt`'ye her bot için ayrı `Allow` grubu | **Uygulanmamalı, zararlı** | Robots standardında (RFC 9309) bir tarayıcı kendi adıyla eşleşen bir grup bulursa `User-agent: *` grubunu tamamen yok sayar. Önerilen dosya GPTBot, ClaudeBot ve diğerleri için `/modeller/` (357 MB model dosyası) ve `/api/` yasağını kaldırır. Google-Extended ve Applebot-Extended birer tarayıcı değil, kullanım izni belirteci; izin zaten varsayılan. Mevcut `robots.txt` doğrudur. |
| Alıntılanabilir özet cümlesi | Doğru, P1-3'te | Ama o rapordaki örnek cümle **yanlış**: "taban aylık katsayısı 1,170243" yazıyor. 01.07.2026 – 31.12.2026 dönemi için doğrusu taban aylık 25,794915, memur aylık 1,575512 (`llms.txt`, HMB genelgesi). Bu yüzden P1-3'te özetin elle yazılmaması, hesap motorundan üretilmesi şartı konuldu. Kesinleşme örneği de HMK'ya dayanıyor; oysa `/kesinlesme/` aracı ceza kararları (CMK) içindir. |
| Tablolarda `caption` ve `scope` | Kısmen doğru, P2-6'da | Unvan maaşı ve döküm tabloları zaten işaretli. Eksik olan, yazı gövdesindeki WordPress tabloları. İlk denetimde ölçülmemişti, bu sürümde eklendi. |
| `SpeakableSpecification` | **Düşük değer** | Google'da hâlâ beta ve yalnızca İngilizce (ABD) haber yayıncıları için geçerli. Türkçe bir araç sitesinde etkisi yok. Yol haritasına alınmadı. |
| 25-45 kelimelik doğrudan yanıt | Kısmen | Araçlar için P1-3 aynı amaca hizmet ediyor. Mülakat ve sözlükteki kısa yanıtları yapay olarak uzatmak ince içerik sorununu çözmez; çözüm P2-1'dir. |
| Piper sesli okuma bir AEO kazancı | **Yanlış** | Yanıt motorları ve sesli asistanlar sayfadaki ses motorunu kullanmaz. Erişilebilirlik için değerli, ama AEO puanına katkısı yok. |

İlk denetimde gözden kaçan ve bu sürümde eklenenler: canlı adres eşleşmesi (§5, P0-1, P0-2, P1-7), canlı Nginx kaynağına bağımlı yollar (P0-3), `/hatalar/` ve `wp-content` kırıkları (P0-4), yazı tablolarının anlamı (P2-6), canlıdaki profil sayfası (P1-2). Ayrıca "354 görselde `alt` eksik" sonucu, boş `alt` değerinin doğru kullanıldığı süs görsellerinden geldiği için sorun listesine alınmadı.

## 8. Yapılmaması gerekenler

- Bot başına ayrı `robots.txt` grubu açmak (gerekçe §7'de).
- `dateModified` ya da `lastmod` için derleme tarihini kullanmak. Her derlemede bütün sayfalar "değişmiş" görünür; motorlar bu sinyale güvenmeyi bırakır (CLAUDE.md'deki derleme tarihi kuralıyla da çelişir).
- Sayı içeren özet, SSS ya da `llms.txt` cümlelerini elle yazmak. Katsayı ve tarife cümleleri yalnızca `ayarlar.json` ve hesap fonksiyonlarından üretilir.
- `FAQPage` ekleyerek zengin sonuç beklemek. Şema ayrıştırmaya yardım eder, Google'da görsel kazanç yoktur.
- İnce sayfaları GSC verisine bakmadan toplu noindex yapmak ya da silmek.
- Kişisel veri nedeniyle kaldırılan 11 yazıyı başka bir adrese 301 ile yönlendirmek. Bunlar 410 almalıdır.

## Ölçülemeyenler

- **CrUX ve Search Console:** site yayında değil. Yayından sonra 28 gün izlenmeli. P0-1'deki öncelik sırası ve P2-1'deki eşik için gereken trafik verisi şu an canlı WordPress'in GSC hesabından alınabilir.
- **Canlı HTTP başlıkları:** GitHub Pages ve Cloudflare'de sıkıştırma, önbellek, HSTS, gerçek 404 durumu ve `x-robots-tag` yayında doğrulanmalı.
- **Cloudflare bot ayarları:** "Block AI bots" ya da yönetilen `robots.txt` açıksa yapay zekâ tarayıcıları engellenir; AIO ve GEO pratikte düşer.
- **Dış bağlantı profili ve marka anılması:** GEO için önemli, bu denetimin kapsamı dışında.

## Ek: puanlama ve yeniden ölçüm

- Her alan 6-10 ölçütten oluşur. Her ölçüt 0-10 arası puanlanır ve ağırlığıyla çarpılır. Oranlar indekslenebilir sayfalar üzerinden hesaplanır.
- Eşikler: başlık 30-65 karakter, açıklama 70-160 karakter, ince içerik `<main>` içinde 150 kelime.
- Yeniden ölçüm:

  ```sh
  npm run build
  node scripts/seo-denetim/tara.mjs dist .seo-denetim.json
  node scripts/seo-denetim/ozet.mjs .seo-denetim.json
  ```

- Canlı adres eşleşmesi canlı `sitemap_index.xml` ile tekrarlanır. Sonuç [seo-canli-eksik-adresler.json](seo-canli-eksik-adresler.json) dosyasına yazılır.
- Lighthouse ve performans izi yerel sunucuda, yapay ağ gecikmesiyle ölçüldü; gerçek CDN koşullarını yansıtmaz.
