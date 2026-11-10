# UDF görüntüleyici · yerel UYAP Kelime İşlemci referansı

Kaynak: `D:\UYAP Kelime İşlemci` içindeki `uki-core.js`, `uki-pages.js`, örnek UDF ve özellik matrisi. Referans proje MIT lisanslıdır. Bu çalışmada uygulama kodu veya görsel varlıklar kopyalanmadı; belge biçimi ve görünüm davranışı incelenerek mevcut Astro görüntüleyicisine uyarlandı.

## Uygulananlar

- `documentproperties.xml` içindeki resmî Java Properties DTD bildirimi güvenli biçimde kaldırılarak yalnız `uyapsicil` ve `uyapdogrulamakodu` alanları okunur. Farklı DTD ve XML varlıkları işlenmez.
- `webID` doğrulama satırı, dosyadaki koddan yerel üretilen karekod ve sicil filigranı belge sayfalarında gösterilir. Kodun doğruluğu veya elektronik imzanın geçerliliği hakkında sonuç üretilmez.
- `TabSet` sekme durakları, `borderNone` tablolar, A4/A5/Letter boyutları ve yatay yön dosyadaki sayfa ayarına göre çizilir.
- Üst yazının başladığı sayfa ve `1/3` sayfa numarası biçimi korunur. Uzun paragraflar metni kaybetmeden sayfalara bölünür.

## Doğrulama

`tests/udf-gorunum.spec.ts` içinde `örnek karar.udf` ve üretilen UDF örnekleriyle sayfalama, karekod, filigran, sekme, tablo, kâğıt yönü ve yabancı DTD davranışı sınanır.

## Sınır

Görüntüleyici yerel bir önizlemedir. `sign.sgn` dosyasının varlığını bildirir, fakat sertifika zinciri ve imza içeriği doğrulaması yapmaz. Karekod, belgedeki doğrulama kodunu taşır; resmî sorgu otomatik açılmaz.
