# Görünür tarih biçimi — 5 Kasım 2026

Tam takvim tarihleri site genelinde iki basamaklı gün/ay ve dört basamaklı yıl ile `gg.aa.yyyy` gösterilir. Örnek: `01.01.2024`. Saatli durum satırları `05.11.2026 20:44` biçimindedir; saatler Europe/Istanbul'a göre gösterilir. Sadece yıl veya ay/yıl bilinen etiketlere gün eklenmez.

`src/lib/bicim.ts` içindeki `gun`, `takvimTarihi` ve `tarihSaat` ortak biçimlendiricilerdir. `src/lib/tarih-metni.ts` eski ISO, eğik çizgili, tek basamaklı ve tam ay adı içeren görünür tarihleri normalleştirir; takvimde geçersiz tarihleri düzeltmeye çalışmaz. HTML middleware yalnız görünür metin ve açıklayıcı öznitelikleri işler. URL, kimlik, datetime, veri alanı, JSON-LD, kod örneği ve tarih seçicisinin ISO değeri korunur.

Tarife arşivlerinin grafik ve karşılaştırma tablosu istemcide oluşturulduğundan doğrudan ortak `gun` işlevini kullanır. Haber akışı, sayaç ölçüm başlangıcı, kesinleşme sonuçları, tarih giriş maskesi, asistan ve belge çıktıları da aynı kurala bağlandı. Tarih girişi noktalı gösterilir; mevcut eğik çizgili girişler okunmaya devam eder. Eski teftiş iframe'leri hazırlanırken ve sonradan hücre oluştururken aynı tarih normalleştirme işlevi kullanılır.

Denetim: `node scripts/seo-denetim/tarih-bicimi.mjs`. Derlenmiş HTML dosyalarında metin ve erişilebilir açıklamalar taranır; teknik alanlar kapsam dışında tutulur. İlk denetimde eski teftiş ekranlarında kalan dört alan tespit edildi; düzeltmeden sonra 17.987 HTML dosyasında kalan biçim farkı sıfırdı.

Doğrulama: 15 tarife arşivinin tablo/grafik tarihleri, tarih alanlarının en-US tarayıcıda yazılması ve ISO değerinin korunması, İstanbul gece yarısı, artık yıl, kod/URL/JSON-LD koruması, haber ve hesaplama sayaçları, kesinleşme, asistan, tazminat ve teftiş aktarımları sınandı. Tarih değişikliği hesaplama formüllerini veya yürürlük karşılaştırmalarını değiştirmez.

Yayın 42084544585 başarıyla tamamlandı (b88077f). Canlı, özgün `?yil=hepsi` adresinde tüketici hakem heyeti tablosunun altı tarihi 01.01.2024–01.07.2026 biçiminde doğrulandı; ek sürüm parametresi gerekmedi. Haber tarihi 05.11.2026, en-US tarayıcıda tarih girişi 26.10.2026; alttaki ISO değeri 2026-10-26 ve tarife JSON kayıtları korunmuş durumda. Son derleme sonrası 17.987 HTML taramasında biçim farkı sıfır.
