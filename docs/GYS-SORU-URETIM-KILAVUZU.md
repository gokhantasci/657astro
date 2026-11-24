# GYS & İcra MY Çoklu-Agent Soru Üretim Kılavuzu (`gys.657.com.tr`)

Bu dosya, herhangi bir yapay zeka ajanına *"Bu kılavuzu ve ilgili mevzuat metnini okuyarak soru üret"* talimatı verildiğinde **%100 şema uyumlu, doğrudan kanuni lafza sadık, kombinatoryal ve doğrulanabilir** sorular hazırlanması için tek referans standardıdır.

---

## 1. Temel Hukuki ve Akademik İlkeler

1. **Kanuni Metne Birebir Sadakat:** Sorularda ve şıklarda yalnızca yürürlükteki kanun, yönetmelik veya Adalet Bakanlığı genelgesindeki **doğrudan resmî tabirler** kullanılır. Günlük konuşma diliyle yumuşatılmış veya mevzuatta geçmeyen uydurma terimler kesinlikle kullanılmaz.
2. **Tek Kaynaklı Paylaşım (`kanun` + `bolum`):** Aynı soru birden fazla ünvan için kopyalanmaz. Soru yalnızca ilgili `kanun` ve alt `bolum` (ünite) kimliğine eklenir; o üniteden sorumlu tüm kurum/sınav/ünvan dallarında (`src/data/gys-agac.json`) otomatik sayılır.
3. **Soru Çeşitliliği (`tur` alanı):**
   - `madde`: Doğrudan madde, fıkra, süre, rakam, merci veya istisna sorusu.
   - `capraz-madde`: En az iki farklı maddeyi veya kanun + yönetmelik/genelge hükmünü iç içe birleştiren karma soru.
   - `vaka-yorum`: Kısa kalem/adliye/icra/cezaevi uygulama olayı üzerinden mevzuat yorumu.
   - `genelge`: `src/data/adalet-genelgeleri.json` içindeki resmî Adalet Bakanlığı genelgelerinden doğrudan uygulama sorusu.
   - `cikmis-benzeri`: Geçmiş PGM/CTE (ANKÜSEM/MEB) veya İcra MY (ÖSYM) sınav kalıplarını esas alan özgün soru.
4. **5 Zorluk Seviyesi (`seviye`):**
   - `kolay` (temel tanım/süre) · `orta` (standart GYS düzeyi) · `zor` (istisna/çeldirici ağırlıklı) · `akademik` (doktrin + iç içe madde yorumu) · `dip` (en ince fıkra/bent/genelge detayı; bu seviyeyi tam yapan sınavda soru kaçırmaz).

---

## 2. Kombinatoryal Şık Havuzu Kuralı

Her soruda sabit 5 şık yerine **iki ayrı dizi** bulunur:
- `dogru`: **En az 1** doğru seçenek. Çoklu doğru üretilebilen sorularda (ör. *"Aşağıdakilerden hangisi elektronik tebligat zorunluluğu kapsamındadır?"* veya *"Hangisi 657'ye göre aylıktan kesme cezasını gerektirir?"*) **3 ile 10 arası** doğru seçenek eklenir.
- `yanlis`: **En az 4** güçlü, mevzuat diliyle yazılmış çeldirici. Çoklu havuzlarda **6 ile 12 arası** yanlış seçenek eklenir.

Sınav motoru (`src/lib/gys-motor.ts`) her soruda:
- **Klasik Mod (5 şık):** `dogru` havuzundan rastgele **1** doğru + `yanlis` havuzundan rastgele **4** yanlış çekip karıştırır.
- **İkili Hızlı Tekrar (2 şık):** `dogru` havuzundan rastgele **1** doğru + `yanlis` havuzundan rastgele **1** yanlış çekip karıştırır.

Böylece tek bir soru yüzlerce farklı şık kombinasyonuyla tekrar çözülebilir.

---

## 3. Zorunlu JSON Şeması

Yeni soru paketleri `src/data/gys-sorular-<paket>.json` dosyasına dizi (`GysSoru[]`) olarak eklenir:

```json
{
  "id": "7201-capraz-041",
  "kanun": "7201",
  "bolum": "7201:elektronik",
  "seviye": "dip",
  "tur": "capraz-madde",
  "soru": "7201 sayılı Tebligat Kanunu m. 7/a ve Elektronik Tebligat Yönetmeliği m. 9 birlikte değerlendirildiğinde, elektronik yolla tebligat muhatabın elektronik adresine ulaştığı tarihi izleyen kaçıncı günün sonunda yapılmış sayılır ve zorunlu kapsamda olup tebligat çıkarılmasına rağmen teknik nedenle elektronik tebligat yapılamaması hâlinde hangi usule başvurulur?",
  "dogru": [
    "Beşinci günün sonunda yapılmış sayılır; teknik nedenle yapılamazsa Kanunda belirtilen diğer usullerle tebligat yapılır."
  ],
  "yanlis": [
    "Üçüncü günün sonunda yapılmış sayılır; yeniden elektronik tebligat çıkarılması zorunludur.",
    "Yedinci günün sonunda yapılmış sayılır; doğrudan ilanen tebligat yoluna gidilir.",
    "On beşinci günün sonunda yapılmış sayılır; yalnızca zabıta marifetiyle tebliğ edilir.",
    "Ulaştığı günün sonunda yapılmış sayılır; tebligat geçersiz sayılır."
  ],
  "kaynak": "7201 sayılı Tebligat Kanunu m. 7/a f. 4–5; Elektronik Tebligat Yönetmeliği m. 9/6",
  "mevzuatUrl": "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=7201&MevzuatTur=1&MevzuatTertip=3",
  "aciklama": "7201 sayılı Kanun m. 7/a gereğince elektronik yolla tebligat, muhatabın elektronik adresine ulaştığı tarihi izleyen beşinci günün sonunda yapılmış sayılır. Elektronik yolla tebligatın zorunlu bir sebeple yapılamaması hâlinde Kanunda belirtilen diğer usullerle tebligat yapılır."
}
```

### Geçerli `kanun` ve `bolum` Kodları
- `7201`: `7201:genel`, `7201:usul`, `7201:ozel`, `7201:kaza-idari-mali`, `7201:cezai`, `7201:elektronik`
- `657`: `657:temel`, `657:disiplin`, `657:izin-mali`
- `anayasa`: `anayasa:temel`, `anayasa:organlar`
- `6100`: `6100:hmk-cmk`, `6100:yazi-isleri`, `6100:harclar`
- `5275`: `5275:infaz`, `5275:yonetim`
- `5018`: `5018:mali`, `5018:ihale-harcirah`
- `icra`: `icra:iik`, `icra:vergi-harc`, `icra:ttk-tbk`
- `genelge`: `genelge:disiplin-personel`, `genelge:ceza-sorusturma`, `genelge:hukuk-uyap`
- `ortak`: `ortak:yazisma-etik`, `ortak:turkce-inkilap`

---

## 4. Zorunlu Doğrulama Komutu

Her soru üretiminden sonra aşağıdaki doğrulama betiği çalıştırılmalıdır; 0 hata vermeden commit yapılmaz:

```powershell
node scripts/gys-dogrula.mjs
```
