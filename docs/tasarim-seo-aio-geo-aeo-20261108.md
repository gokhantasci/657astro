# 657.com.tr tasarım, UX ve yanıt erişimi denetimi

Tarih: **08.11.2026 · Europe/Istanbul**. Bu rapor gözlemlenen sorunları,
uygulanan değişiklikleri ve ölçüm sınırlarını ayırır. Sıralama, trafik veya
yapay zekâ tarafından alıntılanma garantisi vermez.

## Kapsam ve değerlendirme

Canlı ana sayfa, araç dizini, memur maaş aracı, bir yazı ve DPB bülten dizini
incelendi. Ortak tasarım sistemi `design.md` ve `src/styles/tokens.css`
esas alındı: Red Hat yazı ailesi, lacivert/kırmızı marka dili, açık/koyu tema,
adresler, hesap motorları ve sayaçlar korunur. Bu bir yeni marka veya
uygulama altyapısı değişimi değildir.

| Alan | Bulgu | Yapılan iyileştirme |
|---|---|---|
| Tasarım | Ana sayfada duyurular iki kez, görselsiz yazılar büyük yapay kapakla gösteriliyordu. | Tek duyuru alanı, sade sayaç şeridi, gerçek görsel veya metin kullanan yazı seçkisi, tutarlı boşluklar ve daha dar okuma satırları. |
| Kullanıcı deneyimi | Haber panelinde binlerce gizli satır; mobilde gereksiz tekrar ve uzun ilk ekran. | Panelde yalnız beş satır; filtre/sayfalama bellekteki tam veriyle çalışır. Tekil duyuru hedefi, kısa bağlantılar ve tam kayıtlar için sayfalı arşiv. |
| SEO | Temel meta/H1/canonical eksikliği yoktu. Ortak 65 karakterlik kesme kuralı farklı soruları/görüşleri aynı başlığa indiriyordu. | Ayırt edici soru sonu ve görüş tarihi/sayısı korunur. Haber arşivi gerçek HTML bağlantıları, kendi canonical adresleri ve site haritasıyla yayımlanır. |
| AIO | Düz metin dizini vardı; yeni belge ve kurum haberleri kapsamı eksikti. | `llms.txt` içine belge arşivleri, kaynak ilkeleri, tarih ve hesaplama sınırları eklendi. Sayısal veriler ortak kayıttan gelmeye devam eder. |
| GEO | Kaynak ve yayıncı bilgisi bulunabiliyordu ancak yazının ilk okuma alanında yeterince açık değildi. | Görünür yayıncı, kaynak/düzeltme ilkeleri, varsa gerçek güncelleme tarihi ve mevcut açıklamadan kısa giriş. Özgün belge ile ek soru-cevap ayrımı korunur. |
| AEO | Araçların mevcut soruları vardı; ana sayfada hesaplama sınırları kolay bulunmuyordu. | Görünür üç kısa soru-cevap ve bunlarla eşleşen yapılandırılmış veri. Uygun yazılarda bölüm bağlantıları; tarih/girdi gerektiren sonuçlar için sabit net tutar iddiası yok. |

GEO burada **Generative Engine Optimization** anlamındadır. Google'ın
[AI özellikleri rehberi](https://developers.google.com/search/docs/appearance/ai-features),
AI araması için ek bir özel dosya veya şema zorunluluğu olmadığını; metin
erişimi, iç bağlantılar, sayfa deneyimi ve görünür içerikle uyumlu şemanın
önemini açıklar. `llms.txt` destekleyici bir dizindir, bir sıralama garantisi
değildir. [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)
da taranabilirlik, kaynak netliği, URL yönetimi ve içerik kalitesini aynı
arama/grounding temeli içinde değerlendirir. Soru-cevap şeması eklemek,
Google'da FAQ zengin sonucu veya AI alıntısı çıkacağını göstermez.

## Ölçülen sonuçlar

| Ölçüm | Önce | Sonra |
|---|---:|---:|
| Ana sayfa sıkıştırılmamış HTML yanıtı | 1.526.586 bayt | 79.857 bayt |
| Ana sayfa tarayıcı DOM öğesi, anlık örnek | 15.926 | 544 |
| Ana sayfa bağlantısı, anlık örnek | 2.047 | 92 |
| Yinelenen `<title>` grubu | 98 | 17 |
| Yinelenen başlıklı sayfa | 222 | 34 |
| İndekslenebilir çıktılarda eksik title/description/canonical veya tek H1 koşulu hatası | 0 | 0 |
| JSON-LD ayrıştırma hatası | 0 | 0 |

HTML yaklaşık **%94,8** küçüldü. Önce ölçümü canlı sitede, sonra ölçümü
yerel üretim önizlemesinde alındı. Baytlar sıkıştırılmamış HTML'dir; toplam
CSS/JavaScript/görsel aktarımı veya ağ hızı değildir. DOM sayıları dinamik
sayaç ve okunma listelerinin yüklenme anına göre küçük farklılık gösterebilir.
Bu sayılar LCP, INP, CLS veya Lighthouse puanı değildir.

Önceki statik çıktı 18.401 `index.html`, sonraki çıktı 18.535 `index.html`
dosyası içerir; fark 134 sayfalı kurum haberleri arşividir. Derlemenin toplam
18.537 sayısı diğer HTML çıkışlarını da içerir. Meta denetimi yalnız
indekslenebilir çıktıları inceler: önce 7.684, sonra 7.818.

Ham veriler:

- [Önce statik meta denetimi](tasarim-seo-once-20261108.json)
- [Sonra statik meta denetimi](tasarim-seo-sonra-20261108.json)
- [Beş sayfa ailesinin HTML ve DOM ölçümleri](tasarim-ux-20261108.json)

## Arşiv, kaynak ve içerik bütünlüğü

- `/kurum-haberleri/` ve kaynak alt dizinleri tüm mevcut kayıtları 30'arlı
  sayfalarda sunar; JavaScript kapalıyken de gezilebilir. Personel kaynağı
  `/kurum-haberleri/personel/` adresinden açılır.
- Ana sayfa ilk HTML'de her kaynak için en çok beş kayıt taşır. Tam akış
  mevcut yenileme uç noktalarından alınır ve bellekte tutulur. Aynı kontrol
  zamanına sahip ilk tam akış da kabul edilir; bu, küçük ilk HTML'nin tam
  akışın yerine yanlışlıkla kalmasını önler.
- Duyuru başlığı, kurum ve kaynak yayın tarihi korunur. Kaynak kontrol zamanı
  ayrı gösterilir. Haber gövdesi veya aday listesi kopyalanmaz.
- DPB ve genelge özgün metinleri, görüş başlıkları, soru-cevap alıntıları,
  matematiksel hesap motorları ve mevcut okunma/kullanım kayıtları değiştirilmez.
- Yayıncı gösterimi, her metnin ilk yazarının veya bir uzman incelemesinin
  doğrulandığı iddiası değildir. Derleme zamanı, içerik güncelleme tarihi
  olarak sunulmaz.

## Doğrulama

Mevcut haber, okunma sıralaması, yazı sayacı ve belge arşivi testlerinde
**33 kontrol** geçti. Yeni tasarım/SEO testlerindeki **14 kontrol**; iki bin
haberle beş DOM satırını, JavaScript olmadan haber arşivini, başlık ayırımını,
görünen soru-cevap ile şema eşleşmesini ve altı sayfa ailesini iki temada
320 / 375 / 414 / 768 / 1440 px genişliklerde doğruladı. Geliştirme HTML'sine
enjekte edilen stiller/scripts, üretim HTML boyutu ölçümüyle karıştırılmadı.
Üretim derlemesi ve kırık iç bağlantı denetimi geçti.

Tekrar ölçmek için:

```sh
node scripts/seo-denetim/tasarim-yanit.mjs dist rapor.json
npx playwright test tests/tasarim-seo.spec.ts tests/haber-akisi.spec.ts
```

## İzlenecek alanlar ve sınırlar

- Kalan 17 başlık grubu listede açıkça tutuldu. Bunlar çoğunlukla aynı
  kaynakta veya tarihsel arşivde tekrar yayımlanmış görüş/sorulardır.
  Başlık benzerliği tek başına içerik eşitliği değildir; otomatik silme,
  toplu yönlendirme veya kaynak metni yeniden yazma uygulanmadı.
- Maaş aracının büyük satır içi veri paketi bu görsel/ortak şablon
  çalışmasında ayrıştırılmadı. Hesap motorunun önbelleklenebilir ayrı veri
  yüklemesi, sonuç doğruluğu ve hata/yükleme akışlarıyla birlikte ayrı
  performans çalışması gerektirir.
- Search Console, Bing Webmaster Tools ve gerçek kullanıcı performans
  kayıtları bu denetimde okunmadı. İndekslenme, sıralama, tıklama veya AI
  alıntılanma artışı hakkında sonuç çıkarılamaz. Sonraki izleme bu gerçek
  verilerle yapılmalıdır; otomatik bir “SEO/AIO/GEO/AEO 100/100” skoru yoktur.
