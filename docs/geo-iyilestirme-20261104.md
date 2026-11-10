# GEO: ölçüm sınırı ve kaynak iyileştirmeleri

04.11.2026. Önceki canlı taramadaki 35,1, beş otomatik göstergenin ortalamasıdır: resmî bağlantı, yazar, tarih, liste/tablo ve 150 kelime. Bu sayı, gerçek yapay zekâ görünürlüğünün veya kaynak gösterilme olasılığının ölçümü değildir. Kısa tanımlara ve soru-cevaplara aynı uzunluk şartını uygulamak uygun değildir; yayıncı ile ilk yazar da aynı kişi olmak zorunda değildir. Bu nedenle 35,1 genel GEO başarı skoru olarak kullanılmamalıdır. Ham sonuç karşılaştırma kanıtı olarak korunur; puanı yükseltmek için geçmiş ölçüm değiştirilmedi.

## Yapılan değişiklikler

- 2.490 sözlük kaydının **2.236'sı (%89,8)**, Adalet Bakanlığı Hukuk Sözlüğü'ndeki terim **ve** tanımıyla eşleştirildi. İlgili kayıtta gerçek kaynak bağlantısı ve karşılaştırma tarihi gösteriliyor. Kaynak URL'si aynı metni içeren harf veya arama sayfasıdır; Bakanlık adına içerik onayı iddia edilmez.
- 254 kayıt için eşleşme elde edilemedi. Bunlara resmî kaynak uydurulmadı.
- 2.490 sözlük ve 2.219 mülakat kaydının mevcut arşiv yayın tarihi hem görünür künyeye hem WebPage.datePublished alanına aktarıldı. Yeniden derleme tarihi, güncelleme tarihi olarak kullanılmıyor.
- Yayıncı, profiline bağlantıyla gösteriliyor. İlk yazarı bilinmeyen kayıtlara author veya reviewedBy eklenmedi.
- Tanım değiştiğinde eski kaynak eşleştirmesi SHA-256 karşılaştırmasıyla geçersiz oluyor. Yeniden eşleştirme gerekmektedir.
- `/icerik-kaynaklari/` sayfası, arşiv kökenini, tarihleri, kaynak karşılaştırmasının sınırını ve düzeltme yolunu açıklıyor. Site haritasına ve alt menüye eklendi.
- Künye, article footer içinde tutuluyor; ana metin kelime sayısı künye eklenmesiyle yapay olarak artırılmıyor.

## Yeniden üretim ve kanıt

`node scripts/sozluk-kaynak-eslestir.mjs --deep` resmî sözlüğü okur. Terim ve tanım metni normalleştirilerek eşleştirilir; yakın kelime veya konu benzerliği eşleşme sayılmaz. Tanımlar değişmez; kaynak metinleri veri dosyasına kopyalanmaz.

Kaynak eşleştirmeleri `src/data/sozluk-kaynaklari.json`; HTTP yanıtı önbellekleri ve sayfa özetleri `artifacts/geo-iyilestirme-20261104/` altındadır. Bu dizindeki `sozluk-kaynak-kaniti.json`, kontrol edilen adresleri ve yanıt SHA-256 değerlerini kaydeder. Kaynak eşleştirme tarihi, uzman tarafından hukuki doğrulama yapıldığı tarihi ifade etmez.

Beş odaklı test; değiştirilmiş tanıma eski kaynak verilmemesini, kaynak ve tarihin görünmesini, doğrulanmamış yazar/güncelleme tarihi eklenmemesini, eşleşmeyen kayıtlarda kaynak üretilmemesini ve kaynak ilkeleri sayfasını kontrol eder: `npx playwright test tests/geo-kaynak.spec.ts`.

Son doğrulama: 5 test geçti; `npm run build` 17.888 sayfayla tamamlandı. `node scripts/geo-uretim-dogrula.mjs`, derlenmiş 4.709 kaydın tamamında gerçek arşiv tarihini, 2.236 kaynak atfını ve kaynak eşleşmeyen 254 sözlük kaydına atıf eklenmediğini doğruladı. Değişiklikler yereldir; GitHub'a gönderilmedi ve canlı GEO görünürlüğü yeniden ölçülmedi.

## Devam eden gerçek eksikler

Mülakat cevaplarının bağımsız kaynak kontrolü yapılmış değildir. Tarih veya künye eklenmesi bu cevapları doğrulamaz. Sözlükte kaynakla eşleşen bir tanım da güncel mevzuatın yerine geçmez; tarihsel kanun atıfları ve eksik tanımlar ayrıca editoryal inceleme gerektirir. Adli çevrede mevcut karara bağlı kaynaklar korunur; her kayda ilgisiz bir kurum ana sayfası eklenmez.

Gerçek GEO değerlendirmesinde konu bazında temsili sorular, verilen yanıtların doğruluğu, kaynak gösterilen sayfalar ve zaman içindeki görünürlük izlenmelidir. Bu çalışma henüz bu dış görünürlük ölçümünü yapmaz. GSC, GA ve Cloudflare hesap verilerine erişim de önceki denetimde sağlanamadı.

Dayanaklar: [Adalet Bakanlığı Hukuk Sözlüğü](https://sozluk.adalet.gov.tr/), [Google: AI özellikleri](https://developers.google.com/search/docs/appearance/ai-features), [Google: yararlı ve güvenilir içerik](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
