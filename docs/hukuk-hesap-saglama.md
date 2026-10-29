# Hukuk araçlarının aktarımı ve sağlaması

30-10-2026: adliyeci.657.com.tr hesapları 657 Astro tasarımına taşınırken, adliyeci.org çıktıları ve resmî tarife kuralları birlikte denetlendi. Ortak veri `src/data/hukuk-tarifeleri.json`; saf hesap motoru `src/lib/hukuk-hesap.ts` içindedir. Kullanıcı girişleri tarayıcıda işlenir.

## Taşınan ekranlar

`/hukuk-mahkemeleri/` dizini altında 12 karar hesabı vardır: tam/kısmi kabul, esastan ret, husumet/dava şartı, açılmamış sayılma, feragat, sulh, davayı kabul, nafaka tam/kısmi kabul, maddi ve manevi tazminat. Sonuçlar hem kalem dökümü hem kopyalanabilir harç/vekâlet/gider karar taslağı üretir. Tarafların birden fazla olması metne yansır; farklı ret sebepleri veya müşterek/müteselsil sorumluluk kendiliğinden belirlenmez.

Yardımcı hesaplar: nispi vekâlet, ıslah, istinaf/temyiz, kasa ve davalılara paylaşım. Almanya posta kodu sorgusu ayrıca taşındı. Kaynak uygulamanın kişisel tarife ayarları yerine, sürümlenen ortak tarife JSON'u kullanılır. Bu çalışma canlı adliyeci alt alan adını kaldırmaz veya yönlendirme/DNS değiştirmez.

## Kaynaklar

- [GİB 98 seri no.lu tebliğ](https://cdn.gib.gov.tr/api/gibportal-file/file/getFile?objectKey=MEVZUAT_TEBLIGLER%2FUNIVERSAL%2F2025%2F492_Teblig98.pdf), ek (1) sayılı tarife: 2026 asliye başvuru ve maktu karar harcı 732 TL, sulh başvuru 335,20 TL, nispi oran binde 68,31, nafaka yıllık tutarında binde 11,38, istinaf başvuru 2.002 TL, temyiz başvuru 3.608,50 TL, temyiz maktu karar 1.526,20 TL.
- [TBB güncel birleştirilmiş tarife](https://www.barobirlik.org.tr/dosyalar/belgeler/AvUcretTarifesi/tbb2025.pdf) ve [karşılaştırmalı cetvel](https://d.barobirlik.org.tr/2025/20251103_tbbtablo_karsilastirmacetveli.pdf): 04-11-2025 başlangıçlı tarife; asliye 45.000, sulh 30.000, tüketici 22.500 TL. On nispi basamak ve son sınırsız %1 basamağı.
- [Harçlar Kanunu](https://mevzuat.adalet.gov.tr/mevzuat/103011): madde 22 ve 28; feragat/sulh/kabulde celseye göre 1/3 veya 2/3, peşin nispi harçta 1/4 veya ölüm/cismani zararda 1/20.
- Karşılaştırma ekranları: [adliyeci.org ana menüsü](http://adliyeci.org/ANASAYFA.aspx), [tam kabul](http://adliyeci.org/TAM%20KABUL.aspx), [kısmi kabul](http://adliyeci.org/KISMENKABUL.aspx), [usulden sonuç](http://adliyeci.org/ACILMAMI%C5%9E.aspx), [nafaka](http://adliyeci.org/NAFAKATAM.aspx), [nispi istinaf](http://adliyeci.org/%C4%B0ST%C4%B0NAFHARCI.aspx).

## Tarayıcıdan doğrulanan örnekler

| Örnek | Kaynak sonucu | Yerel sonuç |
| --- | --- | --- |
| Tam kabul, 100.000 TL; başvuru/peşin 732'şer TL; bilirkişi 1.000 ve posta 100 TL | Harç 6.831; bakiye 6.099; davacı ücreti 45.000; gider 2.564 | Aynı |
| Aynı girdiler, 60.000 TL kısmi kabul | Harç 4.098,60; bakiye 3.366,60; davacı ücreti 45.000; davalı 40.000; harç gideri 1.464 + diğer gider 660 | Aynı |
| Açılmamış sayılma, para ile ölçülmeyen iş, ön incelemeden önce; 1.000 TL peşin | Harç 732; iade 268; davalı ücreti 22.500 | Aynı |
| Nafaka tam kabul, aylık 500 TL, gider yok | Harç 732; davacı ücreti 6.000 | Aynı |
| İstinaf, 100.000 TL, genel dava | Nispi karar harcı 1.707,75 | Aynı; başvuru harcı ayrıca 2.002 gösterilir |
| İstinaf, 1.000.000 TL, ölüm/cismani zarar | Nispi karar harcı 3.415,50 | Aynı; başvuru ayrıca gösterilir |

## Bilinçli düzeltmeler

- adliyeci.657.com.tr tam kabul ekranı parasal dava değerine rağmen daima maktu karar harcı kullanıyordu. Yeni sürüm para ile ölçülen davada nispi harcı seçtirir; adliyeci.org ve GİB ile eşleşir.
- Aynı alt alan adındaki kısmi kabul ekranı, bütün dava için tek vekâlet ücreti hesaplayıp kabul/ret oranıyla dağıtıyordu. AAÜT 13 uyarınca kabul ve ret tutarları ayrı hesaplanır. 100.000/60.000 örneğinde 27.000/18.000 yerine 45.000/40.000 sonucu çıkar.
- Husumet/dava şartı (AAÜT 7/2), açılmamış sayılmadan (7/1) ayrıdır. İlki parasal işte nispi tutarın maktu tavanla sınırlandırılmasıdır; ön inceleme öncesi diye kendiliğinden yarıya indirilmez. Açılmamış sayılmada aşamaya göre yarım/tam ve maktu tavan uygulanır.
- Manevi tazminatta davalı ücretinin davacı ücretini geçemeyeceği kuralı 08-01-2026 tarihinde kaldırılmıştır (birleştirilmiş resmî tarifenin dipnotu). Maddi tazminatta AAÜT 13/3 sınırı korunur. Tam ret, iki tazminat türünde de ayrı maktu kurala tabidir.
- Nafaka reddedilen kısmına vekâlet ücreti yoktur; yıllık kabul tutarı ücretin üst sınırıdır. Aylık 500 TL örneği kaynakta da 6.000 TL'dir.
- Harç giderleri ile diğer giderler ayrılır. Keşif harcı, keşif/ulaşım giderinden ayrı girilir. İade edilen peşin harç ikinci kez davacıya gider olarak ödenmez.
- adliyeci.org nafaka kısmi kabulünde 10.000/6.000 TL; başvuru/peşin 732; tamamlama/ıslah/keşif 0; bilirkişi 1.000 ve posta 100 girildi. Kaynak harç/ücrette doğru 819,36 ve 45.000 verdi, fakat keşif 0 olmasına rağmen döküme 732 TL keşif harcı daha ekledi. Yeni sürüm yalnız gerçek keşif harcını kullanır; gider bu örnekte 2.124 TL'dir.
- Nispi tarifenin son %1 basamağı sınırsızdır; kaynak alt alan adındaki 18,6 milyonluk son bant sınırı yüzünden daha büyük tutarın hesap dışında kalması taşınmadı.
- Paylaşımda kuruşlar en büyük kalan yöntemiyle dağıtılır. 60 kuruşun 100 kişiye %1'er paylaştırılmasında son kişiye negatif para yazılmaz.
- Eski uyumluluk JSON'larının 2026 asliye maktu vekâlet tutarı da 45.000 TL'ye bağlandı; keşif harcı ortak tebligat kaynağındaki 5.188 TL'dir. Eski yıllar korunur.
- Almanya cetvelindeki 23913 gibi birden fazla görev bölgesine düşen kodlar ilk eşleşme ile gizlenmez; bütün farklı temsilcilikler ve doğrulama uyarısı gösterilir. Bu cetvel bağımsız güncel resmî görev bölgesi doğrulaması yerine geçmez.

## Sınırlar ve güncelleme

Tek talep ve genel hukuk davası modeli kullanılır. Karşı dava, özel istisnalar, farklı ret sebepli davalılar ve yalnız bir tarafın harç muafiyeti ayrıca değerlendirilmelidir. Sulhte paylaşım anlaşmaya göre girilir; araç hukuki sorumluluğu kendisi belirlemez. Taslak, hükmün diğer unsurlarını veya somut dosyaya uygunluğunu belirlemez.

Tarifeler tarih bazındadır. 2027 harcı henüz dosyada yoksa 2026 tutarı sessizce kullanılmaz. Yeni resmî tarife girildiğinde önceki dönem kapatılarak yeni kayıt eklenir. `hukuk-hesap.spec.ts` kaynak örneklerini, dilim sınırlarını, aşama değişikliklerini, yeni manevi tazminat kuralını, kuruş dağıtımını ve bütün ekranların mobil açık/koyu görünümünü denetler.
