import kayitlar from '../data/bilirkisi-kararlari.json';

export const arsivYolu = '/bilirkisi-bolge-kurulu-kararlari/';
const kaynak = 'https://bilirkisilik.adalet.gov.tr/Home/SayfaDetay/';
export const kararGruplari = [
  { id: 'uyarma', ad: 'Uyarma', kaynak: kaynak + 'uyarma15012021024508' },
  { id: 'gecici-cikarma', ad: 'Geçici süreyle listeden çıkarma', kaynak: kaynak + 'gecici-sureyle-listeden-cikarma15012021024546' },
  { id: 'sicilden-cikarma', ad: 'Bilirkişilik sicilinden ve listesinden çıkarılma', kaynak: kaynak + 'bilirkisilik-sicilinden-ve-listesinden-cikarilma15012021024613' },
  { id: 'yasaklanma', ad: 'Bilirkişilik yapmaktan yasaklanma', kaynak: kaynak + 'bilirkisilik-yapmaktan-yasaklanma22012021035202' },
].map(grup => ({ ...grup, kararlar: kayitlar.filter(k => k.category === grup.id) }));

const incelemeler: Record<string, { ozet: string; gerekce: string; soru: string; cevap: string }> = {
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
