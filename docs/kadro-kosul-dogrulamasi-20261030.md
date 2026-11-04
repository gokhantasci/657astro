# Kadrolu maaş koşullarının kontrolü — 30.10.2026

MAHEP'in 270 unvanlık canlı envanteri tarandı. Seçili unvan/koşul/derece ve kişisel alan denetimi geçen 5.026 kaynak profili yerel önbellekte tutuluyor. Bu sayı yerel motorun tamamının doğrulandığı anlamına gelmez.

Önceden ayrı cetvelleri bulunan unvanlara ek olarak 258 unvan kaydı ve 534 kurum/öğrenim koşulu üretildi. 4.744 derece/koşul bordrosu; kişisel brüt, çalışan emekli primi, GSS, gelir vergisi, damga vergisi ve net açısından kuruş düzeyinde sınanır. Aynı 258 unvanın her biri için iki ek sentetik profil vardır: 5510/aile/sendika/%5 BES ve 5434/kıdem/engellilik/çocuk/%3 BES. Toplam 516 ek profil, pratisyen tabibin bir ek sendikalı profili ve 209 ek 3 kapsamındaki 31 derece/koşulun her birinde sendika/aile/%5 BES profili var: 548 kişisel profil. Sendika karşılığı nominal oranlar 1–2, 3–4 ve diğer derecelerde ayrı; aidat ve GV matrahı kuruşa yuvarlanır. Hepsi aynı kalemlerle kontrol edilir.

Memurlar.net ile ödeme oranları eşleşen 679 kaynak çifti ayrıca karşılaştırılır. Kaynakta 33.000 TL damga istisna tabanı ile kesilmemiş ara prim matrahından yuvarlama görüldüğünden, yerel 33.030 TL tabanına göre ortaya çıkan farklar kalem bazında açıklanır; netler yalnız tolerans verilerek eşit sayılmaz. Memurlar.net'in tüm unvan/koşullarını kapsayan ek tarama ve eşleme henüz tamamlanmış değildir.

## Tamamlanmayan kapsam

Önceki 122 bekleyen profilin tamamı çözüldü: 78 zabıta örneğinde kesirli yan ödeme puanı; 13 örnekte kişisel gelire eklenmemesi gereken PEKFarkBilgi; 31 hekim örneğinde %265/%335 209 ek 3 ödemesi. Üretilen 4.744 temel bordroda ret yok. 209 ödemesi GV ve DV'ye dahil, prime dahil değil; sendika matrahında 375 ek 9 karşılığı net ödeme kullanılır. Bu ayrım sendikalı ve sendikasız örneklerle sınandı. [TBMM 2022 düzenleme açıklaması](https://www.tbmm.gov.tr/Haber/Detay?Id=9a2b34d7-4433-49cb-afba-4c52aa2db8be), 265/335/410 oranlarını açıklar.

Memurlar.net sınır taramasında 954 seçimi denetlenmiş sonuç, 326 reddedilen istek var. Uyumlu cetvel eşlemesi 679 çift üretir. Dört eşleme farklı ödeme rejimi nedeniyle aynı kabul edilmedi: orman muhafazada kaynağın ayrıca tayin bedeli eklemesi, psikologda MAHEP'in net korumalı ek ödemesine karşı Memurlar.net'in nominal ödemesi. Kalem ve tutarlar `kaynak-rejim-farklari.json` içinde. Kaynakta aynı ada sahip koşulların otomatik eşdeğer sayılması önlendi.

270 MAHEP unvan adının tamamı yerel seçeneklerde bulunuyor; toplam 281 yerel unvan etiketi var. Bununla birlikte eski 657'deki “Cezaevi Müdürü (Özel +13 P)” koşulu bağımsız doğrulanmadığından sonuç üretmez. Bütün görev yeri/ek görev ve geçmiş yıllar birleştirmeleri doğrulanmış sayılmaz.

Yeni koşullar açıkça seçilir. Önceden doğrulanmış eski profil ve görev yeri davranışı bulunan unvanlar varsayılanını korur. Bu tarama, bağımsız kadro/emeklilik derecesi, tüm coğrafi/kurumsal artırımlar, döner sermaye, nöbet ve kişisel istisnaların her birleşiminin doğrulandığı anlamına gelmez. Yeni eklenen tüm unvanlar için geçmiş yıllara ait maaş arşivi oluşturulmuş değildir.

Mevcut yıllık maaş profillerindeki 38 ortak kod, formdaki bağımsız unvan koduna geçirildi. Böylece güncel sayfa ve geleceğe ilişkin tahmin aynı unvanı kullanır. Geçmiş aktarım tutarları yeniden hesaplanmaz; güncel yayın derleme sonunda kendi hesap bağlamıyla arşivlenir.

Kullanıcının paylaştığı bordrodan kimlik, kurum sicili veya başka kişisel bilgi depoya aktarılmadı. Formda BES kapalı, sendika üyeliği açık. Yazı işleri müdürü 3. derece profilinde yan ödeme 1.600 ve görev yeri ilavesinden önce ÖHT %135 düzeltildi. Paylaşılan bordronun netine ilişkin incelemede işveren primleri, kişisel gelirden ayrı değerlendirildi. İcra alanı varsayılan olarak bordroda görünen toplam kesintiyi aynen düşer; harç hariç ana tutara %4,55 eklenmesi ayrı seçenektir. Böylece bordrodaki toplam kesintiye ikinci kez harç uygulanmaz. Herkese açık regresyon testi farklı, sentetik icra tutarı kullanır.

Maaş haczinde %4,55 oranının kaynağı: [GİB, 98 seri no.lu Harçlar Kanunu Genel Tebliği eki, (1) sayılı tarife B/I/3-d](https://cdn.gib.gov.tr/api/gibportal-file/file/getFile?objectKey=MEVZUAT_TEBLIGLER%2FUNIVERSAL%2F2025%2F492_Teblig98.pdf).

## Yeniden üretim

- `python scripts/kaynak/mahep-dogrula.py`
- `python scripts/kaynak/standart-kadro-uret.py`
- `python scripts/kaynak/standart-kadro-karsilastir.py`
- `python scripts/kaynak/kadro-varyantlari.py`
- `python scripts/kaynak/kadro-kisisel-fixture.py`
- `npx playwright test tests/standart-kadro.spec.ts tests/kadro-kisisel.spec.ts tests/maas-varsayilan.spec.ts tests/saglik-ek-odeme.spec.ts`

Ham kaynak form durumları ve geçici belirteçler Git dışında kalır. Yalnız sayısal gözlemler, sentetik girdiler ve üretilmiş ödeme cetvelleri yayımlanır. Bu dosyadaki sayılar belirtilen denetim anına aittir.

## Memurlar.net’teki ek adlar

MAHEP ad listesinde olmayan 64 Memurlar.net başlığının 27’sinde standart 657 gelir ve prim yapısı çıkarıldı. 28 koşul ve 215 derece/koşul sonucu eklendi; yalnız kaynakta seçim ve kalem denetimi geçen dereceler sunulur. 666/2802 kapsamındaki üst kadrolar, hâkimler ve ayrı ödeme kalemleri standart cetvele zorla eklenmez. Üretilen ek unvanlar ayrıca `memurlar-ek.spec.ts` ile gelir, prim, damga istisnası ve net farkı kapanışı bakımından kontrol edilir. Diğer 37 ad ve kalan özel rejimler tamamlanmadı.
