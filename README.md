# 657.com.tr · Kamu Personeli ve Adliye Hesaplama Portalı

[![Astro](https://img.shields.io/badge/Astro-5.x-BC52EE.svg?style=flat&logo=astro)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33.svg?style=flat&logo=playwright)](https://playwright.dev/)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-222222.svg?style=flat&logo=github)](https://pages.github.com/)
[![Cloudflare](https://img.shields.io/badge/Proxy-Cloudflare-F38020.svg?style=flat&logo=cloudflare)](https://www.cloudflare.com/)

**657.com.tr**, Devlet Memurları Kanunu'na tabi kamu çalışanları, adliye teşkilatı personeli (yazı işleri müdürleri, zabıt katipleri, icra memurları, mübaşirler), hakim/savcı adayları, bilirkişiler ve avukatlar için geliştirilmiş bağımsız, modern, hızlı ve açık kaynaklı hesaplama ve başvuru platformudur.

Eski WordPress altyapısından **Astro** statik site mimarisine (SSG) taşınmıştır. Tüm URL yapısı, geriye dönük 301 kuralları ve veri kaynakları korunarak sıfır kesintiyle çalışacak şekilde tasarlanmıştır.

---

## 📌 İçindekiler

1. [Projenin Amacı ve Tasarım Felsefesi](#-projenin-amacı-ve-tasarım-felsefesi)
2. [Öne Çıkan Modüller ve Kapsam](#-öne-çıkan-modüller-ve-kapsam)
3. [Teknik Mimari ve Proje Yapısı](#-teknik-mimari-ve-proje-yapısı)
4. [Gereksinimler](#-gereksinimler)
5. [Kurulum ve Çalıştırma](#-kurulum-ve-çalıştırma)
6. [Katsayı ve Veri Yönetimi](#-katsayı-ve-veri-yönetimi)
7. [Testler ve Kalite Güvencesi](#-testler-ve-kalite-güvencesi)
8. [Arama ve Yapay Zeka Hazırlığı (SEO, AIO, GEO, AEO)](#-arama-ve-yapay-zeka-hazırlığı-seo-aio-geo-aeo)
9. [Yayın ve Dağıtım (Deployment)](#-yayın-ve-dağıtım-deployment)
10. [Lisans ve Telif Hakları](#-lisans-ve-telif-hakları)

---

## 🎯 Projenin Amacı ve Tasarım Felsefesi

Platformun temel gayesi; adliye ve kamu personeline her gün ihtiyaç duyduğu hesaplama, süre kontrolü, teftiş çizelgesi ve mevzuat sorgulama işlemlerini **reklamsız, hızlı, hatasız ve doğrudan tarayıcı üzerinde** sunmaktır.

* **Resmiyet ve Ciddiyet ("B – Hizmet Portalı"):** Adalet Bakanlığı ve UYAP kurum kültürüne yakışır; derin lacivert (`#132036`), kurumsal kırmızı mühür (`#c8102e`) ve yüksek okunurluğa sahip `Red Hat Display` & `Red Hat Text` tipografisi.
* **Anti-AI-Slop & Editoryal Netlik:** Basmakalıp SaaS kartları veya göz yoran süsler yerine, doğrudan işe odaklanan akordeon formlar ve sabit sonuç panelleri.
* **Tam Gizlilik:** Hesaplamalar ve dosya işlemleri (Excel, UDF, Word) sunucuya yüklenmeden doğrudan kullanıcının tarayıcısında (Client-Side / WebAssembly) işlenir.

---

## 🛠️ Öne Çıkan Modüller ve Kapsam

| Modül | Adres | Kapsam ve Açıklama |
| :--- | :--- | :--- |
| **Memur Maaş Robotu** | `/memur-maas-hesaplama/` | 79 unvan, 126 derece/kademe, 5510 ve 5434 rejimleri, 14 günlük maaş farkı ve GİB kümülatif vergi matrahı. |
| **Sözleşmeli Maaş** | `/sozlesmeli-memur-maas-hesaplama/` | 58 unvan / 91 alt koşul; hizmet yılına göre taban ücret ve ek ödeme. |
| **Emekli Maaşı & İkramiye** | `/emekli-memur-maas-hesaplama/` | 5434 sayılı kanun esaslı aylık, ikramiye ve yolluk dökümü. |
| **Yargılama Masrafı & Harç** | `/yargilamagideri/` | Dava açılış harçları, keşif/bilirkişi giderleri, tam kabul ve kısmen kabul masraf paylaştırma. |
| **Karar Kesinleşme Süresi** | `/kesinlesme/` | Tebliğ tarihi, istinaf/temyiz süreleri, adli tatil uzaması ve 2024–2035 Diyanet resmî tatil takvimi. |
| **Derdest Dosya Listesi** | `/derdest-dosya-listesi/` | Mahkeme Excel dökümünden yıl ve dosya numaralarını ayıklar, tekrarları temizler ve TXT/CSV üretir. |
| **UDF Dönüştürücü** | `/udf-goruntuleyici/` | UYAP editörüne gerek kalmadan tarayıcıda doğrudan UDF okuma ve metin ayıklama. |
| **Hukuk Sözlüğü** | `/hukuk-sozlugu/` | 2.490 terimlik dizin, harf sayfaları ve anında canlı arama. |
| **Çıkmış Mülakat Soruları** | `/cikmis-mulakat-sorulari/` | 2.219 soru-cevap kartı, çevirme animasyonu ve yerel WebAssembly Türkçe sesli okuma. |
| **Adli Teşkilat Çevreleri** | `/adlicevre/` | 1.012 adliye ve mülhakat kaydı, ağır ceza merkezleri ve birleşen mahkemeler. |
| **DPB Mütalaaları** | `/devlet-personel-baskanligi-mutalaalari/` | 576 Devlet Personel Başkanlığı görüşü ve tam metin araması. |
| **Unvan Maaşları Arşivi** | `/unvan-maaslari/` | 76 unvanın güncel ve geçmiş dönem (2017–2026) maaş tabloları. |

---

## 🏗️ Teknik Mimari ve Proje Yapısı

```text
657astro/
├── public/                 # Statik varlıklar (bayrak, favicon, dosyalar, modeller)
│   ├── robots.txt          # Arama ve AI botu direktifleri
│   └── llms.txt            # Dil modelleri için özet dizin
├── src/
│   ├── components/         # Yeniden kullanılabilir UI bileşenleri (Form, Panel, İkon, vb.)
│   ├── content/
│   │   └── yazilar/        # Markdown formatında mevzuat yazıları ve rehberler
│   ├── data/               # Statik JSON veri kaynakları (ayarlar, katsayılar, terimler)
│   │   ├── ayarlar.json    # Ortak memur katsayıları ve site ayarları
│   │   ├── araclar.json    # 81 aracın katalog ve kategori şeması
│   │   ├── haberler.json   # Bakanlık, HSK, CTE ve PGM haberleri
│   │   ├── sozluk.json     # 2.490 terimlik hukuk sözlüğü verisi
│   │   └── mulakat.json    # 2.219 mülakat sorusu ve cevapları
│   ├── layouts/
│   │   └── Layout.astro    # Üst bar, sayaç, footer ve SEO/JSON-LD ana şablonu
│   ├── lib/                # Bağımsız TypeScript hesaplama motorları (Pür fonksiyonlar)
│   │   ├── kamu-hesaplari.ts
│   │   ├── memur-maas.ts
│   │   ├── kesinlesme.ts
│   │   └── site-haritasi.ts
│   ├── pages/              # Astro rota sistemi (Dosya tabanlı yönlendirme)
│   ├── scripts/            # İstemci tarafı tarayıcı betikleri (Vanilla TS, sıfır ağır paket)
│   └── styles/             # Tasarım sistemi CSS değişkenleri (tokens, base, global)
├── tests/                  # Playwright E2E ve matematiksel doğrulama testleri
└── astro.config.mjs        # Astro yapılandırması (trailingSlash: 'always')
```

---

## 💻 Gereksinimler

* **Node.js:** v20.x veya üzeri
* **npm:** v10.x veya üzeri
* **Python:** 3.10+ (Ortak tarife PDF üretimi ve veri aktarım araçları için)
* **İşletim Sistemi:** Windows, macOS veya Linux (PowerShell 7 önerilir)

---

## 🚀 Kurulum ve Çalıştırma

### 1. Bağımlılıkların Yüklenmesi
```powershell
# Node.js paketlerini yükleyin
npm ci

# Python PDF üretim kütüphanesini yükleyin (Tarife dökümleri için)
python -m pip install reportlab==5.1.0
```

### 2. Geliştirme Sunucusunu Başlatma
```powershell
# Geliştirme sunucusu (Varsayılan port: 4321)
npm run dev
```
Tarayıcınızda `http://127.0.0.1:4321/` adresini açarak çalışabilirsiniz.

### 3. Arka Planda Çift Sunucu (Geliştirme + Önizleme)
Projeyi aynı anda hem geliştirme (4321) hem de derlenmiş önizleme (4322) modunda arka planda çalıştırmak için:
```powershell
pwsh -NoProfile -File scripts/yerel-baslat.ps1
```

### 4. Statik Derleme (Build)
```powershell
# Tip kontrolü (astro check) + dist/ içine statik çıktı üretimi
npm run build
```

### 5. Derlenmiş Çıktıyı Önizleme (Preview)
```powershell
npm run preview
# veya belirli port ile:
npx astro preview --port 4322
```

---

## 📊 Katsayı ve Veri Yönetimi

Tüm hesaplama araçları katsayıları asla kendi kodunun içine gömmez; **Tek Doğru Kaynak (Single Source of Truth)** prensibiyle çalışır:

1. **Memur Katsayıları:** `src/data/ayarlar.json` dosyasındaki `donemler[]` dizisinde tutulur (Aylık katsayı, taban katsayı, yan ödeme, asgari ücret istisnası).
2. **Katsayı Okuma:** Araçlar `getKatsayilar('YYYY-AA-GG')` fonksiyonuyla ilgili dönemin katsayısını çağırır. Derleme tarihine bağımlılık yoktur; bu sayede geçmiş dönemler de doğru hesaplanır.
3. **Sabit Göstergeler:** `ayarlar.json` altındaki `sabitler` objesinde tanımlanır (Seyyanen zam göstergesi `15.965`, Muhtar göstergesi `14.750`, Bedelli askerlik `240.000`).
4. **Haber Akışı:** `node scripts/haberler.mjs` betiği Bakanlık, HSK, CTE ve PGM portallarından resmi duyuruları çeker ve tekilleştirir.

---

## 🧪 Testler ve Kalite Güvencesi

Projede her hesaplama motoru için resmi mevzuat ve bordro örnekleriyle doğrulanmış Playwright testleri bulunur.

```powershell
# Bütün uçtan uca (E2E) ve hesaplama testlerini çalıştırın
npx playwright test

# Yalnızca memur maaş hesaplama testini çalıştırmak için:
npx playwright test tests/memur-maas.spec.ts

# Test sonuçlarını tarayıcı arayüzünde incelemek için:
npx playwright show-report
```

---

## 🔍 Arama ve Yapay Zeka Hazırlığı (SEO, AIO, GEO, AEO)

Platform, geleneksel arama motorlarının yanı sıra yeni nesil üretken yapay zeka ve sesli cevap motorlarına **100/100 tam uyumluluk** ile tasarlanmıştır:

* **SEO:** 6 alt haritadan oluşan dinamik `sitemap.xml`, kalıcı kanonik URL'ler, zengin OpenGraph ve Twitter kartları.
* **AIO:** `llmstxt.org` standartlarında `/llms.txt` ve `/llms-full.txt` uç noktaları. GPTBot, ClaudeBot ve PerplexityBot için optimize edilmiş `robots.txt`.
* **GEO:** Tüm unvan maaşlarında ve araçlarda HMK, CMK ve HMB genelgelerine dayalı doğrulanabilir tablolar.
* **AEO:** 2.219 soruda `FAQPage` yapısal verisi, 2.490 terimde `DefinedTerm` ve yerel sesli okuma desteği.

Ayrıntılı denetim ve puanlama raporu için: [`docs/seo-aio-geo-aeo-denetim-raporu.md`](docs/seo-aio-geo-aeo-denetim-raporu.md)

---

## 🚢 Yayın ve Dağıtım (Deployment)

Tasarım sistemi: [Hizmet portalı](design.md). Kullanıcıya ait `ornekler` tasarımları Astro bileşenlerine uyarlanır; örneklerin React çalışma zamanı üretimde kullanılmaz. Ortak yüzeyler `src/styles/portal.css` ve token'lardan yönetilir.

03/11/2026 yerel sürümünün kapsamı ve doğrulaması: [akşam kontrol raporu](docs/pencere-kontrol-20261103.md). TÜFE, tarifeler, beklentiler ve mesajların düzenleme yerleri yerel `/veri-guncelleme/` sayfasındadır. Kutlama metinleri `src/data/ozel-gun-mesajlari.json` dosyasından yönetilir.

Site **GitHub Pages** üzerinde statik olarak barındırılır ve önünde **Cloudflare** proxy/önbellek katmanı bulunur.

* **Otomatik Yayın:** `.github/workflows/yayin.yml` iş akışı ile ana dala (`main`) yapılan her gönderimde derlenir ve GitHub Pages'e yüklenir.
* **Saatlik Haber Yenileme:** GitHub Actions cron görevi saatte bir çalışarak resmî kurum haberlerini günceller ve siteyi yeniden oluşturur.

---

## ⚖️ Lisans ve Telif Hakları

* **Telif Hakkı:** © 2026 Gökhan TAŞÇI. Tüm hakları saklıdır.
* **Yasal Uyarı:** 657.com.tr bağımsız bir mevzuat ve hesaplama platformudur. Sitedeki hesaplama sonuçları bilgilendirme amaçlı olup, resmi işlemlerde T.C. Resmî Gazete ve yetkili idarelerin bordroları esastır.
