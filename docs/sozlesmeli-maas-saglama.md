# Sözleşmeli maaş cetveli

29-10-2026 tarihinde [Memurlar.net 4/B formundaki](https://www.memurlar.net/maas/sozlesmeli/) 58 unvanın 91 öğrenim/kurum/görev koşulu incelendi. Her koşul için 0–25 hizmet yılları ayrı ayrı sorgulandı; 50 yıl sorgusu son basamağın 25 yıl olduğunu doğruladı. Sayfadaki 60 seçim, bu 58 unvana ek olarak önceki silahlı/silahsız güvenlik görevlisi seçimlerinin korunmasından oluşur. Proje Uzmanı eklendi.

`src/data/sozlesmeli-unvanlar.json` kaynak tarihini, temel aylık katsayısını, kaynak unvan adresini ve her hizmet yılının sözleşme ücretini/ek ödeme oranını tutar. `yillar[0]` sıfır hizmet yılıdır. Kaynakta hesap üretilemeyen birleşimler `null` bırakıldı; yakın bir yılın tutarıyla doldurulmadı. Böyle bir seçimde sonuç temizlenir ve kullanıcı sözleşme ücretini elle girebilir. Her unvan ve koşulun sıfır hizmet yılı verisi mevcuttur.

Ücret, kaynaktaki 2026 ikinci yarı aylık katsayısı 1,575512 üzerinden ortak dönem katsayısının değişim oranıyla güncellenir. Bu, mevcut ücretin genel katsayı artışıyla devamını modeller; unvana özel yeni mevzuat veya ek ödeme oranı değişikliği cetvelde ayrıca işlenmelidir. Ücret/oran elle giriş seçeneği kişisel sözleşme farklarını karşılar.

## Vergi ve yıllık matrah

Otomatik önceki matrah, işe başlama/matrah başlangıç ayından ödeme ayına kadar aynı sözleşme ve kişisel bilgileri kullanır. Önceki ayların ücretleri kendi ortak katsayılarıyla hesaplanır. Bu amaçla 2026 Ocak–Haziran dönemi [HMB 06-01-2026 genelgesinden](https://ms.hmb.gov.tr/uploads/2026/01/2026-Yili-Ocak-Ayina-Ait-Mali-ve-Sosyal-Haklara-Iliskin-Genelge-f65182d63c880a4c.pdf) ortak ayarlara eklendi: aylık 1,387871, taban 22,722793, yan ödeme 0,440141. Eski yayımlanmış unvan maaşı arşivleri tekrar hesaplanmadı. İlk hesap yayını olan Temmuz 2026 ve sonrasındaki arşiv zorunluluğu korunur.

İşe yıl içinde başlanınca asgari ücret istisnasının birikimi de bu aydan başlar. Sonraki sözleşme yenilemesi geçmiş matrahı sıfırlamaz; bu alan yıllık matrahın fiilen başladığı aydır. Önceki ücret/kesinti bilgileri farklıysa bordrodaki önceki matrah elle girilir.

Gelir vergisi ve damga vergisinde `vergi.json` ortak verileri kullanılır. Kaynak çıktısındaki net rakamları aynen kopyalamak amaçlanmadı. Örneğin Ekim 2026, sıfır hizmet, o ay işe giriş, BES/sendika yok durumunda mühendis: kaynak brüt ücret 59.632,71 TL, gelir toplamı 104.243,33 TL ve GV matrahı 51.284,13 TL eşleşir. Kaynak GV istisnası 4.207,54 TL ve DV istisnası 250,47 TL kullanmaktadır; ortak resmî veride 4.211,33 TL ve 250,70 TL bulunur. Net kaynakta 91.868,94 TL, ortak verilerle 91.872,96 TL'dir. Ocaktan devam eden kişide Ekim GV istisnası yıllık birikim nedeniyle ayrıca farklıdır.

## Kontroller

`tests/fixtures/sozlesmeli-maas.json` kaynakta elde edilen sekiz bordronun brüt, matrah ve net tutarlarını saklar. `tests/sozlesmeli-tarife.spec.ts` ücret/oran, brüt toplam, matrah ve ortak vergi verileriyle beklenen netleri denetler. Ayrıca bütün unvan/koşulların açılışı, hizmet yılı değişimi, öğrenim seçimi, eksik kaynak, elle ücret, sıfırlama ve ortak katsayıyla güncelleme kontrol edilir. `tests/diger-maas.spec.ts` mevcut 4BMAHEP örneklerini ve mobil açık/koyu temaları korur.

Nöbet, döner sermaye, eksik gün, rapor, belediye/kurumun ayrı ilaveleri ve özel sözleşme ücretleri tam ay genel 4/B cetvelinden otomatik türetilmez.
# 03/11/2026 unvan envanteri ek kontrolü

`tests/fixtures/sozlesmeli-unvanlar-20261103.json` canlı Memurlar.net sözleşmeli ekranındaki 58 unvanı kaydeder; `tests/guncel-veriler.spec.ts` tamamının yerel 60 seçenek içinde olduğunu doğrular. MAHEP 4/B unvan listesi yerine brüt sözleşme ücreti alır. Bu kontrol kişisel bordro koşullarının tüm birleşimlerinin doğrulaması değildir.

# 13/11/2026 Adalet 4/B zabıt katibi bordro doğrulaması

Kullanıcının yüklediği Sakarya Adliyesi Ekim 2026 KBS bordrosu (sözleşmeli zabıt katibi, evli, 1 çocuk, sendika üyesi) kalem kalem çözüldü:

| Bordro kalemi | Kaynağı |
|---|---|
| Sözleşme ücreti 34.718,60 | Kurumun sözleşmesinde belirlenen tutar; yayımlanmış resmî cetveli bulunamadı (aşağıya bakın) |
| Ek taban aylık 1.135,94 | 721 gösterge × 1,575512 (aylık katsayı) |
| Ek ödeme (666 KHK) 14.218,99 | 9.500 gösterge × %95 × 1,575512; %95 = %85 taban + büyükşehir 10 puan (8. Dönem TS büro hizmetleri md. 22: İstanbul/Ankara/İzmir +15, diğer büyükşehir +10, diğer iller +5) |
| İlave ödeme (375 ek 40) 25.153,05 | 15.965 gösterge × 1,575512 |
| Sendika ikramiyesi 1.113,89 | 707 gösterge × 1,575512 |
| Çocuk yardımı 787,76 | 500 gösterge × 1,575512 |
| Emekli keseneği %9 / GSS %5 (kişi) | (ücret + ek taban) = 35.854,54 üzerinden: 3.226,91 / 1.792,73 |
| Sendika aidatı 381,70 | %0,5 × (ücret + ek taban + ek ödeme + seyyanen + sendika ikramiyesi) = 76.340,47 |
| GV matrahı 30.453,20 | 35.854,54 − 3.226,91 − 1.792,73 − 381,70 |
| Damga vergisi 328,72 | 76.340,47 × 7,59/1000 − 250,70 istisna |
| Gelir vergisi 475,54 | 247.563,33 önceki matrahla %20 dilim: 30.453,20 × %20 − 5.615,10 istisna |
| Net 70.922,63 | Birebir (tests/sozlesmeli-katip-bordro.spec.ts) |

Eskiden site ek taban aylığı ve görev yeri artışını hiç hesaplamıyordu; bu yüzden SGK, vergi ve damga matrahı ile ek ödeme eksik çıkıyordu. Düzeltme yalnız Adalet Bakanlığı zabıt katibi (`adalet: true`) için uygulanır; başka 4/B unvanları için ek taban aylık kaynağı doğrulanmadı.

## Sözleşme ücretinin kaynağı

- Yüklenen Ocak ve Temmuz 2026 HMB genelgeleri (Sıra No 3 ve 7) 5393 sayılı Kanun kapsamındaki belediye sözleşmelilerine aittir. Katsayıları (1,387871 / 25,794915 / 0,440141 ve 1,575512 / 25,794915 / 0,499649) `ayarlar.json` ile birebir aynıdır. Temmuz genelgesi mevcut sözleşme ücretlerinin %13,52 artırılmasını söyler (1,575512 / 1,387871).
- 4/B ücret tavanı (Sözleşmeli Personel Çalıştırılmasına İlişkin Esaslar md. 3/2) Temmuz–Aralık 2026 için 76.873,55 TL'dir; bu tutar bir üst sınırdır, kişinin ücreti değildir. 86.231,60 TL 399 sayılı KHK 3/c kapsamındaki personele aittir; karıştırılmamalıdır.
- Adalet Bakanlığı 4/B zabıt katibi için yayımlanmış bir ücret cetveli bulunamadı. Memurlar.net, MAHEP ve Saffet Çelik yazısı ücretin sözleşmedeki tutar olduğunu, hesaplayıcıda girilebileceğini belirtir. Bordro ücreti 34.718,60 TL Memurlar.net cetvelindeki önlisans/lisans örneğinden (30.697,90 TL) 4.020,70 TL fazladır ve bu fark bir gösterge/katsayı bileşimine bağlanamadı. Bu nedenle site, bordrodaki ücreti elle girme seçeneğini öne çıkarır ve cetveli örnek olarak etiketler.
