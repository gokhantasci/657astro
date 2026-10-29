# 657.com.tr · Astro

657.com.tr'nin WordPress'ten statik Astro sitesine taşınması. Hedef GitHub Pages (önünde Cloudflare proxy'si kalacak). Canlı site ve araçlar taşınana kadar WordPress'te çalışır; bu proje henüz yayında değil.

## Komutlar

- `npm run dev` → http://127.0.0.1:4321 (testler bunu kullanır)
- `npm run build` → `astro check` + statik çıktı `dist/`; `npx astro preview --port 4322` ile bakılır
- `npx playwright test` → bütün testler (Microsoft Edge). Bir aracı değiştirdikten sonra mutlaka çalıştır.

## Katsayılar ve ortak veri (bütün hesaplayıcılar)

- Memur katsayıları **tek yerde** durur: `src/data/ayarlar.json` → `donemler[]`. Alanlar: aylık, taban, yan ödeme katsayıları, gelir ve damga vergisi istisnası, asgari ücret, `kaynak`. Şema `src/lib/settings.ts`; çakışan dönem ya da eksik alan derlemeyi durdurur.
- Araçlar katsayıyı **kopyalamaz**, `getKatsayilar('YYYY-AA-GG')` ile okur. Bir araç hangi dönemi hesaplıyorsa o dönemin tarihini verir (ör. enflasyon aracı `donemBaslangici()`); **derleme tarihine bağlama**, yoksa yeni dönem girilmeden yıl dönünce bütün site derlenemez. `guncelKatsayilar()` yalnızca "bugünkü katsayı" gösteren yerler içindir ve kayıt yoksa bilerek hata verir.
- Katsayıyla çarpılan sabit göstergeler `ayarlar.json` → `sabitler` (bedelli askerlik 240.000 ve teklif edilen 300.000, muhtar 14.750, seyyanen 15.965). Yeni bir sabit gerekiyorsa koda gömme, buraya ekle.
- Enflasyon farkı dönemi `src/data/enflasyon.json` (baz endeks, toplu sözleşme zammı, sonraki zam, altı ay). Resmî ayda `degisim` ve `endeks` birlikte girilir; boş ay sayfada tahmine açıktır.
- İlk aktarımın kaynağı canlı yönetim paneli (`wp-content/themes/teftis/657/assets/katsayilar.json`, `durum: "suan"` kaydı ve enflasyon ayarları). Yeni dönemde iki dosya birlikte güncellenir; `kaynak` alanına resmî genelge bağlantısı yazılmalı.
- Adliye personeli derece/kademe tablosu `src/data/dereceler.json`; kaynak `657/assets/datalar.json`. Maaş parametreleri `ayarlar.json.maas_parametreleri`, seyyanen gösterge yalnızca ortak `sabitler` kaynağındadır. Fark katsayıları `donemler[].fark14` içindedir.

## Site geneli ortak kaynaklar

- Site ayarları `ayarlar.json → site`: e-posta, `tablo_sayfa_boyu`, `analitik` (GTM, GA4, doğrulama kodları). Kodda e-posta ya da sayfa boyu yazılmaz.
- Görünen tarih `lib/bicim.ts → gun()` ile `gg.aa.yyyy`; ISO yalnızca `datetime` ve veride.
- Tatiller `tatiller.json` (Diyanet, `scripts/import-tatiller.py`); süre hesabı `tatilGunleri` kullanır (tarih başına tek kayıt).
- Adli çevre metni `lib/adlicevre.ts` şablonundan; veri `adli-teskilat.json`. Haberler `scripts/haberler.mjs`, okunma `okunma.json`.
- Yeni `<select>` için ek iş gerekmez (`scripts/secim.ts`); kodla `select.value` atamak görünen metni de günceller.

## Hesap mantığı

- Hesap **saf TypeScript fonksiyonu** olarak `src/lib/<arac>.ts` içinde durur (bağımlılıksız). Aynı fonksiyon sayfada derleme anında çalışır (betik yoksa da doğru sonuç görünür, arama motoru da görür) ve tarayıcı betiğinde (`src/scripts/<arac>.ts`) yeniden kullanılır.
- Tarayıcı betikleri zod'u ya da büyük JSON'ları içe aktaran modülleri (`lib/tools.ts`, `lib/sozluk.ts` vb.) **almamalı**; paket şişer. Ortak küçük yardımcılar: `lib/normalize.ts` (Türkçe arama), `lib/bicim.ts` (`yuzde`, `tl`, `katsayi`, `sayiOku`; virgüllü ondalık kabul eder).
- İlk aktarımda mantık canlıdaki `wp-content/themes/teftis/assets/js/*.js` dosyasından taşındı. Maaş ve yeni kamu araçlarında resmî kaynakla doğrulanan düzeltmeler esas alınır; eski hatalara uyum aranmaz. Bilinçli her sapma kodda yorumla ve kullanıcıya raporla. Örnek: canlı enflasyon aracı fark eksiyken katsayıyı eksi farkla hesaplıyordu; yeni sürümde fark sıfırın altına inmez.
- Her araç için `tests/<arac>.spec.ts`: canlı formülle elle türetilmiş en az bir sayısal örnek + sayfa testi.

## Adresler ve SEO

- WordPress adresleri **birebir** korunur (`trailingSlash: 'always'`). Taşınan araç `src/pages/<aynı-yol>/index.astro` olur ve `src/data/araclar.json` kaydına `"tasindi": true` eklenir; o zamana kadar bağlantı canlı siteyi açar.
- Kökteki `src/pages/[slug].astro` hem yazıları (`src/content/yazilar/*.md`) hem mülakat sorularını üretir; adres çakışması derlemeyi durdurur.
- Sözlük terimleri `/kelime/<slug>/`, mülakat soruları `/<slug>/`. Eski `/kelimeler/<slug>/` ve `/sozlukyeni/<slug>/` yolları için canonical + noindex + meta-refresh sayfaları hazırdır; gerçek HTTP 301 Cloudflare üzerinden ayrıca kurulabilir.
- Her sayfa `Layout`'a `title`, `description`, `path` ve uygun JSON-LD verir; yeni sayfa türleri `src/pages/sitemap.xml.ts` ve gerekiyorsa `llms.txt.ts`'e eklenir.
- Binlerce sayfa olduğu için CSS ayrı dosyadır (`inlineStylesheets: 'auto'`); büyük veri (sözlük indeksi, mülakat kartları) ayrı JSON uç noktası olarak tembel yüklenir.

## Canlıdan veri çekme

- Yayımdaki içerik: REST API (`/wp-json/wp/v2/...`). Sayfalı çekerken `orderby=id&order=asc` kullan; aksi hâlde aynı tarihli kayıtlar tekrar eder ya da kaybolur.
- Veritabanı ve tema dosyaları: SSH takma adı `kickhex-production` (düz `ssh root@IP` reddedilir). WordPress yolu `/home/kickadmin/web/657.com.tr/public_html`; wp-cli yok, sorgu için `php -r` + `define("SHORTINIT", true)` + `wp-load.php` + `$wpdb` SELECT. **Yalnızca oku**, canlıda hiçbir şey yazma.
- Yerel kopyadaki tema (`D:\wp28-3`) eski olabilir; şablon ve JS için sunucudaki sürümü esas al.
- Erişim bilgileri `.env.local` (git'e girmez); koda, yoruma ya da commit'e asla yazma.

## Tasarım

- Görsel dil: 657 kırmızısı `#c8102e` ve lacivert, Excel ızgarası zemin ve imleci izleyen kırmızı aktif hücre, Red Hat yazı ailesi, açık **ve** koyu tema (ikisi de her değişiklikte kontrol edilir).
- Her renk, boşluk ve süre `src/styles/tokens.css` token'larından gelir; `global.css` başındaki Hallmark damgası korunur. Koyu temada değişmesi gerekmeyen lacivert yüzeyler `--color-lead`, `--color-banner`, `--color-on-dark` kullanır.
- Sayılar gövde yazı tipinde ve `font-variant-numeric: tabular-nums` (`.num`); eşit genişlikli yazı tipi yalnızca `code` ve `kbd` için.
- Ortak kalıplar: `.panel` + `.panel__head`, araçlarda `.arac` (sol girdi, sağ yapışkan `.sonuc`), `.olgular`, `.grid` tablosu (sayı tablosu `.grid--sayi`).
- Arayüz metinleri Türkçe ve sade; başlık üstü etiket (eyebrow), uzun tire ve "Daha fazla" gibi kalıp düğmeler kullanılmaz. Anasayfa düzeni kullanıcının kararıdır: solda uygulamalar ve duyurular, sağda haberler, altta yazılar.

## Taşıma sırası

Öncelik GA, Search Console ve Cloudflare verisinden çıkarıldı (2026-10-28): enflasyon farkı (yapıldı) → yargılama gideri ailesi → kesinleşme → memur maaşı → adli çevre → unvan maaşı sayfaları → tarife, mülakat ve kararname yazıları.

29 Ekim devamı: kadrolu/sözleşmeli/emekli maaşı, 1.012 adli çevre kaydı, 76 unvan maaşı adresi ve 47 ek basit yazı taşındı. Eski sözlük/kart yönlendirmeleri hazır. Maaş hesabı dış kaynaklarla kalem bazında karşılaştırıldı; ayrıntılar `docs/maas-saglama.md`. Eski 784 kayıt doğruluk iddiası değildir. 11 kamu hesap ekranı ve GİB kümülatif vergi motoru eklendi. Bilinçli farklar README'de kayıtlıdır. Cezaevi müdürü oranları eksik olduğundan tahmin üretilmez. Yerel yönetim paneli, otomatik haber güncellemesi ve yayın geçişi hâlâ yapılacak; canlıya yazma/DNS değişikliği yapılmadı.

Yeni kamu araçları `src/lib/kamu-hesaplari.ts` / `kamu-katalog.ts` ve `src/data/kamu-kurallari.json` kullanır. Vergi `src/data/vergi.json` içindedir; katsayı döneminin yılı tarifeyle uyuşmazsa maaş derlemesi durur. Kurum/TİS veya rütbe cetveli doğrulanmadan kapsam tamamlanmış gibi gösterilmez.

Unvan maaş yayını: profiller `src/data/unvan-profilleri.json`, arşivler `src/data/maas-arsivleri/`. Güncel dönem aynı hesap motorundan üretilir; geçmiş sonuçlar tekrar hesaplanmaz. Başarılı build güncel yayını arşivler. Yeni dönemi eskiyi silmeden ekle; arşiv JSON dosyalarını depoya dahil et. Yeni yıl adresleri ve `/unvan-maaslari/<yıl>/` dizinleri otomatik üretilir. `docs/unvan-maas-yayinlari.md` kaynak ve güncelleme kurallarını açıklar.
