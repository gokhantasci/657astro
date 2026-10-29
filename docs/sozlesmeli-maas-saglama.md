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
