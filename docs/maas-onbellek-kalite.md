# Kaynak maaş taramasının kalite kontrolü

30-10-2026 yerel denetimi. Yeniden üretim: `python scripts/kaynak/onbellek_raporu.py`. Başlangıç JSON'u ve işçi dosyaları kayıt anahtarıyla birleştirilir; farklı değerli tekrarlar çelişki sayılır, boş yanıtlar başarı sayılmaz. Kaynak HTML ve ham sonuçlar `artifacts/kaynak-onbellek/` içinde, Git dışında korunur.

| Kaynak | Benzersiz kayıt | Boş | Çelişkili | Dolu, çelişkisiz |
| --- | ---: | ---: | ---: | ---: |
| MAHEP | 2.675 | 0 | 0 | 2.675 |
| Memurlar.net | 2.504 | 1.197 | 0 | 1.307 |

Bunlar yalnız kaynak yanıtlarıdır. Yerel motorla sayısal eşleşme, bütün unvanların tamamlandığı veya bütün derece/kademe koşullarının geçerli olduğu anlamına gelmez. Boş yanıtın nedeni geçersiz derece, yönlendirme, kaynak erişim hatası veya sonuç ayrıştırma sorunu olabilir; kaynak formuyla yeniden kontrol edilmeden karar verilmez.

MAHEP istemcisi eskiden UTF-8 çözümlemesinde geçersiz baytları U+FFFD ile değiştiriyordu. Türkçe adların kaybolmasını önlemek için katı UTF-8, ardından Windows-1254 çözümlemesi eklendi. Önceden bozulmuş unvan envanteri bu değişiklikle kendiliğinden düzelmez; ilgili ham kayıtların yeniden alınması gerekir. Unvanlar bozuk metinden tahmin edilerek eşleştirilmez. `test_sayfa_metni.py` Türkçe unvanları her iki kodlamada ve önceden bozulmuş verinin reddini kontrol eder.
