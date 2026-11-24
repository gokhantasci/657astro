export {};

interface Seviye {
  ad: string;
  metin: string;
}

interface Ders {
  id: string;
  duzen: 'f' | 'q';
  baslik: string;
  aciklama: string;
  tuslar: string;
  seviyeler: Seviye[];
}

const F_DERSLER: Ders[] = [
  {
    id: 'f-1', duzen: 'f', baslik: 'Ders 1: Temel Sıra Tuşları',
    aciklama: 'TS 2117 F klavye temel sırası: u, i, e, a, ü, t, k, m, l, y, ş.',
    tuslar: 'u i e a ü t k m l y ş',
    seviyeler: [
      { ad: 'Seviye 1: İşaret Parmakları (a, k, ü, t)', metin: 'ak ka at ta aka kata taka ata kaka tat kat tak akat katak takat ütü kütük akü ataka taka kata' },
      { ad: 'Seviye 2: Orta & Yüzük (e, m, i, l)', metin: 'em me ek ke il li el le emek etek kale kalem kilim kule liman malik millet teklif temlik ilmek' },
      { ad: 'Seviye 3: Serçe & Tam Sıra (u, y, ş)', metin: 'ul lu uy yu uş şu yaka yele yemek yetim yetki yulaf yumak şaka şale şema şule şükür uyku uşak' },
    ],
  },
  {
    id: 'f-2', duzen: 'f', baslik: 'Ders 2: Üst Sıra Tuşları',
    aciklama: 'Sol el (f, g, ğ, ı, o) ve sağ el (d, r, n, h, p) üst sıra uzanımları.',
    tuslar: 'f g ğ ı o d r n h p',
    seviyeler: [
      { ad: 'Seviye 1: Sol El Üst Sıra (f, g, ğ, ı, o)', metin: 'fg gf go og fo of ığ ğı foya gala gıda ığdır ışık ılık odak ofis okul olgu olay olgun onay oyun' },
      { ad: 'Seviye 2: Sağ El Üst Sıra (d, r, n, h, p)', metin: 'dr rd dn nd dh hd dp pd dava delil duruşma hakim harç hukuk hüküm karar kanun noter rapor resmi' },
      { ad: 'Seviye 3: Tüm Üst Sıra Birleşimi', metin: 'fidan gafil gönül gözlem kılavuz ortak oyuk duruşma dilekçe mahkeme memur parlamento personel tanık' },
    ],
  },
  {
    id: 'f-3', duzen: 'f', baslik: 'Ders 3: Alt Sıra Tuşları',
    aciklama: 'Sol el (j, ö, v, c, ç) ve sağ el (z, s, b) alt sıra çalışması.',
    tuslar: 'j ö v c ç z s b',
    seviyeler: [
      { ad: 'Seviye 1: Sol El Alt Sıra (j, ö, v, c, ç)', metin: 'jö öj vc cv vç çv jale jüri ödev ödül öğle önlem örnek özet özür vade vakıf vekil vergi cevap ceza' },
      { ad: 'Seviye 2: Sağ El Alt Sıra (z, s, b)', metin: 'zs sz zb bz sb bs zabıt zaman zarf cezaevi savcı savunma senet sicil sistem sözleşme suç belge büro' },
      { ad: 'Seviye 3: Tüm Alt Sıra Birleşimi', metin: 'vicdan cadde cihaz cuma cümle çaba çağrı çalışma çevre çizelge çözüm bakanlık başvuru bilirkişi bordro' },
    ],
  },
  {
    id: 'f-4', duzen: 'f', baslik: 'Ders 4: Temel Sıra ve Diğerleri',
    aciklama: 'Temel sıradan üst ve alt sıraya hızlı gidiş-dönüş kas hafızası.',
    tuslar: 'Temel + Üst + Alt',
    seviyeler: [
      { ad: 'Seviye 1: Temel + Üst Sıra Geçişi', metin: 'adalet akıl anlam arama aralık karar kanun katip makale makam memur noter onay oran rapor temel yetki' },
      { ad: 'Seviye 2: Temel + Alt Sıra Geçişi', metin: 'belge bütçe cevap ceza çaba çözüm ödev ödül örnek savcı senet sicil sözleşme vekil vergi zabıt zaman' },
      { ad: 'Seviye 3: Üç Sıra Tam Geçiş', metin: 'mahkeme kaleminde görevli zabıt katibi duruşma tutanaklarını düzenli ve hatasız biçimde sisteme kaydeder' },
    ],
  },
  {
    id: 'f-5', duzen: 'f', baslik: 'Ders 5: Diğer Tuşlar (q, w, x ve Özel)',
    aciklama: 'Sağ serçe uzanımındaki q, w, x ve nadir kullanılan harf geçişleri.',
    tuslar: 'q w x j ğ ş',
    seviyeler: [
      { ad: 'Seviye 1: Nadir Harf Egzersizi (j, ğ, ş)', metin: 'jale jandarma jelatin jest jüri ağaç ağustos ağırlık bağımsızlık çağdaş şeffaflık şikâyet şüpheli' },
      { ad: 'Seviye 2: q, w, x ve Uluslararası Terimler', metin: 'qr kod web wiki xml xss sql query widget proxy workflow quick text web sitesi xml belgesi qr tarama' },
      { ad: 'Seviye 3: Karma Uzanım Kontrolü', metin: 'jüri değerlendirme tutanağı ağaçlandırma projesi şeffaflık ilkesi web erişimi ve xml veri aktarımı' },
    ],
  },
  {
    id: 'f-6', duzen: 'f', baslik: 'Ders 6: Temel Sıra Kolay Kelimeler',
    aciklama: 'Yalnızca temel sıra harfleriyle kurulan akıcı Türkçe kelimeler.',
    tuslar: 'u i e a ü t k m l y ş',
    seviyeler: [
      { ad: 'Seviye 1: Kısa Kelimeler', metin: 'ak al at el em et il it kat kel kil kul kut mal mat mil şal tak tam tek tel tüm yat yel yem yet' },
      { ad: 'Seviye 2: Orta Uzunlukta Kelimeler', metin: 'akıl alem amel ekmek elma emek emlak ilke ilmek kale kalem kemal kilim kule kulak kumlu leylek liman' },
      { ad: 'Seviye 3: Akıcı Cümle Ritmi', metin: 'kemal kalem ile makale yazmalı ali kilim ve yelek almalı millet emek ile yükselir yetki ve ilke temeldir' },
    ],
  },
  {
    id: 'f-7', duzen: 'f', baslik: 'Ders 7: Üst Sıra Kolay Kelimeler',
    aciklama: 'Üst sıra yoğunluklu günlük ve resmî Türkçe kelimeler.',
    tuslar: 'f g ğ ı o d r n h p',
    seviyeler: [
      { ad: 'Seviye 1: Kısa Üst Sıra Kelimeleri', metin: 'dar fon gar han hap hız nar nur oda ofis oran pay pınar raf rıhtım rol ruh ton tur for gor hor' },
      { ad: 'Seviye 2: Resmî Kelimeler', metin: 'dava delil dilekçe duruşma ferman gıda gönül hakim harç hukuk hüküm karar kanun noter rapor resmi tanık' },
      { ad: 'Seviye 3: Üst Sıra Akıcılık', metin: 'hakim duruşma günü gelen raporları okuyup hukuka uygun nihai kararını açık duruşmada taraflara bildirdi' },
    ],
  },
  {
    id: 'f-8', duzen: 'f', baslik: 'Ders 8: Alt Sıra Kolay Kelimeler',
    aciklama: 'Alt sıra harfleriyle ritim ve parmak esnekliği.',
    tuslar: 'j ö v c ç z s b',
    seviyeler: [
      { ad: 'Seviye 1: Kısa Alt Sıra Kelimeleri', metin: 'baz bez buz cam can caz cep çam çay çöp göz köz söz saz ses sis var vaz zam zar zevk zor' },
      { ad: 'Seviye 2: Hukuk ve Büro Kelimeleri', metin: 'başvuru belge bilirkişi bordro büro bütçe cevap ceza çaba çağrı çalışma çevre çözüm ödev ödül savcı senet' },
      { ad: 'Seviye 3: Alt Sıra Akıcılık', metin: 'savcı başvuru belgesini inceleyerek bilirkişi cevabını ve çözüm önerisini özetleyip ceza dosyasına ekledi' },
    ],
  },
  {
    id: 'f-9', duzen: 'f', baslik: 'Ders 9: Başlangıç Son Tekrar',
    aciklama: 'İlk 8 dersin tüm harflerini pekiştiren dengeli tekrar aşaması.',
    tuslar: 'Tüm Küçük Harfler',
    seviyeler: [
      { ad: 'Seviye 1: Dengeli Kelime Havuzu', metin: 'adalet bakanlık belge bilgi bütçe cevap ceza çalışma dava delil dilekçe dosya duruşma görev hakim hukuk' },
      { ad: 'Seviye 2: Uzun Kelimeler', metin: 'değerlendirme görevlendirme kesinleştirme sınıflandırma sorumluluk sürdürülebilirlik yetkilendirme yükümlülük' },
      { ad: 'Seviye 3: Akıcı Paragraf', metin: 'düzenli ve doğru teknikle yapılan on parmak çalışması hem yazım hızını artırır hem de parmak yorgunluğunu azaltır' },
    ],
  },
  {
    id: 'f-10', duzen: 'f', baslik: 'Ders 10: Harf Havuzu (A – N)',
    aciklama: 'A harfinden N harfine kadar alfabetik odaklanma çalışması.',
    tuslar: 'a b c ç d e f g ğ h ı i j k l m n',
    seviyeler: [
      { ad: 'Seviye 1: A – F Harfleri', metin: 'adalet atama başvuru belge bilirkişi celse ceza çaba çalışma dava delil dilekçe emek evrak feragat fıkra' },
      { ad: 'Seviye 2: G – J Harfleri', metin: 'gerekçe görevlendirme güven hakim harç hukuk hüküm ıslah ığdır icra iddianame iflas ilam infaz istinaf jüri' },
      { ad: 'Seviye 3: K – N Harfleri', metin: 'kadro kanun karar katip kesinleşme keşif kıdem liyakat mahkeme memur mübaşir müzekkere nafaka nakil noter' },
    ],
  },
  {
    id: 'f-11', duzen: 'f', baslik: 'Ders 11: Harf Havuzu (O – Z)',
    aciklama: 'O harfinden Z harfine kadar alfabetik odaklanma çalışması.',
    tuslar: 'o ö p r s ş t u ü v y z',
    seviyeler: [
      { ad: 'Seviye 1: O – Ş Harfleri', metin: 'onay oran ödenek ödeme emri ön inceleme personel rapor resmi savcı savunma senet sicil sulh şikâyet şüpheli' },
      { ad: 'Seviye 2: T – Ü Harfleri', metin: 'tahkikat tanık tapu tazminat tebligat tedbir temyiz tensip tutanak uyap uzlaştırma ücret ünvan üst sınır' },
      { ad: 'Seviye 3: V – Z Harfleri', metin: 'vade vekâletname vekil vergi yargı yargıtay yasal faiz yetki yıllık izin zabıt katibi zamanaşımı zorunlu' },
    ],
  },
  {
    id: 'f-12', duzen: 'f', baslik: 'Ders 12: Büyük Harf Vuruşları: İlk Adım',
    aciklama: 'Karşı el Shift tuşuyla tekil büyük harf başlangıçları.',
    tuslar: 'Sol Shift + Sağ Shift',
    seviyeler: [
      { ad: 'Seviye 1: Şehir ve Kurum Başlangıçları', metin: 'Ankara İstanbul İzmir Bursa Adana Antalya Konya Kayseri Samsun Trabzon Eskişehir Diyarbakır Erzurum Van' },
      { ad: 'Seviye 2: Kurum Kısaltmaları', metin: 'TBMM PGM CTE HSK UYAP SGK GİB TÜİK AYM YSK TDK MEB ÖSYM DPB KHK HMK CMK TCK TMK TBK İİK İYUK' },
      { ad: 'Seviye 3: Özel İsim Zinciri', metin: 'Türkiye Cumhuriyeti Adalet Bakanlığı Personel Genel Müdürlüğü Ceza ve Tevkifevleri Genel Müdürlüğü' },
    ],
  },
  {
    id: 'f-13', duzen: 'f', baslik: 'Ders 13: Büyük Harf Kelime Vuruşları: İkinci Adım',
    aciklama: 'Resmî yazışma cümlelerinde akıcı Shift kullanımı.',
    tuslar: 'Shift + Akıcı Metin',
    seviyeler: [
      { ad: 'Seviye 1: Mahkeme Adları', metin: 'Ankara Asliye Hukuk Mahkemesi İstanbul Ağır Ceza Mahkemesi İzmir Bölge Adliye Mahkemesi Danıştay Başkanlığı' },
      { ad: 'Seviye 2: Kanun Başlıkları', metin: 'Devlet Memurları Kanunu Hukuk Muhakemeleri Kanunu Ceza Muhakemesi Kanunu Tebligat Kanunu Harçlar Kanunu' },
      { ad: 'Seviye 3: Tam Resmî Cümleler', metin: 'Türkiye Cumhuriyeti Anayasası uyarınca Yargıtay ve Danıştay yüksek mahkemeler olarak görev yaparlar.' },
    ],
  },
  {
    id: 'f-14', duzen: 'f', baslik: 'Ders 14: Temel Noktalama İşaretleri',
    aciklama: 'Nokta, virgül, iki nokta, noktalı virgül ve soru işareti.',
    tuslar: '. , : ; ? !',
    seviyeler: [
      { ad: 'Seviye 1: Nokta ve Virgül', metin: 'Dava açıldı, tensip düzenlendi, tebligat çıkarıldı. Duruşma günü belirlendi, taraflar çağrıldı.' },
      { ad: 'Seviye 2: İki Nokta ve Noktalı Virgül', metin: 'Gerekçe: Deliller incelendi; tanıklar dinlendi; bilirkişi raporu alındı. Sonuç: Davanın kabulüne karar verildi.' },
      { ad: 'Seviye 3: Soru ve Ünlem', metin: 'Süre ne zaman başlar? Tebligat usulüne uygun mudur? Dikkat! Hak düşürücü süreleri mutlaka kontrol ediniz.' },
    ],
  },
  {
    id: 'f-15', duzen: 'f', baslik: 'Ders 15: Sık Kullanılan Türkçe Kelimeler',
    aciklama: 'Türkçede en yüksek frekanslı kelimelerle yüksek DKS hızı.',
    tuslar: 'Yüksek Frekans',
    seviyeler: [
      { ad: 'Seviye 1: En Sık 40 Kelime', metin: 've bir bu da de için ile olarak daha çok ne gibi ama ancak veya ise kadar göre sonra önce her tüm kendi' },
      { ad: 'Seviye 2: Resmî Metin Bağlaçları', metin: 'bu nedenle bununla birlikte buna göre dolayısıyla öte yandan ayrıca nitekim bunun yanı sıra buna karşın' },
      { ad: 'Seviye 3: Hız Paragrafı', metin: 'her aday düzenli olarak çalışma yaptığında daha hızlı ve daha doğru yazmaya başlar çünkü parmaklar kelimeleri bütün olarak tanır' },
    ],
  },
  {
    id: 'f-16', duzen: 'f', baslik: 'Ders 16: Sayılar ve Kelimeler',
    aciklama: 'Üst sayı sırası, tarihler ve kanun madde numaraları.',
    tuslar: '1 2 3 4 5 6 7 8 9 0',
    seviyeler: [
      { ad: 'Seviye 1: Temel Rakamlar', metin: '10 20 30 40 50 60 70 80 90 100 123 456 789 2024 2025 2026 2027 657 6100 5237 5271 2004 2577 4857' },
      { ad: 'Seviye 2: Tarih ve Madde', metin: '657 sayılı Kanunun 48, 54, 74 ve 154 üncü maddeleri ile 24.11.2026 tarihli 2026/1450 sayılı karar.' },
      { ad: 'Seviye 3: Parasal Tutar ve Oran', metin: '2026 yılında yeniden değerleme oranı %25,49 olup 3 dakikada 180 saniye içinde en az 90 net kelime şarttır.' },
    ],
  },
  {
    id: 'f-17', duzen: 'f', baslik: 'Ders 17: Klavye Çeyrekleri',
    aciklama: 'Sol el ağırlıklı ve sağ el ağırlıklı kelimelerle el dengesi.',
    tuslar: 'Sol El / Sağ El Dengesi',
    seviyeler: [
      { ad: 'Seviye 1: Sol El Ağırlıklı', metin: 'aile ağaç vefa cevap cefa vade ödev övgü foya gıda ığdır ışık odak ofis olgu olay oyun öğle özet' },
      { ad: 'Seviye 2: Sağ El Ağırlıklı', metin: 'karar kanun katip kalem kilim kule liman malik millet noter rapor resmi sabır savcı senet sicil tanık' },
      { ad: 'Seviye 3: Çapraz El Ritimleri', metin: 'adalet bakanlığı personel genel müdürlüğü uygulamalı klavye sınavında ellerin dengeli çalışması hızı katlar' },
    ],
  },
  {
    id: 'f-18', duzen: 'f', baslik: 'Ders 18: Semboller ve Gelişmiş Noktalama',
    aciklama: 'Parantez, tırnak, kesme işareti, eğik çizgi ve yüzde.',
    tuslar: '( ) " \' / - %',
    seviyeler: [
      { ad: 'Seviye 1: Eğik Çizgi ve Tire', metin: '2026/1045 E. - 2026/892 K. 4/B sözleşmeli 4/D işçi 13/3 derece 1/4 kademe 68/B hizmet süresi.' },
      { ad: 'Seviye 2: Parantez ve Tırnak', metin: '657 sayılı Kanun (DMK) kapsamında "Anlam Bütünlüğü" şartı (%25 hata sınırı) esas alınır.' },
      { ad: 'Seviye 3: Tam Resmî Semboller', metin: 'T.C. Adalet Bakanlığı (PGM) 2026/1307 sayılı duyurusu: "3 dakikada en az 90 net kelime" kuralı geçerlidir.' },
    ],
  },
  {
    id: 'f-19', duzen: 'f', baslik: 'Ders 19: Gelişmiş Doğruluk',
    aciklama: 'Sıfır hata hedefiyle uzun hukuki cümleler ve sınav provası.',
    tuslar: 'Tüm Tuşlar · %98+ Doğruluk',
    seviyeler: [
      { ad: 'Seviye 1: Zor Hukuk Terimleri', metin: 'muvaffakiyet müteselsil tahakkuk taahhüt tebligat temerrüt temyiz tereddüt teşkilat tetkik tevkif zamanaşımı' },
      { ad: 'Seviye 2: Anayasa ve Yargı', metin: 'mahkemelerin bağımsızlığı ve hakimlik teminatı hukuk devletinin vazgeçilmez unsurlarıdır yargı yetkisi türk milleti adına bağımsız ve tarafsız mahkemelerce kullanılır' },
      { ad: 'Seviye 3: Final Sınav Provası', metin: 'adalet devletin temelidir hukuk devleti insan haklarına saygılı bu hak ve özgürlükleri koruyup güçlendiren her eylem ve işlemi hukuka uygun olan devlettir zabıt katibi duruşma tutanaklarını eksiksiz ve hatasız yazar' },
    ],
  },
];

// Türkçe Q Klavye için aynı 19 ders × 3 seviye müfredatı (ilk 8 ders Q tuş dizilimine göre uyarlanmış)
const Q_DERSLER: Ders[] = [
  {
    id: 'q-1', duzen: 'q', baslik: 'Ders 1: Temel Sıra Tuşları',
    aciklama: 'Türkçe Q klavye temel sırası: a, s, d, f, g, h, j, k, l, ş, i.',
    tuslar: 'a s d f g h j k l ş i',
    seviyeler: [
      { ad: 'Seviye 1: İşaret Parmakları (f, j, g, h)', metin: 'ff jj gg hh fj jf gh hg fg hj jf gf hf gj fh jg ff jj gg hh fj gh jf hg fg hj gf jh' },
      { ad: 'Seviye 2: Orta & Yüzük (d, k, s, l)', metin: 'dk kd sl ls df kj sd kl dsl kls fsl jls sdl kld fls jls sld kds dal kal sal fal hal şal' },
      { ad: 'Seviye 3: Serçe & Tam Sıra (a, ş, i)', metin: 'ada adaş adil afiş akıl akış alan alay asıl asil aşık dahil dakika dala dalga defa delik dil hakim halk' },
    ],
  },
  {
    id: 'q-2', duzen: 'q', baslik: 'Ders 2: Üst Sıra Tuşları',
    aciklama: 'Sol el (q, w, e, r, t) ve sağ el (y, u, ı, o, p, ğ, ü) üst sıra.',
    tuslar: 'q w e r t y u ı o p ğ ü',
    seviyeler: [
      { ad: 'Seviye 1: Sol El Üst Sıra (e, r, t)', metin: 'er re et te ter ret der ser fer ger her ker ler şer dert fert sert terk eser eter eder tere dere' },
      { ad: 'Seviye 2: Sağ El Üst Sıra (y, u, ı, o, p, ğ, ü)', metin: 'yu uy yo oy po op ığ ğı üy yü uyum oyun olay olgu okul ofis onay oran rapor personel parlamento' },
      { ad: 'Seviye 3: Tüm Üst Sıra Birleşimi', metin: 'yetki yönetim yöntem yargı yarım yıl dönümü yüksek öğretim protokol performans periyot görevli memur' },
    ],
  },
  {
    id: 'q-3', duzen: 'q', baslik: 'Ders 3: Alt Sıra Tuşları',
    aciklama: 'Sol el (z, x, c, v, b) ve sağ el (n, m, ö, ç) alt sıra.',
    tuslar: 'z x c v b n m ö ç',
    seviyeler: [
      { ad: 'Seviye 1: Sol El Alt Sıra (z, c, v, b)', metin: 'zc cz vb bv zb bz cv vc zabıt zaman zarf ceza cevap cadde vade vakıf vekil vergi belge büro bütçe' },
      { ad: 'Seviye 2: Sağ El Alt Sıra (n, m, ö, ç)', metin: 'nm mn nö ön nç çn mö öm kanun karar mahkeme memur noter önlem örnek özet özür çaba çağrı çalışma çözüm' },
      { ad: 'Seviye 3: Tüm Alt Sıra Birleşimi', metin: 'bakanlık başvuru bilirkişi bordro cezaevi savcı savunma senet sicil sözleşme çevre çizelge çözümleme' },
    ],
  },
  {
    id: 'q-4', duzen: 'q', baslik: 'Ders 4: Temel Sıra ve Diğerleri',
    aciklama: 'Q klavye temel sırasından üst ve alt sıraya akıcı geçişler.',
    tuslar: 'Temel + Üst + Alt',
    seviyeler: [
      { ad: 'Seviye 1: Temel + Üst Sıra', metin: 'adalet aralık atama dilekçe duruşma görev hakim harç hukuk hüküm karar katip rapor resmi tanık yetki' },
      { ad: 'Seviye 2: Temel + Alt Sıra', metin: 'belge bütçe cevap ceza çaba çözüm mahkeme memur noter ödev örnek savcı senet sicil vekil vergi zabıt' },
      { ad: 'Seviye 3: Üç Sıra Tam Geçiş', metin: 'zabıt katibi duruşma ve keşiflerde hakimin yazdırdığı beyanları eksiksiz biçimde tutanağa geçirir' },
    ],
  },
  {
    id: 'q-5', duzen: 'q', baslik: 'Ders 5: Diğer Tuşlar (q, w, x, ğ, ü)',
    aciklama: 'Q klavyede sol serçe q, w, x ve sağ serçe ğ, ü uzanımları.',
    tuslar: 'q w x ğ ü ş i',
    seviyeler: [
      { ad: 'Seviye 1: Sağ Serçe (ğ, ü, ş, i)', metin: 'ağaç ağustos ağırlık bağımsızlık değer eğitim görevlendirme güçlendirme şeffaflık şikâyet şüpheli ünvan' },
      { ad: 'Seviye 2: Sol Serçe (q, w, x)', metin: 'qr kod web wiki xml xss sql query widget proxy workflow quick text web sayfası xml dosyası qr okuma' },
      { ad: 'Seviye 3: Karma Uzanım Kontrolü', metin: 'yükseköğretim güvenlik duvarı ağaçlandırma çalışması şeffaflık ilkesi ve xml veri doğrulama süreci' },
    ],
  },
  {
    id: 'q-6', duzen: 'q', baslik: 'Ders 6: Temel Sıra Kolay Kelimeler',
    aciklama: 'Q klavye temel sırası (a s d f g h j k l ş i) kelimeleri.',
    tuslar: 'a s d f g h j k l ş i',
    seviyeler: [
      { ad: 'Seviye 1: Kısa Kelimeler', metin: 'ad af ak al aş da fa ha il is iş kal kas kaş kil kiş laf sal şal şık fak hak sak dal gal hal' },
      { ad: 'Seviye 2: Orta Uzunlukta Kelimeler', metin: 'iade idare iddia ifade iflas ihale ihmal ihsan ikaz ikbal ilah ilave ilga ilgi ilik ilke imza infaz' },
      { ad: 'Seviye 3: Temel Sıra Akıcılığı', metin: 'adil hakim dahil dakika dala dalga defa delik dil dikiş fasıl fidan gafil galip hadis halk hasıl hilal' },
    ],
  },
  {
    id: 'q-7', duzen: 'q', baslik: 'Ders 7: Üst Sıra Kolay Kelimeler',
    aciklama: 'Q klavye üst sırasıyla akıcı kelime kombinasyonları.',
    tuslar: 'e r t y u ı o p ğ ü',
    seviyeler: [
      { ad: 'Seviye 1: Kısa Kelimeler', metin: 'er et ot oy rö ter tor tur tut top pot poy roy yer yor yur yürü türe türü öte ütü' },
      { ad: 'Seviye 2: Resmî Kelimeler', metin: 'tertip teftiş rapor yetki görev yönetim yöntem yargı yürürlük yürütme protokol periyot personel' },
      { ad: 'Seviye 3: Üst Sıra Akıcılık', metin: 'rapor görevli personel tarafından yürürlükteki yönetmelik ve protokol hükümlerine göre hazırlandı' },
    ],
  },
  {
    id: 'q-8', duzen: 'q', baslik: 'Ders 8: Alt Sıra Kolay Kelimeler',
    aciklama: 'Q klavye alt sırası (z c v b n m ö ç) kelime pratiği.',
    tuslar: 'z c v b n m ö ç',
    seviyeler: [
      { ad: 'Seviye 1: Kısa Kelimeler', metin: 'cam can caz ban ben biz boş cam çam çan man men nam nem van ven zam zan zon' },
      { ad: 'Seviye 2: Büro ve Hukuk Kelimeleri', metin: 'bakanlık başvuru belge bilirkişi bordro büro bütçe cevap ceza çaba çalışma çevre çözüm memur noter savcı' },
      { ad: 'Seviye 3: Alt Sıra Akıcılık', metin: 'memur başvuru belgesini inceleyip bilirkişi cevabını ve çözüm önerisini ceza dosyasına kaydetti' },
    ],
  },
  // Ders 9–19 her iki klavyede de ortak Türkçe/hukuk yetkinlik müfredatıdır
  ...F_DERSLER.slice(8).map((d) => ({ ...d, id: d.id.replace(/^f-/, 'q-'), duzen: 'q' as const })),
];

interface Tus { ch: string; label?: string; p: number; genis?: boolean; }
const KB_F: Tus[][] = [
  [{ ch: '1', p: 1 }, { ch: '2', p: 1 }, { ch: '3', p: 2 }, { ch: '4', p: 3 }, { ch: '5', p: 4 }, { ch: '6', p: 4 }, { ch: '7', p: 6 }, { ch: '8', p: 6 }, { ch: '9', p: 7 }, { ch: '0', p: 8 }, { ch: '/', p: 9 }, { ch: '-', p: 9 }],
  [{ ch: 'f', p: 1 }, { ch: 'g', p: 2 }, { ch: 'ğ', p: 3 }, { ch: 'ı', p: 4 }, { ch: 'o', p: 4 }, { ch: 'd', p: 6 }, { ch: 'r', p: 6 }, { ch: 'n', p: 7 }, { ch: 'h', p: 8 }, { ch: 'p', p: 9 }, { ch: 'q', p: 9 }, { ch: 'w', p: 9 }],
  [{ ch: 'u', p: 1 }, { ch: 'i', p: 2 }, { ch: 'e', p: 3 }, { ch: 'a', p: 4 }, { ch: 'ü', p: 4 }, { ch: 't', p: 6 }, { ch: 'k', p: 6 }, { ch: 'm', p: 7 }, { ch: 'l', p: 8 }, { ch: 'y', p: 9 }, { ch: 'ş', p: 9 }, { ch: 'x', p: 9 }],
  [{ ch: 'j', p: 1 }, { ch: 'ö', p: 2 }, { ch: 'v', p: 3 }, { ch: 'c', p: 4 }, { ch: 'ç', p: 4 }, { ch: 'z', p: 6 }, { ch: 's', p: 6 }, { ch: 'b', p: 7 }, { ch: '.', p: 8 }, { ch: ',', p: 9 }],
  [{ ch: ' ', label: 'Boşluk (Başparmak)', p: 5, genis: true }],
];
const KB_Q: Tus[][] = [
  [{ ch: '1', p: 1 }, { ch: '2', p: 1 }, { ch: '3', p: 2 }, { ch: '4', p: 3 }, { ch: '5', p: 4 }, { ch: '6', p: 4 }, { ch: '7', p: 6 }, { ch: '8', p: 6 }, { ch: '9', p: 7 }, { ch: '0', p: 8 }, { ch: '*', p: 9 }, { ch: '-', p: 9 }],
  [{ ch: 'q', p: 1 }, { ch: 'w', p: 2 }, { ch: 'e', p: 3 }, { ch: 'r', p: 4 }, { ch: 't', p: 4 }, { ch: 'y', p: 6 }, { ch: 'u', p: 6 }, { ch: 'ı', p: 7 }, { ch: 'o', p: 8 }, { ch: 'p', p: 9 }, { ch: 'ğ', p: 9 }, { ch: 'ü', p: 9 }],
  [{ ch: 'a', p: 1 }, { ch: 's', p: 2 }, { ch: 'd', p: 3 }, { ch: 'f', p: 4 }, { ch: 'g', p: 4 }, { ch: 'h', p: 6 }, { ch: 'j', p: 6 }, { ch: 'k', p: 7 }, { ch: 'l', p: 8 }, { ch: 'ş', p: 9 }, { ch: 'i', p: 9 }, { ch: ',', p: 9 }],
  [{ ch: 'z', p: 1 }, { ch: 'x', p: 2 }, { ch: 'c', p: 3 }, { ch: 'v', p: 4 }, { ch: 'b', p: 4 }, { ch: 'n', p: 6 }, { ch: 'm', p: 6 }, { ch: 'ö', p: 7 }, { ch: 'ç', p: 8 }, { ch: '.', p: 9 }],
  [{ ch: ' ', label: 'Boşluk (Başparmak)', p: 5, genis: true }],
];
const PARMAK: Record<number, string> = {
  1: 'Sol Serçe', 2: 'Sol Yüzük', 3: 'Sol Orta', 4: 'Sol İşaret',
  5: 'Başparmak', 6: 'Sağ İşaret', 7: 'Sağ Orta', 8: 'Sağ Yüzük', 9: 'Sağ Serçe',
};

const PROG_KEY = '657:onparmak:ders-ilerleme';
interface DersKaydi { yildiz: number; enIyiDks: number; dogruluk: number; }

const root = document.querySelector<HTMLElement>('[data-dersler]');
if (root) {
  const elDuzenBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-d-duzen]')];
  const elListe = root.querySelector<HTMLElement>('[data-d-liste]')!;
  const elBaslik = root.querySelector<HTMLElement>('[data-d-baslik]')!;
  const elAciklama = root.querySelector<HTMLElement>('[data-d-aciklama]')!;
  const elSeviyeler = root.querySelector<HTMLElement>('[data-d-seviyeler]')!;
  const elHedef = root.querySelector<HTMLElement>('[data-d-hedef]')!;
  const elGiris = root.querySelector<HTMLInputElement>('[data-d-giris]')!;
  const elIlerleme = root.querySelector<HTMLElement>('[data-d-ilerleme]')!;
  const elDks = root.querySelector<HTMLElement>('[data-d-dks]')!;
  const elDogruluk = root.querySelector<HTMLElement>('[data-d-dogruluk]')!;
  const elHata = root.querySelector<HTMLElement>('[data-d-hata]')!;
  const elIpucu = root.querySelector<HTMLElement>('[data-d-ipucu]')!;
  const elKb = root.querySelector<HTMLElement>('[data-d-kb]')!;
  const elSonuc = root.querySelector<HTMLElement>('[data-d-sonuc]')!;
  const elSifirla = root.querySelector<HTMLButtonElement>('[data-d-sifirla]')!;

  let duzen: 'f' | 'q' = 'f';
  let aktifDers: Ders = F_DERSLER[0];
  let aktifSeviyeIdx = 0;
  let aktifMetin = aktifDers.seviyeler[0].metin;
  let konum = 0;
  let hata = 0;
  let baslangic = 0;

  function seviyeAnahtari(d: Ders, sIdx: number): string {
    return `${d.id}:s${sIdx + 1}`;
  }

  function ilerlemeOku(): Record<string, DersKaydi> {
    try {
      return JSON.parse(localStorage.getItem(PROG_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function ilerlemeKaydet(key: string, dks: number, dogruluk: number) {
    const tum = ilerlemeOku();
    const yildiz = dogruluk >= 96 && dks >= 25 ? 3 : dogruluk >= 90 ? 2 : 1;
    const eski = tum[key];
    tum[key] = {
      yildiz: Math.max(eski?.yildiz ?? 0, yildiz),
      enIyiDks: Math.max(eski?.enIyiDks ?? 0, dks),
      dogruluk: Math.max(eski?.dogruluk ?? 0, dogruluk),
    };
    try {
      localStorage.setItem(PROG_KEY, JSON.stringify(tum));
    } catch {
      /* geç */
    }
  }

  function kbCiz() {
    const rows = duzen === 'f' ? KB_F : KB_Q;
    elKb.innerHTML = '';
    for (const r of rows) {
      const div = document.createElement('div');
      div.className = 'op-kb__row';
      for (const t of r) {
        const s = document.createElement('span');
        s.className = `op-kb__key op-kb__p${t.p}${t.genis ? ' op-kb__key--space' : ''}`;
        s.dataset.key = t.ch;
        s.textContent = t.label ?? t.ch.toLocaleUpperCase('tr-TR');
        div.append(s);
      }
      elKb.append(div);
    }
    siradakiVurgula();
  }

  function siradakiVurgula() {
    elKb.querySelectorAll('.is-next').forEach((e) => e.classList.remove('is-next'));
    const ch = aktifMetin[konum];
    if (!ch) return;
    const low = ch.toLocaleLowerCase('tr-TR');
    const el = elKb.querySelector<HTMLElement>(`.op-kb__key[data-key="${CSS.escape(low)}"]`);
    if (el) el.classList.add('is-next');
    const rows = duzen === 'f' ? KB_F : KB_Q;
    const t = rows.flat().find((x) => x.ch === low);
    if (t) {
      elIpucu.textContent = `Sıradaki tuş: "${ch === ' ' ? 'BOŞLUK' : ch}" · Parmak: ${PARMAK[t.p]}`;
    } else {
      elIpucu.textContent = `Sıradaki karakter: "${ch}"`;
    }
  }

  function hedefCiz() {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < aktifMetin.length; i++) {
      const span = document.createElement('span');
      span.textContent = aktifMetin[i];
      if (i < konum) span.className = 'dr-ch--ok';
      else if (i === konum) span.className = 'dr-ch--cur';
      frag.append(span);
    }
    elHedef.replaceChildren(frag);
    const oran = aktifMetin.length ? Math.round((konum / aktifMetin.length) * 100) : 0;
    elIlerleme.style.width = `${oran}%`;
  }

  function seviyeleriCiz() {
    const prog = ilerlemeOku();
    elSeviyeler.innerHTML = '';
    aktifDers.seviyeler.forEach((s, idx) => {
      const k = prog[seviyeAnahtari(aktifDers, idx)];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dr-sev';
      btn.setAttribute('aria-pressed', String(idx === aktifSeviyeIdx));
      const yildiz = k ? ` ${'★'.repeat(k.yildiz)}` : '';
      btn.textContent = `${s.ad}${yildiz}`;
      btn.addEventListener('click', () => {
        aktifSeviyeIdx = idx;
        seviyeYukle();
      });
      elSeviyeler.append(btn);
    });
  }

  function listeCiz() {
    const liste = duzen === 'f' ? F_DERSLER : Q_DERSLER;
    const prog = ilerlemeOku();
    elListe.innerHTML = '';
    for (const d of liste) {
      const tamam = d.seviyeler.filter((_, idx) => Boolean(prog[seviyeAnahtari(d, idx)])).length;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `dr-item${d.id === aktifDers.id ? ' is-active' : ''}`;
      btn.innerHTML = `<strong>${d.baslik}</strong><span>Tuşlar: ${d.tuslar}</span><small>${tamam}/${d.seviyeler.length} seviye tamamlandı</small>`;
      btn.addEventListener('click', () => dersSec(d));
      elListe.append(btn);
    }
  }

  function seviyeYukle() {
    const sev = aktifDers.seviyeler[aktifSeviyeIdx] ?? aktifDers.seviyeler[0];
    aktifMetin = sev.metin;
    konum = 0;
    hata = 0;
    baslangic = 0;
    elBaslik.textContent = `${aktifDers.baslik} — ${sev.ad}`;
    elAciklama.textContent = aktifDers.aciklama;
    elDks.textContent = '0';
    elDogruluk.textContent = '%100';
    elHata.textContent = '0';
    elSonuc.hidden = true;
    elGiris.value = '';
    elGiris.disabled = false;
    seviyeleriCiz();
    hedefCiz();
    siradakiVurgula();
    elGiris.focus();
  }

  function dersSec(d: Ders) {
    aktifDers = d;
    aktifSeviyeIdx = 0;
    listeCiz();
    seviyeYukle();
  }

  elGiris.addEventListener('input', () => {
    const val = elGiris.value;
    if (!val) return;
    const son = val[val.length - 1];
    elGiris.value = '';
    if (!baslangic) baslangic = performance.now();

    if (son === aktifMetin[konum]) {
      konum++;
    } else {
      hata++;
      elHedef.classList.add('is-shake');
      window.setTimeout(() => elHedef.classList.remove('is-shake'), 180);
    }
    const gecenDk = Math.max((performance.now() - baslangic) / 60000, 1 / 60);
    const dks = Math.round(konum / 5 / gecenDk);
    const dogruluk = Math.max(0, Math.round((konum / Math.max(1, konum + hata)) * 100));
    elDks.textContent = String(dks);
    elDogruluk.textContent = `%${dogruluk}`;
    elHata.textContent = String(hata);
    hedefCiz();
    siradakiVurgula();

    if (konum >= aktifMetin.length) {
      elGiris.disabled = true;
      ilerlemeKaydet(seviyeAnahtari(aktifDers, aktifSeviyeIdx), dks, dogruluk);
      const yildiz = dogruluk >= 96 && dks >= 25 ? 3 : dogruluk >= 90 ? 2 : 1;
      const sonrakiVar = aktifSeviyeIdx + 1 < aktifDers.seviyeler.length;
      elSonuc.innerHTML = `<strong>Seviye Tamamlandı! ${'★'.repeat(yildiz)}${'☆'.repeat(3 - yildiz)}</strong> · Hız: ${dks} DKS · Doğruluk: %${dogruluk} · Hata: ${hata}${sonrakiVar ? ' <button type="button" class="btn btn--kucuk" data-d-sonraki style="margin-left:8px;">Sonraki Seviye →</button>' : ''}`;
      elSonuc.hidden = false;
      elSonuc.querySelector('[data-d-sonraki]')?.addEventListener('click', () => {
        aktifSeviyeIdx++;
        seviyeYukle();
      });
      listeCiz();
      seviyeleriCiz();
    }
  });

  elDuzenBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      duzen = (btn.dataset.dDuzen as 'f' | 'q') || 'f';
      elDuzenBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      kbCiz();
      dersSec(duzen === 'f' ? F_DERSLER[0] : Q_DERSLER[0]);
    })
  );

  elSifirla.addEventListener('click', () => seviyeYukle());

  kbCiz();
  dersSec(F_DERSLER[0]);
}
