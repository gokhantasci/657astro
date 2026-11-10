# Ana sayfa dönem sıralamaları

Döviz / hava durumu / Shell panelinin yerini hukuk terimleri, adli çevre,
mülakat soruları ve yazılar için beşer bağlantı aldı. Bugün, bu hafta, bu ay
ve bu yıl seçimi dört listeyi birlikte günceller.

`/okunma-katalogu.json` her site derlemesinde yayınlanan içeriklerden üretilir.
Mülakat listesi yalnız `mulakat: true` soruları, yazılar yalnız taslak olmayan
koleksiyon kayıtlarını içerir. Adresler sayaçlarla aynı URL kodlamasını kullanır.
Katalog istemcide bir kez alınır; başlıklar `textContent` ile yazılır.

`/_657-servis/api/okunma/siralama?donem=bugun|hafta|ay|yil` yalnız günlük
okunma tablosunu toplar. Türkiye saati, pazartesi başlayan hafta, takvim ayı
ve takvim yılı kullanılır. Gelecek tarihli kayıtlar ve eski arşiv toplamları
hesaba katılmaz. Ölçüm başlangıcı gösterilir. Sıfır sayılar açıkça belirtilir;
eşitlikte Türkçe alfabetik sıra kullanılır. Her kategori en fazla beş kayıttır.
Hızlı seçimde eski yanıt yeni dönemi ezmez. Hata durumunda yeniden denenebilir.

Doğrulama: 19 servis testi, 11 tarayıcı testi; beş genişlikte (320, 375, 414,
768, 1440) açık/koyu tema, gerçek katalog bağlantıları, dönem sıralaması,
yarışan yanıtlar ve servis hata/yeniden deneme akışı. Yerel `astro check`
hatasızdır. Yerel tam derleme disk alanı nedeniyle durdu; üretim derlemesi
GitHub Actions üzerinde başarıyla tamamlandı. İlk Pages dağıtımı dosya eşitleme
aşamasında 10 dakikada zaman aşımına uğradı; yayın bekleme süresi 30 dakikaya
çıkarıldı. Servis yayını kaynak ve SQLite
yedeği alınarak yapıldı; 83 araç sayacı ve mevcut toplamları korundu.

İkinci üretim derlemesi ve Pages yayını başarılıdır (çalışma: 42319840974).
Canlı katalog 5.036 kayıt içerir: 2.490 terim, 1.007 adli çevre, 1.209
mülakat sorusu ve 330 yazı. Canlı ana sayfada açık/koyu tema × 375/1440 px
× dört dönem karşılaştırıldı; her seçimin dört beşli listesi servis verileriyle
aynı sıradadır. Yatay taşma görülmedi. Servis sonucu ve katalog gerçek veridir;
bu son kontrolde yanıtlar taklit edilmedi.
