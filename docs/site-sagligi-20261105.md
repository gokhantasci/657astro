# Site sağlığı — 5 Kasım 2026

> Sonraki düzeltme: kullanıcı başlangıç sayaç değerlerinin kaynağını bilmediğini ve sıfırlanabileceğini belirtti. Değerler sıfırlandı; çalışan API ve doğrulanmış veri sağlanana kadar hesaplama sayaçlarının görünümü ve istekleri kapatıldı. Aşağıdaki hız ve servis bulguları düzeltmeden önceki sürümü belgeler. Ayrıntı: [Sayaç düzeltmesi](sayac-sifirlama-20261105.md).

Site GitHub Pages üzerinde yayında. Son yayın: [41948444692](https://github.com/gokhantasci/657astro/actions/runs/41948444692), commit `e66d6ee0fad8a633ab9872fc7ac73a54700f2fe4`. Derleme ve yayın işleri başarılı. Tarifeler, veri güncelleme, yargı haritası ve düzeltilen YDO yazısı canlıda doğrulandı. Aynı sürüm tekrar yayımlanmadı.

Genel değerlendirme: erişim ve temel teknik SEO iyi; mobil ilk ziyaret deneyimi ile sayaç/önbellek işletiminde açık işler var. GA/GSC/Cloudflare hesap raporlarına erişilemediğinden ziyaretçi, organik trafik, indeks kapsamı ve gerçek kullanıcı Core Web Vitals sağlığı hakkında kesin hüküm verilmez.

## Kapsam ve yöntem

- Derlenmiş `dist` HTML yolları ile canlı site haritalarının birleşimindeki **17,988 benzersiz URL** kontrol edildi. Bunların **7,208 tanesi site haritasında**. Eski adresler ve yönlendirme HTML'leri de tam taramada bulunuyor. Dosya indirmeleri ve model dosyaları HTML sayfa sayısına dahil değil.
- Tüm URL'lerde GET, manuel yönlendirme, 30 saniye zaman aşımı ve 6 eşzamanlı istek kullanıldı. Başlıkların ve gövdenin tamamlanma süreleri ayrı ölçüldü. Başlık süresi DNS/TLS/bağlantı dahil istemciden ölçümdür; sunucunun tek başına işlem süresi değildir. Gövde baytları açılmış HTML boyutudur; ağdan sıkıştırılmış aktarım boyutu değildir.
- **50 farklı sayfa/şablon örneğinde mobil Lighthouse** çalıştırıldı; üçüncü taraf GA/GTM/Cloudflare kodları engellenmedi. Bu, her URL için Lighthouse çalıştırıldığı anlamına gelmez. Tüm URL hız kapsamı HTTP teslim ölçümüdür. Mobil testlerde yeni ziyaretçi, varsayılan izin durumu ve simüle yavaşlatma kullanıldı.
- Tek istemci/ağ noktası; gözlenen Cloudflare noktası AMS. Bir seferlik laboratuvar ölçümü Türkiye'deki tüm kullanıcıların deneyimini veya 28 günlük CrUX verisini temsil etmez. Lighthouse SEO puanı arama sıralaması ya da indekslenme garantisi değildir.

## Tüm URL hız ve erişim sonuçları

| Ölçüm | Sonuç |
|---|---:|
| HTTP durum dağılımı | {"200": 7371, "301": 10617} |
| Ağ/zaman aşımı hatası | 0 |
| 200 yanıtlarında başlık süresi medyan / p95 | 218 / 304 ms |
| 200 yanıtlarında gövde tamamlanma medyan / p95 | 219 / 307 ms |
| Site haritası yanıt dağılımı | {"200": 7208} |
| Site haritasında durum/noindex/canonical eksikliği/meta-refresh uyarısı | 0 |

301 yanıtları hata değildir; tarama ilk yanıtı ölçer, zincirin sonunu her eski URL için ayrıca takip etmez. Site haritası URL'lerinin 200 dönmesi Google'da indekslendiklerini göstermez. Taramada bulunmayan sahipsiz eski URL'ler ve sorgu parametresi kombinasyonları bu envantere dahil değildir.

## Mobil Lighthouse

50 geçerli ölçümün ortalamaları: performans **96.72**, erişilebilirlik **99.96**, iyi uygulamalar **98.84**, teknik SEO **100**. Performansı 90'ın altında 6, laboratuvar LCP'si 2,5 saniyenin üzerinde 13, CLS'si 0,1'in üzerinde 3 örnek var.

| Sayfa | Performans | LCP | CLS | Erişilebilirlik |
|---|---:|---:|---:|---:|
| / | 84 | 4.45 sn | 0.036 | 100 |
| /memur-maas-hesaplama/ | 78 | 5.62 sn | 0.039 | 100 |
| /yazilar/ | 78 | 5.46 sn | 0.000 | 100 |
| /turist-omeri-canlandiran-oyuncu-kimdir/ | 89 | 1.58 sn | 0.221 | 100 |
| /adlicevre/abana-adliyesi-yargi-cevresi/ | 90 | 1.58 sn | 0.212 | 100 |
| /2026-ekim-ayi-enflasyon-verileri/ | 88 | 1.58 sn | 0.237 | 100 |
| /yargi-haritasi/ | 70 | 7.01 sn | 0.001 | 98 |

Harita, toplu HTTP taraması bittikten sonra iki kez daha ölçüldü. Üç ölçümde performans 70, 87, 87; medyan 87. LCP medyanı 3.07 saniye. Dolayısıyla ilk 70 puanı tek başına sabit sonuç saymamak gerekir; tekrarlar da iyileştirme ihtiyacını gösteriyor. Bu iki tekrar 50 örneğin ortalamasına eklenmedi.

Ana sayfa, maaş ve harita izlerinde LCP öğesi çerez bildirimi metni. Bu öğenin görünme gecikmesi ilk ziyaret puanını etkiliyor. Harita HTML'i Lighthouse ağ kaydında yaklaşık 1,56 MB açılmış, 423 KB aktarılmış; harita/veri yükünün azaltılması ayrıca öncelikli. Haritada başlangıç panelinin `h3` başlığı seviye atlıyor (`heading-order`). Bazı içerik sayfalarında CLS yüksek; metin/font ve sonradan eklenen alanlar iz üzerinden incelenmeli. Cloudflare challenge betiği ana sayfada eski API uyarıları üretiyor; bunun kaynağı siteye ait hesaplama kodu değil.

[Google'ın Core Web Vitals eşikleri](https://web.dev/articles/vitals): LCP ≤2,5 sn, INP ≤200 ms, CLS ≤0,1; gerçek kullanıcı ziyaretlerinin yüzde 75'lik dilimi dikkate alınır. Lighthouse TBT, INP yerine geçmiş gerçek kullanıcı verisi olarak kullanılamaz.

## GA4

- Canlı GTM `GTM-KPCCB5FP`, onun yüklediği GA4 `G-SBMKDHD5TF`.
- Ayrı temiz tarayıcı bağlamlarında çerez reddi ve kabulü test edildi. İkisinde de bir `page_view` isteği Google'ın `/g/collect` ucundan **204** aldı; ağ hatası yok. Red durumunda `G100`, kabulde `G101` izin sinyali gözlendi. İzin varsayılanı etiket yüklenmeden önce kuruluyor.
- Redde rağmen isteğin görünmesi tek başına çerez yazıldığını göstermez; [gelişmiş Consent Mode](https://developers.google.com/tag-platform/security/concepts/consent-mode) izin verilmediğinde çerezsiz ping gönderebilir. Bu test bir hukuki uygunluk değerlendirmesi değildir.
- 204, isteğin kabulünü gösterir; GA raporunda işlenme, doğru mülk eşlemesi, filtreler, trafik ve dönüşüm doğruluğu hesap içinden kontrol edilemedi.
- GitHub logunda GA hizmet hesabı ve mülk değişkeni boş; `PUBLIC_OKUNMA_API` etkin olduğundan GA okunma aktarımı bilinçli atlanıyor. Başarılı workflow adımı, GA raporuna bağlanıldığının kanıtı değil.

## Search Console

Google doğrulama meta etiketi canlıda mevcut. robots.txt 200, genel taramaya açık; `/modeller/` ve `/api/` hariç tutulmuş, sitemap adresi bildirilmiş. Altı alt harita ve 7,208 URL okundu. HTTP ve www varyantları HTTPS ana alan adına 301 gidiyor.

GSC hesabındaki mülk doğrulaması, site haritası işlenme sonucu, indeks dışı nedenleri, manuel işlemler, güvenlik sorunları, tıklama/gösterim ve Core Web Vitals raporu **okunamadı**. Tarayıcı erişim sunucusu kullanılamadı; Windows aracı geçerli tarayıcı URL'sini güvenle belirleyemediği için hesap oturumu denemesi durduruldu. Kurulu hesap bağlayıcısı yok. GA/GSC için Windsor.ai bağlantısı bulunabiliyor ancak bağlı değil.

Public PageSpeed API denemesi 429/kota hatası verdi; dış PageSpeed/CrUX verisi elde edilmedi. Yerel Lighthouse sonuçları bunun yerine gerçek kullanıcı verisi gibi sunulmadı.

## Cloudflare ve servisler

- Canlı yanıtlarda `server: cloudflare`, `cf-ray`, Brotli (`br`) görüldü. Robots, sitemap, tarifeler bölümü, veri güncelleme ve harita için tekrar istekleri HIT döndü.
- Tam envanterin soğuk taramasında HIT/MISS/EXPIRED dağılımı gerçek ziyaretçi önbellek isabet oranı değildir. [Cloudflare yanıt tanımları](https://developers.cloudflare.com/cache/concepts/cache-responses/) kullanılarak yorumlanmalıdır.
- TLS 1.3 bağlantısı geçerli; sertifika 26 Ocak 2027'ye kadar geçerli.
- **Yayın sonrası purge çalışmıyor:** workflow logu açıkça “Cloudflare secret'ları yok; önbellek temizlenmedi” diyor. `CLOUDFLARE_API_TOKEN` ve `CLOUDFLARE_ZONE_ID` tanımlı değil. İşin yeşil olması bu atlanan işlemin yapıldığını göstermiyor. Yeni içerikler canlı örneklerde mevcut; yine de eski sürüm önbellekte kalabilir.
- `/api/hesaplama` ve `/_657-servis/api/hesaplama` **404**. Bunlar sonuç hesaplayan motor değil, kullanım sayacı. Sunucu tarafında bu uç yok; ön yüzde sessizce sabit sayılara geri dönülüyor. `src/data/hesaplama-sayaclari.json` başlangıç değerlerinde doğrulanabilir kaynak belirtilmiyor. Kullanıcıya kaynak soruldu; bu toplamlar doğrulanmış GA/gerçek işlem istatistiği kabul edilmemeli. Kaynak bilinmeden mevcut değerler silinmedi/değiştirilmedi.
- Okunma ucunun GET'e 405 vermesi beklenen davranış; yalnız POST/OPTIONS tanımlı, izinli OPTIONS 204. İndirme sayacı geçerli kimlikli GET'te 200; parametresiz 400 beklenen doğrulama. Servis uç testlerinde deneme indirmesi/sahte sayaç artışı için ayrıca POST gönderilmedi; normal tarayıcı gezinmeleri ölçüm istekleri üretmiş olabilir. Piper manifesti ve denetim DOCX dosyası 200.
- Python kullanıcı aracısı ana sayfa/robots'ta 403, standart Node ve Googlebot adı taşıyan test isteği 200 aldı. İstemciye göre koruma davranışı var; Googlebot kullanıcı aracısı taklidi gerçek Google taramasının kanıtı değildir. GSC canlı URL ve Cloudflare güvenlik olaylarıyla doğrulanmalı.
- Cloudflare hesap içi trafik, WAF olayları, botlar, günlük isabet oranı ve alan adı kuralları okunamadı. Mevcut kimlik bilgisi veya bağlı Cloudflare oturumu yok; güvenlik ayarları değiştirilmedi.

## Öncelikli işler

1. Hesaplama sayaçlarının veri kaynağını doğrulamak; gerçek API ve dönem tanımlarını tamamlamak veya doğrulanana kadar istatistik iddiasını kaldırmak.
2. GitHub'da sınırlı yetkili Cloudflare purge secret'larını tanımlayıp gerçek purge sonucunu doğrulamak.
3. Harita yükünü küçültmek ve başlık sırasını düzeltmek; çerez bildiriminin ilk çizimini geciktiren bağımlılıkları ayırmak; listelenen CLS sayfalarını iyileştirmek.
4. Bağlı hesaplarla GSC indeks/CWV ve GA trafik/dönüşüm raporlarını, Cloudflare WAF/önbellek raporunu incelemek. Hesap erişimi olmadan trafik düşüşü veya tam SEO sağlığı sonucu çıkarılmamalı.

## Kanıt dosyaları

- [Tüm URL'lerin hız CSV'si](../artifacts/site-sagligi-20261105/tum-sayfalar-hiz.csv)
- [Mobil Lighthouse CSV'si](../artifacts/site-sagligi-20261105/mobil-lighthouse.csv)
- [Makine okunur özet](../artifacts/site-sagligi-20261105/summary.json)
- Ham HTTP JSONL, Lighthouse sıkıştırılmış raporları, tracking/edge/TLS/servis kontrolleri aynı klasörde.

Tekrar çalıştırma: `node scripts/seo-denetim/saglik.mjs`, ardından `node artifacts/site-sagligi-20261105/lighthouse-run.mjs artifacts/site-sagligi-20261105 --templates`, `python scripts/seo-denetim/saglik-ozet.py`, `python scripts/seo-denetim/saglik-rapor.py`. Devam dosyaları aynı klasörde tutulur; yeni gün ölçümü için önce çıktı klasörünü/tarihini değiştirin. Bu denetimde ürün dosyası değiştirilmedi; yeni bir site yayını gerekmiyor.
