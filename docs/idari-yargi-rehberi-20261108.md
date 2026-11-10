# Adli çevre sayfalarında idari yargı — 08.11.2026

Kaynak: HSK'nin [Adli ve İdari Yargı Listesi](https://www.hsk.gov.tr/adli-ve-idari-yargi-listesi) sayfasındaki [18.09.2026 tarihli idari rehber dosyası](https://www.hsk.gov.tr/Eklentiler/180920261016idari-rehberpdf.pdf). Dört sayfalık tablodaki 113 mahkeme satırı ve 12 BİM grubu `src/data/idari-yargi-rehberi.json` dosyasına alınmıştır. Kaynak URL, kontrol tarihi ve PDF SHA-256 özeti kaydedilmiştir. Tablo metni çıkarılmış ve ikinci sayfa görsel olarak incelenmiştir; FD işaretleri korunmuştur.

İl bazında üç ayrı bilgi sunulur: ildeki idare mahkemesinin durumu, hizmet veren faal idare mahkemesi, bağlı bölge idare mahkemesi. Kurulu fakat faal olmayan mahkeme, mahkeme bulunmayan il ile aynı kabul edilmez. İlçe adliye sayfası kendi ilinin kaydını kullanır; ilçede idare mahkemesi bulunduğu iddia edilmez. Eski arşiv kayıtlarında doğrulanmış il alanı yoksa bilgi tahmin edilmez.

Eşleme önce ilin kendi faal mahkemesini kullanır. Böyle bir mahkeme yoksa rehberde o ili çevresinde gösteren faal mahkemeye bakılır; sıfır veya birden fazla aday derlemeyi durdurur. Rehberde Erzurum İdare satırında Bingöl de yazılmıştır; aynı tabloda Bingölün kendi faal idare mahkemesi Diyarbakır BİM grubunda bulunmaktadır. Bingöl için kendi faal mahkeme satırı esas alınır. Ham ek iller alanı değiştirilmez ve bu durum veri dosyasında not edilmiştir.

Örnekler: Ağrı faal, Ağrı İdare / Erzurum BİM; Iğdır FD, Ağrı İdare / Erzurum BİM; Bilecik FD, Eskişehir İdare / Bursa BİM; Ardahan'da yerel idare mahkemesi rehberde yok, Kars İdare / Erzurum BİM. Haritanın idare/vergi etiketleri ve BİM il grupları da aynı kaynaktan üretilir. Ham coğrafi geometri dosyası değiştirilmez.

Bilgi, mahkeme rehberidir; somut uyuşmazlıkta görev/yetki kararı yerine geçmez. Sayfada kaynak bağlantısı ve dosya tarihi gösterilir.
