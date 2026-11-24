// On Parmak Klavye Sınavı metin arşivini (public/veri/klavye-metinleri.json ve src/data/klavye-ozet.json)
// Daktilografi (20), İcra Kâtipliği (15), Yargıtay/Adli Yargı (15), Danıştay/İdari Yargı (15),
// Tekerlemeler (12), Türkçe Seçme Metinler (12), Özel ve Zor Kelimeler (12) ve Rakam/Sayı Çalışması (10)
// kategorileriyle genişletir. Mevcut PGM/CTE/HSK resmî sınav gruplarını aynen korur.
// Kullanım: node scripts/klavye-metin-genislet.mjs
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const VERI_YOL = new URL('../public/veri/klavye-metinleri.json', import.meta.url);
const OZET_YOL = new URL('../src/data/klavye-ozet.json', import.meta.url);
const TEKERLEME_YOL = new URL('../src/data/tekerlemeler.json', import.meta.url);

const YENI_GRUP_IDLERI = new Set([
  'daktilografi',
  'icra-katipligi',
  'yargitay-kararlari',
  'danistay-idari',
  'tekerlemeler',
  'turkce-secme',
  'ozel-kelimeler',
  'rakam-sayi',
]);

function temizleMarkdown(md) {
  return md
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/[>*_`#|]/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function kirpKelime(metin, minK = 220, maxK = 300) {
  const kelimeler = metin.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (kelimeler.length < minK) return null;
  return kelimeler.slice(0, maxK).join(' ');
}

function kelimeSayisi(metin) {
  return metin.trim().split(/\s+/).filter(Boolean).length;
}

async function klasordenMetinDerle(klasor, filtreFn, hedefAdet) {
  const dosyalar = (await readdir(klasor)).filter((f) => f.endsWith('.md')).sort();
  const sonuc = [];
  const gorulen = new Set();
  for (const f of dosyalar) {
    if (sonuc.length >= hedefAdet) break;
    const raw = await readFile(join(klasor, f), 'utf8');
    const temiz = temizleMarkdown(raw);
    if (!filtreFn(f, temiz)) continue;
    const kirpilmis = kirpKelime(temiz, 230, 295);
    if (!kirpilmis) continue;
    const anahtar = kirpilmis.slice(0, 80);
    if (gorulen.has(anahtar)) continue;
    gorulen.add(anahtar);
    sonuc.push(kirpilmis);
  }
  return sonuc;
}

// 20 kapsamlı MEB Daktilografi Kitabı ders ve hız metni
const DAKTILOGRAFI_METINLER = [
  { ad: 'Ders 1: Temel Sıra İşaret Parmakları (a, k, ü, t)', metin: 'ak ka at ta ak ka at ta aka kata taka ata kaka tat kat tak akat katak takat ataka ütü kütük tütük ütü akü kütük ataka taka kata ak ka at ta ütü akü katak takat aka kata taka ata tat kat tak akat katak takat ütü kütük akü ataka taka kata ak ka at ta' },
  { ad: 'Ders 2: Temel Sıra Orta Parmaklar (e, m)', metin: 'em me ek ke et te ama eke emek etek kema kete meke tema teke metek yemek temek akem makam matema tekme ekmek kemek emekli metek etek kete tema ameka emek etek ekmek tekme makam tema meke kete teke emekli akem matema' },
  { ad: 'Ders 3: Temel Sıra Yüzük Parmakları (i, l)', metin: 'il li el le al la ali ela ile kalem kale kilim kule liman malik melik millet mimik teklif temlik ilke ilmek kemal kemik kilim kule leke liman makale malik melek kalem kale liman millet ilke ilmek kemal kemik teklif temlik' },
  { ad: 'Ders 4: Temel Sıra Serçe Parmakları (u, y, ş)', metin: 'ul lu uy yu uş şu yaka yala yama yata yele yemek yetim yetki yıkım yulaf yumak şaka şale şema şule şükür müşkül müştak yaşlı yeşil yokuş uşak uyku uymak uyumak şaşkın yaka yele yemek yetim yetki şema şule şükür uşak uyku' },
  { ad: 'Ders 5: Temel Sıra Tam Birleşim', metin: 'akıl alem amel ekmek elma emek emlak ilke ilmek kale kalem kemal kilim kule kulak kumlu leylek liman makale makam makul malik melek memleket millet mühim şema şule taklit talim temel temsil tüketti uyumlu yakıt yalım yelek yemek yemin yetim yetki yulaf yumak' },
  { ad: 'Ders 6: Üst Sıra Sol El (f, g, ğ, ı, o)', metin: 'foya gala gıda ığdır ışık ılık odak ofis okul olgu olay olgun onay oyun faul fil filo fıkıh gafil gamze gönül gözlem ığdır ışık ıslak kılavuz kıyamet oluklu omlet ortak otlak oyuk ofis okul olgu olay onay oyun gıda ışık odak' },
  { ad: 'Ders 7: Üst Sıra Sağ El (d, r, n, h, p)', metin: 'dava delil duruşma dilekçe hakim harç hukuk hüküm karar kanun katip mahkeme memur noter nüsha onay oran parlamento personel rapor resmi rica tanık tebligat tutanak yargı yetki dava delil hakim hukuk hüküm karar kanun mahkeme memur noter rapor' },
  { ad: 'Ders 8: Alt Sıra Sol El (j, ö, v, c, ç)', metin: 'jale jüri ödev ödül öğle önlem örnek özet özür vade vakıf vekil vergi vicdan cadde caiz cevap ceza cihaz cuma cümle çaba çağrı çalışma çevre çizelge çözüm jale jüri ödev ödül önlem örnek vade vekil vergi cevap ceza çaba çalışma çözüm' },
  { ad: 'Ders 9: Alt Sıra Sağ El (z, s, b)', metin: 'zabıt zaman zarf cezaevi savcı savunma senet sicil sistem sözleşme suç sübut bakanlık başvuru belge bilirkişi bordro büro bütçe zabıt katibi serbest savunma zaman zarf savcı senet sicil sistem sözleşme bakanlık başvuru belge bilirkişi bordro bütçe' },
  { ad: 'Ders 10: Tüm Harflerle Daktilografi Ritmi', metin: 'on parmak klavye yazımında parmakların temel sıradan ayrılmadan ilgili tuşa uzanıp geri dönmesi esastır düzenli ve ritmik çalışma hız kadar doğruluğu da artırır ekrana bakarak yazmak göz kaslarını dinlendirir ve dikkati metin üzerinde toplar her gün en az yirmi dakika düzenli alıştırma yapan adaylar kısa sürede dakikada kırk net kelimenin üzerine çıkarlar' },
  { ad: 'Ders 11: Resmî Yazışma ve Dilekçe Metni', metin: 'türkiye cumhuriyeti adalet bakanlığı personel genel müdürlüğü tarafından yürütülen uygulamalı klavye sınavlarında adayların üç dakika içerisinde yanlışsız ve tekrarsız en az doksan kelime yazması gerekmektedir sınav metinleri günlük hukuk dilinden seçilir ve adayların klavye hakimiyeti ile anlam bütünlüğü birlikte değerlendirilir' },
  { ad: 'Ders 12: Duruşma Tutanağı Hız Metni', metin: 'belirli gün ve saatte celse açıldı davacı vekili ile davalı vekilinin hazır olduğu görüldü açık yargılamaya devam olundu gelen müzekkere cevapları okundu dosyasına konuldu taraflardan diyecekleri soruldu davacı vekili önceki beyanlarımızı tekrar ederiz davanın kabulüne karar verilmesini talep ederiz dedi davalı vekili davanın reddine karar verilmesini talep ederiz dedi dosya incelendi gereği düşünüldü' },
  { ad: 'Ders 13: Anayasa ve Hukuk Devleti', metin: 'türkiye cumhuriyeti toplumun huzuru milli dayanışma ve adalet anlayışı içinde insan haklarına saygılı atatürk milliyetçiliğine bağlı başlangıçta belirtilen temel ilkelere dayanan demokratik laik ve sosyal bir hukuk devletidir yargı yetkisi türk milleti adına bağımsız ve tarafsız mahkemelerce kullanılır hakimler görevlerinde bağımsızdırlar anayasaya kanuna ve hukuka uygun olarak vicdani kanaatlerine göre hüküm verirler' },
  { ad: 'Ders 14: 657 Sayılı Devlet Memurları Kanunu', metin: 'devlet memurları kanunu devlet memurlarının hizmet şartlarını niteliklerini atanma ve yetiştirilmelerini ilerleme ve yükselmelerini ödev hak yüküm ve sorumluluklarını aylıklarını ödeneklerini ve diğer özlük işlerini düzenler bu kanunun temel ilkeleri sınıflandırma kariyer ve liyakattir devlet kamu hizmetleri görevlerini ve bu görevlerde çalışan devlet memurlarını görevlerin gerektirdiği niteliklere ve mesleklere göre sınıflara ayırmak esastır' },
  { ad: 'Ders 15: Zabıt Kâtibinin Görev ve Sorumlulukları', metin: 'zabıt kâtibi duruşma ve keşiflerde hâkimin yazdırdığı beyanları kararları ve ara kararlarını eksiksiz olarak tutanağa geçirir dava dosyalarını düzenli biçimde muhafaza eder tebligat ve müzekkere işlemlerini zamanında yerine getirir ulusal yargı ağı bilişim sistemi üzerinden evrak akışını takip eder mahkeme kalemindeki işlerin hızlı ve hatasız yürütülmesinde doğrudan sorumluluk taşır' },
  { ad: 'Ders 16: İnfaz ve Koruma Hizmetleri Metni', metin: 'ceza infaz kurumlarında görev yapan personel hükümlü ve tutukluların güvenliğini sağlamak kurum düzenini korumak ve iyileştirme programlarının etkin biçimde uygulanmasına destek olmakla yükümlüdür insan haklarına saygı hukukun üstünlüğü ve tarafsızlık ilkeleri çerçevesinde yürütülen infaz hizmetleri topluma yeniden kazandırma amacına hizmet eder kayıt ve evrak düzeni titizlikle tutulur' },
  { ad: 'Ders 17: Tebligat Hukuku ve Usul Kuralları', metin: 'kazai merciler genel bütçe kapsamındaki kamu idareleri özel bütçeli idareler düzenleyici ve denetleyici kurumlar sosyal güvenlik kurumları il özel idareleri belediyeler köy tüzel kişilikleri barolar ve noterler tarafından yapılacak elektronik ortam da dahil tüm tebligat bu kanun hükümlerine göre posta ve telgraf teşkilatı anonim şirketi veya memur vasıtasıyla yapılır tebligat bilinen en son adreste yapılır' },
  { ad: 'Ders 18: Hukuk Muhakemeleri ve İspat', metin: 'taraflar kanunda belirtilen süre ve usule uygun olarak ispat hakkına sahiptir kanuni istisnalar dışında hâkim iki taraftan birinin söylemediği şeyi veya vakıaları kendiliğinden dikkate alamaz ve onları hatırlatabilecek davranışlarda dahi bulunamaz taraflarca getirilme ilkesi gereği davada dayanılan vakıaların ve bunları doğrulayan delillerin süresinde mahkemeye sunulması gerekir' },
  { ad: 'Ders 19: Ceza Muhakemesi ve Savunma Hakkı', metin: 'soruşturma ve kovuşturma evrelerinin her aşamasında şüpheli veya sanığın savunma hakkı kutsaldır şüpheli veya sanık avukat yardımından yararlanma susma hakkını kullanma lehine olan delillerin toplanmasını isteme ve isnat edilen suçlamayı öğrenme haklarına sahiptir mahkeme maddi gerçeğe ulaşmak amacıyla hukuka uygun yöntemlerle elde edilmiş bütün delilleri serbestçe değerlendirir' },
  { ad: 'Ders 20: Daktilografi Final Hız ve Dayanıklılık', metin: 'hızlı ve hatasız yazmak sabır disiplin ve doğru teknik gerektirir klavye sınavına hazırlanan her aday önce doğruluk oranını yüzde doksan sekizin üzerine çıkarmalı ardından kademeli olarak hızını artırmalıdır yanlış yazılan her kelimenin anlam bütünlüğünü bozabileceği unutulmamalıdır gözler daima hedef metinde parmaklar ise temel sırada kalmalıdır düzenli pratik başarıyı kesinleştirir' },
];

const ICRA_METINLER = [
  'icra ve iflas kanunu hükümlerine göre para ve teminat alacaklarına ilişkin ilamsız icra takibi yetkili icra dairesine yapılan takip talebi ile başlar alacaklı takip talebinde kendi kimlik ve adres bilgilerini borçlunun kimlik ve adres bilgilerini alacağın veya istenen teminatın türk parasıyla tutarını faizli alacaklarda faizin miktarı ile işlemeye başladığı günü alacağın dayanağı olan belgeyi ve seçtiği takip yolunu açıkça göstermek zorundadır takip talebini alan icra müdürü talebin kanunda öngörülen şartları taşıdığını tespit ederse en geç üç gün içinde ödeme emri düzenleyerek borçluya tebliğe çıkarır borçlu ödeme emrinin kendisine tebliğinden itibaren yedi gün içinde icra dairesine başvurarak borca veya imzaya itiraz edebilir süresinde yapılan geçerli itiraz takibi kendiliğinden durdurur borçlu süresi içinde itiraz etmez ve borcu da ödemezse takip kesinleşir ve alacaklı haciz isteme yetkisini kazanır haciz talebi üzerine icra dairesi borçlunun taşınır ve taşınmaz malları ile üçüncü kişilerdeki hak ve alacaklarını alacağı karşılayacak miktarda haczeder',
  'ilamlı icra takibi mahkemeler tarafından verilen eda hükümlerinin veya kanunen ilam niteliğinde sayılan belgelerin icra dairesi aracılığıyla zorla yerine getirilmesini sağlayan takip yoludur alacaklı elindeki ilamı icra dairesine ibraz ederek takip talebinde bulunur icra dairesi borçluya icra emri gönderir icra emrinde borçluya yedi gün içinde borcu ödemesi veya ilamın gereğini yerine getirmesi aksi halde cebri icra işlemlerine devam edileceği ihtar olunur ilamlı icrada borçlu yalnızca itfa zamanaşımı veya imhal sebeplerine dayanarak icra mahkemesinden icranın geri bırakılmasını isteyebilir icra dairesi kural olarak ilamın içeriğini denetleyemez ancak ilamda yazılı hüküm fıkrasının açık ve infaza elverişli olması gerekir para borcuna ilişkin ilamların icrasında faiz başlangıç tarihi ve faiz türü hüküm fıkrasına göre hesaplanır takip kesinleştikten sonra alacaklı haciz ve satış talebinde bulunabilir icra kâtibi dosya kapak hesabını harç masraf ve vekâlet ücreti kalemleriyle birlikte eksiksiz düzenler',
  'kambiyo senetlerine özgü haciz yolu poliçe bono ve çek gibi kıymetli evraka dayanan alacakların tahsili amacıyla öngörülen özel bir ilamsız takip türüdür alacaklı kambiyo senedinin aslını ve borçlu sayısı kadar onaylı örneğini icra dairesine vermek zorundadır icra müdürü senedin kambiyo senedi niteliği taşıyıp taşımadığını ve vadesinin gelip gelmediğini resen inceler şartlar tamam ise borçluya on günlük ödeme emri gönderilir bu takip yolunda borca veya imzaya itiraz süresi beş gün olup itiraz doğrudan icra mahkemesine yapılır itiraz satıştan başka icra takip işlemlerini kendiliğinden durdurmaz ancak icra mahkemesi hakimi gerekli görürse geçici olarak takibin durdurulmasına karar verebilir borçlu on gün içinde borcu ödemez ve itirazı da kabul edilmezse mal beyanında bulunmakla yükümlüdür alacaklının talebi üzerine borçlunun banka hesapları maaşı taşınır ve taşınmaz malları üzerine elektronik ortamda sorgulama yapılarak haciz uygulanır',
  'haciz kesinleşmiş bir icra takibinde alacaklının alacağını karşılayacak miktarda borçlunun haczi caiz mallarına ve haklarına icra dairesi tarafından hukuken el konulması işlemidir haciz talebi ödeme emrinin tebliği tarihinden itibaren bir yıl içinde yapılmalıdır bu süre içinde haciz istenmez veya geri alınıp yenilenmezse dosya işlemden kaldırılır haciz sırasında icra memuru borçlunun ve ailesinin yaşamı için zorunlu olan eşyalar ile kanunen haczi yasaklanmış mal ve hakları dikkate almak zorundadır borçlunun maaş ve ücretlerinin en az dörtte biri haczedilebilir ancak nafaka alacakları bakımından özel öncelik kuralları uygulanır üçüncü kişiler nezdindeki hak ve alacakların haczi birinci ikinci ve üçüncü haciz ihbarnameleri yoluyla gerçekleştirilir taşınır malların haczi fiilen kıymet takdiri yapılarak tutanağa geçirilir taşınmaz malların haczi ise tapu siciline şerh verilmek suretiyle tamamlanır haciz tutanağı icra memuru ve hazır bulunanlarca imzalanır',
  'satış ve paraların paylaştırılması aşaması cebri icra sürecinin alacağa kavuşma sonucunu doğuran en önemli evresidir haczedilen taşınır ve taşınmaz malların satışı kural olarak elektronik satış portalı üzerinden açık artırma usulüyle yapılır satış talebinden önce kıymet takdiri kesinleştirilir ve satış ilanı yasal süreler içinde yayımlanır artırmaya katılacak ilgililer belirlenen teminatı yatırmak zorundadır ihale en yüksek teklifi veren alıcıya bırakılır ve ihale bedelinin süresi içinde ödenmesiyle mülkiyet geçişi sağlanır elde edilen satış bedeli bütün alacaklıların alacaklarını karşılamaya yetmezse icra dairesi tarafından sıra cetveli düzenlenir sıra cetvelinde rehinli alacaklar kamu alacakları işçi alacakları ve nafaka alacakları kanundaki öncelik sırasına göre yer alır aynı sıradaki alacaklılar arasında ise garameten yani alacakları oranında paylaştırma yapılır icra dairesi hesaplamalarda tahsil harcı cezaevi yapı harcı ve yargılama giderlerini ayrı ayrı gösterir',
  'ihtiyati haciz para borcuna ilişkin bir alacağın zamanında ödenmesini güvence altına almak amacıyla mahkeme kararı ile borçlunun mallarına geçici olarak el konulmasıdır vadesi gelmiş bir para borcu için alacaklı rehinle temin edilmemiş olmak şartıyla ihtiyati haciz talep edebilir vadesi gelmemiş borçlarda ise borçlunun belirli yerleşim yerinin bulunmaması veya mal kaçırma hazırlığında olması gibi kanuni sebeplerin varlığı aranır mahkeme alacaklıdan muhtemel zararları karşılamak üzere teminat göstermesini ister ihtiyati haciz kararının verildiği tarihten itibaren on gün içinde yetkili icra dairesinden kararın infazı istenmelidir aksi halde ihtiyati haciz kararı kendiliğinden kalkar karar uygulandıktan sonra alacaklı yedi gün içinde esas takibini başlatmak veya dava açmak zorundadır icra kâtibi ihtiyati haciz dosyasındaki süreleri ve teminat mektubu kayıtlarını titizlikle takip eder',
  'icra dairesinde tutulan defterler ve uyap kayıtları teftiş ve denetim bakımından büyük önem taşır esas defteri kasa defteri tahsilat ve reddiyat makbuzları emanet kasa kayıtları haciz ve satış tutanakları ile kıymetli evrak defteri düzenli ve eksiksiz işlenmelidir icra harçları ve masraf avansları tahsil edildiği anda sisteme kaydedilir reddiyat işlemleri hak sahibinin banka hesabına aktarılmak suretiyle gerçekleştirilir dosya kapak hesabında asıl alacak işlemiş faiz takip sonrası faiz harçlar tebligat giderleri ve vekâlet ücreti ayrı kalemler halinde denetlenir icra müdürü ve icra kâtibi mevzuattaki parasal sınırları yıllık yeniden değerleme oranlarını ve yasal faiz değişikliklerini güncel olarak uygular geciken işlemlerin önlenmesi ve tarafların hak kaybına uğramaması için tebligat akıbetleri düzenli olarak kontrol edilir',
  'meskeniyet şikâyeti ve haczedilmezlik kuralları borçlunun ve ailesinin insan onuruna yaraşır asgari yaşam koşullarını korumayı amaçlar borçlunun haline münasip evi kural olarak haczedilemez ancak evin değeri borçlunun sosyal ve ekonomik durumuna göre fazla ise satılarak haline münasip bir ev alması için gerekli bedel borçluya bırakılır kalan tutar alacaklıya ödenir yine borçlunun mesleğini sürdürebilmesi için zorunlu olan alet edevat ve kitaplar ile sosyal güvenlik kurumundan bağlanan emekli aylıkları borçlunun açık muvafakati olmadıkça haczedilemez haczedilmezlik şikâyeti öğrenme tarihinden itibaren yedi gün içinde icra mahkemesine yapılır icra mahkemesi dosya üzerinden veya duruşma açarak keşif ve bilirkişi incelemesi yaptırmak suretiyle karar verir',
  'itirazın iptali ve itirazın kaldırılması davaları borçlunun ödeme emrine itirazı üzerine duran icra takibine devam edilebilmesi için başvurulan hukuki yollardır elinde icra ve iflas kanununun altmış sekizinci maddesinde sayılan belgelerden biri bulunan alacaklı altı ay içinde icra mahkemesinden itirazın kaldırılmasını isteyebilir bu nitelikte belgesi bulunmayan veya genel hükümlere göre uyuşmazlığın kesin hükme bağlanmasını isteyen alacaklı ise itirazın tebliğinden itibaren bir yıl içinde genel mahkemede itirazın iptali davası açar dava sonunda borçlunun itirazında haksız olduğu anlaşılırsa talep halinde alacağın yüzde yirmisinden aşağı olmamak üzere icra inkâr tazminatına hükmedilir icra müdürlüğü kesinleşen veya icra edilebilir mahkeme kararını dosyaya işleyerek takibe devam eder',
  'menfi tespit ve istirdat davaları borçlunun gerçekte borçlu olmadığını ileri sürdüğü durumlarda başvurduğu önemli koruma mekanizmalarıdır borçlu icra takibinden önce veya takip sırasında borçlu bulunmadığının tespitini genel mahkemeden isteyebilir mahkeme takip sırasında açılan menfi tespit davasında teminat karşılığında icra veznesindeki paranın alacaklıya ödenmemesine ihtiyati tedbir yoluyla karar verebilir borçlu cebri icra tehdidi altında borcu olmayan bir parayı ödemek zorunda kalmışsa ödeme tarihinden itibaren bir yıl içinde istirdat davası açarak ödediği tutarın geri verilmesini talep edebilir bu davalarda ispat yükü genel kurallar çerçevesinde belirlenir ve mahkeme kararları icra dosyasına bildirilir',
  'kiralanan taşınmazların ilamsız icra yoluyla tahliyesi kira bedelinin ödenmemesi veya yazılı tahliye taahhüdüne rağmen taşınmazın boşaltılmaması hallerinde uygulanır kira bedelini ödemeyen kiracıya ödeme emri ile birlikte konut ve çatılı işyeri kiralarında otuz gün içinde ödeme yapması aksi halde tahliye edileceği ihtar olunur süresinde itiraz edilmez ve borç ödenmezse kiralayan icra mahkemesinden tahliye talep edebilir yazılı tahliye taahhüdüne dayalı takipte ise kiracıya on beş gün içinde taşınmazı boşaltması için tahliye emri gönderilir kesinleşen tahliye emri üzerine icra dairesi taşınmazı zorla boşaltarak alacaklıya teslim eder',
  'konkordato mali durumu bozulan ancak borçlarını yeniden yapılandırarak faaliyetine devam etme olanağı bulunan dürüst borçlular için öngörülmüş bir hukuki kurumdur borçlu veya iflas talebinde bulunabilecek alacaklılardan biri asliye ticaret mahkemesine başvurarak konkordato talep edebilir mahkeme belgelerin eksiksiz olduğunu görürse derhal geçici mühlet kararı verir ve geçici konkordato komiseri görevlendirir mühlet içinde borçlu aleyhine kural olarak yeni icra takibi başlatılamaz ve mevcut takipler durur alacaklılar toplantısında gerekli çoğunluğun sağlanması ve mahkemenin tasdik kararı vermesiyle konkordato bütün ilgili alacaklılar için bağlayıcı hale gelir',
  'iflas tacir sıfatına sahip borçluların bütün haczedilebilir malvarlığının paraya çevrilerek tüm alacaklıların eşitlik ilkesi çerçevesinde tatmin edilmesini amaçlayan külli icra yoludur iflas kararı asliye ticaret mahkemesince verilir ve kararın kesinleşmesi beklenmeksizin iflas dairesine bildirilir iflas dairesi müflisin mallarının defterini tutar ve muhafaza tedbirlerini alır birinci alacaklılar toplantısında iflas idaresi adayları belirlenir ve icra mahkemesince iflas idaresi atanır iflas idaresi alacakları inceleyerek sıra cetvelini hazırlar masa mallarını paraya çevirir ve pay cetveline göre dağıtımı gerçekleştirir',
  'icra ve iflas hukukunda süreler kamu düzenine ilişkin olup kural olarak hak düşürücü niteliktedir gün olarak belirlenen sürelerde ilk gün hesaba katılmaz ve son günün tatil saatinde süre biter son gün resmi tatile rastlarsa süre tatili izleyen ilk iş gününün çalışma saati sonunda sona erer elektronik tebligat adresine ulaştığı tarihi izleyen beşinci günün sonunda yapılmış sayılır sürelerin doğru hesaplanması hem icra personelinin sorumluluğu hem de tarafların hak arama özgürlüğü açısından vazgeçilmezdir',
  'icra kâtipliği görevinde hız kadar mevzuat bilgisi ve dikkat de belirleyicidir her gün onlarca müzekkere talimat tebligat ve haciz yazışması düzenlenir uyap editör ekranında hatasız yazım yapmak evrak iadelerini önler ve vatandaşın adalete erişimini hızlandırır icra dairesinde çalışan personel gizlilik tarafsızlık ve kamu yararı ilkelerine bağlı kalarak görevini icra eder',
];

const TURKCE_SECME_METINLER = [
  { ad: 'Anayasa Başlangıç ve Temel İlkeler', metin: 'türkiye devleti bir cumhuriyettir türkiye cumhuriyeti toplumun huzuru milli dayanışma ve adalet anlayışı içinde insan haklarına saygılı atatürk milliyetçiliğine bağlı başlangıçta belirtilen temel ilkelere dayanan demokratik laik ve sosyal bir hukuk devletidir türkiye devleti ülkesi ve milletiyle bölünmez bir bütündür dili türkçedir bayrağı şekli kanununda belirtilen beyaz ay yıldızlı al bayraktır milli marşı istiklal marşıdır başkenti ankaradır egemenlik kayıtsız şartsız milletindir türk milleti egemenliğini anayasanın koyduğu esaslara göre yetkili organları eliyle kullanır egemenliğin kullanılması hiçbir surette hiçbir kişiye zümreye veya sınıfa bırakılamaz hiç kimse veya organ kaynağını anayasadan almayan bir devlet yetkisi kullanamaz herkes dil ırk renk cinsiyet siyasi düşünce felsefi inanç din mezhep ve benzeri sebeplerle ayırım gözetilmeksizin kanun önünde eşittir devlet organları ve idare makamları bütün işlemlerinde kanun önünde eşitlik ilkesine uygun olarak hareket etmek zorundadırlar' },
  { ad: 'Resmî Yazışmalarda Uygulanacak Usul ve Esaslar', metin: 'resmî yazışmalar kamu kurum ve kuruluşlarının kendi aralarında veya gerçek ve tüzel kişilerle iletişimlerini sağlamak amacıyla oluşturdukları belgelerdir resmî belgeler elektronik ortamda güvenli elektronik imza ile hazırlanır ve elektronik belge yönetim sistemi üzerinden kayıt altına alınır belgede başlık sayı tarih konu muhatap ilgi metin imza ve ek bölümleri belirli bir düzen içinde yer alır metin bölümü türk dil kurumu yazım kılavuzu ve türkçe sözlük esas alınarak açık anlaşılır ve resmi bir dille kaleme alınır gereksiz tekrar ve belirsiz ifadelerden kaçınılır yazışma süreçlerinde gizlilik derecesi ve ivedilik durumu açıkça belirtilir böylece kamu hizmetlerinin hızlı şeffaf ve denetlenebilir biçimde yürütülmesi sağlanır' },
  { ad: 'Türkçe Yazım Kuralları ve Doğru Kullanım', metin: 'güzel ve doğru türkçe kullanmak her kamu görevlisinin temel sorumlulukları arasındadır bağlaç olan de ve ki ayrı yazılırken ek olan bulunma durumu ve ilgi ekleri kelimeye bitişik yazılır soru eki olan mı mi mu mü kendisinden önceki kelimeden daima ayrı yazılır ancak kendisine gelen eklerle bitişik kullanılır özel adlara getirilen iyelik durum ve bildirme ekleri kesme işareti ile ayrılır kurum kuruluş ve kurul adlarına gelen ekler ise kesme işareti ile ayrılmaz kısaltmaların okunuşuna uygun ek getirilmesi ve sayıların yazımında standart kurallara uyulması metin kalitesini belirgin biçimde artırır' },
  { ad: 'Bilimsel Yöntem ve Eleştirel Düşünme', metin: 'bilimsel yöntem gözlem hipotez kurma deney yapma veri toplama ve sonuçları nesnel ölçütlerle değerlendirme aşamalarından oluşur eleştirel düşünen birey karşılaştığı her bilgiyi kaynağına dayanağına ve tutarlılığına göre sorgular tek bir örneğe bakarak acele genellemeler yapmak yerine ölçülebilir kanıtlara odaklanır bilim tarihinde kalıcı ilerlemeler hataların açıkça test edilmesi ve doğrulanabilir yöntemlerin paylaşılması sayesinde gerçekleşmiştir çağdaş kamu yönetiminde de kararların veriye ve bilimsel analize dayanması kaynakların verimli kullanılmasını sağlar' },
  { ad: 'Zaman Yönetimi ve Verimli Çalışma', metin: 'verimli çalışma uzun saatler boyunca yorularak değil öncelikleri doğru belirleyerek ve dikkati tek bir göreve odaklayarak elde edilir günün başında yapılacak işlerin önem ve aciliyet sırasına göre listelenmesi zihinsel dağınıklığı azaltır yirmi beş dakikalık yoğun odaklanma dilimlerinin ardından verilen kısa molalar hem göz sağlığını korur hem de hata oranını düşürür özellikle klavye ve sınav hazırlığı yapan adaylar için düzensiz uzun çalışmalar yerine her gün belirli saatte yapılan disiplinli tekrarlar çok daha kalıcı kas hafızası oluşturur' },
  { ad: 'Bilgi Güvenliği ve Kişisel Verilerin Korunması', metin: 'dijital çağda kamu kurumlarında işlenen verilerin güvenliği vatandaşın devlete olan güveninin temel unsurudur kişisel veriler ancak kanunda öngörülen usul ve esaslara uygun olarak hukuka ve dürüstlük kurallarına bağlı biçimde işlenebilir güçlü parolalar kullanmak iki aşamalı doğrulamayı etkinleştirmek ve resmî belgeleri yetkisiz kişilerle paylaşmamak temel bilgi güvenliği kurallarıdır kurum bilgisayarlarında lisanslı yazılımlar tercih edilmeli şüpheli e posta ekleri açılmamalı ve düzenli yedekleme alışkanlığı kazanılmalıdır' },
  { ad: 'İletişim Becerileri ve Kamu Etiği', metin: 'kamu görevlileri hizmet sunarken nezaket sabır tarafsızlık ve şeffaflık ilkelerini gözetirler etkili iletişim yalnızca düzgün konuşmak değil karşısındaki kişiyi dikkatle dinlemek ve sorununu doğru anlamaktır açık beden dili sakin ses tonu ve anlaşılır cümleler kurumsal güveni güçlendirir kamu etiği gereği görev ve yetkiler hiçbir zaman kişisel çıkar amacıyla kullanılamaz herkesin eşit hizmet alma hakkına saygı gösterilir' },
  { ad: 'Kitap Okuma ve Kelime Dağarcığı', metin: 'düzenli kitap okumak insanın düşünce ufkunu genişletir kelime dağarcığını zenginleştirir ve okuduğunu anlama hızını doğrudan artırır zengin kelime hazinesine sahip adaylar klavye sınavlarında metni kelime bütünlüğü içinde görerek çok daha akıcı yazarlar gözler tek tek harfleri aramak yerine kelimeleri bütün olarak tanır bu sayede parmaklar metnin ritmine uyum sağlar ve yazım hataları en aza iner' },
  { ad: 'Türk F Klavyenin Bilimsel Gelişimi', metin: 'türkçe f klavye bin dokuz yüz elli beş yılında ihsan sıtkı yener başkanlığındaki bilimsel komisyon tarafından türk dil kurumu sözlüğündeki yaklaşık otuz bin kelimenin harf ve ikili harf sıklıkları hesaplanarak geliştirilmiştir bu bilimsel tasarım sayesinde türkçede en çok kullanılan sesli harfler sol elin temel sırasına en sık sessiz harfler ise sağ elin temel sırasına yerleştirilmiştir böylece iki el arasında yüzde kırk dokuz ve yüzde elli bir oranında dengeli yük dağılımı sağlanmış ve uluslararası şampiyonalarda pek çok dünya rekoru kırılmıştır' },
  { ad: 'Adalet ve Hukukun Üstünlüğü', metin: 'adalet mülkün temelidir ilkesi devletin varlık sebebinin ve meşruiyetinin hukuka bağlılıktan doğduğunu ifade eder hukukun üstünlüğü kuralların herkes için önceden bilinebilir açık ve eşit biçimde uygulanmasını gerektirir bağımsız yargı organları bireylerin temel hak ve özgürlüklerini güvence altına alır adil yargılanma hakkı makul sürede yargılanma ve gerekçeli karar hakkı demokratik hukuk devletinin ayrılmaz parçalarıdır' },
  { ad: 'Eğitimde Sürekli Öğrenme ve Gelişim', metin: 'bilgi ve teknolojinin hızla değiştiği günümüzde öğrenme yalnızca okul yıllarıyla sınırlı kalmamakta yaşam boyu devam eden bir sürece dönüşmektedir mesleki gelişimini sürdüren yeni mevzuatı ve dijital araçları yakından takip eden çalışanlar kurumlarına daha yüksek katkı sunarlar hatalardan ders çıkarmak geri bildirime açık olmak ve ölçülebilir hedefler koymak kişisel başarının en sağlam basamaklarıdır' },
  { ad: 'Çevre Bilinci ve Sürdürülebilirlik', metin: 'doğal kaynakların bilinçli kullanımı gelecek kuşaklara yaşanabilir bir dünya bırakmanın ön koşuludur enerji tasarrufu atıkların kaynağında ayrıştırılması kağıt tüketiminin dijitalleşmeyle azaltılması ve su kaynaklarının korunması bireysel ve kurumsal sorumluluktur kamu kurumlarında elektronik belge sistemlerine geçiş yalnızca iş süreçlerini hızlandırmakla kalmamış her yıl binlerce ağacın korunmasına da doğrudan katkı sağlamıştır' },
];

const OZEL_KELIMELER_GRUPLARI = [
  { ad: 'Zor Türkçe Harfler (ğ, ç, ş, ö, ü)', metin: 'ağaç ağustos ağırlık bağımsızlık bağlantı çağdaş çağrı çalışma çevre çizelge çözüm değişik değerlendirme doğruluk düşünce eğitim eşgüdüm gelişim görevlendirme güçlendirme güzergâh ışıldak iyileştirme kişiselleştirme köprü küçümseme müşavirlik öğle önlem örgütleme özgürlük özveri paylaşım şeffaflık şikâyet şüpheli taşınmaz teşkilat tüketici üçüncü ünvan üretkenlik yürürlük yürütme yükseköğretim çözümleme çoğunluk çerçeve çağrışım değişmezlik doğrulanabilirlik dönüştürülebilirlik eşleştirme gerçekleştirme gözlemleme güçlük iklimlendirme işbirliği karşılıklı keşfetme küreselleşme mükellefiyet ölçülebilirlik önceliklendirme öngörülebilirlik sürdürülebilirlik şahsiyet tanımlanabilirlik teşvik ulaşılabilirlik üstünlük yaygınlaştırma yükümlülük zenginleştirme' },
  { ad: 'Çift Ünsüzlü ve Uzun Eklemeli Kelimeler', metin: 'hakkında hukuken kanunen kısmen madde maddesi maddeleri mahkemece memuriyet milliyetçilik muvaffakiyet müdürlük mükellef müracaat müsaade müsteşar müteahhit müteakip müteselsil müvekkil nakden resmen sahih sehven sıhhat şiddet şüphesiz taahhüt taalluk tahakkuk tahammül tahkikat tahsilat taksirle taltif tasdik tasnif tazminat tebellüğ tebligat tecelli tedbir teeddüp teessüs teftiş tekemmül tekerrür telaffuz telakki temayül temekkün temenni temerrüt teminat temyiz tenezzül tenkit tepki tereddüt terfi terkip tertip tesadüf tesbit tescil teselli tesir tesis teslimiyet teşebbüs teşekkül teşkilat teşrif tetkik teveccüh tevkif tevsik tevzi tezahür ticaret tutanak' },
  { ad: 'Hukuk ve Yargılama Terimleri', metin: 'aciz vesikası adli tatil adli yardım ağır ceza ahde vefa akdi faiz alacaklı aleniyet amme alacağı anayasa arabuluculuk ara karar asliye hukuk asliye ticaret atama beraat beyanname bilirkişi bölge adliye bölge idare borçlu cebri icra celse cezaevi cumhuriyet savcısı danıştay dava şartı davacı davalı defterdarlık delil başlangıcı denetimli serbestlik derdest dilekçe disiplin soruşturması duruşma ecrimisil eda davası ehliyet ek karar elbirliği mülkiyeti emsal karar emanet esas numarası evrak kayıt faiz oranı feragat feshin geçersizliği garameten paylaştırma gerekçeli karar görevsizlik haciz ihbarnamesi hak düşürücü süre hâkimlik teminatı harç muafiyeti hüküm fıkrası husumet ıslah ibra icra inkâr iddianame iflas masası ihale feshi ihtarname ihtiyati haciz ihtiyati tedbir ikame ilam ilamsız takip imtiyaz infaz istinaf istirdat itirazın iptali izalei şüyu kadastro kamulaştırma kanun yolu karar düzeltme kast kesin hüküm kesinleşme keşif kıdem tazminatı kovuşturma kusur sorumluluğu layiha mahsup maktu harç mal beyanı manevi tazminat mazbata menfi tespit mirasçılık belgesi muacceliyet muvazaa mücbir sebep müdafi müeyyide mühür müsadere müzekkere nafaka nispi harç noterlik ön inceleme ödeme emri rehin rücu savunma senet sicil sulh tahkikat tahliye takipsizlik tanık tapu tazminat tebligat tedbir temerrüt temyiz tensip tespit uzlaştırma vekâletname yargıtay yetkisizlik zabıt kâtibi zamanaşımı' },
  { ad: 'F Klavye Zayıf Parmak (Serçe ve Yüzük) Kelimeleri', metin: 'ufuk uşak uyku uyumak uyanık ulaşım ulusal uygulama uzmanlık uzlaşma şaka şale şanlı şapka şartname şaşmaz şefkat şehir şekil şema şeref şerit şifa şifre şikâyet şimdi şube şule şura şükür şüphe yaka yakıt yalım yamaç yanık yaprak yargı yarım yasak yaşam yatak yavru yavaş yazım yazı yazıt yedek yelek yemek yemin yeni yerli yeşil yeter yetim yetki yıkım yıl dönümü yıllık yıldız yolcu yokuş yorum yönetim yöntem yüksek yürüyüş yüzük yüzleşme jale jandarma jelatin jest jilet jüri ödev ödül öfke öğle öğüt öksüz ölçü ömür önlem öneri örnek övgü öykü özen özet özgü özlem öznel özür faliyet fakülte fayda fazla felaket feragat ferman fırtına fikir filo finans fiyat fonksiyon formül fotoğraf foya fırsat' },
  { ad: 'Q Klavye Zayıf Parmak (Serçe ve Yüzük) Kelimeleri', metin: 'adalet adaylık adres ağustos aile akıl akış alan alay alfabe alıcı alışkanlık amaç ambar amir anahtar analiz anayasa anket anlam anlaşma anlatım anma anlayış apartman arama araç arşiv asgari asil askerlik aşama atama avukat ayak aydınlık ayrım azami zaaflar zabıt zaman zamir zarafet zarar zarf zayıf zemin zengin zihin zirve ziyaret zorluk zorunlu zulüm şahıs şahit şans şart şefkat şehir şekil şema şeref şerit şifre şikâyet şimdi şirket şube şükür şüphe paket palto panel pano para parça parlamento parmak parti pasaport patent pazar paylaşım pedagoji pencere performans periyot personel peşin piyasa plan planlama plaka politika portre posta pratik prensip problem program proje protokol puan pusula' },
  { ad: 'Sık Karıştırılan ve Yazımı Zor Kelimeler', metin: 'acente alüminyum antrenman apar topar ardı sıra aritmetik asfalt ataşe ateşkes babayiğit bağdaşmak baş başa başlangıç başöğretmen başsavcı başyazar beyefendi birdenbire birikim birkaç birleşik birtakım bugün büsbütün çağdaş çeşni çiğnemek çıplak dağıtım dahi doğrudan doğruya doküman dürüst egzoz ekseriyet elverişli enstitü entelektüel erezyon erozyon eşofman etüt evrak fasulye fevkalade filoloji fiyat flüt fotoğraf gardırop gazete gelgelelim gelişigüzel geometri gitgide gökkuşağı güncelleme güpegündüz hafriyat hâlbuki halihazırda ham madde hani harikulade hayalperest hemşehri herhangi herhâlde herkes hiçbiri hukukçu ıstırap iddia ihbarname ikametgâh illaki imkânsız inisiyatif inkılap inşallah istisna işbirliği işgüzar itibarıyla izdiham jandarma kalemşor kamuoyu kangren kapüşon karambol karnabahar karoser katalog kâtip kılavuz kibritle kiprik kirpik koleksiyon kolektif komiser komodin komşu konjonktür konteyner kravat kredi kronoloji laboratuvar layık leğen lisans makine maalesef mahcup mahkeme mahsus makbuz mani marangoz materyal matbaa maydanoz meclis mecburi menfaat menü merhaba mesela metot meyve mezuniyet miğfer mikrop milyar minnettar misafir muamma muayene muhafaza muhakkak muhalefet muhatap muhtelif muhteşem mukavele mukayese muvaffak mübalağa mübaşir mücadele mücevher müdafaa müdür müellif müfettiş mühendis mühim mükafat mükemmel mükerrer mülakat mülkiyet münasebet müracaat müsaade müsait müspet müstakil müsteşar müşteri müteahhit müteakip mütevazı müvekkil müzekkere' },
  { ad: 'Kamu Yönetimi ve Mevzuat Terimleri', metin: 'asalet tasdiki aday memur açık atama açıktan atama aile yardımı aylık katsayısı bakanlık makamı belediye encümeni bütçe kanunu cumhurbaşkanlığı kararnamesi çalışma saatleri derece yükselmesi devlet memuru disiplin amiri disiplin kurulu döner sermaye ek gösterge ek ödeme emekli ikramiyesi emekli keseneği enflasyon farkı fazla çalışma geçici görev yolluğu genel idare hizmetleri görevde yükselme görevlendirme gündelik harcırah hastalık izni hizmet içi eğitim hizmet sınıfı hizmet süresi iç denetim idari para cezası idari yargı il özel idaresi ilçe müdürlüğü kademe ilerlemesi kadro derecesi kamu denetçiliği kamu görevlileri kamu ihale kamu konutları kamu maliyesi kamu personeli kamu yararı kanun hükmünde kararname kazanılmış hak aylığı kıdem aylığı kınama cezası kurumlar arası nakil liyakat lojman puanı makam tazminatı mali haklar mazeret izni memuriyet mahalli merkezi yönetim naklen atama nöbet ücreti özel hizmet tazminatı özlük dosyası refakat izni resmî gazete sendika aidatı seyyanen zam sicil numarası sözleşmeli personel sürekli görev yolluğu taban aylığı tayin bedeli teşkilat şeması toplu sözleşme unvan değişikliği uyarma cezası ücret göstergesi vekâlet aylığı yan ödeme yıllık izin yüksek disiplin kurulu' },
  { ad: 'Bilişim, UYAP ve Dijital Ofis Kelimeleri', metin: 'algoritma anahtar kelime arşivleme barkod okuyucu bellek bilişim sistemi bulut depolama çevrimiçi çözümleyici dahili ağ daktilografi denetim kaydı dijital imza doküman editör doğrulama e devlet e imza e tebligat ekran görüntüsü elektronik arşiv elektronik belge elektronik posta erişilebilirlik güvenlik duvarı hesaplama motoru hızlı okuma istemci kayıt defteri kullanıcı deneyimi kimlik doğrulama klavye düzeni kodlama kriptografi mobil imza onay süreci otomatik yedekleme önbellek parola politikası raporlama sanal klavye sayısal sertifika sekme senkronizasyon sunucu şifreleme tarayıcı teknik destek ulusal yargı ağı uzaktan erişim veri bütünlüğü veri güvenliği veri tabanı yapay zekâ yazılım güncellemesi yedekleme yetki matrisi zaman damgası' },
  { ad: 'Ekonomi, Vergi ve Muhasebe Terimleri', metin: 'amortisman asgari ücret istisnası avans bilanço bordro brüt ücret bütçe açığı cari hesap damga vergisi defterdarlık değer artış kazancı döviz kuru ek bütçe emlak vergisi enflasyon oranı fatura finansman gelir vergisi dilimi genel bütçe gider avansı harç tarifesi hazine bonosu hesap özeti ihale bedeli ikramiye indirim oranı istisna tutarı işsizlik sigortası işveren payı kademeli tarife kamu harcaması katma değer vergisi kesinti matrahı kıdem tazminatı tavanı kurumlar vergisi mali müşavir mali yıl matrah muhasebe fişi mutemetlik net kazanç ödeme emri belgesi ödenek özel tüketim vergisi para politikası peşin vergi prim esas kazanç reeskont faizi resmi tarife saymanlık serbest meslek makbuzu sigorta primi stopaj oranları tahakkuk tahsilat tediye temerrüt faizi tevkifat ticari kazanç tüketici fiyat endeksi vergi dairesi vergi iadesi vergi matrahı vergi usul kanunu yasal faiz yeniden değerleme oranı yevmiye defteri' },
  { ad: 'İkili ve Üçlü Zor Harf Bileşimleri', metin: 'stra strateji strüktür ekstra ekstrem spektrometre psikoloji psikiyatri pskolojik şoför şölen şömine şöhret cüzdan cümbüş cümle cüret cüsse çağrışım çığlık çiğdem çiğnemek çıraklık çırpınmak çizmeli çoğaltmak çökelmek çözümlemek çürütmek ığdır ılık ırmak ısırmak ıslahat ıslaklık ıspanak ıssız ıstırap ışıldamak ışıklandırma ızgara jandarma jeoloji jeofizik jeneratör jimnastik jokey jübile jüri öbür ödenek ödüllendirme öğleden öğretmen öğretim öğütmek öküz ölçümleme öldürmek ölümsüzlük ömürlük öncelik önderlik öngörü önleyici örnekleme örtbas örümcek ötelemek övünmek öykülemek özdeşlik özelleştirme özendirmek özerklik özgürleştirme özleştirmek özümsemek özverili' },
  { ad: 'Eş Sesli ve Bağlamlı Kelime Çalışması', metin: 'açık alan açık oturum açık artırma adil yargılama adli sicil adli tıp ağır kusur ağır iş akıl yürütme aktif görev alacak hakkı alt kurul alt sınır ana kural ana metin ara karar ara sınav arsa payı asıl alacak asıl nüsha aşama kaydı atama kararı ayrıntılı döküm bağımsız yargı bağlı birim bakanlık onayı başvuru harcı belge örneği bilirkişi raporu bireysel başvuru birim amiri boş kadro bölünmez bütünlük bütçe dönemi çalışma belgesi çekişmesiz yargı çevre düzeni dava değeri dava dilekçesi dava dosyası defter kaydı denetim raporu derece terfisi destek ödemesi dijital arşiv dilekçe hakkı disiplin cezası doğal hakim doğruluk oranı dosya numarası duruşma günü duruşma tutanağı düzenleyici işlem eğitim düzeyi ek belge ek süre emekli aylığı emsal bedel esas kayıt evrak numarası' },
  { ad: 'Hız ve Akıcılık Kelime Zinciri', metin: 'insan hakları hukuk devleti adalet bakanlığı yargı yetkisi bağımsız mahkeme tarafsız hakim zabıt katibi icra katibi cezaevi katibi yazı işleri müdürü idari işler müdürü mübaşir infaz koruma memuru personel genel müdürlüğü ceza tevkifevleri hakimler savcılar kurulu yargıtay danıştay anayasa mahkemesi bölge adliye mahkemesi bölge idare mahkemesi asliye hukuk asliye ceza sulh hukuk sulh ceza ağır ceza iş mahkemesi aile mahkemesi tüketici mahkemesi ticaret mahkemesi icra dairesi tebligat kanunu harçlar kanunu devlet memurları kanunu türk ceza kanunu türk medeni kanunu türk borçlar kanunu hukuk muhakemeleri kanunu ceza muhakemesi kanunu idari yargılama usulü kanunu icra iflas kanunu' },
];

const RAKAM_SAYI_METINLER = [
  { ad: 'Sayı Sırası Temel Alıştırma (0–9)', metin: '10 20 30 40 50 60 70 80 90 100 123 456 789 012 345 678 901 2024 2025 2026 2027 1923 1982 657 6100 5237 5271 2004 2577 4857 5510 5434 7201 492 1453 1881 1938 15 25 35 45 55 65 75 85 95 105 250 500 750 1000 2500 5000 10000 12345 67890' },
  { ad: 'Kanun Numaraları ve Madde Atıfları', metin: '657 sayılı devlet memurları kanununun 48 inci 54 üncü 68 inci 74 üncü 125 inci ve 154 üncü maddeleri ile 6100 sayılı hukuk muhakemeleri kanununun 114 üncü 119 uncu 200 üncü 341 inci ve 362 nci maddeleri uygulamada sık kullanılır 5237 sayılı türk ceza kanununun 43 üncü 53 üncü 62 nci ve 142 nci maddeleri ile 5271 sayılı ceza muhakemesi kanununun 100 üncü 174 üncü 231 inci ve 251 inci maddeleri duruşma tutanaklarında yer alır 2004 sayılı icra ve iflas kanununun 62 nci 67 nci 68 inci 82 nci ve 89 uncu maddeleri icra takiplerinin temelini oluşturur' },
  { ad: 'Esas, Karar ve Dosya Numaraları', metin: '2026/1045 esas 2026/892 karar sayılı ilam 2025/4120 esas 2026/315 karar sayılı hüküm 2024/9876 esas 2025/5432 karar sayılı dosya 2026/128 değişik iş 2026/745 talimat 2026/3012 icra esas 2025/18940 soruşturma 2026/4502 iddianame 2026/781 istinaf 2026/219 temyiz dosyası incelendi 14/07/2026 tarihli duruşma zaptı 29/10/2026 tarihli kesinleşme şerhi 01/01/2027 tarihli yürürlük kaydı 15/01/2026 ile 31/12/2026 tarihleri arasındaki dönem için 180 gün ve 365 gün hesapları yapıldı' },
  { ad: 'Parasal Tutarlar, Harç ve Yüzde Oranları', metin: '2026 yılı yeniden değerleme oranı yüzde 25,49 olarak belirlenmiştir başvurma harcı 615,40 tl peşin karar ve ilam harcı binde 68,31 oranının dörtte biri olarak hesaplanır kdv oranları yüzde 1 yüzde 10 ve yüzde 20 olarak uygulanır damga vergisi oranı binde 7,59 olup gelir vergisi dilimleri yüzde 15 yüzde 20 yüzde 27 yüzde 35 ve yüzde 40 şeklindedir 12.500,00 tl asıl alacak 1.875,50 tl işlemiş faiz 4.250,00 tl yargılama gideri ve 30.000,00 tl vekâlet ücreti toplamı 48.625,50 tl olarak tespit edilmiştir' },
  { ad: 'Tarihler, Saatler ve Süre Hesapları', metin: '01.01.2026 perşembe 09:00 duruşma saati 15.03.2026 pazar 14:30 keşif saati 23.04.2026 ulusal egemenlik 19.05.2026 gençlik bayramı 15.07.2026 demokrasi günü 20.07.2026 ile 31.08.2026 arası adli tatil dönemi 01.09.2026 yeni adli yıl açılışı 29.10.2026 cumhuriyet bayramı 10.11.2026 anma günü 24.11.2026 öğretmenler günü 2 haftalık istinaf süresi 14 gün 1 aylık temyiz süresi 30 gün 7 günlük itiraz süresi 5 günlük elektronik tebligat bekleme süresi 3 dakikalık klavye sınavı 180 saniye ve 90 net kelime barajı' },
  { ad: 'Derece, Kademe ve Katsayı Tablosu', metin: '13/3 12/1 11/2 10/1 9/1 9/2 9/3 8/1 8/2 8/3 7/1 6/2 5/3 4/1 3/1 3/2 2/1 1/4 derece kademe ilerlemesi 1500 gösterge 2200 ek gösterge 2800 ek gösterge 3600 ek gösterge 4200 ek gösterge 5400 ek gösterge 15965 seyyanen zam göstergesi 1000 taban aylığı göstergesi 500 yan ödeme 1775 yan ödeme 2500 yan ödeme yüzde 130 özel hizmet tazminatı yüzde 170 ek ödeme oranı 25 hizmet yılı kıdem aylığı 500 gösterge üzerinden hesaplanır' },
  { ad: 'Telefon, Posta Kodu ve Sicil Numaraları', metin: '0312 417 77 70 ankara adalet bakanlığı 0212 375 75 75 istanbul adliyesi 0232 411 20 00 izmir adliyesi 06420 çankaya ankara 34381 şişli istanbul 35530 bayraklı izmir 01010 seyhan adana 07050 muratpaşa antalya 16050 osmangazi bursa 26010 odunpazarı eskişehir 38010 kocasinan kayseri 42040 selçuklu konya 55030 ilkadım samsun 61030 ortahisar trabzon sicil no 184520 sicil no 209415 sicil no 241890 sicil no 315642' },
  { ad: 'Bütçe, Maaş ve Bordro Kalemleri', metin: 'gösterge aylığı 1.854,25 tl ek gösterge aylığı 4.120,60 tl taban aylığı 16.450,80 tl kıdem aylığı 582,40 tl yan ödeme 745,15 tl özel hizmet tazminatı 14.320,90 tl ek ödeme 12.640,35 tl ilave ödeme 18.925,10 tl aile yardımı 2.890,45 tl çocuk yardımı 640,20 tl toplam tahakkuk 73.170,20 tl emekli keseneği 5.120,40 tl gss primi 2.845,10 tl gelir vergisi 3.410,85 tl damga vergisi 412,30 tl net ödenen 61.381,55 tl' },
  { ad: 'İstatistik ve Sınav Metrikleri', metin: '300 kelimelik sınav metninde 180 saniye içinde 115 doğru kelime 3 hatalı kelime 0 atlanan kelime ile 112 net kelime elde edilmiştir dakika başına kelime hızı 37 dks toplam vuruş sayısı 842 doğruluk oranı yüzde 97,46 hata oranı yüzde 2,54 olarak hesaplanmıştır anlam bütünlüğü sınırı yüzde 25 atlanan kelime sınırı 22 kelime olup aday 90 net barajını 22 net farkla aşarak başarılı sayılmıştır' },
  { ad: 'Karma Sayı ve Kelime Hız Finali', metin: '2026 yılında 81 ilde 15 bölge adliye mahkemesi 9 bölge idare mahkemesi ve 140 ağır ceza merkezi görev yapmaktadır 5766 sözleşmeli personel alımında 30 zabıt katibi metni 30 cezaevi katibi metni ve 433 arşiv metni kullanılmıştır 10 parmak eğitiminde 19 ders ve 57 seviye tamamlandığında ortalama yazım hızı dakikada 35 kelimeden 65 kelimeye yükselmekte hata oranı yüzde 8 seviyesinden yüzde 1,5 seviyesine düşmektedir' },
];

async function main() {
  const veri = JSON.parse(await readFile(VERI_YOL, 'utf8'));

  // Eski ek/daktilografi gruplarını çıkarıp yalnız çekirdek resmî PGM/CTE/HSK gruplarını koru
  const cekirdekGruplar = veri.gruplar.filter((g) => !YENI_GRUP_IDLERI.has(g.id));

  // Metin havuzunu yeniden derle (kullanılmayan eski daktilografi metinlerini temizle)
  const metinHarita = new Map();
  const yeniMetinler = [];
  const metinEkle = (txt) => {
    const temiz = txt.replace(/\s+/g, ' ').trim();
    if (metinHarita.has(temiz)) return metinHarita.get(temiz);
    const idx = yeniMetinler.length;
    yeniMetinler.push(temiz);
    metinHarita.set(temiz, idx);
    return idx;
  };

  const gruplar = cekirdekGruplar.map((g) => ({
    ...g,
    ogeler: g.ogeler.map((o) => {
      const ham = veri.metinler[o.t] ?? '';
      return { ad: o.ad, t: metinEkle(ham), k: o.k };
    }),
  }));

  // 1. Daktilografi Kitabı (20 metin)
  gruplar.push({
    id: 'daktilografi',
    kurum: 'Daktilografi',
    yil: 0,
    baslik: 'Daktilografi Kitabı ve On Parmak Dersleri (20 Metin)',
    tarih: '2026-01-01',
    kaynak: '',
    ogeler: DAKTILOGRAFI_METINLER.map((d) => ({
      ad: d.ad,
      t: metinEkle(d.metin),
      k: kelimeSayisi(d.metin),
    })),
  });

  // 2. İcra Kâtipliği ve İcra Hukuku (15 metin)
  gruplar.push({
    id: 'icra-katipligi',
    kurum: 'İcra',
    yil: 2026,
    baslik: 'İcra Kâtipliği ve İcra Hukuku Çalışma Metinleri',
    tarih: '2026-07-01',
    kaynak: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=2004&MevzuatTur=1&MevzuatTertip=3',
    ogeler: ICRA_METINLER.map((m, i) => ({
      ad: `Metin ${i + 1}`,
      t: metinEkle(m),
      k: kelimeSayisi(m),
    })),
  });

  // 3. Yargıtay ve Adli Yargı Metinleri (15 metin — belgeler/genelgeler arşivinden)
  const adliMetinler = await klasordenMetinDerle(
    'src/content/belgeler',
    (f, txt) => /genelge|adalet|mahkeme|yargi|tebligat|harc|kalem/i.test(f + ' ' + txt.slice(0, 200)),
    15
  );
  if (adliMetinler.length > 0) {
    gruplar.push({
      id: 'yargitay-kararlari',
      kurum: 'Yargı',
      yil: 2026,
      baslik: 'Yargı, Genelge ve Adli Uygulama Metinleri',
      tarih: '2026-01-01',
      kaynak: 'https://657.com.tr/genelgeler/',
      ogeler: adliMetinler.map((m, i) => ({
        ad: `Metin ${i + 1}`,
        t: metinEkle(m),
        k: kelimeSayisi(m),
      })),
    });
  }

  // 4. Danıştay ve İdari Yargı / DPB Görüş Metinleri (15 metin — dpb-bulten arşivinden)
  const idariMetinler = await klasordenMetinDerle(
    'src/content/dpb-bulten',
    (_f, txt) => txt.length > 1200,
    15
  );
  if (idariMetinler.length > 0) {
    gruplar.push({
      id: 'danistay-idari',
      kurum: 'İdare',
      yil: 2026,
      baslik: 'Danıştay, 657 ve İdari Mevzuat Metinleri',
      tarih: '2026-01-01',
      kaynak: 'https://657.com.tr/dpb-gorusleri/',
      ogeler: idariMetinler.map((m, i) => ({
        ad: `Metin ${i + 1}`,
        t: metinEkle(m),
        k: kelimeSayisi(m),
      })),
    });
  }

  // 5. Tekerlemeler (12 metin — src/data/tekerlemeler.json'dan fonetik gruplar)
  const tekerlemeler = JSON.parse(await readFile(TEKERLEME_YOL, 'utf8'));
  const tekerlemeGruplari = [];
  for (let i = 0; i < tekerlemeler.length; i += 2) {
    const dilim = tekerlemeler.slice(i, i + 3);
    const harfler = dilim.map((x) => x.harf).join(', ');
    const birlesik = dilim.flatMap((x) => x.maddeler).join(' ');
    // Akıcı 150+ kelime için tekrarlı pekiştirme
    const metin = kelimeSayisi(birlesik) < 120 ? `${birlesik} ${birlesik}` : birlesik;
    tekerlemeGruplari.push({ ad: `Tekerlemeler (${harfler})`, metin });
    if (tekerlemeGruplari.length >= 12) break;
  }
  gruplar.push({
    id: 'tekerlemeler',
    kurum: 'Diksiyon',
    yil: 0,
    baslik: 'Tekerlemeler Çalışma Metinleri (A–Z)',
    tarih: '2026-01-01',
    kaynak: 'https://657.com.tr/tekerlemeler/',
    ogeler: tekerlemeGruplari.map((t) => ({
      ad: t.ad,
      t: metinEkle(t.metin),
      k: kelimeSayisi(t.metin),
    })),
  });

  // 6. Türkçe Seçme Metinler (12 metin)
  gruplar.push({
    id: 'turkce-secme',
    kurum: 'Seçme',
    yil: 0,
    baslik: 'Türkçe Seçme Metinler (Hukuk, Dil ve Genel Kültür)',
    tarih: '2026-01-01',
    kaynak: '',
    ogeler: TURKCE_SECME_METINLER.map((m) => ({
      ad: m.ad,
      t: metinEkle(m.metin),
      k: kelimeSayisi(m.metin),
    })),
  });

  // 7. Özel ve Zor Kelimeler (12 metin)
  gruplar.push({
    id: 'ozel-kelimeler',
    kurum: 'Özel',
    yil: 0,
    baslik: 'Özel ve Zor Kelimeler Çalışması',
    tarih: '2026-01-01',
    kaynak: '',
    ogeler: OZEL_KELIMELER_GRUPLARI.map((m) => ({
      ad: m.ad,
      t: metinEkle(m.metin),
      k: kelimeSayisi(m.metin),
    })),
  });

  // 8. Rakam, Sayı ve Madde Çalışması (10 metin)
  gruplar.push({
    id: 'rakam-sayi',
    kurum: 'Sayılar',
    yil: 0,
    baslik: 'Rakam, Sayı ve Kanun Maddesi Çalışması',
    tarih: '2026-01-01',
    kaynak: '',
    ogeler: RAKAM_SAYI_METINLER.map((m) => ({
      ad: m.ad,
      t: metinEkle(m.metin),
      k: kelimeSayisi(m.metin),
    })),
  });

  const toplamMetin = gruplar.reduce((a, g) => a + g.ogeler.length, 0);
  const ozet = {
    toplamMetin,
    benzersizMetin: yeniMetinler.length,
    gruplar: gruplar.map((g) => ({
      id: g.id,
      kurum: g.kurum,
      yil: g.yil,
      baslik: g.baslik,
      tarih: g.tarih,
      kaynak: g.kaynak,
      adet: g.ogeler.length,
    })),
  };

  await writeFile(VERI_YOL, JSON.stringify({ metinler: yeniMetinler, gruplar }), 'utf8');
  await writeFile(OZET_YOL, JSON.stringify(ozet, null, 2) + '\n', 'utf8');
  console.log(`Tamamlandı: ${gruplar.length} grup, ${toplamMetin} toplam metin (${yeniMetinler.length} benzersiz).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
