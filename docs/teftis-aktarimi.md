# Teftiş ekranları ve kaynak aktarımı

03/11/2026. Kaynak: 657.com.tr'nin kendi WordPress temasından salt okunur alınan şablonlar ve hesap betikleri. Kaynak sunucuya dosya veya ayar yazılmadı. Başka kişilere ait kapalı kaynak yazılım alınmadı.

## Ekranlar

Terfi cetveli, karar ve istinaf defteri, BYU süre/uygulanan dosyalar, kesinleştirme/infaz, harç tahsil, kesinleşme zamanı, kalem denetimi ve JSON robotu kaynak motorlarıyla çalışır. İddianame, tensip, hedef süre ve gerekçeli karar önceki yerel motorlarını kullanır. Duruşma kaçağı ile kanun yolu kaynakta otomatik hesap değil; açıklama ve Word şablonları taşındı.

Yargılama gideri kontrolü kaynakta “hazırlanıyor” ekranıydı. Yeni `/yargilama-gideri-kontrolu/` bağımsız bir aritmetik mutabakat aracıdır: tahsilat − gider − iade ile bildirilen bakiye karşılaştırılır. Hukuki uygunluk veya tarife denetimi olduğu iddia edilmez. Eksik Excel sütunları reddedilir; farklar toplamda sıfırlansa da dosya bazındaki fark sayısı görünür.

Nüfus kayıt analizi de aynı izole çalışma ortamında taşındı. Kaynak, ilk kişiyi davacı ve eşini davalı kabul ederek özet çıkarır; taraf sıfatları dosyadan teyit edilmelidir. Hüküm metni üretmez. Eski menünün “boşanma kararı” etiketi bu yeteneği doğru anlatmadığından adı düzeltildi.

## Çalışma ve gizlilik

`src/legacy/teftis/` yalnız temizlenmiş ekran gövdelerini içerir. Motorlar ve lisansları `public/uygulamalar/teftis/` içindedir. `scripts/teftis-hazirla.mjs`, predev/prebuild sırasında kendi kendine yeterli HTML dosyalarını üretir. Bu üretilen HTML Git'e girmez; kaynak kopyası ve npm bağımlılıklarıyla yeniden oluşturulur. Üretim derlemesi sunucu veya artifacts klasörüne bağlı değildir.

Ekranlar opaque-origin sandbox iframe içinde çalışır. Üst sayfa/veri deposuna erişim verilmez. CSP dış bağlantıları ve form gönderimini engeller. DOMPurify, dinamik HTML hücrelerinden betik ve olay özniteliklerini kaldırır. Kaynakların dört sabit düğme eylemi, veri özniteliği ve yerel olay dinleyicisine çevrilir. Word/Excel dışa aktarımı yalnız doğrulanan mesajlarla ana sayfanın tarayıcı koduna gider. Kaynak PHP uçlarına dosya gönderilmez. localStorage yerine açık sayfanın geçici belleği kullanılır.

Terfi Excel'i ve BYU/kalem Word çıktıları asıl şablonların alanlarına tarayıcıda yazılır. Aynı alan/değerleri taşımak, Excel'in zengin metin biçimlerinin veya dosya baytlarının birebir aynı olması anlamına gelmez. Özgün şablonlar ve 3. taraf lisansları aynı dizindedir.

Kaynak betikte eski `panel-head` seçicisi güncel `card-header` şablonuyla uyuşmadığından kesinleştirme adım başlığı değişmiyordu; düzeltildi. Karar şablonunun footer sonrasında ikinci kez eklediği ayar kartı kaldırıldı. Tarihler ekranda gg/aa/yyyy, seçimler aramalı ve sayfa boyu ortak site ayarındandır. Eski ağ sayaçları devre dışıdır. Alt dizine yayın için `BASE_PATH` desteklenir.

## Kaynağı yenileme

`scripts/teftis-aktar.py`, salt okunur kaynak anlık görüntüsünü `artifacts/teftis-port` ve `artifacts/kaynak-onbellek/teftis` klasörlerinden normalize eder. Kaynak görüntüsünü aldıktan sonra çalıştırılır; normal derlemede çalışmaz. Şablon SHA-256 değerleri `src/data/teftis-modulleri.json` içindedir. Hesap değişikliğinde aynı girdiler kaynak ve yerel ekrana verilerek testler yeniden çalıştırılmalıdır.

`tests/teftis-aktarim.spec.ts`: gerçek XLSX/UDF/JSON girdisi, dosya eşleştirme, süre, sıralama, kişi sayıları, üç aşamalı infaz akışı, Word/Excel hücre içeriği, sandbox, HTML temizleme, mobil genişlik ve yerel şablonlar. Yalnız ekranın açılması tamamlanmış sağlama sayılmadı. Tüm gerçek UYAP belge varyantlarının veya bütün olası veri birleşimlerinin doğrulandığı iddia edilmez.
