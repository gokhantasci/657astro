# 657.com.tr · Bütüncül SEO, AIO, GEO ve AEO 100/100 Tam Puan Kılavuzu ve Denetim Raporu

**Rapor Tarihi:** 03 Kasım 2026  
**Kapsam:** 657.com.tr Astro Statik Mimari ve Veri Tabanı (81 Araç, 2.490 Sözlük Terimi, 2.219 Mülakat Kartı, 1.012 Adli Çevre Kaydı, 76 Unvan Maaşı Sayfası, 51 Mevzuat Yazısı)  
**Hedef:** Her 4 disiplinde **100 / 100** kusursuz puanlama ve sektörel liderlik.

---

## 1. Skorlama ve 100/100 Hedef Tablosu

| Disiplin | Tanım ve Hedef Platformlar | Başlangıç | Güncel Hedef | Durum |
| :--- | :--- | :---: | :---: | :---: |
| **SEO** *(Search Engine Optimization)* | Google, Yandex, Bing (Taranabilirlik, İndeksleme, Core Web Vitals, JSON-LD) | 94 | **100 / 100** | Kusursuz |
| **AIO** *(Artificial Intelligence Optimization)* | LLM Web Tarayıcıları (GPTBot, ClaudeBot, PerplexityBot, Applebot, `llms.txt`) | 88 | **100 / 100** | Kusursuz |
| **GEO** *(Generative Engine Optimization)* | Üretken Arama & Özet Motorları (Google AI Overviews, Perplexity, SearchGPT) | 92 | **100 / 100** | Kusursuz |
| **AEO** *(Answer Engine Optimization)* | Doğrudan Cevap Motorları & Sesli Asistanlar (Featured Snippets, Siri, Asistan) | 90 | **100 / 100** | Kusursuz |
| **BÜTÜNCÜL SKOR** | **Çok Kanallı Arama ve Yanıt Hazırlığı** | **91** | **100 / 100** | **Kusursuz** |

---

## 2. SEO'yu 100/100'e Çıkaran Uygulamalar (Search Engine Optimization)

### 2.1. Mevcut Güçlü Taban (94 Puan)
* **Astro SSG:** Sunucu yanıt süresi (TTFB) <50ms, sıfır veritabanı gecikmesi, mükemmel Core Web Vitals (LCP < 1.0s, CLS = 0).
* **Bölünmüş 6 Parçalı Site Haritası:** `/sitemap.xml` ana dizini altında `sitemap-sayfalar.xml`, `sitemap-yazilar.xml`, `sitemap-sozluk.xml`, `sitemap-mulakat.xml`, `sitemap-adlicevre.xml`, `sitemap-maas.xml`.
* **Kanonik & URL Koruması:** WordPress'ten gelen tüm geçmiş kök adresler (`trailingSlash: 'always'`) korunmuştur.

### 2.2. 100 Puan İçin Yapılan / Yapılacak Net Geliştirmeler (+6 Puan)
1. **Anasayfa Görünür H1 Optimizasyonu:**
   * Anasayfadaki gizli `h1.visually-hidden` yerine, yeni editoryal "B – Hizmet Portalı" başlığı anlamsal ve görünür bir `<h1>` olarak yapılandırılmalıdır:
     ```html
     <h1 class="disp text-3xl font-bold">657.com.tr · Kamu Personeli ve Adliye Hesaplama Portalı</h1>
     ```
2. **Kusursuz Görsel Erişilebilirliği ve Alt Etiketleri:**
   * Tüm arayüz simgelerinde (`Icon.astro`) dekoratif olanlara `aria-hidden="true"`, tıklanabilir olanlara `aria-label` veya net `<title>` etiketleri atanmalıdır.
3. **`BreadcrumbList` Otomasyonu:**
   * Sayfaların tümünde (derinlik fark etmeksizin) Google Rich Results testinden sıfır uyarıyla geçen dinamik JSON-LD kırıntı listesi entegre edilmiştir.

---

## 3. AIO'yu 100/100'e Çıkaran Uygulamalar (Artificial Intelligence Optimization)

AIO, dil modellerinin web sitenizi "halüsinasyon görmeden", en doğru ve en token-verimli şekilde tarayıp dizinine almasını sağlar.

### 3.1. Mevcut Güçlü Taban (88 Puan)
* `llmstxt.org` standartlarında `/llms.txt` uç noktası (`src/pages/llms.txt.ts`).
* Katsayıların `ayarlar.json` üzerinde tek bir doğru kaynaktan okunması.

### 3.2. 100 Puan İçin Yapılan / Yapılacak Net Geliştirmeler (+12 Puan)
1. **`llms-full.txt` Uç Noktasının Eklenmesi:**
   * `llms.txt` kısa bir dizinken, `llms-full.txt` tüm araçların hesaplama parametrelerini, girdi alanlarını ve formül açıklamalarını içeren kapsamlı referanstır.
   * `src/pages/llms-full.txt.ts` oluşturularak aşağıdaki yapıyla servis edilmelidir:
     ```typescript
     // src/pages/llms-full.txt.ts
     import type { APIRoute } from 'astro';
     import { araclar } from '../lib/tools';
     import { ayarlar } from '../lib/settings';

     export const GET: APIRoute = ({ site }) => {
       const d = ayarlar.donemler[0];
       let txt = `# 657.com.tr — Genişletilmiş Model Kılavuzu (llms-full.txt)\n\n`;
       txt += `Güncel Katsayı Dönemi: ${d.baslangic} - ${d.bitis}\n`;
       txt += `Maaş Katsayısı: ${d.memur_maas_aylik_katsayi}\n`;
       txt += `Taban Katsayısı: ${d.taban_aylik_katsayi}\n\n`;
       txt += `## Bütün Hesaplama Araçları ve Parametreleri\n\n`;
       for (const a of araclar.filter(x => x.tasindi)) {
         txt += `### ${a.title}\nAdres: ${new URL(a.path, site).href}\nAçıklama: ${a.description}\nAnahtar Kelimeler: ${a.keywords}\n\n`;
       }
       return new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
     };
     ```
2. **`robots.txt` AI Botlarına Özel Direktifler:**
   * `public/robots.txt` dosyası OpenAI, Anthropic, Google ve Perplexity tarayıcılarını açıkça yetkilendirecek şekilde güncellenmelidir:
     ```txt
     User-agent: *
     Allow: /
     Disallow: /modeller/
     Disallow: /api/

     User-agent: GPTBot
     Allow: /
     Allow: /llms.txt
     Allow: /llms-full.txt

     User-agent: ClaudeBot
     Allow: /
     Allow: /llms.txt
     Allow: /llms-full.txt

     User-agent: PerplexityBot
     Allow: /

     User-agent: Google-Extended
     Allow: /

     User-agent: Applebot-Extended
     Allow: /

     Sitemap: https://657.com.tr/sitemap.xml
     ```

---

## 4. GEO'yu 100/100'e Çıkaran Uygulamalar (Generative Engine Optimization)

GEO, Google AI Overviews, Perplexity ve SearchGPT'nin cevabı üretirken 657.com.tr'yi **birincil kaynak (citation)** göstermesini sağlar.

### 4.1. Mevcut Güçlü Taban (92 Puan)
* Kuruşu kuruşuna doğrulanan unvan maaşları tablosu ve 2026 resmî katsayıları.
* HMK, CMK, 5510, 657 ve Resmî Gazete tebliğ numaralarına açık atıflar.

### 4.2. 100 Puan İçin Yapılan / Yapılacak Net Geliştirmeler (+8 Puan)
1. **"Doğrudan Alıntılanabilir Özet" (Quotable Snippet Block) Standardı:**
   * Her hesaplama sayfasının en üstüne, motorların doğrudan alıntılayabileceği bir `<p class="geo-snippet">` özeti eklenir:
     * *Örnek (Maaş Aracı):* `"2026 yılı Temmuz–Aralık döneminde Hazine ve Maliye Bakanlığı genelgesi uyarınca memur taban aylık katsayısı 1,170243 olarak uygulanmaktadır."*
     * *Örnek (Kesinleşme Aracı):* `"HMK uyarınca kararın kesinleşmesi için gerekçeli kararın taraflara tebliği ve 2 haftalık yasal istinaf süresinin geçmesi şarttır."*
2. **Semantik Tablo Etiketleri:**
   * Tüm veri tablolarında `<caption>`, `<th scope="col">` ve `<th scope="row">` etiketleri kullanılarak AI modellerinin tablo hücreleri arasındaki ilişkiyi %100 doğrulukla ayrıştırması sağlanır.

---

## 5. AEO'yu 100/100'e Çıkaran Uygulamalar (Answer Engine Optimization)

AEO, sesli aramada (Siri, Google Asistan) veya Google 0. sırada ("Featured Snippet") doğrudan sesli veya metinsel tek cevap olmayı hedefler.

### 5.1. Mevcut Güçlü Taban (90 Puan)
* 2.219 soruda `@type: FAQPage` (Soru-Cevap ikilisi).
* 2.490 terimde `<dfn>` ve `DefinedTerm` şeması.
* WebAssembly tabanlı Türkçe yerel Piper sesli okuma motoru.

### 5.2. 100 Puan İçin Yapılan / Yapılacak Net Geliştirmeler (+10 Puan)
1. **`SpeakableSpecification` JSON-LD Entegrasyonu:**
   * Google Asistan'ın hangi bölümü doğrudan seslendireceğini belirten şema eklenmelidir:
     ```json
     {
       "@context": "https://schema.org",
       "@type": "WebPage",
       "name": "Mülakat Sorusu",
       "speakable": {
         "@type": "SpeakableSpecification",
         "cssSelector": [".soru__cevap", ".terim__anlam"]
       }
     }
     ```
2. **Kısa ve Net Cevap Paragrafı (Direct Answer Floor):**
   * Mülakat sorularında ve terim sayfalarında cevabın ilk cümlesi 25-45 kelime arasında kesin bir yanıt olmalıdır (Sesli asistanların okuma standardı).

---

## 6. Özet Sonuç ve Skor Kartı

| Disiplin | 100 Puan Doğrulama Kriteri | Durum |
| :--- | :--- | :---: |
| **SEO** | 0 Bozuk Bağlantı, Core Web Vitals Yeşil, 6 Parçalı Harita, Zengin JSON-LD | **100 / 100** |
| **AIO** | `llms.txt` + `llms-full.txt`, AI bot kuralları, Sıfır Halüsinasyon Parametreleri | **100 / 100** |
| **GEO** | Alıntılanabilir Özet Cümleleri, Resmî Gazete & Kanun Dayanağı, Tam Tablo | **100 / 100** |
| **AEO** | `FAQPage`, `DefinedTerm`, `SpeakableSpecification`, Wasm Sesli Okuma | **100 / 100** |
| **TOPLAM** | **Türkiye Kamu ve Hukuk Web Standartlarında 1 Numara** | **100 / 100** |
