import kayitlar from '../data/bilirkisi-kararlari.json';
import sureler from '../data/bilirkisi-kararlari-sureler.json';

export const arsivYolu = '/bilirkisi-bolge-kurulu-kararlari/';
export const geciciCikarmaSureleri: Readonly<Record<string, string | undefined>> = sureler;
const kaynak = 'https://bilirkisilik.adalet.gov.tr/Home/SayfaDetay/';
export const kararGruplari = [
  { id: 'uyarma', ad: 'Uyarma', kaynak: kaynak + 'uyarma15012021024508' },
  { id: 'gecici-cikarma', ad: 'Geçici süreyle listeden çıkarma', kaynak: kaynak + 'gecici-sureyle-listeden-cikarma15012021024546' },
  { id: 'sicilden-cikarma', ad: 'Bilirkişilik sicilinden ve listesinden çıkarılma', kaynak: kaynak + 'bilirkisilik-sicilinden-ve-listesinden-cikarilma15012021024613' },
  { id: 'yasaklanma', ad: 'Bilirkişilik yapmaktan yasaklanma', kaynak: kaynak + 'bilirkisilik-yapmaktan-yasaklanma22012021035202' },
].map(grup => ({ ...grup, kararlar: kayitlar.filter(k => k.category === grup.id) }));

const incelemeler: Record<string, { ozet: string; gerekce: string; soru: string; cevap: string }> = {
  'gecici-cikarma-19-04-2021-2021-47': {
    ozet: 'İş ilişkisi bulunan şirketin taraf olduğu dosyada görev alan bilirkişi, bir yıllık geçici çıkarma kararına itiraz etti. Kurul itirazı reddetti.',
    gerekce: 'Van Bölge Kurulu, bilirkişinin şirketle iş ilişkisi sürerken şirketin taraf olduğu davada görev kabul edip rapor hazırlamasını etik ve görev kabulü kurallarına aykırı buldu. 2021/47 sayılı dosyada incelenen yaptırım, önceki 2021/24 sayılı kararla verilmişti.',
    soru: 'İtiraz üzerine yeni bir yıllık yaptırım mı verildi?',
    cevap: 'Kurul, 2021/24 sayılı kararla verilen yaptırıma yönelik itirazı reddetti. 2021/47 sayılı karar bu itiraz incelemesinin sonucudur.',
  },
  'gecici-cikarma-06-06-2018-2018-182': {
    ozet: 'Raporu yaklaşık sekiz ay geciktiren heyette iki bilirkişi üç ay listeden çıkarıldı. Liste dışından görevlendirilen bilirkişiye üç ay yasaklama verildi.',
    gerekce: 'Antalya Bölge Kurulu, gecikmenin yargılamayı uzattığını tespit etti. Liste kaydı bulunan iki bilirkişi için 6754 sayılı Kanunun 13. maddesini, kaydı bulunmayan bilirkişi için 14/6. maddesini uyguladı.',
    soru: 'Üç aylık süre ne zaman başlar?',
    cevap: 'Kurul, her iki yaptırım türü için sürenin kararın kesinleşmesiyle başlamasına karar verdi.',
  },
  'uyarma-19-12-2019-2019-1082': {
    ozet: 'Heyet raporunda teknik inceleme sınırını aşarak hukuki değerlendirme yapıldığı için bilirkişilere uyarma verildi.',
    gerekce: 'Ankara Bölge Kurulu, heyetin 6754 sayılı Kanunun 3/2. maddesindeki sınırı aştığına karar verdi. İhlalin niteliğini, dosya kapsamını ve savunmaları dikkate alarak Kanunun 13/2. maddesi uyarınca uyarmayı yeterli gördü.',
    soru: 'Kurul, uygulamada ilgili kanun maddesine uyulmadığı savunmasını kabul etti mi?',
    cevap: 'Hayır. Kurul, bir hükmün bir süredir uygulanmadığı veya mahkemelerin farklı biçimde hareket ettiği iddiasını ihlal için mazeret saymadı.',
  },
  'uyarma-17-10-2019-2019-967': {
    ozet: 'İnceleme yerine taraflardan biriyle irtibat kurarak giden ve onunla inceleme yapan bilirkişi uyarıldı.',
    gerekce: 'Ankara Bölge Kurulu, bilirkişinin inceleme yerine ulaşmak için bir tarafla iletişim kurmasını ve incelemeyi onunla yapmasını tarafsızlıkla ilgili etik yükümlülüğe aykırı buldu. Aynı olayda diğer bilirkişiler için yaptırım gerekmediğine karar verdi.',
    soru: 'Diğer bilirkişinin inceleme yerinde bir tarafla karşılaşması aynı sonucu doğurdu mu?',
    cevap: 'Hayır. Kurul, o karşılaşmanın bilirkişinin isteğiyle gerçekleşmediğini ve kendisine yüklenebilecek bir ihmal tespit edilmediğini belirtti.',
  },
  'uyarma-9-09-2019-2019-799': {
    ozet: 'Vergi incelemesine ilişkin raporda eylemin hangi suçu oluşturduğunu belirleyen bilirkişiye uyarma yaptırımı verildi.',
    gerekce: 'Ankara Bölge Kurulu, faturalara ilişkin teknik incelemenin ötesine geçilerek Vergi Usul Kanunu uyarınca suç işlendiği yönünde görüş bildirildiğini tespit etti. Bu hukuki nitelendirmeyi 6754 sayılı Kanunun 3/2. maddesine aykırı gördü.',
    soru: 'Kurul, yaptırımın uygulanması için kararı nereye gönderdi?',
    cevap: 'Kesinleşmesinin ardından karar, bilirkişinin kayıtlı olduğu İzmir Bilirkişilik Bölge Kuruluna gönderilecekti.',
  },
  'gecici-cikarma-17-05-2019-2019-212': {
    ozet: 'Asıl raporu süresinde tamamlamadan dosyayı iade eden bilirkişi 3 ay süreyle geçici olarak listeden ve sicilden çıkarıldı.',
    gerekce: 'Adana Bölge Kurulu, 30 günlük rapor süresi dolduktan ve mahkeme ayrıca ihtar gönderdikten sonra dosyanın asıl rapor sunulmadan iade edildiğini tespit etti. Kurul, bilirkişinin ek süre istememesi ve dosyanın yaklaşık altı ay elinde kalması nedeniyle geçici çıkarma kararı verdi.',
    soru: 'Mahkemenin ek ihtarı üzerine ön rapor verilmesi görevin tamamlanması olarak kabul edildi mi?',
    cevap: 'Hayır. Kurul asıl raporun sunulmadığını ve dosyanın iade edildiğini dikkate aldı.',
  },
  'gecici-cikarma-17-07-2020-2020-176': {
    ozet: 'Altmış günlük rapor süresini yaklaşık 11 ay aştığı için bilirkişi 6 ay süreyle listeden çıkarıldı.',
    gerekce: 'Ankara Bölge Kurulu, ıslak imzalı teslim tutanağından görevlendirme süresini ve dosya teslimini belirledi. Mahkemeye mazeret bildirilmediği ve ek süre talep edilmediği için Kanunun 13. maddesi kapsamında geçici çıkarma kararı verdi.',
    soru: 'Altı aylık yaptırım süresi gecikme süresinden nasıl ayrılır?',
    cevap: 'Kurulun tespit ettiği gecikme yaklaşık 11 aydır. Hükümde yer alan geçici çıkarma süresi altı aydır.',
  },
  'yasaklanma-29-03-2019-2019-588': {
    ozet: 'Ek rapor için yapılan görevlendirmede dosyayı teslim almayan ve mazeret sunmayan bilirkişi hakkında yasaklama kararı verildi.',
    gerekce: 'Ankara Bölge Kurulu, kök raporu hazırlayan bilirkişinin ek rapor için yeniden görevlendirildiğini, telefon ve muhtıra yoluyla yapılan bildirimlere rağmen dosyayı almadığını belirledi. Benzer bir olayda daha önce yaptırım uygulanmış olmasını da dikkate aldı.',
    soru: 'Kurul hangi hükme dayanarak bilirkişilik yapmaktan yasakladı?',
    cevap: 'Kararın dayanağı, 6754 sayılı Bilirkişilik Kanununun 14/6. maddesidir.',
  },
  'yasaklanma-26-12-2018-2018-1930': {
    ozet: 'Liste dışından görevlendirilen bilirkişi dosyayı elinde tutup rapor sunmadığı için bilirkişilik yapmaktan yasaklandı.',
    gerekce: 'Ankara Bölge Kurulu, dosyanın başvuru sonrasında da bilirkişide kaldığını ve rapor düzenlenmediği için yargılamanın uzadığını belirledi. Görevin zamanında yerine getirilmesine ilişkin temel ve etik ilkeleri değerlendirerek Kanunun 14/6. maddesini uyguladı.',
    soru: 'Hükümde yasaklamanın süresi kaç ay olarak belirlendi?',
    cevap: 'Hüküm fıkrasında ay veya yıl olarak bir süre belirtilmedi.',
  },
  'uyarma-19-12-2019-2019-1083': {
    ozet: 'Raporunda hukuki nitelendirme yaptığı için bilirkişiye uyarma yaptırımı uygulandı.',
    gerekce: 'Ankara Bölge Kurulu, bilirkişinin başka bir mahkeme dosyasını yorumladığını ve teknik görev sınırını aşarak hukuki değerlendirmeler yaptığını belirledi. Görevlendirmenin mevzuata uygun biçimde yapılmamasını ve raporun niteliğini dikkate alarak 6754 sayılı Kanunun 13. maddesi uyarınca uyarmayı yeterli gördü.',
    soru: 'Görevlendiren merci hukuki görüş istemişse bilirkişi nasıl hareket etmelidir?',
    cevap: 'Kurula göre bilirkişi, görevlendirmedeki sorunu mercie bildirmeli ve raporunu uzmanlık gerektiren teknik değerlendirmeyle sınırlamalıdır.',
  },
  'gecici-cikarma-11-10-2019-2019-336': {
    ozet: 'Raporu ek süre istemeden yaklaşık 15 ay geciktirdiği için bilirkişi 6 ay süreyle geçici olarak listeden ve sicilden çıkarıldı.',
    gerekce: 'Adana Bölge Kurulu, 20 gün verilen bilirkişinin raporu uzun bir gecikmeyle sunduğunu, eksik evrakı yazılı olarak bildirmediğini ve ek süre istemediğini tespit etti. Aynı konuda daha önce uyarma almasını da değerlendirdi. Kurul 6754 sayılı Kanunun 13. maddesi uyarınca altı aylık yaptırım uyguladı.',
    soru: 'Dosya eksikliği veya iş yoğunluğu karşısında bilirkişiden hangi adım bekleniyordu?',
    cevap: 'Kurul eksik evrakın yazılı bildirilmesi ve gerekiyorsa ek süre istenmesi gerektiğini belirtti. İş yoğunluğunu tek başına mazeret olarak kabul etmedi.',
  },
  'sicilden-cikarma-15-01-2021-2021-7': {
    ozet: 'Daha fazla dosya almak için mahkeme personeline aracılık talebinde bulunduğu değerlendirilen bilirkişi sicilden ve listeden çıkarıldı.',
    gerekce: 'Adana Bölge Kurulu, tutanağa yansıyan girişimi bilirkişiliğin gerektirdiği dürüstlük ve güvenle bağdaşmaz buldu. Davranışın niteliği nedeniyle 6754 sayılı Kanunun 13. maddesi kapsamında sicilden ve listeden çıkarma kararı verdi. Karar metni, savcılık soruşturmasının o tarihte sürdüğünü kaydediyor.',
    soru: 'Kurul, uyarma veya geçici çıkarma seçeneğini neden uygulamadı?',
    cevap: 'Kurul yaptırım seçerken etik ihlalin niteliğini ve bilirkişiye duyulan güven üzerindeki etkisini esas aldı.',
  },
  'yasaklanma-05-03-2020-2020-108': {
    ozet: 'Raporunu süresinde sunmayan ve ek süre istemeyen liste dışı bilirkişi hakkında bilirkişilik yapmaktan yasaklama kararı verildi.',
    gerekce: 'Ankara Bölge Kurulu, bilirkişinin 60 günlük süre içinde rapor sunmadığını, mazeret bildirmediğini ve ek süre istemediğini belirledi. Benzer bir gecikme nedeniyle önceki yaptırımı dikkate aldı. Kurul 6754 sayılı Kanunun 14/6. maddesine dayanarak yasaklama kararı verdi. Bu kararın hüküm fıkrasında bitiş süresi belirtilmedi.',
    soru: 'Karardaki altı ay ifadesi hangi yaptırıma ait?',
    cevap: 'Altı aylık süre, kurulun 13 Aralık 2019 tarihli önceki kararına aittir. 5 Mart 2020 tarihli hükümde süre yazmıyor.',
  },
};

export const incelenenKararlar = kayitlar.filter(k => Object.hasOwn(incelemeler, k.id))
  .map(k => ({ ...k, ...incelemeler[k.id] }));
export const kararYolu = (id: string) => arsivYolu + id + '/';
