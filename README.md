# 657.com.tr · Astro

657.com.tr'nin GitHub Pages'te yayımlanacak statik sürümü. İçerik ve URL kaynağı canlı site ile `D:/wp28-3`. Tasarım: 657 kırmızısı ve laciverti, adliyeci.org'daki Excel ızgarası, açık ve koyu tema.

## Çalıştırma

```powershell
npm ci
npm run dev        # http://127.0.0.1:4321/
npm run build      # astro check + statik çıktı dist/ içine
npm run preview
npm run test:e2e   # Microsoft Edge ile tarayıcı testleri
```

## Sayfalar

- `/`: solda uygulamalar ve duyurular, sağda haberler (kaynağa göre süzülür), altta son yazılar.
- `/araclar/`: 55 aracın aranabilir dizini. Alan filtresi ve arama adres çubuğunda tutulur (`?q=`, `?alan=`). İğneyle işaretlenen araçlar "Masam" sekmesinde toplanır; seçim yalnızca o tarayıcıda saklanır.
- `/yazilar/` ve `/<yazı-adresi>/`: basit yazılar, WordPress'teki kök adresleriyle. Kapak görseli derlemede AVIF/WebP'ye çevrilir.
- `/hukuk-sozlugu/`: 2.490 terimlik sözlük. Arama (indeks `/hukuk-sozlugu/ara.json`, ilk aramada iner), harf sayfaları `/hukuk-sozlugu/harf/<harf>/`, her terim WordPress'teki adresiyle `/kelime/<slug>/`.
- `/cikmis-mulakat-sorulari/`: 2.219 hatırlatma kartı (1.209'u mülakat sorusu). Kart uygulaması (`kartlar.json`'dan iner; çevirme, otomatik oynatma, ses, yazı boyutu, tam ekran, ← → boşluk F kısayolları, `?kart=<adres>` ile doğrudan kart) ve 100'lük sayfalı liste (`/cikmis-mulakat-sorulari/sayfa/<n>/`). Her soru WordPress'teki kök adresinde (`/<soru-adresi>/`).
- `/sitemap.xml`, `/robots.txt`, `/llms.txt` (yanıt motorları için düz metin özet).

## İçerik nerede

| Dosya | İçerik |
| --- | --- |
| `src/data/araclar.json` | Kategoriler ve araçlar. `featured`, `tasindi`, `path` ya da `url`. Şema: `src/lib/tools.ts` |
| `src/data/duyurular.json` | Site duyuruları |
| `src/data/haberler.json` | Bakanlık, HSK, PGM, CTE, İİDB, EDB ve Bilirkişilik haberleri (`source`, `date`, `title`, `url`). `node scripts/haberler.mjs` yeniler; GitHub Actions saatte bir çalıştırır |
| `src/content/yazilar/*.md` | Yazılar. Dosya adı = adres. Görsel `gorseller/` klasöründe, `gorsel` + `gorselAlt` alanlarıyla. Şema: `src/content.config.ts` |
| `src/data/mulakat.json` | Mülakat kartları (`slug`, `soru`, `cevap`, `tarih`, `mulakat`). Şema: `src/lib/mulakat.ts` |
| `src/data/sozluk.json` | Hukuk sözlüğü (`slug`, `terim`, `anlam`, `tarih`, `goruntulenme`). Şema: `src/lib/sozluk.ts` |
| `src/data/ayarlar.json` | Hesaplayıcıların ortak katsayıları; `site` altında e-posta, tablo sayfa boyu (`tablo_sayfa_boyu`), GTM/GA4 ve Search Console doğrulama kodları. Şema: `src/lib/settings.ts` |
| `src/data/enflasyon.json` | Enflasyon farkı dönemi ve aylık TÜFE; enflasyon farkı ve enflasyon oranı araçları buradan okur |
| `src/data/tatiller.json` | 2024–2035 resmî tatiller, Diyanet yıllık listelerinden: `python scripts/import-tatiller.py`. Aynı güne düşen tatiller ayrı satırdır |
| `src/data/adli-teskilat.json` | Adli çevre kaynağı (WordPress All Import'taki `teskilat_guncel.json` ile aynı biçim). 1.004 sayfa derlemede şablondan üretilir; dosyayı değiştirmek yeterlidir. Eski adresler `adlicevre-eski.json` |
| `src/data/sayaclar.json` | Başlık altındaki geri sayım şeridi (WordPress sayaç eklentisinin karşılığı) |
| `src/data/okunma.json` | Sayfa okunma sayıları: WordPress `teftis_views` + yayından sonra GA4 (`scripts/okunma.mjs`, `ga_baslangic` doldurulunca) |
| `src/data/muhtar-arsivi.json` | Memurlar.net'ten geçmiş muhtar ödenekleri; `ayarlar.json`'daki her dönem tabloya kendiliğinden eklenir |
| `src/data/thh-bilirkisi.json` | Tüketici hakem heyeti bilirkişi ürün göstergeleri, damga ve gelir vergisi oranları |
| `src/data/wp-yonlendirmeler.json` | WordPress Redirection eklentisindeki 301 kuralları; statik yönlendirme sayfası olarak üretilir. Cloudflare kuralları: `docs/cloudflare-yonlendirmeler.md` |

Şemalar derlemede doğrulanır; hatalı kayıt derlemeyi durdurur.

## Taşıma kuralı

Bir araç taşındığında sayfası aynı yolla `src/pages/<yol>/index.astro` olur ve `araclar.json` kaydına `"tasindi": true` eklenir. O zamana kadar bağlantılar canlı 657.com.tr sayfasını açar. Alan adını GitHub Pages'e yönlendirmeden önce taşınmayan araçlar için bir çözüm gerekir (eski siteyi alt alan adında tutmak ya da araçları önce taşımak); yoksa bu bağlantılar 404 verir.

Haberler şu an canlı sitenin 28 Ekim 2026 anasayfasından alınmış bir kopyadır; otomatik güncelleme henüz yoktur.

Erişim bilgileri `.env.local` dosyasındadır (git'e girmez).

Önceki tasarım denemesi `artifacts/onceki-surum/` altında yedeklidir.

## Devam çalışması · 29 Ekim 2026

- Kadrolu maaş: `/memur-maas-hesaplama/`. 79 unvan seçeneği, 22 şablon, 126 derece/kademe; öğretmen alan/alt görev, 5510/5434 ve ayrı katsayılarla 14 günlük fark. HMB katsayıları ve GİB 2026 kümülatif ücret tarifesi kullanılır. MAHEP öğretmen örneği kalem ve net olarak eşleşir; Memurlar.net kâtip örneğinin damga farkı ayrıca kaydedilir. Eski 784 kayıt yalnızca geçmiş sürüm arşividir. Cezaevi müdürü için eksik oranlar nedeniyle hesap gösterilmez.
- Sözleşmeli maaş: `/sozlesmeli-memur-maas-hesaplama/`. Memurlar.net listesindeki 58 unvan / 91 alt koşul; eski güvenlik seçimleriyle 60 unvan seçeneği. Öğrenim, kurum ve 0–25 hizmet yılına göre otomatik ücret/ek ödeme; sonraki yıllar son basamak. Ortak katsayılarla ücret ve yıllık matrah güncellenir; özel sözleşme ücreti ve bordrodaki matrah elle girilebilir. Kaynakta olmayan birleşimler tahmin edilmez. Vergi farkları ve doğrulama: `docs/sozlesmeli-maas-saglama.md`.
- Emekli maaşı: `/emekli-memur-maas-hesaplama/`. Kaynağın 5434 esaslı hesabı; aylık, ikramiye ve yolluk. İkramiyedeki sayı/metin birleştirme hatası düzeltilmiştir; brüt ve ek ödeme hariç tutarlar ayrı gösterilir. 5510 kişisel emeklilik hesabı değildir.
- Adli çevre: `/adlicevre/` ve `/adlicevre/<adres>/`. 1.012 arşiv kaydı, Türkçe arama ve eski adresler.
- Unvan maaşları: `/unvan-maaslari/` ve kökte 76 mevcut adres. Örnekler ortak hesap motorundan üretilir; uygun yılın katsayıları veya ödeme oranları yoksa arşiv içeriği korunur.
- Basit yazı sayısı 51 oldu. Tarife, sınav ve kararname grubundan 47 yazı eklendi. Görseller ve indirme dosyaları eski yollarıyla `public/` altında bulunur.
- `/kelimeler/<adres>/` ve `/sozlukyeni/<adres>/` için canonical + noindex + meta-refresh sayfaları eklendi. GitHub Pages'te bunlar HTTP 301 değildir. Gerçek HTTP yönlendirmeleri Cloudflare üzerinden ayrıca kurulabilir.
- Site haritası taşınmış araçları otomatik listeler; yeni dizinler ve ayrıntı sayfaları da eklenmiştir. `public/.nojekyll` hazırdır.

Bir eski GYS tercih ekranı görseli (`2024/04/tercih-ekrani-1024x555.jpg.webp`) canlıda ve yerel kopyada bulunamadı; ilgili arşiv yazısında görselin bulunamadığı belirtilir. Tercih Robotu indirme dosyası gerçek tema yolundan kurtarıldı.

Yeni veriler: `src/data/dereceler.json`, `memur-maas-secenekler.json`, `sozlesmeli-unvanlar.json`, `adlicevre.json`, `maas-yazilari.json`. Maaş parametreleri `ayarlar.json.maas_parametreleri`; fark katsayıları `donemler[].fark14`. Seyyanen gösterge yalnızca ortak `sabitler` kaynağından okunur.

`scripts/import-*.py` salt okunur REST API/tema kopyalarından veri aktarır. `import-yazilar.py --refresh` aktarılmış yazıları yeniden oluşturur; mevcut ilk dört yazıyı korur. `--legacy-root D:/wp28-3/wordpress` canlıda bulunmayan görseller için yerel kopyayı kullanır. `salary-fixtures.mjs <tema-kopyası>` karşılaştırma verisini yeniden üretir.

Yerel yönetim paneli, otomatik haber güncellemesi ve GitHub Pages/Cloudflare yayını henüz kurulmadı. Alan adı çevrilmeden önce kalan araçlar, geçmiş yazı adreslerinin tamamı, diğer yüklenen dosyalar ve alt alan adı kuralları denetlenmelidir. Canlı sunucu ve DNS değiştirilmedi.

## Dış kaynak sağlaması ve yeni araçlar

Ayrıntılı profil, kalem karşılaştırmaları, kaynak uyuşmazlıkları ve açık kalan kapsam: [docs/maas-saglama.md](docs/maas-saglama.md).

11 yeni hesap ekranı: öğretmen ve akademik ek ders, net ek dersten saat, İLKSAN emekli yardımı, bileşik enflasyon, muhtar ödeneği, 68/B hizmet, lojman puanı, geçici/sürekli görev yolluğu, belediye başkanı ödeneği. Dizinde 51 araç bulunur; bu sayı daha önceki henüz taşınmamış araçları da içerir.

Hesap motoru `src/lib/kamu-hesaplari.ts`, alanlar `kamu-katalog.ts`, sayısal kurallar `src/data/kamu-kurallari.json`, vergi tarifesi `src/data/vergi.json` içindedir. Tarayıcıda dış bordro hizmetine istek yapılmaz. Ek dersin ücretli öğretmen/öz gelirli akademik varyantları, eski 4/C’den geçiş rejimi, kurum/TİS bazlı 4/D ve rütbe cetvelli asker emekliliği henüz tamamlanmamıştır. Yollukta gündelik ve konaklama sınırı, belediye başkanında K cetveli ilavesi ve kişisel prim kullanıcı girdisidir.

## Otomatik unvan maaşı yayını

76 unvanın düşük/kıdemli örnekleri ortak motorla derlemede yenilenir. Yıl dizinleri, yeni yıl adresleri ve aynı yılın dönem tabloları otomatik üretilir. 2024 (35 unvan), 2025 (76 unvan, ayı belirsiz kaynak aktarımı) ve Ocak 2026 arşivi korundu. Başarılı derleme `src/data/maas-arsivleri/` altında sonuçları kaydeder; bu dosyalar veri değişiklikleriyle birlikte depoya alınmalıdır. Ayrıntılı güncelleme ve kaynak kuralları: [docs/unvan-maas-yayinlari.md](docs/unvan-maas-yayinlari.md).

## Site geneli · 29 Ekim 2026 (ikinci bölüm)

- Tarihler sitede `gg-aa-yyyy` (`lib/bicim.ts → gun`, `donemAraligi`).
- Bütün `<select>` kutuları aranabilir (`scripts/secim.ts`); yerel select formda kalır, değer onda tutulur.
- Yazılardaki 15+ satırlı tablolarda arama, `tablo_sayfa_boyu` satırlık sayfalama (`scripts/tablo.ts`). Başka tabloya `data-tablo` eklenebilir.
- Taşınmamış araçlar dizinde soluk ve bağlantısızdır; satırın tamamı aracı açar.
- Sözlük araması harf ve terim sayfalarında da vardır. Terim ve mülakat sorusu önerisi: `/oneri/` (sunucusuz, e-posta taslağı).
- Kurumsal sayfalar WordPress adresleriyle: `/iletisim/`, `/657-com-tr-gizlilik-politikasi-ve-kvkk-aydinlatma-metni/`, `/hizmet-sartlari-ve-kullanim-kosullari-2/`.
- Site haritası `/sitemap.xml` bir dizindir (`/sitemap-<grup>.xml`); Yoast'ın eski `/sitemap_index.xml` adresi de aynı dizini verir.
- Yeni araç: `/tuketici-hakem-heyeti-bilirkisi-ucret-hesaplama/` (2026 tarifesinin 248 satırıyla kuruşu kuruşuna eşleşir).
- Emekli maaşı: unvan, kadro (KHA) ve emekliliğe esas derece (EKEA), hizmet ayı; OzkanSoft EMIHEP'in 5 örneğiyle sağlandı. Özel hizmet eşiği düzeltildi: ek gösterge 2200 tam değerde %55 (önceden %85 sayılıyordu; 5434'lü memurun kesenek matrahını da etkiler).
- Yayın: `.github/workflows/yayin.yml` (push, saatlik haber yenileme, GitHub Pages). GA4 okunma sayıları için `GA_HIZMET_HESABI` gizli değişkeni ve `GA_MULK` değişkeni tanımlanır.

Açık işler: 4/C maaşı (OzkanSoft 4C MAHEP; aile yardımı göstergeleri memurdan farklı, örnekleri toplanmalı), asker emekli maaşı (rütbe cetveli), emeklilik yaşı hesabı (Memurlar.net sayfası kaldırılmış; resmî tabloyla kurulmalı), KVKK çerez rızası bandı (analitik çerezler için açık rıza önerilir).

## Son devam kaydı

Haberlerde beşli sayfalama, THH gelir vergisi seçimi, Piper/Türkçe sesli okuma, yerel ziyaret sayacı, eski JSON adresleri ve resmî H/K cetveli düzeltmeleri eklendi. Kaynak örnekleri, test sonuçları ve henüz tamamlanmamış dış hizmetler: [docs/devam-29-ekim.md](docs/devam-29-ekim.md). Önceki devam bölümleri tarihsel aktarım kaydıdır; güncel kapsam bu belgede açıklanır.

Derdest dosya aracı: `/derdest-dosya-listesi/` (eski `/derdest.html` adresi yönlenir). Mahkeme Excel’inde B sütunundaki yıl ve C’den TOPLAM sütununa kadar dosya numaraları okunur; çok sayfalı çalışma kitabı, yıl/genel toplam kontrolü, sıralama/tekrar çıkarma ve TXT/CSV indirme vardır. Dosya sunucuya gönderilmez. Kaynak: https://657.com.tr/derdest.html .
