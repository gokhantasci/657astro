# Personel duyuruları · 07.11.2026

Ana sayfanın Bakanlık haberleri panelinde tek **Personel** filtresi bulunur.
Kapsam, Adalet Bakanlığının `/Birimler/ACM`, `/Birimler/BAM` ve
`/Birimler/BİM` resmî dizinlerinden alınır. İlk katalogda 173 ağır ceza
merkezi, 18 bölge adliye mahkemesi ve 12 bölge idare mahkemesi vardır.
Bu katalogdaki adliyeler, sitedeki 170 faal ACM kaydının tamamını da kapsar;
İstanbul Anadolu ve iki Ereğli için resmî dizindeki adlandırmalar kullanılır.
Alan adları il/ilçe isimlerinden tahmin edilmez.

`scripts/personel-haberleri.mjs`, `/Arsiv/tumu` arşivini ve devam kayıtlarını
`/Site/ListeDevamGetir` üzerinden okur. Tümü arşivine ulaşılamazsa
`/Arsiv/duyuru` denenir. Son bir yılın başlıklarında Sınav, Mülakat, Sözlü,
Sonuç veya Aday sözcükleri ve bunların ek almış biçimleri eşleştirilir.
HTML menüleri, haber gövdeleri, aday listeleri ve PDF içerikleri içe aktarılmaz.
Kayıtlar başlık, tarih, kurum, kurum türü ve resmî bağlantıdan oluşur.

Farklı mahkemelerin aynı başlıklı duyuruları URL ile ayrı tutulur. Personel
kategorisine diğer kaynakların 40 haber sınırı uygulanmaz. Sınav/atama sonucu
duyuruları genel haber filtresince silinmez; haber yazılarına ilişkin önceki
yayın denetimi devam eder. Ana sayfa ve tarayıcı yenilemesi aynı kuralları
uygular. Personel seçilince kaynak kapsamı ve erişilemeyen kurum sayısı görünür.

Kaynak katalogları her haber güncellemesinde yeniden okunur; dizine
ulaşılamazsa kayıtlı kurumlar taranır. Aynı anda en çok altı kurum okunur.
İmleç döngüsü, eksik devam yanıtı veya 40 sayfa sınırı başarı sayılmaz;
alınabilen yeni kayıtlar ve önceki kayıtlar korunur. Yönlendirmeler resmî
alanlarda kalır; kaynak hata sayfası döngüsü takip edilmez.

`.github/workflows/haberler.yml` yaklaşık yarım saatte bir mevcut haber
toplayıcısını çalıştırır. Saatlik yayın iş akışı da aynı veriyi günceller.
`personel-kaynaklari.json`, `haberler.json` ve `haber-akisi.json` birlikte
kaydedilir. Açık ana sayfa mevcut beş dakikalık yenilemesini kullanır.

İlk canlı tarama: 203 kurum denendi, 197 kaynak başarıyla okundu, 1.727
eşleşen duyuru alındı. Adana BAM, Aydın, Elazığ, Karaman, Zile ve İzmir BİM
siteleri kendi `/hata?aspxerrorpath=…` adreslerine yönlendiriyordu. Bunlar
listeden çıkarılmaz; sonraki otomatik çalıştırmalarda yeniden denenir.

Doğrulama: `node --test tests/personel-haberleri.node.mjs` ile Türkçe
eşleştirme, bozuk HTML, güvenilir adresler, arşiv devamı, tarih sınırı,
erişim hatasında kayıt koruma ve yönlendirme davranışı denetlenir.
`tests/haber-akisi.spec.ts`, yenileme/sayfalama yanında tek Personel filtresini
ve farklı kurumların aynı başlığının korunmasını denetler. Birim testleri
iki otomatik haber/yayın iş akışında da çalışır.
