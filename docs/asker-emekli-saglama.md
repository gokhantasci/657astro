# Asker emekliliği karşılaştırması

30-10-2026. Ekran: `/asker-emekli-maasi-hesaplama/`.

## Kaynak ve kapsam

- Karşılaştırma: https://www.memurlar.net/hesaplama/asker-emekli-maas/
- 18 rütbe/görev, 52 görev koşulu tarandı. Kaynağın 1–15. dereceleri sorgulandı; sonuç ürettiği 74 rütbe/derece birleşimi test dosyasına alındı. Sonuç vermeyen birleşimler için gösterge tahmin edilmez. Astsubay, uzman erbaş ve uzman jandarma kaynak robotun bu rütbe listesinde bulunmuyor; bu ekranın kapsamında değiller.
- Koşullar emeklilik göstergeleri bakımından aynı çıktı verdiği için rütbe altında birlikte gösterilir. Bu durum görevdeki maaşların da aynı olduğu anlamına gelmez.
- Katsayı, taban aylık, oranlar ve nominal ilaveler `ayarlar.json` içindedir. Yalnız rütbe/gösterge cetveli `asker-emekli.json` içindedir. Yeni dönem katsayısı girilince sonuç aynı motorla güncellenir.
- 5434 hesabıdır. 5510 kişisel prim geçmişi, dul/yetim, malullük, emekli olduktan sonra sigortalı çalışma ve emsal görevdeki personelin net maaşı hesaplanmaz.

## Mevzuat

- [7417 sayılı Kanun, TBMM yayımlanan metin](https://cdn.tbmm.gov.tr/KKBSPublicFile/D27/Y5/T2/KanunMetni/7d0315a6-731c-42bd-adbf-30a2e0fa6d20.html): madde 2, güncel yedi özel hizmet dilimi; madde 3, 5434 ek 85 kapsamında 3600 altı ek göstergede makam tazminatına hak kazanamamış kişilere 1.200 TL ilave ve ek 81 ile birlikte ödenmemesi. Ek 85 ilavesi %4 ek ödeme matrahına girmez.
- [5434 ek 81 için TBMM kanun görüşmesi](https://cdn.tbmm.gov.tr/TbmmWeb/Tutanak20230120/22/4/77/Tam/89f76bf6-f325-4b45-9987-1d0125f3dad7.pdf): 100 TL nominal ilave. Asker kapsamı sonraki değişikliklerle genişletilmiştir; güncel kapsam ve tutar kaynak robotla da karşılaştırıldı.
- [Sahil Güvenlik sitesindeki 926 metni](https://www.sg.gov.tr/kurumlar/sg.gov.tr/mevzuatlar/kanun/turksilahlikuvvetler.pdf), madde 49: kadrosuzluk yüzdeleri ve hak kazanma/emsal sınırı. İndirme yerelde HTML hata yanıtı verdi; arama motorunun indekslediği madde metni okunabildi. Bu yüzden dosya yerel resmî PDF nüshası olarak arşivlendiği iddia edilmez.
- [Çevre Bakanlığı belediye başkanları rehberi](https://webdosya.csb.gov.tr/v2/yerelyonetimler/2026/05/3-1-2-BELED-YE-BA-KANLARI-REHBER-20260515163951.pdf), emeklilik bölümü de yedi özel hizmet dilimini ve bağlama sistemini doğrular. Rehberdeki eski katsayı örneği kullanılmaz.

## Örnekler

Temmuz–Aralık 2026, derece/kademe 1/1, hizmet ve kıdem 25 yıl, ikramiye 25 tam yıl, kaynak robotun eklediği tazminat hakları açık, üst tutar sınırı uygulanmadan:

| Rütbe | Net aylık | İkramiye |
| --- | ---: | ---: |
| Albay, asker alma bölge başkanı | 85.553,55 TL | 1.546.656,56 TL |
| Binbaşı | 55.646,80 TL | 1.424.554,38 TL |
| Tümgeneral/Tümamiral | 115.675,59 TL | 1.721.932,27 TL |

Asteğmen 9/1 örneği: 30.963,45 TL net, 894.788,47 TL ikramiye. Binbaşı 3/1: 47.146,14 TL net, 1.133.084,66 TL ikramiye. Bunlar kaynak robotun sentetik 25 yıl profilidir; tek başına emeklilik hakkı kazandıran yaş/hizmet örneği değildir.

74 derece örneği `tests/fixtures/asker-emekli.json`, hizmet yılı/ayı ve kıdemi farklı 3 ek örnek `tests/fixtures/asker-emekli-ek.json`, testler `tests/asker-emekli.spec.ts`. Net ve ikramiye farkı en fazla 1 kuruş toleransla karşılaştırılır. Bordroda her aylık kalemi ayrı yuvarlanır; EMIHEP'in genel memur toplam yönteminden farklıdır.

## Bilinçli ayrımlar

- Kaynak robot makam ve kadrosuzluk tazminatını hak kazanma sorusu olmadan ekler. Burada ayrı seçim vardır. Açılış profili kaynak karşılaştırmasıyla aynıdır; kullanıcı kendi hakkını seçmelidir.
- 926/49 emsal sınırlaması için görevdeki emsal maaşı tahmin edilmez. Kullanıcı SGK'nın belirlediği **ödenebilir kadrosuzluk tazminatı üst tutarını** girebilir; 0, sınırlama uygulanmadığı varsayımıdır. Bu alan emsal net maaşı değildir.
- Makam tazminatı hakkı yoksa, ek göstergeye göre ek 81 veya ek 85 ilavesi uygulanır; ikisi birlikte eklenmez.
- Genel memur motorundaki eski `2200 üstü %85, 3600 üstü %145` kısaltması kaldırıldı. Güncel sınır 2800'dür; 5400 ve üzerindeki dört basamak da ortak cetvele eklendi. Mevcut öğretmen karşılaştırmaları değişmeden geçti.
- Kaynağa kadro 1/1, emekliliğe esas 3/1 gönderilen albay örneğinde form 3/1'i seçili tuttuğu hâlde bordroda gösterge 1/1 (1320) kullanıldı. Yerel motor iki dereceyi ayrı değerlendirir: ek gösterge kadro derecesinden, aylık göstergesi emekliliğe esas dereceden gelir. Ek karşılaştırma dosyasındaki bu kaynak sonucu, fiilen kullandığı 1/1 üzerinden kayıtlıdır; farklı EKEA desteği için eşleşme iddiası yoktur.
