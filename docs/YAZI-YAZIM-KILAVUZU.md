# 657.com.tr Haber ve Rehber Yazım Kılavuzu (SEO · AIO · GEO · AEO)

Bu kılavuz, 657.com.tr üzerinde yayımlanan tüm haber, duyuru ve rehberlerin **hem insansı ve akıcı bir Türkçe ekonomi/kamu haberi dilinde** hem de arama ve yapay zekâ yanıt motorları (Google, Bing, ChatGPT, Perplexity, Gemini) için **en yüksek kalite skorunda (85+/100)** üretilmesini sağlar.

## 1. Altın Kurallar (Ton ve Üslup)
- **Robotik dilden kaçın:** *"Ortak yönetim kaydından otomatik hazırlanmıştır"*, *"max(0; ...)"* gibi yazılım/sistem ifadeleri yerine doğrudan okuyucuya (memur, sözleşmeli, emekli, aday) hitap eden açık, net, profesyonel Türkçe kullan.
- **İlk paragrafta doğrudan yanıt (AEO):** Okuyucu ilk 2–3 cümlede ana rakamı, tarihi veya kuralı öğrenmelidir.
- **Resmî dayanak (GEO / Güven):** Her rakam ve kuralda resmî kaynak (Resmî Gazete, HMB Genelgesi, TÜİK, PGM, CTE, HSK, ÖSYM) adı ve bağlantısı verilir.
- **Eyleme geçirici iç bağlantılar:** Yazı içinde ilgili hesaplama robotuna (`/memur-maas-hesaplama/`, `/enflasyon-farki-hesaplama-robotu/`, `/hukuki-sure-hesaplama/`, `gys.657.com.tr`, `onparmak.657.com.tr`) en az 2 doğal bağlantı verilir.

## 2. Zorunlu Yapı (Minimum 85/100 Skor İçin)
1. **Frontmatter:**
   - `title`: Net, yıl ve konu içeren başlık (50–68 karakter).
   - `description`: 90–160 karakter arası, özetleyici ve tıklanabilir açıklama.
   - `date` (ve varsa `updated`), `kategori`, `kaynak`.
2. **İçerik İskeleti (En az 300 kelime, en az 2 adet `##` alt başlık):**
   - **Giriş (Spot):** Ne oldu, kimleri ilgilendiriyor, yürürlük tarihi nedir?
   - **`##` Rakamlar / Şartlar / Tablo:** Taranabilir Markdown tablo veya madde listesi.
   - **`##` Uygulamada Ne Değişiyor? / Nasıl Hesaplanır?:** Memur ve emeklinin günlük hayatına etkisi + ilgili 657.com.tr araç bağlantıları.
   - **`##` Resmî Kaynak:** Dayanak genelge / kanun bağlantısı.

## 3. Otomatik Kalite Denetimi
Yeni yazı ekledikten sonra tüm arşivi skorlamak için:
```bash
node scripts/yazi-skorla.mjs
```
