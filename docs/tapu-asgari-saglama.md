# Tapu harcı ve asgari ücret istisnası

Kontrol tarihi: 30-10-2026. Kaynak sitede yer alan açıklama örneği, canlı formdan alınmış bordro sonucu olarak sayılmaz.

## Tapu

Eski adres `/tapu-harci-hesaplama-2/` korunur. Saf hesap `src/lib/tapu-harci.ts`; tarife `src/data/tapu-tarifesi.json`.

- [GİB Harçlar Kanunu](https://gib.gov.tr/mevzuat/kanun/439), m.63 ve (4) sayılı tarife I/20-a: bedel ile emlak vergi değerinden yüksek olanı, 10 TL altı matrah kesri atılarak, her taraf için binde 20.
- [98 sayılı Tebliğ](https://cdn.gib.gov.tr/api/gibportal-file/file/getFile?objectKey=MEVZUAT_TEBLIGLER%2FUNIVERSAL%2F2025%2F492_Teblig98.pdf), PDF sayfa 5: oranla alınan harçta en az 411,60 TL. Yerel `artifacts/harc2026.pdf` dosyası görsel olarak kontrol edildi. Bazı dış hesaplarda görülen 346,10 TL, 2026 tutarı değildir.
- [TKGM 2026 tarifesi](https://www.tkgm.gov.tr/sites/default/files/2025-12/2026%20tarife%20ctv.pdf): gösterge 2.227 TL, ilave gösterge 307 TL. Bağımsız bölüm başına tam ücret; kat mülkiyeti/irtifakı olmayan diğer taşınmazların tek talebinde ilave gösterge. Yetki dışı işlemde döner sermaye iki kat. Ekran kuruşlu çarpımı gösterir; tarifenin tahakkuk yuvarlaması ayrıca açıklanır.
- [Saffet Çelik açıklama örneği](https://saffetcelik.com.tr/uygulamalar/tapu-harci-hesaplama): 3.000.000 TL, katsayı 1 → alıcı harcı 60.000, satıcı harcı 60.000, döner sermaye 2.227; alıcı döner sermayeyi karşılarsa 62.227 TL. Bu turda kaynak canlı form etkileşimi yapılmadı.

Testler: emlak vergi değeri üstünlüğü, matrah kesri, düşük bedelde asgari harç, ilave taşınmaz ile bağımsız bölüm farkı, yetki dışı çarpanı, geçersiz tutar ve form değişikliği. Çoklu taşınmaz örnekleri yalnız aynı nitelik ve aynı birim değerlere sahip taşınmazları kapsar. Satış+ipotek, yabancı taraf, muafiyet ve karma talepler kapsam dışıdır.

## Asgari ücret istisnası

Eski adres `/asgari-ucret-istisna-oranlari/` korunur. Brüt asgari ücret ve tüm dilimler maaş motorundaki `src/data/vergi.json` kaydından gelir; ayrı katsayı/vergi kopyası yoktur. Ara zam, yalnız senaryo alanıdır.

`tests/asgari-istisna.spec.ts`: 2026 Ocak net/matrah 28.075,50 TL, GV istisnası 4.211,33 TL, DV 250,70 TL. Temmuz dilim geçişi 4.537,75 TL; Ağustos 5.615,10 TL. On iki ay maaş motorunun `vergiIstisnasi` fonksiyonuyla ayrıca karşılaştırılır. Temmuzda varsayımsal brüt 40.000 TL senaryosu önceki altı ayın 168.453 TL matrahını korur; Temmuz GV istisnası 5.722,65 TL olur.

Kaynaklar ortak vergi kaydındaki [GİB GVK](https://gib.gov.tr/mevzuat/kanun/433/madde/6937) ve [2026 ücret rehberi](https://intvrg.gib.gov.tr/hazirbeyan/assets/pdf/DUYURU_UNIVERSAL_2026_2026_Ucret_Geliri.pdf). Tam yıl aynı işveren örneği; birden çok işveren veya yıl ortasında başlangıçta kişisel bordro uygulaması ayrıca değerlendirilir.
