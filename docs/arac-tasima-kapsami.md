# Dış kaynak araçlarının taşıma durumu

Saffet Çelik ve AdaletPortal için yeni karşılaştırma ve teknik yol: [taşıma yöntemi](saffet-adaletportal-tasima-yontemi.md), [işlev envanteri](yeni-kaynak-arac-envanteri.json).

Beş kaynak için araç ve unvan bazında kalan doğrulamalar: [birleşik rapor](hesap-dogrulama-durumu.md). Yeni mali/personel hesaplarının canlı örnekleri ve farkları: [sağlama](mali-personel-saglama.md).

30-10-2026. Bir aracın taşınmış olması, bütün kurumların bütün kişisel bordrolarının doğrulandığı anlamına gelmez. Sayısal doğrulamalar ilgili `*-saglama.md` belgelerinde ve test örneklerinde kayıtlıdır.

## OzkanSoft ana programları

Kaynak: https://www.ozkansoft.com/mahep.php

| Program | Yerel karşılığı / durum |
| --- | --- |
| MAHEP | `/memur-maas-hesaplama/`; doğrulanmış unvanlar çalışır, kaynak unvan envanterinin tümü henüz kapsanmıyor |
| EDUHEP | `/ogretmen-ek-ders-hesaplama/` |
| 4B MAHEP | `/sozlesmeli-memur-maas-hesaplama/`; unvan/koşul/yıl cetveliyle |
| 4C MAHEP | Güncel maaş olarak taşınmadı; kaldırılmış statünün tarihsel hesapları ayrıca ele alınmalı |
| 4D MAHEP | `/4d-isci-maas-hesaplama/`; kurum/TİS parametreli örnek, tüm kurumların TİS'i doğrulanmış değil |
| EMIHEP | `/emekli-memur-maas-hesaplama/`; 5434, üst kadroların makam/temsil/görev tazminatları kapsam dışında |
| UTEDESHEP | `/ek-ders-ucretinden-saat-hesaplama/` |
| İLKSAN EYHEP | `/ilksan-emekli-yardimi-hesaplama/` |
| YOHEP | Geçici görev ve sürekli görev yolluğu araçları |
| ENOHEP | `/enflasyon-farki-hesaplama-robotu/`; ortak katsayılar ve enflasyon verisi |

4/C tespiti: [MYK'nın 696 sayılı KHK açıklaması](https://myk.gov.tr/tr/haberler/genel/taeron-duezenlenmesi-696-sayili-kanun-huekmuende-kararname-ile-yayinlandi), 4/C statüsünün kaldırıldığını ve 4/B'ye geçişi açıklar. Kaynak 4C MAHEP hâlâ 2026 seçeneğiyle eski göstergelerden sonuç üretiyor; bu sonuç güncel personel maaşı kabul edilmez. Tarihsel 2017/2018 katsayı, vergi/AGİ ve geçiş dönemi hükümleri tamamlanmadan araç hazır işaretlenmeyecek.

## Memurlar.net ana robot listesi

Kaynak: https://www.memurlar.net/maasrobot/

Kadrolu, sözleşmeli, memur emekli, asker emekli, belediye başkanı, muhtar, 68/B hizmeti, lojman ve sürekli görev yolluğu karşılıkları yerelde var. Asker emekliliğinde 18 rütbe ve 74 derece birleşimi sayısal olarak karşılaştırıldı; [ayrıntılar](asker-emekli-saglama.md). Kapsam sınırlamaları her ekranın açıklamasında korunur. Menüde ayrıca bulunan emeklilik yaşı/AGİ sayfaları ana dokuz robotla aynı envanter değildir; geçmiş AGİ hesabı ayrıca dönem verisi gerektirir.

## Adliyeci

Kaynaklar: https://adliyeci.657.com.tr/ ve http://adliyeci.org/ANASAYFA.aspx

`/hukuk-mahkemeleri/` dizininde tam kabul, kısmen kabul, ret, husumet/ön şart, açılmamış sayılma, feragat, sulh, davayı kabul, nafaka, maddi/manevi tazminat kararları ve yardımcı harç/vekâlet araçları var. Kasa, davalılara paylaşım, Almanya posta kodu/konsolosluk ve mevcut kesinleşme aracı da yerelde.

[Hukuk hesap sağlaması](hukuk-hesap-saglama.md) resmî 2026 harçları, AAÜT, dış kaynak örnekleri ve kaynakta düzeltilen hataları açıklar. Kaynak menüdeki çalışmayan düğmeler hesaplayıcı gibi işaretlenmez. Genel konsolosluk dizini ve Almanya dışındaki görev bölgesi güncelliği tamamlanmış değil. Bozma sonrası özel hükümler, karşı dava ve birden çok talebin bağımsız matrahları henüz genel karar motorunun kapsamında değil.

## Altyapıdaki açık işler

Öneri/onay servisi açık kullanıcı onayıyla 657.com.tr/_657-servis altında ayrı servis olarak kuruldu. Turnstile sunucuda zorunludur. Ortak okunma ve başlatılan indirme sayaçları bu servistedir. Yeni ön yüz yerelde test edilir; canlı WordPress yerine henüz yayımlanmadı. [Canlı servis](canli-oneri-servisi.md).

## 03/11/2026 akşam güncellemesi

Katalog 83 kayda ulaştı: 81 yerel yol ve iki mevcut alt alan adı uygulaması. Genel konsolosluk arşivi (44.218 kayıt), birleşik HMK formu, nüfus HTML analizi, teftiş ekranları ve rehberleri eklendi. Önceki genel konsolosluk dizini eksikliği giderildi; görev bölgelerinin güncel Dışişleri teyidi hâlâ ayrı doğrulama gerektirir. Tarihsel 4/C, tüm kurum TİS'leri ve özel karar birleşimleri yukarıdaki kapsam sınırlarını korur.

Memurlar.net'in güncel 58 sözleşmeli unvanının tamamı yerel 60 seçenek içinde. 2024 sonrası hukuk harç/AAÜT dönemleri, CMK arşivi ve güncel tarife sınır testleri eklendi. [Akşam talimatları ve doğrulama](pencere-kontrol-20261103.md).
