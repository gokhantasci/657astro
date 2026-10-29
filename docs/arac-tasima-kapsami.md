# Dış kaynak araçlarının taşıma durumu

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

Öneri servisi yerelde kayıt/onay/GitHub yayım akışıyla hazırdır. Canlı sunucu, alan adı/TLS, sunucuda GitHub erişimi ve `PUBLIC_ONERI_API` bağlantısı kurulmadan canlı öneri toplandığı söylenmez. Kurulum: [öneri altyapısı](oneri-altyapisi.md).
