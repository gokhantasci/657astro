# Özel bülten: her özet ayrı görüş · 08.11.2026

`/dpb-gorusleri/dpb_mutalaa_ozel/` artık PDF sayfalarının kopyası değildir;
bültendeki **336 görüşün başlık dizinidir**. Her başlık kendi kalıcı adresine
açılır. Bu sayfada özet, görüş başlığıdır; altında yalnız ilgili görüşün
özgün metni, daha aşağıda aynı metne dayalı kısa soru-cevaplar bulunur.

336 ayrı Markdown `src/content/dpb-bulten/` koleksiyonundadır; haber
koleksiyonuna eklenmez. Birden fazla PDF sayfasına yayılan görüşler tek
görüş metninde birleşir. İçindekiler, kapak, matbaa künyesi ve sayfa
numaraları görüş gövdesine alınmaz. Kaynak yazımı, tarihleri, madde sırası
ve sözcükleri korunur; başlık ve gövde tarih biçimlendirmesinden ayrılır.
PDF başlangıç/bitiş referansları yalnız kaynak doğrulaması için metadata
olarak saklanır. PDF bağlantısı doğru kaynak konumuna açılır.

Başlangıçta 335 standart `Özet:` başlığı bulunmuştu. Bağımsız sözcük sırası
karşılaştırması, kaynakta `Özet;` biçiminde dizilmiş Laboratuar bölümü
mezununun sağlık teknikeri kadrosuna atanmasına ilişkin bir görüşü daha
saptadı. Bu görüş de ayrı sayfadır; toplam 336'dır. Aynı başlığın kaynakta
tekrar edildiği kayıtlar sırf başlık aynı diye başka görüşe birleştirilmez.

`scripts/dpb-bulten-gorusleri.mjs` özgün bülten Markdown'ından başlıkları
ve metin sınırlarını çıkarır. Başlık/metin kimliğinden kalıcı adres üretir.
`scripts/belge-markdown-denetimi.mjs`, her derlemede 336 dosyanın kaynağa
eşitliğini ve başlık dizinini kontrol eder. Tam bülten Markdown'ı yalnız
kaynak bütünlüğü ve tekrar üretim amacıyla korunur; kamuya açık adreste
tam kitap yerine görüş dizini görüntülenir.

Yeni adresler DPB arşivinde, site haritasında, site aramasında ve asistan
dizininde bulunur. Her görüş kendi okunma sayacını kullanır. Önceden bülten
adresinde kaydedilen görüntülenmeler o adreste kalır; görüşlere yapay
olarak dağıtılmaz. Rakamlarla sayfası ayrı görüşleri içerik toplamına ekler.

`tests/dpb-bulten.spec.ts`, kaynak görüş metinlerinin sıralı sözcüklerini
birleştirilmiş ayrı metinlerle bağımsız olarak karşılaştırır; sözcük kaybı,
fazlalığı veya sıra farkını kabul etmez. Her görüşün soru-cevap alıntısı
yalnız kendi metninde bulunmalıdır. Diğer belge testleri yeni dizini,
görüş bağlantılarını, tek sayacı ve açık/koyu temada beş ekran genişliğini
kontrol eder.
