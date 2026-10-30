# Hesap doğrulama çalışma raporu

Veri tarihi: 2026-10-30. Üretim: `node scripts/hesap-dogrulama-raporu.mjs`.

Beş kaynakta gözlenen hesap işlevlerinin çalışma listesi. Ekran hazır olması, tüm kaynak/kural/unvan karşılaştırmalarının tamamlandığı anlamına gelmez. Kaynakta karşılığı olmayan hesap başka sitede test edilmiş sayılmaz.

## Kaynak çiftleri

Bir hesabın iki sitedeki karşılığı iki kaynak çifti sayılır. Belgeli kayıt kısmi örnek doğrulamasıdır; tüm koşulların geçtiği anlamına gelmez.

| Kaynak | Kayıt | Belgeli kısmi/örnek | Bekleyen |
| --- | ---: | ---: | ---: |
| Saffet Çelik | 33 | 5 | 28 |
| AdaletPortal | 13 | 3 | 10 |
| Adliyeci.org | 17 | 7 | 10 |
| OzkanSoft | 10 | 5 | 5 |
| Memurlar.net | 11 | 6 | 5 |

## İşlevler

| İşlev | Yerel ekran | Kaynak başına durum |
| --- | --- | --- |
| UDF dönüşümleri | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/udf-donustur): bekliyor |
| UDF görüntüleme | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/udf-goruntuleyici): bekliyor |
| UDF birleştirme | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/udf-birlestirme): bekliyor |
| UDF düzenleme | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/udf-editor): bekliyor |
| UDF görsel düzenleme | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/udf-resim-ekleme): bekliyor |
| Belge özetleme | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/belge-ozetleme): bekliyor |
| Sesle yazma ve cihaz eşleştirme | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/sesle-yazi-yazma): bekliyor; [AdaletPortal](https://www.adaletportal.com/senkro/): bekliyor |
| Nüfus kaydından boşanma taslakları | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/nufus-analiz): bekliyor |
| Karar metni şablonu | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/gerekceli-karar-sablonu): bekliyor |
| Görselden ve taramadan metin çıkarma | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/genel-ocr): bekliyor |
| Konsolosluk görev bölgesi | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/konsolosluk-sorgulama): bekliyor; [Adliyeci.org](http://adliyeci.org/KONSOLOSLUKLAR.aspx): bekliyor |
| Kira artışı ve bağlı süreler | [Ekran](/kira-artis-hesaplama/) | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/kira-artis-hesaplama): bekliyor |
| Memur maaşı | [Ekran](/memur-maas-hesaplama/) | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/memur-maas-hesaplama): bekliyor; [OzkanSoft](https://www.ozkansoft.com/mahep.php): belgeli-kismi; [Memurlar.net](https://www.memurlar.net/maas/): belgeli-kismi |
| Memur emekliliği | [Ekran](/emekli-memur-maas-hesaplama/) | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/emekli-memur-maas-hesaplama): bekliyor; [OzkanSoft](https://www.ozkansoft.com/emihep.php): belgeli-kismi; [Memurlar.net](https://www.memurlar.net/hesaplama/emekli-maas/): belgeli-kismi |
| Islah harcı | [Ekran](/islah-harci-hesaplama/) | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/islah-harci-hesaplama): bekliyor; [Adliyeci.org](http://adliyeci.org/islahharci.aspx): bekliyor |
| İstinaf harcı | [Ekran](/istinaf-temyiz-harci-hesaplama/) | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/istinaf-nispi-harc-hesaplama): bekliyor; [Adliyeci.org](http://adliyeci.org/%C4%B0ST%C4%B0NAFHARCI.aspx): belgeli-kismi; [Adliyeci.org](http://adliyeci.org/A%C4%B0LE%C4%B0ST%C4%B0NAF.aspx): belgeli-kismi |
| Dava açılış giderleri | [Ekran](/dava-acma-masraflari/) | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/dava-masrafi-hesaplama): fark-gerekceli; [AdaletPortal](https://www.adaletportal.com/dava-harci-hesaplama/): bekliyor |
| Kıdem ve ihbar | [Ekran](/kidem-ihbar-tazminati-hesaplama/) | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/kidem-ihbar-tazminati): bekliyor |
| Araç değer kaybı | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/arac-deger-kaybi): bekliyor |
| İcra kapak hesabı | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/icra-kapak-hesabi): bekliyor |
| Miras payları | [Ekran](/miras-payi-hesaplama/) | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/miras-payi-hesaplama): bekliyor |
| Dönemsel faiz | [Ekran](/faiz-hesaplama/) | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/yasal-ticari-faiz): ornek-dogrulandi; [AdaletPortal](https://www.adaletportal.com/faiz-hesaplama/): ornek-dogrulandi |
| Serbest meslek makbuzu | [Ekran](/serbest-meslek-makbuzu-hesaplama/) | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/smm-hesaplama): ornek-dogrulandi; [AdaletPortal](https://www.adaletportal.com/serbest-meslek-makbuzu-hesaplama/): ornek-dogrulandi |
| Hukuki süre ve elektronik tebliğ | [Ekran](/kesinlesme/) | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/hukuki-sure-hesaplama): bekliyor; [Adliyeci.org](http://adliyeci.org/KES%C4%B0NLESME.aspx): bekliyor |
| Tapu harcı ve döner sermaye | [Ekran](/tapu-harci-hesaplama-2/) | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/tapu-harci-hesaplama): belgeli-kismi |
| İşçi yıllık izni | [Ekran](/yillik-izin-hesaplama/) | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/yillik-izin-hesaplama): ornek-dogrulandi |
| Trafik kazasında araç zararları | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/trafik-kazasi-tazminat): bekliyor |
| Adliye kapanma ve birleşme geçmişi | [Ekran](/adlicevre/) | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/kapanan-adliye-sorgulama): bekliyor |
| Vekâlet ücreti | [Ekran](/nispi-vekalet-ucreti-hesaplama/) | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/vekalet-ucreti-hesaplama): bekliyor; [AdaletPortal](https://www.adaletportal.com/vekalet-ucreti-hesaplama/): bekliyor |
| Yargılama gideri | [Ekran](/yargilamagideri/) | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/yargilama-gideri-hesaplama): bekliyor; [AdaletPortal](https://www.adaletportal.com/yargilama-gideri-hesaplama/): bekliyor |
| Keşif gideri ve ara karar | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/kesif-hesaplama): bekliyor |
| Mahkeme bilirkişisi ücreti | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/bilirkisi-ucreti-hesaplama): bekliyor |
| Tebligat tarifesi ve toplama | Bekliyor / eksik | [Saffet Çelik](https://saffetcelik.com.tr/uygulamalar/tebligat-ucreti-hesaplama): bekliyor |
| Ceza infazı | Bekliyor / eksik | [AdaletPortal](https://www.adaletportal.com/infaz-hesaplama/): bekliyor |
| TCK ceza belirleme | Bekliyor / eksik | [AdaletPortal](https://www.adaletportal.com/tck-ceza-hesaplama-robotu/): bekliyor |
| İKM boy ve kilo şartı | [Ekran](/infaz-ve-koruma-memuru-boy-kilo-hesaplama/) | [AdaletPortal](https://www.adaletportal.com/infaz-ve-koruma-memuru-boy-kilo-hesaplama/): ornek-dogrulandi |
| Adliye iletişim bilgileri | Bekliyor / eksik | [AdaletPortal](https://www.adaletportal.com/adliye-iletisim-rehberi/): bekliyor |
| Cezaevi iletişim bilgileri | Bekliyor / eksik | [AdaletPortal](https://www.adaletportal.com/ceza-infaz-kurumlari-cezaevi-iletisim-rehberi/): bekliyor |
| Noterlik iletişim bilgileri | Bekliyor / eksik | [AdaletPortal](https://www.adaletportal.com/tum-noterlikler/): bekliyor |
| Günlük nöbetçi noter | Bekliyor / eksik | [AdaletPortal](https://www.adaletportal.com/nobetci-noterlikler/): bekliyor |
| Öğretmen ek ders | [Ekran](/ogretmen-ek-ders-hesaplama/) | [OzkanSoft](https://www.ozkansoft.com/eduhep.php): bekliyor |
| Sözleşmeli 4/B | [Ekran](/sozlesmeli-memur-maas-hesaplama/) | [OzkanSoft](https://www.ozkansoft.com/4bmahep.php): belgeli-kismi; [Memurlar.net](https://www.memurlar.net/maas/sozlesmeli/): belgeli-kismi |
| Tarihsel 4/C | Bekliyor / eksik | [OzkanSoft](https://www.ozkansoft.com/4cmahep.php): bekliyor |
| 4/D işçi | [Ekran](/4d-isci-maas-hesaplama/) | [OzkanSoft](https://www.ozkansoft.com/4dmahep.php): bekliyor |
| Ücretten ek ders saati | [Ekran](/ek-ders-ucretinden-saat-hesaplama/) | [OzkanSoft](https://www.ozkansoft.com/utedeshep.php): belgeli-kismi |
| İLKSAN yardımı | [Ekran](/ilksan-emekli-yardimi-hesaplama/) | [OzkanSoft](https://www.ozkansoft.com/ilksaneyhep.php): bekliyor |
| Geçici görev yolluğu | [Ekran](/gecici-gorev-yollugu-hesaplama/) | [OzkanSoft](https://www.ozkansoft.com/yohep.php): belgeli-kismi |
| Enflasyon oranı | [Ekran](/enflasyon-orani-hesaplama/) | [OzkanSoft](https://www.ozkansoft.com/enohep.php): bekliyor |
| Asker emekli | [Ekran](/asker-emekli-maasi-hesaplama/) | [Memurlar.net](https://www.memurlar.net/hesaplama/asker-emekli-maas/): belgeli-kismi |
| Belediye başkanı | [Ekran](/belediye-baskani-maasi-hesaplama/) | [Memurlar.net](https://www.memurlar.net/maas/belediye-baskani/): belgeli-kismi |
| Muhtar | [Ekran](/muhtar-maasi-hesaplama/) | [Memurlar.net](https://www.memurlar.net/maas/muhtar/): belgeli-kismi |
| 68/B hizmet | [Ekran](/68-b-hizmet-hesaplama/) | [Memurlar.net](https://www.memurlar.net/hesaplama/memurluk-hizmeti/): bekliyor |
| Lojman puanı | [Ekran](/lojman-puani-hesaplama/) | [Memurlar.net](https://www.memurlar.net/hesaplama/lojman-puanlama/): bekliyor |
| Sürekli görev yolluğu | [Ekran](/surekli-gorev-yollugu/) | [Memurlar.net](https://www.memurlar.net/maas/harcirah/): bekliyor |
| Tam kabul | [Ekran](/tam-kabul-hesaplama/) | [Adliyeci.org](http://adliyeci.org/TAM%20KABUL.aspx): belgeli-kismi |
| Kısmen kabul | [Ekran](/kismen-kabul-hesaplama/) | [Adliyeci.org](http://adliyeci.org/KISMENKABUL.aspx): belgeli-kismi |
| Ret | [Ekran](/davanin-reddi-hesaplama/) | [Adliyeci.org](http://adliyeci.org/REDD%C4%B0NE1.aspx): bekliyor |
| Husumet ve ön şart | [Ekran](/husumet-dava-sarti-hesaplama/) | [Adliyeci.org](http://adliyeci.org/ACILMAMI%C5%9E.aspx): bekliyor |
| Açılmamış sayılma | [Ekran](/acilmamis-sayilma-hesaplama/) | [Adliyeci.org](http://adliyeci.org/ACILMAMI%C5%9E.aspx): belgeli-kismi |
| Feragat ve sulh | [Ekran](/feragat-hesaplama/) | [Adliyeci.org](http://adliyeci.org/FERAGAT-SULH.aspx): bekliyor |
| Nafaka tam kabul | [Ekran](/nafaka-tam-kabul-hesaplama/) | [Adliyeci.org](http://adliyeci.org/NAFAKATAM.aspx): belgeli-kismi |
| Nafaka kısmen kabul | [Ekran](/nafaka-kismen-kabul-hesaplama/) | [Adliyeci.org](http://adliyeci.org/NAFAKAKISMEN.aspx): belgeli-kismi |
| Maddi tazminat | [Ekran](/maddi-tazminat-vekalet-hesaplama/) | [Adliyeci.org](http://adliyeci.org/maddi.aspx): bekliyor |
| Manevi tazminat | [Ekran](/manevi-tazminat-vekalet-hesaplama/) | [Adliyeci.org](http://adliyeci.org/manevi.aspx): bekliyor |
| Kasa | [Ekran](/adliye-kasa-hesabi/) | [Adliyeci.org](http://adliyeci.org/KASA%20HESABI.aspx): bekliyor |
| Davalı paylaşımı | [Ekran](/davalilara-paylasim-hesaplama/) | [Adliyeci.org](http://adliyeci.org/daval%C4%B11234.aspx): bekliyor |
| Emeklilik yaşı | Bekliyor / eksik | [Memurlar.net](https://www.memurlar.net/hesaplama/emekli-yas/): bekliyor |
| Tarihsel asgari geçim indirimi | Bekliyor / eksik | [Memurlar.net](https://www.memurlar.net/maas/agi.aspx): bekliyor |

## Kadrolu unvan envanteri

335 kaynak unvanının 264 adında yerel seçenek eşleşmesi var. Ad eşleşmesi bordro doğrulaması değildir. Derece/kademe, hizmet, öğrenim/kurum koşulu, 5434/5510, ay ve kesintiler ayrıca doğrulanmalıdır. Eski `memur-maas.json` regresyon dosyası dış kaynak bordrosu diye sayılmaz.

| Unvan | Yerel ad eşleşmesi | Kaynak unvan kayıtları |
| --- | --- | --- |
| Öğretmen | Var; koşul testleri ayrıca | ozkan: 391; memurlar: ogretmen |
| 1. Hukuk Müşaviri | Var; koşul testleri ayrıca | ozkan: 1301; memurlar: 1-hukuk-musaviri |
| Ambar Memuru | Var; koşul testleri ayrıca | ozkan: 011; memurlar: ambar-memuru |
| Anketör | Var; koşul testleri ayrıca | ozkan: 1960 |
| Antrenör | Var; koşul testleri ayrıca | ozkan: 1480; memurlar: antrenor |
| Araştırma Görevlisi | Var; koşul testleri ayrıca | ozkan: 430; memurlar: arastirma-gorevlisi |
| Araştırmacı | Var; koşul testleri ayrıca | ozkan: 021; memurlar: arastirmaci |
| Arkeolog | Var; koşul testleri ayrıca | ozkan: 1751; memurlar: arkeolog |
| Arşiv Memuru | Var; koşul testleri ayrıca | ozkan: 1491; memurlar: arsiv-memuru |
| Asistan | Var; koşul testleri ayrıca | ozkan: 930; memurlar: asistan |
| Aşçı | Var; koşul testleri ayrıca | ozkan: 030; memurlar: asci |
| Avukat | Var; koşul testleri ayrıca | ozkan: 040; memurlar: avukat |
| Ayniyat Memuru | Var; koşul testleri ayrıca | ozkan: 2051 |
| Ayniyat Saymanı | Var; koşul testleri ayrıca | ozkan: 051; memurlar: ayniyat-saymani |
| Bahçıvan | Var; koşul testleri ayrıca | ozkan: 680; memurlar: bahcivan |
| Bakanlık Maarif Başmüfettişi | Var; koşul testleri ayrıca | ozkan: 060 |
| Bakanlık Maarif Müfettişi | Var; koşul testleri ayrıca | ozkan: 070 |
| Bakıcı Anne | Var; koşul testleri ayrıca | ozkan: 1500 |
| Bakteriyolog | Var; koşul testleri ayrıca | ozkan: 1071 |
| Basın ve Halkla İlişkiler Müşaviri | Var; koşul testleri ayrıca | ozkan: 2580; memurlar: basin-ve-halkla-iliskiler-musaviri |
| Başasistan | Var; koşul testleri ayrıca | ozkan: 920; memurlar: basasistan |
| Başimam-Hatip | Var; koşul testleri ayrıca | ozkan: 2281 |
| Başkomiser | Var; koşul testleri ayrıca | ozkan: 500; memurlar: bas-komiser |
| Başmüezzin | Var; koşul testleri ayrıca | ozkan: 2311 |
| Başmüfettiş | Var; koşul testleri ayrıca | ozkan: 1420; memurlar: basmufettis |
| Başmühendis | Var; koşul testleri ayrıca | ozkan: 1760; memurlar: basmuhendis |
| Başvaiz | Var; koşul testleri ayrıca | ozkan: 2261 |
| Bekçi (YH) | Var; koşul testleri ayrıca | ozkan: 080 |
| Belediye Başkan Yardımcısı | Var; koşul testleri ayrıca | ozkan: 2681; memurlar: belediye-baskan-yardimcisi |
| Berber | Var; koşul testleri ayrıca | ozkan: 690; memurlar: berber |
| Bilet Kontrol Memuru | Var; koşul testleri ayrıca | ozkan: 1511 |
| Bilgisayar İşletmeni | Var; koşul testleri ayrıca | ozkan: 091; memurlar: bilgisayar-isletmeni |
| BİM Müdürü | Var; koşul testleri ayrıca | ozkan: 2561 |
| BİM Müdür Yardımcısı | Var; koşul testleri ayrıca | ozkan: 2571 |
| Biyolog | Var; koşul testleri ayrıca | ozkan: 581 |
| Bölge Müdürü | Var; koşul testleri ayrıca | ozkan: 1520; memurlar: bolge-muduru |
| Bölge Müdür Yardımcısı | Var; koşul testleri ayrıca | ozkan: 1530; memurlar: bolge-mudur-yardimcisi |
| Bölge Plancısı | Var; koşul testleri ayrıca | ozkan: 1770; memurlar: bolge-plancisi |
| Cezaevi Katibi | Var; koşul testleri ayrıca | ozkan: 841; memurlar: cezaevi-katibi |
| Cezaevi Müdürü | Var; koşul testleri ayrıca | ozkan: 761; memurlar: cezaevi-muduru |
| Cezaevi Tabibi | Var; koşul testleri ayrıca | ozkan: 1191 |
| Çağrı Karşılama Memuru | Var; koşul testleri ayrıca | ozkan: 2471 |
| Çarşı ve Mahalle Bekçisi | Var; koşul testleri ayrıca | ozkan: 541; memurlar: carsi-ve-mahalle-bekcisi |
| Çocuk Bakıcısı | Var; koşul testleri ayrıca | ozkan: 2320 |
| Çocuk Eğiticisi | Var; koşul testleri ayrıca | ozkan: 1541; memurlar: cocuk-egiticisi |
| Çocuk Eğitimcisi | Var; koşul testleri ayrıca | ozkan: 1551 |
| Çocuk Gelişimcisi | Var; koşul testleri ayrıca | ozkan: 1091; memurlar: cocuk-gelisimcisi |
| Çözümleyici | Var; koşul testleri ayrıca | ozkan: 2111; memurlar: cozumleyici |
| Dağıtıcı | Var; koşul testleri ayrıca | ozkan: 100; memurlar: dagitici |
| Daire Başkanı | Var; koşul testleri ayrıca | ozkan: 111; memurlar: daire-baskani |
| Daire Tabibi | Var; koşul testleri ayrıca | ozkan: 1180; memurlar: daire-tabibi |
| Daktilograf | Var; koşul testleri ayrıca | ozkan: 1561; memurlar: daktilograf |
| Defterdarlık Uzmanı | Var; koşul testleri ayrıca | ozkan: 2450; memurlar: defterdarlik-uzmani |
| Defterdarlık Uzman Yardımcısı | Var; koşul testleri ayrıca | ozkan: 2460; memurlar: defterdarlik-uzman-yardimcisi |
| Dekoratör | Var; koşul testleri ayrıca | ozkan: 2121 |
| Desinatör | Var; koşul testleri ayrıca | ozkan: 2131 |
| Dil ve Konuşma Terapisti | Var; koşul testleri ayrıca | ozkan: 2081 |
| Din Görevlisi | Var; koşul testleri ayrıca | ozkan: 1951 |
| Diş Tabibi | Eksik | ozkan: 980; memurlar: dis-tabibi |
| Diyetisyen | Var; koşul testleri ayrıca | ozkan: 1081; memurlar: diyetisyen |
| Doçent | Var; koşul testleri ayrıca | ozkan: 411; memurlar: docent |
| Doktor Öğretim Üyesi | Var; koşul testleri ayrıca | ozkan: 420; memurlar: doktor-ogretim-uyesi |
| Ebe | Var; koşul testleri ayrıca | ozkan: 1131; memurlar: ebe |
| Eczacı | Var; koşul testleri ayrıca | ozkan: 991; memurlar: eczaci |
| Eğitim Görevlisi | Var; koşul testleri ayrıca | ozkan: 641; memurlar: egitim-gorevlisi |
| Eğitim Müfettişi | Var; koşul testleri ayrıca | ozkan: 560 |
| Eğitim Müfettiş Yardımcısı | Var; koşul testleri ayrıca | ozkan: 570 |
| Eğitim Uzmanı | Var; koşul testleri ayrıca | ozkan: 121; memurlar: egitim-uzmani |
| Ekonomist | Var; koşul testleri ayrıca | ozkan: 1171; memurlar: ekonomist |
| Emanet Memuru | Var; koşul testleri ayrıca | ozkan: 821; memurlar: emanet-memuru |
| Emniyet Amiri | Var; koşul testleri ayrıca | ozkan: 490; memurlar: emniyet-amiri |
| Enstitü Sekreteri | Var; koşul testleri ayrıca | ozkan: 1350; memurlar: enstitu-sekreteri |
| Fakülte Sekreteri | Var; koşul testleri ayrıca | ozkan: 1330; memurlar: fakulte-sekreteri |
| Fizikçi | Var; koşul testleri ayrıca | ozkan: 1850; memurlar: fizikci |
| Fizikoterapist | Var; koşul testleri ayrıca | ozkan: 2391 |
| Fizyoterapist | Var; koşul testleri ayrıca | ozkan: 1011; memurlar: fizyoterapist |
| Folklor Araştırmacısı | Var; koşul testleri ayrıca | ozkan: 1910 |
| Fotoğrafçı | Var; koşul testleri ayrıca | ozkan: 1611 |
| Garson | Var; koşul testleri ayrıca | ozkan: 700; memurlar: garson |
| Gassal | Var; koşul testleri ayrıca | ozkan: 710; memurlar: gassal |
| Gelir Uzmanı | Var; koşul testleri ayrıca | ozkan: 2500; memurlar: gelir-uzmani |
| Gelir Uzman Yardımcısı | Var; koşul testleri ayrıca | ozkan: 2510; memurlar: gelir-uzman-yardimcisi |
| Gemi Adamı | Var; koşul testleri ayrıca | ozkan: 1571; memurlar: gemi-adami |
| Genel Müdür | Var; koşul testleri ayrıca | ozkan: 1380; memurlar: genel-mudur |
| Genel Müdür Yardımcısı | Var; koşul testleri ayrıca | ozkan: 1390; memurlar: genel-mudur-yardimcisi |
| Gişe Memuru | Var; koşul testleri ayrıca | ozkan: 1971 |
| Grafiker | Var; koşul testleri ayrıca | ozkan: 2140; memurlar: grafiker |
| Hastabakıcı | Var; koşul testleri ayrıca | ozkan: 740; memurlar: hastabakici |
| Hayvan Bakıcısı | Var; koşul testleri ayrıca | ozkan: 2330 |
| Hayvan Kesicisi | Var; koşul testleri ayrıca | ozkan: 2340 |
| Hemşire | Var; koşul testleri ayrıca | ozkan: 131; memurlar: hemsire |
| Heykeltraş | Var; koşul testleri ayrıca | ozkan: 2151 |
| Hidrobiyolog | Var; koşul testleri ayrıca | ozkan: 2370 |
| Hidrolog | Var; koşul testleri ayrıca | ozkan: 1820; memurlar: hidrolog |
| Hizmetli | Var; koşul testleri ayrıca | ozkan: 141; memurlar: hizmetli |
| Hukuk Müşaviri | Var; koşul testleri ayrıca | ozkan: 150; memurlar: hukuk-musaviri |
| İcra Başmüdürü | Var; koşul testleri ayrıca | ozkan: 771 |
| İcra Katibi | Var; koşul testleri ayrıca | ozkan: 1981; memurlar: icra-katibi |
| İcra Müdürü | Var; koşul testleri ayrıca | ozkan: 781; memurlar: icra-muduru |
| İcra Müdür Yardımcısı | Var; koşul testleri ayrıca | ozkan: 791; memurlar: icra-mudur-yardimcisi |
| İç Denetçi | Var; koşul testleri ayrıca | ozkan: 160; memurlar: ic-denetci |
| İç Mimar | Var; koşul testleri ayrıca | ozkan: 1800; memurlar: ic-mimar |
| İdare Memuru | Var; koşul testleri ayrıca | ozkan: 831; memurlar: idare-memuru |
| İdari İşler Müdürü | Var; koşul testleri ayrıca | ozkan: 811 |
| İl Emniyet Müdürü | Var; koşul testleri ayrıca | ozkan: 451; memurlar: il-emniyet-muduru |
| İl Emniyet Müdür Yardımcısı | Var; koşul testleri ayrıca | ozkan: 460; memurlar: il-emniyet-mudur-yardimcisi |
| İl Müdürü | Var; koşul testleri ayrıca | ozkan: 2231; memurlar: il-muduru |
| İl Müdür Yardımcısı | Var; koşul testleri ayrıca | ozkan: 2241; memurlar: il-mudur-yardimcisi |
| İl Müftüsü | Var; koşul testleri ayrıca | ozkan: 591 |
| İl Müftü Yardımcısı | Var; koşul testleri ayrıca | ozkan: 600 |
| İlçe Emniyet Müdürü | Var; koşul testleri ayrıca | ozkan: 470; memurlar: ilce-emniyet-muduru |
| İlçe Emniyet Müdür Yardımcısı | Var; koşul testleri ayrıca | ozkan: 480; memurlar: ilce-emniyet-mudur-yardimcisi |
| İlçe Müftüsü | Var; koşul testleri ayrıca | ozkan: 610 |
| İmam-Hatip | Var; koşul testleri ayrıca | ozkan: 651; memurlar: imam-hatip |
| İnfaz ve Koruma Başmemuru | Var; koşul testleri ayrıca | ozkan: 871; memurlar: infaz-ve-koruma-basmemuru |
| İnfaz ve Koruma Memuru | Var; koşul testleri ayrıca | ozkan: 881; memurlar: infaz-ve-koruma-memuru |
| İstatistikçi | Var; koşul testleri ayrıca | ozkan: 1870; memurlar: istatistikci |
| İş Başmüfettişi | Var; koşul testleri ayrıca | ozkan: 1580 |
| İş Müfettişi | Var; koşul testleri ayrıca | ozkan: 1590 |
| İş Müfettiş Yardımcısı | Var; koşul testleri ayrıca | ozkan: 1600 |
| İş ve Meslek Danışmanı | Var; koşul testleri ayrıca | ozkan: 750; memurlar: is-ve-meslek-danismani |
| İş ve Uğraşı Terapisti | Var; koşul testleri ayrıca | ozkan: 2091 |
| İşaret Dili Tercümanı | Var; koşul testleri ayrıca | ozkan: 1991 |
| İşletme Müdürü | Var; koşul testleri ayrıca | ozkan: 1400; memurlar: isletme-muduru |
| İşletme Müdür Yardımcısı | Var; koşul testleri ayrıca | ozkan: 1410; memurlar: isletme-mudur-yardimcisi |
| İtfaiye Amiri | Var; koşul testleri ayrıca | ozkan: 1221 |
| İtfaiye Çavuşu | Var; koşul testleri ayrıca | ozkan: 1231 |
| İtfaiye Eri | Var; koşul testleri ayrıca | ozkan: 1241 |
| İtfaiye Müdürü | Var; koşul testleri ayrıca | ozkan: 1200 |
| İtfaiye Şube Müdürü | Var; koşul testleri ayrıca | ozkan: 1210 |
| Jeofizikçi | Var; koşul testleri ayrıca | ozkan: 1840; memurlar: jeofizikci |
| Jeolog | Var; koşul testleri ayrıca | ozkan: 1810; memurlar: jeolog |
| Jeomorfolog | Var; koşul testleri ayrıca | ozkan: 1830; memurlar: jeomorfolog |
| Kadastro Teknisyeni | Var; koşul testleri ayrıca | ozkan: 2161 |
| Kaloriferci | Var; koşul testleri ayrıca | ozkan: 170; memurlar: kaloriferci |
| Kameraman | Var; koşul testleri ayrıca | ozkan: 1621; memurlar: kameraman |
| Kaptan | Var; koşul testleri ayrıca | ozkan: 2170; memurlar: kaptan |
| Kaymakam | Var; koşul testleri ayrıca | ozkan: 2691; memurlar: kaymakam |
| Kaymakam Adayı | Var; koşul testleri ayrıca | ozkan: 2700; memurlar: kaymakam-adayi |
| Kimyager (SH) | Var; koşul testleri ayrıca | ozkan: 1151 |
| Kimyager (TH) | Var; koşul testleri ayrıca | ozkan: 1880 |
| Kitap Patoloğu | Var; koşul testleri ayrıca | ozkan: 1930 |
| Komiser | Var; koşul testleri ayrıca | ozkan: 510; memurlar: komiser |
| Komiser Yardımcısı | Var; koşul testleri ayrıca | ozkan: 520; memurlar: komiser-yardimcisi |
| Kontrol Memuru | Var; koşul testleri ayrıca | ozkan: 2671 |
| Koruma ve Güvenlik Amiri | Var; koşul testleri ayrıca | ozkan: 1630 |
| Koruma ve Güvenlik Görevlisi | Var; koşul testleri ayrıca | ozkan: 551; memurlar: koruma-ve-guvenlik-gorevlisi |
| Koruma ve Güvenlik Şefi | Var; koşul testleri ayrıca | ozkan: 1641; memurlar: koruma-ve-guvenlik-sefi |
| Kuran Kursu Başöğreticisi | Var; koşul testleri ayrıca | ozkan: 2301 |
| Kuran Kursu Uzman Öğreticisi | Var; koşul testleri ayrıca | ozkan: 2291 |
| Kuran Kursu Öğreticisi | Var; koşul testleri ayrıca | ozkan: 661; memurlar: kuran-kursu-ogreticisi |
| Kütüphaneci | Var; koşul testleri ayrıca | ozkan: 1890; memurlar: kutuphaneci |
| Laborant | Var; koşul testleri ayrıca | ozkan: 1141; memurlar: laborant |
| Maarif Müfettişi | Var; koşul testleri ayrıca | ozkan: 180 |
| Makinist | Var; koşul testleri ayrıca | ozkan: 2181 |
| Mali Hizmetler Müdürü | Var; koşul testleri ayrıca | ozkan: 2660 |
| Mali Hizmetler Uzmanı | Var; koşul testleri ayrıca | ozkan: 190; memurlar: mali-hizmetler-uzmani |
| Mali Hizmetler Uzman Yardımcısı | Var; koşul testleri ayrıca | ozkan: 200; memurlar: mali-hizmetler-uzman-yardimcisi |
| Matbaacı (GİH) | Var; koşul testleri ayrıca | ozkan: 1651 |
| Matbaacı (YH) | Var; koşul testleri ayrıca | ozkan: 1660 |
| Matematikçi | Var; koşul testleri ayrıca | ozkan: 1860; memurlar: matematikci |
| Memur | Var; koşul testleri ayrıca | ozkan: 211; memurlar: memur |
| Milli Eğitim Uzmanı | Var; koşul testleri ayrıca | ozkan: 1450 |
| Milli Eğitim Uzman Yardımcısı | Var; koşul testleri ayrıca | ozkan: 1460 |
| Milli Emlak Denetmeni | Var; koşul testleri ayrıca | ozkan: 2620; memurlar: milli-emlak-denetmeni |
| Milli Emlak Denetmen Yardımcısı | Var; koşul testleri ayrıca | ozkan: 2630; memurlar: milli-emlak-denetmen-yardimcisi |
| Milli Emlak Müdürü | Var; koşul testleri ayrıca | ozkan: 2600; memurlar: milli-emlak-muduru |
| Milli Emlak Müdür Yardımcısı | Var; koşul testleri ayrıca | ozkan: 2610; memurlar: milli-emlak-mudur-yardimcisi |
| Milli Emlak Uzmanı | Var; koşul testleri ayrıca | ozkan: 2640; memurlar: milli-emlak-uzmani |
| Milli Emlak Uzman Yardımcısı | Var; koşul testleri ayrıca | ozkan: 2650 |
| Mimar | Var; koşul testleri ayrıca | ozkan: 220; memurlar: mimar |
| Muayene Memuru | Var; koşul testleri ayrıca | ozkan: 1670; memurlar: muayene-memuru |
| Muhabir | Var; koşul testleri ayrıca | ozkan: 2000; memurlar: muhabir |
| Muhafaza Memuru | Var; koşul testleri ayrıca | ozkan: 1680; memurlar: muhafaza-memuru |
| Muhasebeci | Var; koşul testleri ayrıca | ozkan: 231; memurlar: muhasebeci |
| Murakıp | Var; koşul testleri ayrıca | ozkan: 621; memurlar: murakip |
| Musahhih | Var; koşul testleri ayrıca | ozkan: 1470; memurlar: musahhih |
| Mübaşir | Var; koşul testleri ayrıca | ozkan: 861; memurlar: mubasir |
| Müdür | Var; koşul testleri ayrıca | ozkan: 1360; memurlar: mudur |
| Müdür Yardımcısı | Var; koşul testleri ayrıca | ozkan: 1370; memurlar: mudur-yardimcisi |
| Müezzin-Kayyım | Var; koşul testleri ayrıca | ozkan: 671; memurlar: muezzin-kayyim |
| Müfettiş | Var; koşul testleri ayrıca | ozkan: 1430; memurlar: mufettis |
| Müfettiş Yardımcısı | Var; koşul testleri ayrıca | ozkan: 1440; memurlar: mufettis-yardimcisi |
| Mühendis | Var; koşul testleri ayrıca | ozkan: 240; memurlar: muhendis |
| Mütercim | Var; koşul testleri ayrıca | ozkan: 1691; memurlar: mutercim |
| Müze Araştırmacısı | Var; koşul testleri ayrıca | ozkan: 1901; memurlar: muze-arastirmacisi |
| Müze Memuru | Var; koşul testleri ayrıca | ozkan: 2061 |
| Odyolog | Var; koşul testleri ayrıca | ozkan: 1021; memurlar: odyolog |
| Orman Muhafaza Memuru | Var; koşul testleri ayrıca | ozkan: 2011; memurlar: orman-muhafaza-memuru |
| Öğretim Görevlisi/Okutman | Var; koşul testleri ayrıca | ozkan: 440 |
| Ölçü ve Ayar Memuru | Var; koşul testleri ayrıca | ozkan: 2361 |
| Özel Kalem Müdürü | Var; koşul testleri ayrıca | ozkan: 2591; memurlar: ozel-kalem-muduru |
| Pedagog | Var; koşul testleri ayrıca | ozkan: 1031; memurlar: pedagog |
| Perfüzyonist | Var; koşul testleri ayrıca | ozkan: 2101 |
| Peyzaj Mimarı | Var; koşul testleri ayrıca | ozkan: 1790; memurlar: peyzaj-mimari |
| Pilot | Var; koşul testleri ayrıca | ozkan: 2350 |
| Polis Memuru | Var; koşul testleri ayrıca | ozkan: 531 |
| Profesör | Var; koşul testleri ayrıca | ozkan: 401; memurlar: profesor |
| Programcı | Var; koşul testleri ayrıca | ozkan: 251; memurlar: programci |
| Psikolog | Var; koşul testleri ayrıca | ozkan: 1041; memurlar: psikolog |
| Radyoterapist | Var; koşul testleri ayrıca | ozkan: 2401 |
| Redaktör | Var; koşul testleri ayrıca | ozkan: 2021 |
| Rehber | Var; koşul testleri ayrıca | ozkan: 2031 |
| Restoratör | Var; koşul testleri ayrıca | ozkan: 2190 |
| Sağlık Fizikçisi | Var; koşul testleri ayrıca | ozkan: 1051; memurlar: saglik-fizikcisi |
| Sağlık Memuru | Var; koşul testleri ayrıca | ozkan: 1101; memurlar: saglik-memuru |
| Sağlık Teknikeri | Var; koşul testleri ayrıca | ozkan: 1121; memurlar: saglik-teknikeri |
| Sağlık Teknisyeni | Var; koşul testleri ayrıca | ozkan: 1111; memurlar: saglik-teknisyeni |
| Sağlık Teknisyen Yardımcısı | Var; koşul testleri ayrıca | ozkan: 720; memurlar: saglik-teknisyen-yardimcisi |
| Sanat Tarihçisi | Var; koşul testleri ayrıca | ozkan: 2381 |
| Santral Memuru | Var; koşul testleri ayrıca | ozkan: 1711; memurlar: santral-memuru |
| Satınalma Memuru | Var; koşul testleri ayrıca | ozkan: 1721 |
| Satış Memuru | Var; koşul testleri ayrıca | ozkan: 1731 |
| Sayman | Var; koşul testleri ayrıca | ozkan: 260; memurlar: sayman |
| Saymanlık Müdürü | Var; koşul testleri ayrıca | ozkan: 2430; memurlar: saymanlik-muduru |
| Saymanlık Müdür Yardımcısı | Var; koşul testleri ayrıca | ozkan: 2440; memurlar: saymanlik-mudur-yardimcisi |
| Seçim Müdürü | Var; koşul testleri ayrıca | ozkan: 2540; memurlar: secim-muduru |
| Seçim Müdür Yardımcısı | Var; koşul testleri ayrıca | ozkan: 2550 |
| Sekreter | Var; koşul testleri ayrıca | ozkan: 1741; memurlar: sekreter |
| Sivil Savunma Uzmanı | Var; koşul testleri ayrıca | ozkan: 270; memurlar: sivil-savunma-uzmani |
| Sosyal Çalışmacı | Var; koşul testleri ayrıca | ozkan: 1061; memurlar: sosyal-calismaci |
| Sosyolog | Var; koşul testleri ayrıca | ozkan: 1920; memurlar: sosyolog |
| Şef | Var; koşul testleri ayrıca | ozkan: 281; memurlar: sef |
| Şehir Bölge Plancısı | Var; koşul testleri ayrıca | ozkan: 1940 |
| Şehir Plancısı | Var; koşul testleri ayrıca | ozkan: 1780; memurlar: sehir-plancisi |
| Şoför | Var; koşul testleri ayrıca | ozkan: 291; memurlar: sofor |
| Şube Müdürü | Var; koşul testleri ayrıca | ozkan: 301; memurlar: sube-muduru |
| Tabip | Var; koşul testleri ayrıca | ozkan: 951; memurlar: tabip |
| Tahsildar | Var; koşul testleri ayrıca | ozkan: 911; memurlar: tahsildar |
| Tapu Müdürü | Var; koşul testleri ayrıca | ozkan: 2520; memurlar: tapu-muduru |
| Tapu Sicil Müdür Yardımcısı | Var; koşul testleri ayrıca | ozkan: 2530; memurlar: tapu-sicil-mudur-yardimcisi |
| Tebligat Memuru | Var; koşul testleri ayrıca | ozkan: 851 |
| Teknik Ressam | Var; koşul testleri ayrıca | ozkan: 2201; memurlar: teknik-ressam |
| Tekniker | Var; koşul testleri ayrıca | ozkan: 311; memurlar: tekniker |
| Teknisyen | Var; koşul testleri ayrıca | ozkan: 321; memurlar: teknisyen |
| Teknisyen Yardımcısı | Var; koşul testleri ayrıca | ozkan: 330; memurlar: teknisyen-yardimcisi |
| Tercüman | Var; koşul testleri ayrıca | ozkan: 1701 |
| Terzi | Var; koşul testleri ayrıca | ozkan: 730; memurlar: terzi |
| Tesis Müdürü | Var; koşul testleri ayrıca | ozkan: 340 |
| Tıbbi Teknolog | Var; koşul testleri ayrıca | ozkan: 1001; memurlar: tibbi-teknolog |
| Topoğraf | Var; koşul testleri ayrıca | ozkan: 2211 |
| Turizm Araştırmacısı | Var; koşul testleri ayrıca | ozkan: 2221; memurlar: turizm-arastirmacisi |
| Usta Öğretici | Var; koşul testleri ayrıca | ozkan: 351; memurlar: usta-ogretici |
| Uzman | Var; koşul testleri ayrıca | ozkan: 361; memurlar: uzman |
| Uzman (TUTG) | Eksik | ozkan: 960 |
| Uzman Diş Tabibi | Eksik | ozkan: 970 |
| Uzman Eczacı | Var; koşul testleri ayrıca | ozkan: 1161 |
| Uzman İmam-Hatip | Var; koşul testleri ayrıca | ozkan: 2271 |
| Uzman Tabip | Eksik | ozkan: 940 |
| Uzman Vaiz | Var; koşul testleri ayrıca | ozkan: 2251 |
| Üniversite Genel Sekreteri | Var; koşul testleri ayrıca | ozkan: 1310; memurlar: universite-genel-sekreteri |
| Üniversite Genel Sekreter Yard. | Var; koşul testleri ayrıca | ozkan: 1320 |
| Vaiz | Var; koşul testleri ayrıca | ozkan: 631; memurlar: vaiz |
| Veri Hazırlama ve Kontrol İşletmeni | Var; koşul testleri ayrıca | ozkan: 371; memurlar: veri-hazirlama-ve-kontrol-isletmeni |
| Veteriner Hekim | Var; koşul testleri ayrıca | ozkan: 381; memurlar: veteriner-hekim |
| Veteriner Sağlık Teknikeri | Var; koşul testleri ayrıca | ozkan: 2411; memurlar: veteriner-saglik-teknikeri |
| Veteriner Sağlık Teknisyeni | Var; koşul testleri ayrıca | ozkan: 2421; memurlar: veteriner-saglik-teknisyeni |
| Veznedar | Var; koşul testleri ayrıca | ozkan: 901; memurlar: veznedar |
| Yazı İşleri Müdürü | Var; koşul testleri ayrıca | ozkan: 801; memurlar: yazi-isleri-muduru |
| Yönetmen | Var; koşul testleri ayrıca | ozkan: 2040 |
| Yurt Müdürü | Var; koşul testleri ayrıca | ozkan: 2480; memurlar: yurt-muduru |
| Yurt Müdür Yardımcısı | Var; koşul testleri ayrıca | ozkan: 2490; memurlar: yurt-mudur-yardimcisi |
| Yurt Yönetim Memuru | Var; koşul testleri ayrıca | ozkan: 2071; memurlar: yurt-yonetim-memuru |
| Yüksekokul Sekreteri | Var; koşul testleri ayrıca | ozkan: 1340; memurlar: yuksekokul-sekreteri |
| Zabıt Katibi | Var; koşul testleri ayrıca | ozkan: 891; memurlar: zabit-katibi |
| Zabıta Amiri | Eksik | ozkan: 1271 |
| Zabıta Komiseri | Eksik | ozkan: 1281 |
| Zabıta Memuru | Eksik | ozkan: 1291 |
| Zabıta Müdürü | Var; koşul testleri ayrıca | ozkan: 1250 |
| Zabıta Şube Müdürü | Var; koşul testleri ayrıca | ozkan: 1260 |
| Arama Kurtarma Teknisyeni | Eksik | memurlar: arama-kurtarma-teknisyeni |
| Asker Öğretmen | Eksik | memurlar: asker-ogretmen |
| Astronom | Eksik | memurlar: astronom |
| Başbakanlık Müsteşarı | Eksik | memurlar: basbakanlik-mustesari |
| Başkanlık Müşaviri | Eksik | memurlar: baskanlik-musaviri |
| Biolog | Eksik | memurlar: biolog |
| Cezaevi Vaizi | Eksik | memurlar: cezaevi-vaizi |
| Cumhurbaşkanlığı Birim Başkanları | Eksik | memurlar: cumhurbaskanligi-3-nolu-cbk |
| Daire Başkanı Kit Müşavir | Eksik | memurlar: daire-baskani-kit-musavir |
| Denetçi-Başdenetçi | Eksik | memurlar: denetci-basdenetci |
| Denetmen | Eksik | memurlar: denetmen |
| Denetmen Yardımcısı | Eksik | memurlar: denetmen-yardimcisi |
| Denizcilik Sörvey Mühendisi | Eksik | memurlar: denizcilik-sorvey-muhendisi |
| Destek Hizmetleri Daire Başkanı | Eksik | memurlar: destek-hizmetleri-daire-baskani |
| Diş Protez Teknisyeni | Eksik | memurlar: dis-protez-teknisyeni |
| Emniyet Müdürü | Eksik | memurlar: emniyet-muduru |
| Enformasyon Memuru | Eksik | memurlar: enformasyon-memuru |
| Evlendirme Memuru | Eksik | memurlar: evlendirme-memuru |
| Genel Müdür Bakan Müşaviri | Eksik | memurlar: genel-mudur-bakan-musaviri |
| Genel Sekreter | Eksik | memurlar: genel-sekreter |
| Hademe | Eksik | memurlar: hademe |
| Hakim | Eksik | memurlar: hakim |
| Hakim Adayı | Eksik | memurlar: hakim-adayi |
| Hazine Avukatı | Eksik | memurlar: hazine-avukati |
| Hidrojeolog | Eksik | memurlar: hidrojeolog |
| İcra Memuru | Eksik | memurlar: icra-memuru |
| İl Nüfus ve Vatandaşlık Müdürü | Eksik | memurlar: il-nufus-ve-vatandaslik-muduru |
| İlçe Müdürü | Eksik | memurlar: ilce-muduru |
| İstidlalci | Eksik | memurlar: istidlalci |
| İtfaiyeci | Eksik | memurlar: itfaiyeci |
| Kısım Amiri | Eksik | memurlar: kisim-amiri |
| Kimyager | Eksik | memurlar: kimyager |
| Kit Müşaviri | Eksik | memurlar: kit-musaviri |
| Kontrolör-Başkontrolör | Eksik | memurlar: kontrolor-baskontrolor |
| Liman Başkan Yardımcısı | Eksik | memurlar: liman-baskan-yardimcisi |
| Mal Müdürü | Eksik | memurlar: mal-muduru |
| Matbaacı | Eksik | memurlar: matbaaci |
| Mutemet | Var; koşul testleri ayrıca | memurlar: mutemet |
| Müftü | Eksik | memurlar: muftu |
| Mülkiye Müfettişi | Eksik | memurlar: mulkiye-mufettisi |
| Müsteşar | Eksik | memurlar: mustesar |
| Müsteşar Yardımcısı | Eksik | memurlar: mustesar-yardimcisi |
| Müşavir | Eksik | memurlar: musavir |
| Nüfus Müdürü | Eksik | memurlar: nufus-muduru |
| Öğretim Görevlisi | Eksik | memurlar: ogretim-gorevlisi |
| Polis, Başpolis, Kıdemli Başpolis | Eksik | memurlar: polis-baspolis-kidemli-baspolis |
| Sosyal Güvenlik Kurumu Başkan Yardımcısı | Eksik | memurlar: sosyal-guvenlik-kurumu-baskan-yardimcisi |
| Sosyal Güvenlik Kurumu Başkanı | Eksik | memurlar: sosyal-guvenlik-kurumu-baskani |
| Sosyal Güvenlik Merkezi Müdür Yardımcısı | Eksik | memurlar: sosyal-guvenlik-merkezi-mudur-yardimcisi |
| Sosyal Güvenlik Merkezi Müdürü | Eksik | memurlar: sosyal-guvenlik-merkezi-muduru |
| Sportif Eğitim Uzmanı | Eksik | memurlar: sportif-egitim-uzmani |
| Strateji Geliştirme Başkanı | Eksik | memurlar: strateji-gelistirme-baskani |
| Tapu Kadastro Denetmen Yardımcısı | Eksik | memurlar: tapu-kadastro-denetmen-yardimcisi |
| Tapu Kadastro Denetmeni | Eksik | memurlar: tapu-kadastro-denetmeni |
| TBMM Genel Sekreteri | Eksik | memurlar: tbmm-genel-sekreteri |
| Teknik Öğretmen (THS) | Eksik | memurlar: teknik-ogretmen |
| Tüketici Hakem Heyeti Raportörü | Eksik | memurlar: tuketici-hakem-heyeti-raportoru |
| Uzman (Kariyer) | Eksik | memurlar: uzman-kariyer |
| Uzman Yardımcısı (Kariyer) | Eksik | memurlar: uzman-yardimcisi-kariyer |
| Vali | Eksik | memurlar: vali |
| Vali Yardımcısı | Eksik | memurlar: vali-yardimcisi |
| Vergi Dairesi Müdür Yardımcısı | Eksik | memurlar: vergi-dairesi-mudur-yardimcisi |
| Vergi Dairesi Müdürü | Eksik | memurlar: vergi-dairesi-muduru |
| Yoklama Memuru | Eksik | memurlar: yoklama-memuru |
| Zabıta | Eksik | memurlar: zabita |
