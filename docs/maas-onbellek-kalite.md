# Kaynak maaş taramasının kalite kontrolü

30-10-2026 yerel denetimi. Yeniden üretim: `python scripts/kaynak/onbellek_raporu.py`. Başlangıç JSON'u ve işçi dosyaları kayıt anahtarıyla birleştirilir; farklı değerli tekrarlar çelişki sayılır, boş yanıtlar başarı sayılmaz. Kaynak HTML ve ham sonuçlar `artifacts/kaynak-onbellek/` içinde, Git dışında korunur.

| Kaynak | Benzersiz kayıt | Boş | Çelişkili | Dolu, çelişkisiz |
| --- | ---: | ---: | ---: | ---: |
| MAHEP | 2.675 | 0 | 0 | 2.675 |
| Memurlar.net | 2.504 | 1.197 | 0 | 1.307 |

Bunlar yalnız kaynak yanıtlarıdır. Yerel motorla sayısal eşleşme, bütün unvanların tamamlandığı veya bütün derece/kademe koşullarının geçerli olduğu anlamına gelmez. Boş yanıtın nedeni geçersiz derece, yönlendirme, kaynak erişim hatası veya sonuç ayrıştırma sorunu olabilir; kaynak formuyla yeniden kontrol edilmeden karar verilmez.

MAHEP istemcisi eskiden UTF-8 çözümlemesinde geçersiz baytları U+FFFD ile değiştiriyordu. Türkçe adların kaybolmasını önlemek için katı UTF-8, ardından Windows-1254 çözümlemesi eklendi. Önceden bozulmuş unvan envanteri bu değişiklikle kendiliğinden düzelmez; ilgili ham kayıtların yeniden alınması gerekir. Unvanlar bozuk metinden tahmin edilerek eşleştirilmez. `test_sayfa_metni.py` Türkçe unvanları her iki kodlamada ve önceden bozulmuş verinin reddini kontrol eder.

## Seçili form alanlarının denetimi

Sonraki incelemede 2.825 MAHEP kaydının 81'inde istenen profil ile dönen formun seçili derecesi farklı bulundu. Yukarıdaki ilk tablo yalnız dolu yanıt sayısını gösterir; bu 81 kayıt doğrulanmış bordro sayılmaz. Örneğin 1/1 istenmesine rağmen 13/1 seçili form dönebiliyordu. Sebep, eski önbellek sayfasından taşınan form durumuydu.

`mahep-dogrula.py` unvan ve koşul geçişlerini canlı formda yapar; hesap sonrası unvan, koşul, derece, kademe ve kişisel seçimleri kontrol eder. Hatalı seçimler reddedilir. `standart-kadro-uret.py` yalnız bu kontrolü geçen kayıtları ve ayrıca denetlenmiş eski kayıtları işler. Ödeme toplamı, prim matrahı ve kalemleri uzlaşmayan özel rejimler cetvele eklenmez. Ham HTML ve form alanları geçici kaynak belirteçleri içerebildiğinden Git'e alınmaz; herkese açık testlere yalnız sayısal sonuçlar ve sentetik girdiler aktarılır.
