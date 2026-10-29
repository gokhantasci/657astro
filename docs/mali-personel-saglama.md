# Yeni mali ve personel hesaplarının sağlaması

30-10-2026. Ekranlar: `/serbest-meslek-makbuzu-hesaplama/`, `/faiz-hesaplama/`, `/dava-acma-masraflari/`, `/yillik-izin-hesaplama/`, `/infaz-ve-koruma-memuru-boy-kilo-hesaplama/`.

Canlı formlarda sentetik girdiler kullanıldı. Gözlenen 12 örnek ve kaynak adresleri `tests/fixtures/cok-kaynak-hesap.json` içinde; bunları yeniden hesaplayan test `tests/cok-kaynak.spec.ts`. Hesap sınırları, hatalar ve arayüzler ayrıca `tests/mali-hesap.spec.ts` ve `tests/personel-hesap.spec.ts` ile denetlenir. Bunlar kayıtlı kaynak sonuçlarına karşı regresyon testleridir; CI her çalıştığında dış sitelere istek göndermez.

| İşlem | Girdi özeti | Kaynakta gözlenen sonuç |
| --- | --- | ---: |
| SMM, iki kaynak | 10.000 brüt, %20 stopaj, %20 KDV | 8.000 net ücret, 10.000 tahsilat |
| SMM, Saffet | 8.000 net ücret, %20/%20 | 10.000 brüt |
| SMM, Saffet | 10.000 tahsilat, %17 stopaj, %10 KDV | 10.752,69 brüt |
| Faiz, iki kaynak | 100.000 TL, 01-01-2026–01-02-2026, %24, 365 gün | 2.038,36 TL |
| Kanuni faiz, Saffet | 100.000 TL, 01-01-2026–01-09-2026 | 16.591,78 TL |
| TCMB avans, Saffet | 100.000 TL, 01-01-2025–01-01-2026 | 44.491,10 TL |
| TTK 1530, Saffet | 100.000 TL, 01-07-2024–01-07-2025 | 50.603,42 TL |
| Dava, Saffet | 100.000 değer, asliye, vekil, 2 taraf, kaynak 630 diğer avans | 6.173,75 TL |
| Dava, Saffet | 1.000 değer, aynı diğer girdiler | 4.649,00 TL |
| İzin, Saffet | 15-03-2020 giriş, 30-10-2026 hesap, 35 yaş, 5 gün kullanım | 20 hak, 15 kalan gün |
| İKM, AdaletPortal | Erkek, 175 cm / 70 kg | 58–88 kg aralığı içinde |
| İKM, AdaletPortal | Erkek, 175 cm / 89 kg | Aralık dışında |

## SMM

[GİB e-SMM açıklaması](https://ebelge.gib.gov.tr/dosyalar/ELEKTRONIK_SERBEST_MESLEK_MAKBUZU.pdf) ve [TBB makbuz rehberi](https://d.barobirlik.org.tr/2022/avukatlar_icin_smm_rehberi.pdf) brüt, net ücret ve net tahsilatı ayırır. Formüller güncel bir oranın bütün işlemlere zorunlu uygulanacağı varsayımına bağlanmadı; stopaj ve KDV kullanıcı girdisidir. KDV tevkifatı hesaplanan KDV üzerinden uygulanır. Tarihsel rehberdeki %18 KDV güncel varsayılan olarak alınmadı.

Saffet formunun üç yönü sayısal olarak denendi. AdaletPortal'ın brüt 10.000 örneği son animasyon değeriyle okundu. Detaylı modda 5/10 tevkifat seçili olmasına rağmen bu oturumda sonuç tablosu tevkifatsız kaldı; bu kol için canlı eşleşme iddiası yoktur. Kamuya açık istemci dosyasındaki yöntem ve GİB formülü incelendi. Yerelde 10.000 brüt, %20 stopaj, %20 KDV, 5/10 tevkifat için 9.000 tahsilat; ters yönde 9.000 tahsilattan 10.000 brüt ayrıca test edilir. Bu, kaynak uygulamadaki gözlemi doğrulanmış doğru sonuç diye kopyalamaz.

## Faiz

[7589 sayılı Kanun, TBMM metni](https://cdn.tbmm.gov.tr/KKBSPublicFile/D28/Y4/KanunMetni/b074aa2a-c1eb-4bd5-b5d9-4b61a9ac3924.htm), madde 10 ve 26: kanuni faizin reeskonta bağlandığı değişiklik 31-07-2026'da yürürlüğe girer. [TCMB reeskont/avans cetveli](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB%2BTR/Main%2BMenu/Temel%2BFaaliyetler/Para%2BPolitikasi/Reeskont%2Bve%2BAvans%2BFaiz%2BOranlari?v=1.0.8) esas alınır. Oran değişiklikleri otomatik ayrılır. Yeni kanuni oran 38,75 × 0,80 = %31'dir; geçmiş günlere uygulanmaz.

[TCMB TTK 1530 cetvelinin](https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Istatistikler/Piyasa+Verileri/TTK+Md.+1530) doğrudan HTML'si okunarak 2024 %48, 2025 %53,25, 2026 %43 ve giderim tutarları doğrulandı. Asgari giderim faiz toplamına otomatik eklenmez.

3095/2 ticari temerrüdün yıl/yarıyıl kuralı, TCMB avansının değişim günlerini doğrudan izleyen seçenekten ayrıldı. 2025 tam yıl için sırasıyla 46.729,45 ve 44.491,10 TL verirler; bu iki tutarın farklı olması hata değildir. Kaynak Saffet formundaki ticari seçenek doğrudan avans tarihlerini izler. AdaletPortal manuel oranlı olduğundan otomatik dönem örnekleri o sitede test edilmiş sayılmaz.

Otomatik kapsam 01-01-2024–30-10-2026'dır. Son günün de hesaplanabilmesi için bitiş hariç 31-10-2026 girilebilir. Daha yeni veri kontrol edilmeden ileri tarihli oran tahmin edilmez. Elle oran, özel sözleşme veya doğrulanmış diğer tarihler için kullanılabilir. Artık yıl gerçek gün sayısını artırır; yıl esası kullanıcının seçtiği 365 veya 360 olarak kalır. Bileşik faiz ve ara ödeme yoktur.

## Dava açılışı

Harçlar mevcut ortak GİB cetveli, posta ve keşif harcı mevcut `tebligat-ucretleri.json` üzerinden gelir. Kaynak Saffet'in 732 başvurma, 1.707,75 peşin ve 104 vekâletname suret harcı örneği eşleşir. Küçük değerde kaynağın tam maktu karar harcı 732'nin dörtte biri olan 183 örneği ayrıca kaydedildi.

**Avans farkı:** Kaynak 630 TL diğer avans kullanıyor. Erişilen [resmî HMK Gider Avansı Tarifesi](https://higm.adalet.gov.tr/Resimler/SayfaDokuman/20251103100034222G%C4%B0DER%20AVANSI%20TAR%C4%B0FES%C4%B0.pdf), taraf sayısının beş katı tebligat + 530 TL öngörüyor. [HİGM güncel duyuruları](https://higm.adalet.gov.tr/Home/TumHaberler/1) ve resmî kaynak aramasıyla 630 TL yeni HMK tutarı teyit edilemedi. Varsayılanımız bu nedenle 530'dur: örnek toplamı 6.073,75 TL olur. Kullanıcı diğer avansı 630 girerse kaynakla aynı 6.173,75 TL çıkar. 100 TL fark harç farkı değildir; karşılaştırmada açıkça ayrılır.

Bilirkişi ve tanık delil avansları ara karardan toplam olarak girilir; mahkemenin takdir ettiği gideri genel asgari tarife yerine kesin tutar diye üretmeyiz. AdaletPortal dava harcı sayfasında doğrulama ekranı görüldü; bu turda sayısal örnek alınamadı ve envanterde bekliyor.

## İzin ve İKM

İzin için [Çalışma Bakanlığı yönetmeliği](https://www.csgb.gov.tr/Media/trddpibj/y%C4%B1ll%C4%B1k-%C3%BCcretli-izin-y%C3%B6netmeli%C4%9Fi.pdf) ve [2026 dinlenme hakkı yayını](https://www.csgb.gov.tr/Media/llifj34w/dinlenme-hakk%C4%B1-ve-s%C3%BCreleri_22_02_2026-1.pdf) esas. Tamamlanan hizmet yılı, yaş koruması, yer altı artışı ve bir yıl dolmadan yeni hak doğmaması test edilir. Geçmiş birikim otomatik tahmin edilmez. İzin dönüş tarihi ve işçi ücretinin net bordrosu ayrı kapsamdır.

İKM sınırları [CTE 05-06-2026 ilanından](https://cte.adalet.gov.tr/Home/SayfaDetay/5766-sozlesmeli-personel-komisyon-alim-ilani05062026050723) doğrulandı. Bu ekran bir kişinin işe alım kararını vermez; sadece sentetik/girilen sayılar için boy-kilo aralığını gösterir. 100–199 cm tam sayı boy kapsamı açıkça yazılıdır. Kilo ondalığı virgüllü kabul edilir. Kaynak portalda nokta ile `88.1` girişi `881` olarak yorumlandı; sayısal eşleşme için gerçek 89 kg örneği kullanıldı. Yerelde bu ayrıştırma hatası kopyalanmadı.
