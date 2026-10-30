# Kadrolu maaş koşullarının kontrolü — 30.10.2026

MAHEP'in 270 unvanlık canlı envanteri tarandı. Seçili unvan/koşul/derece ve kişisel alan denetimi geçen 5.026 kaynak profili yerel önbellekte tutuluyor. Bu sayı yerel motorun tamamının doğrulandığı anlamına gelmez.

Önceden ayrı cetvelleri bulunan unvanlara ek olarak 251 unvan kaydı ve 523 kurum/öğrenim koşulu üretildi. 4.622 derece/koşul bordrosu; kişisel brüt, çalışan emekli primi, GSS, gelir vergisi, damga vergisi ve net açısından kuruş düzeyinde sınanır. Aynı 251 unvanın her biri için iki ek sentetik profil vardır: 5510/aile/sendika/%5 BES ve 5434/kıdem/engellilik/çocuk/%3 BES. Toplam 502 ek profil de aynı kalemlerle kontrol edilir.

Memurlar.net ile ödeme oranları eşleşen 625 kaynak çifti ayrıca karşılaştırılır. Kaynakta 33.000 TL damga istisna tabanı ile kesilmemiş ara prim matrahından yuvarlama görüldüğünden, yerel 33.030 TL tabanına göre ortaya çıkan farklar kalem bazında açıklanır; netler yalnız tolerans verilerek eşit sayılmaz. Memurlar.net'in tüm unvan/koşullarını kapsayan ek tarama ve eşleme henüz tamamlanmış değildir.

## Tamamlanmayan kapsam

122 derece/koşul profili cetvele alınmadı: 78 oran/ödeme yuvarlaması, 31 ayrı ödeme kalemi, 13 gelir/prim matrahı uyuşmazlığı. Diş tabibi, uzman tabip, uzman diş tabibi ve TUTG uzmanındaki 209 sayılı Kanun ek 3 ödemesi ile zabıta koşullarının bazı oranları ayrıca incelenmelidir. BİM müdür yardımcısında bazı dereceler ve diğer birkaç unvanın tekil dereceleri de bekler. Eksik koşula karşılık tahmini katsayı yazılmadı.

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
