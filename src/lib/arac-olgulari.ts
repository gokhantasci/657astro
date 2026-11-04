// Araç sayfaları için doğrudan yanıt cümlesi, resmî kaynak, sık sorulan sorular ve hesap adımları (yol haritası P1-3, P1-4, P1-6).
// Bütün sayılar ortak veriden gelir (ayarlar.json, hukuk-tarifeleri.json); hiçbir tutar elle yazılmaz.
// Cümle ve adımlar yalnız içeriği gerçekten o kurala dayanan araçlara verilir; uymayan araçta boş kalır.
import type { Arac } from './tools';
import { ayarlar } from './settings';
import { donemAraligi, katsayi, tl, gun } from './bicim';
import hukukTarifeleri from '../data/hukuk-tarifeleri.json';
import kidem from '../data/kidem-tavanlari.json';
import tufe from '../data/tufe-12-ay-ortalama.json';
import mali from '../data/mali-kurallar.json';
import tapu from '../data/tapu-tarifesi.json';
import yolluk from '../data/yolluk.json';
import thh from '../data/thh-bilirkisi.json';
import cmk from '../data/cmk-tarifeleri.json';
import kamu from '../data/kamu-kurallari.json';
import vergi from '../data/vergi.json';
import isci from '../data/isci-kurallari.json';
import iflas from '../data/iflas-idaresi.json';

export interface AracOlgusu { cumle: string; kaynak?: { ad: string; url: string }; sss: { soru: string; cevap: string }[]; adimlar: string[] }

const son = <T extends { baslangic: string }>(l: T[]) => [...l].sort((a, b) => b.baslangic.localeCompare(a.baslangic))[0];
// Karar ve ilam harcı, başvurma harcı ya da avukatlık ücreti hesaplayan araçlar.
const HARC_ARACLARI = new Set(['yargilama-gideri', 'hmk-yargilama', 'gider-paylasim', 'dava-acma', 'nispi-vekalet', 'istinaf-temyiz-harci', 'islah-harci', 'aaut-tarife',
  'hukuk-tam-kabul', 'hukuk-kismen-kabul', 'hukuk-red', 'hukuk-husumet', 'hukuk-acilmamis', 'hukuk-feragat', 'hukuk-sulh', 'hukuk-davayi-kabul', 'hukuk-nafaka-tam', 'hukuk-nafaka-kismen',
  'hukuk-maddi-tazminat', 'hukuk-manevi-tazminat', 'hukuk-paylasim']);
const CMK = { ad: '5271 sayılı Ceza Muhakemesi Kanunu', url: 'https://www.mevzuat.gov.tr/mevzuatmetin/1.5.5271.pdf' };

// Memur aylık katsayısıyla hesaplanan maaş araçları; diğer maaş araçları kendi verisine dayanır.
const KATSAYI_ARACLARI = new Set(['memur-maas', 'sozlesmeli-maas', 'emekli-maas', 'asker-emekli', 'enflasyon-farki', 'muhtar', 'belediye-baskani', 'ek-ders', 'ek-ders-saat', 'akademik-ek-ders', 'ucretli-ogretmen']);
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const yuzde = (n: number) => `%${String(n).replace('.', ',')}`;
const MEVZUAT = (no: string, ad: string) => ({ ad, url: `https://www.mevzuat.gov.tr/mevzuatmetin/1.5.${no}.pdf` });

// Teftiş araçlarının dayandığı hüküm (P1-6). Yalnız kanunda açıkça yer alan kural yazılır; teftiş ölçütü olan süreler kanun hükmü gibi gösterilmez.
const TEFTIS_KURULU = { ad: 'Adalet Bakanlığı Teftiş Kurulu Başkanlığı', url: 'https://teftis.adalet.gov.tr/' };
const TEFTIS_DEFTER = { cumle: 'Araç, kayıtları yazı işleri denetiminde kullanılan ölçütlere göre listeler ve karşılaştırır; tespit ve değerlendirme denetimi yapana aittir.', kaynak: TEFTIS_KURULU };
const TEFTIS: Record<string, { cumle: string; kaynak: { ad: string; url: string } }> = {
  'iddianame': { cumle: 'Mahkeme iddianameyi, verildiği tarihten itibaren on beş gün içinde inceler; bu süre içinde iade edilmeyen iddianame kabul edilmiş olur (CMK 174–175). Araç değerlendirmenin bu sürede yapılıp yapılmadığını kontrol eder.', kaynak: CMK },
  'tensip': { cumle: 'İddianamenin kabulünden sonra duruşma hazırlığı yapılır (CMK 175 ve devamı). Araç tensip zaptının düzenlenme süresini teftiş ölçütüne göre kontrol eder.', kaynak: CMK },
  'gerekceli-karar': { cumle: 'Gerekçesi açıklanmayan hükmün gerekçesi, hükmün açıklanmasından itibaren on beş gün içinde yazılarak dosyaya konur (CMK 232/2). Araç gerekçeli kararın yazılma süresini kontrol eder.', kaynak: CMK },
  'byu': { cumle: 'Basit yargılama usulü CMK 251 ve 252. maddelerde düzenlenir. Araç bu usulde yapılan işlemlerin sürelerini kontrol eder.', kaynak: CMK },
  'byu-dosyalar': { cumle: 'Basit yargılama usulü CMK 251 ve 252. maddelerde düzenlenir. Araç bu usulün uygulandığı dosyaları listeler.', kaynak: CMK },
  'kanun-yolu': { cumle: 'İstinaf ve temyiz kanun yolları CMK 272 ve devamı maddelerde düzenlenir. Araç kanun yoluna başvurulan dosyaların üst mahkemeye gönderilme sürelerini kontrol eder.', kaynak: CMK },
  'kesinlestirme': { cumle: 'Ceza mahkemelerinden verilen hükümler kesinleşmedikçe infaz olunamaz (5275 sayılı Kanun 4). Araç kesinleşen kararların infaza verilme sürelerini kontrol eder.', kaynak: MEVZUAT('5275', '5275 sayılı Ceza ve Güvenlik Tedbirlerinin İnfazı Hakkında Kanun') },
  'kesinlesme-zamani': { cumle: 'Ceza mahkemelerinden verilen hükümler kesinleşmedikçe infaz olunamaz (5275 sayılı Kanun 4). Araç kesinleşme işlemlerinin zamanında yapılıp yapılmadığını kontrol eder.', kaynak: MEVZUAT('5275', '5275 sayılı Ceza ve Güvenlik Tedbirlerinin İnfazı Hakkında Kanun') },
  'terfi-cetveli': { cumle: '657 sayılı Kanunun 64. maddesine göre memurlar bulundukları derecede her yıl bir kademe ilerler; derece yükselmesi için kanundaki koşullar aranır. Araç personelin ilerlemesini cetvel olarak çıkarır.', kaynak: MEVZUAT('657', '657 sayılı Devlet Memurları Kanunu') },
  'harc-tahsil': { cumle: 'Yargı harçları 492 sayılı Harçlar Kanunu ve ekli tarifelerine göre alınır. Araç alınması gereken harçların tahsil edilip edilmediğini kontrol eder.', kaynak: MEVZUAT('492', '492 sayılı Harçlar Kanunu') },
  'gider-kontrolu': { cumle: 'Yargılama giderleri hukuk davalarında 6100 sayılı HMK 323 ve devamı, ceza davalarında 5271 sayılı CMK 324 ve devamı maddelerinde düzenlenir. Araç tahsilat, gider, iade ve bakiyeyi dosya bazında karşılaştırır.', kaynak: MEVZUAT('6100', '6100 sayılı Hukuk Muhakemeleri Kanunu') },
  'hedef-sure': { cumle: 'Hedef süreler, dava türlerine göre Hâkimler ve Savcılar Kurulunun belirlediği yargısal hedef sürelerdir. Araç dosyaların hedef süreyi aşıp aşmadığını gösterir.', kaynak: { ad: 'Hâkimler ve Savcılar Kurulu', url: 'https://www.hsk.gov.tr/' } },
  'karar-defteri': TEFTIS_DEFTER, 'istinaf-defteri': TEFTIS_DEFTER, 'kalem-denetimi': TEFTIS_DEFTER, 'durusma-kacagi': TEFTIS_DEFTER, 'json-robot': TEFTIS_DEFTER,
};

/** Kendi verisine ya da kanun maddesine dayanan tekil araçlar. */
function ozelOlgu(arac: Arac): AracOlgusu | null {
  switch (arac.id) {
    case 'kidem-ihbar': {
      const t = son(kidem.tavanlar);
      return {
        cumle: `${gun(t.baslangic)} – ${gun(t.bitis)} döneminde kıdem tazminatı tavanı ${tl(t.tutar)}; bir yıllık kıdem için ödenecek brüt tutar bu tavanı aşamaz. Kıdem tazminatından yalnız damga vergisi kesilir.`,
        kaynak: { ad: 'Hazine ve Maliye Bakanlığı genelgesi (kıdem tavanı)', url: t.kaynak },
        sss: [{ soru: 'Kıdem tazminatı tavanı ne kadar?', cevap: `${gun(t.baslangic)} – ${gun(t.bitis)} döneminde ${tl(t.tutar)}. Tavan, en yüksek devlet memuruna ödenen emeklilik ikramiyesine bağlıdır ve her altı ayda bir güncellenir.` }],
        adimlar: ['İşe giriş ve çıkış tarihini ve son brüt ücreti girin.', 'Her tam yıl için 30 günlük brüt ücret, artan süre için orantılı tutar hesaplanır.', `Bir yıllık tutar ${tl(t.tutar)} tavanını aşamaz.`, 'Kıdem tazminatından damga vergisi, ihbar tazminatından gelir ve damga vergisi kesilerek net tutar bulunur.'],
      };
    }
    case 'kira-artis': {
      const ay = Object.keys(tufe.aylar).sort().at(-1)!;
      const [y, m] = ay.split('-').map(Number);
      const o = (tufe.aylar as Record<string, number>)[ay];
      return {
        cumle: `${AYLAR[m - 1]} ${y} itibarıyla TÜFE on iki aylık ortalaması ${yuzde(o)}; konut ve çatılı iş yeri kiralarında yıllık artış bu oranı aşamaz (TBK 344).`,
        kaynak: { ad: 'TÜİK tüketici fiyat endeksi bülteni', url: tufe.kaynak },
        sss: [{ soru: 'Kira artışında hangi oran uygulanır?', cevap: `Kira döneminin yenilendiği aydan önceki ayın TÜFE on iki aylık ortalaması üst sınırdır. ${AYLAR[m - 1]} ${y} için bu oran ${yuzde(o)}'dir.` }],
        adimlar: ['Mevcut kira bedelini ve kira döneminin yenilendiği ayı girin.', 'Araç, yenileme ayından önceki ayın TÜFE on iki aylık ortalamasını alır.', 'Yeni kira = mevcut kira × (1 + oran); sözleşmede daha düşük oran varsa o uygulanır.'],
      };
    }
    case 'faiz': {
      const f = mali.faiz, tcmb = son(f.tcmb), ttk = son(f.ttk);
      return {
        cumle: `${gun(tcmb.baslangic)} tarihinden bu yana TCMB reeskont faizi ${yuzde(tcmb.reeskont)}, avans faizi ${yuzde(tcmb.avans)}; ${gun(ttk.baslangic)} tarihinden itibaren TTK 1530 ticari temerrüt faizi ${yuzde(ttk.oran)}. Faiz, oranın değiştiği tarihlerde dönemlere bölünerek hesaplanır.`,
        kaynak: { ad: 'TCMB reeskont ve avans faiz oranları', url: f.kaynaklar[0] },
        sss: [{ soru: 'Faiz oranı dönem içinde değişirse ne olur?', cevap: 'Hesap, oranın değiştiği tarihlerde dönemlere bölünür; her dönem kendi oranıyla, gün esasıyla hesaplanıp toplanır.' }],
        adimlar: ['Anapara, başlangıç ve bitiş tarihini ve faiz türünü seçin.', 'Araç süreyi oran değişikliği tarihlerinde dönemlere böler.', 'Her dönem için anapara × oran × gün / yıl esası (seçime göre 365 ya da 360) hesaplanır.', 'Dönem faizleri toplanarak toplam faiz ve döküm gösterilir.'],
      };
    }
    case 'tapu-harci': {
      const t = tapu.donemler.at(-1)!;
      return {
        cumle: `${t.yil} yılında tapu satış harcı alıcı ve satıcı için ayrı ayrı binde ${t.harc_binde}; en az harç ${tl(t.en_az_harc)}. Harç, beyan edilen satış bedeli ile emlak vergi değerinden yüksek olanı üzerinden alınır.`,
        kaynak: { ad: 'Tapu ve Kadastro Genel Müdürlüğü ücret tarifesi', url: t.kaynak },
        sss: [{ soru: 'Tapu harcı kim tarafından ödenir?', cevap: `Satışta alıcı ve satıcı ayrı ayrı binde ${t.harc_binde} harç öder; döner sermaye ücreti ayrıca alınır.` }],
        adimlar: ['Satış bedelini ve emlak vergi değerini girin.', 'Yüksek olan tutar harç matrahı olarak alınır.', `Alıcı ve satıcı payı ayrı ayrı binde ${t.harc_binde} üzerinden hesaplanır; en az harç ${tl(t.en_az_harc)}'dir.`, 'Döner sermaye ücreti tarife göstergesi ve yöresel katsayıyla eklenir.'],
      };
    }
    case 'smm': {
      const m = mali.smm;
      return {
        cumle: `Serbest meslek makbuzunda gelir vergisi stopajı ${yuzde(m.stopaj)}, KDV ${yuzde(m.kdv)} oranıyla hesaplanır; net tutar brüt ücretten stopaj düşülerek bulunur.`,
        kaynak: { ad: 'GİB elektronik serbest meslek makbuzu kılavuzu', url: m.kaynak },
        sss: [{ soru: 'Brütten nete nasıl geçilir?', cevap: `Net = brüt − brüt × ${yuzde(m.stopaj)} stopaj. Tahsil edilecek tutar = net + brüt × ${yuzde(m.kdv)} KDV; tevkifat varsa KDV'nin bir kısmını alıcı beyan eder.` }],
        adimlar: ['Brüt, net ya da tahsil edilecek tutardan birini girin.', `Brüt ücret üzerinden ${yuzde(m.stopaj)} gelir vergisi stopajı ve ${yuzde(m.kdv)} KDV hesaplanır.`, 'Varsa KDV tevkifatı düşülür; makbuzdaki brüt, stopaj, KDV ve tahsil edilecek tutar gösterilir.'],
      };
    }
    case 'gecici-gorev': case 'surekli-gorev': {
      const g = yolluk.gundelikler.map(x => x.tutar);
      return {
        cumle: `${yolluk.yil} yılı bütçe kanunu (H) cetveline göre yurt içi gündelikler derece ve ek göstergeye göre ${tl(Math.min(...g))} ile ${tl(Math.max(...g))} arasındadır.`,
        kaynak: { ad: `${yolluk.yil} yılı Merkezi Yönetim Bütçe Kanunu (H) cetveli`, url: yolluk.kaynak },
        sss: [{ soru: 'Gündelik tutarı neye göre belirlenir?', cevap: `Gündelik, memurun aylık derecesi ve ek göstergesine göre ${yolluk.yil} yılı bütçe kanununun (H) cetvelinden alınır; yolluk 6245 sayılı Harcırah Kanunu hükümlerine göre ödenir.` }],
        adimlar: arac.id === 'gecici-gorev'
          ? ['Derece ve ek göstergeyi, görev gün sayısını ve varsa konaklama ile yol giderlerini girin.', `Gündelik ${yolluk.yil} yılı (H) cetvelinden alınır.`, 'Gündelik görev süresine göre hesaplanır; konaklama ve yol giderleri eklenir.', 'Toplam yolluk ve kalem dökümü gösterilir.']
          : ['Derece ve ek göstergeyi, aile durumunu ve yol bilgisini girin.', `Gündelik ${yolluk.yil} yılı (H) cetvelinden alınır.`, 'Memur ve aile fertleri için yol gideri ile yer değiştirme gideri ayrı ayrı hesaplanır.', 'Kalemler toplanarak sürekli görev yolluğu gösterilir.'],
      };
    }
    case 'thh-bilirkisi': {
      const d = son(ayarlar.donemler);
      return {
        cumle: `Tüketici hakem heyeti bilirkişi ücreti, ürün grubu göstergesi ile memur aylık katsayısının (${donemAraligi(d)} için ${katsayi(d.memur_maas_aylik_katsayi)}) çarpımıdır; brüt ücretten binde ${String(thh.damga_binde).replace('.', ',')} damga vergisi ve ${yuzde(thh.gelir_vergisi_oran)} gelir vergisi kesilir.`,
        kaynak: MEVZUAT('6502', '6502 sayılı Tüketicinin Korunması Hakkında Kanun'),
        sss: [{ soru: 'Bilirkişi ücreti hangi katsayıyla hesaplanır?', cevap: `Ödemenin yapıldığı dönemdeki memur aylık katsayısıyla; ${donemAraligi(d)} için ${katsayi(d.memur_maas_aylik_katsayi)}. Katsayı her altı ayda bir değiştiği için aynı ürün grubunun ücreti de değişir.` }],
        adimlar: ['Ürün ya da hizmet grubunu seçin.', `Grubun göstergesi güncel aylık katsayıyla (${katsayi(d.memur_maas_aylik_katsayi)}) çarpılarak brüt ücret bulunur.`, 'Damga ve gelir vergisi düşülerek net ücret gösterilir.'],
      };
    }
    case 'miras-payi':
      return {
        cumle: "Sağ kalan eş, altsoyla birlikte mirasın 1/4'ünü, anne-baba zümresiyle 1/2'sini, büyük ana-baba zümresiyle 3/4'ünü alır; bunlar yoksa mirasın tamamı eşe kalır (TMK 499).",
        kaynak: MEVZUAT('4721', '4721 sayılı Türk Medeni Kanunu'),
        sss: [{ soru: 'Altsoy mirası nasıl paylaşır?', cevap: 'Çocuklar eşit pay alır; ölmüş çocuğun payı kendi altsoyuna geçer (TMK 495). Eşin payı ayrıldıktan sonra kalan kısım paylaştırılır.' }],
        adimlar: ['Sağ kalan eşi, çocukları ve ölmüş çocukların altsoyunu girin.', 'Mirasçılar zümre sistemine göre belirlenir: önce altsoy, yoksa anne-baba ve altsoyu, yoksa büyük ana-babalar.', 'Eşin payı birlikte bulunduğu zümreye göre ayrılır (TMK 499).', 'Kalan pay zümre içinde eşit bölünür; her mirasçının kesir ve tutar payı gösterilir.'],
      };
    case 'yillik-izin':
      return {
        cumle: 'İşçinin yıllık ücretli izni hizmet süresi 1–5 yıl (5 dahil) olanlarda 14, 5–15 yıl olanlarda 20, 15 yıl ve üzerinde 26 gündür; 18 ve daha küçük yaştaki ve 50 ve daha büyük yaştaki işçilerde 20 günden az olamaz (4857 sayılı İş Kanunu 53).',
        kaynak: MEVZUAT('4857', '4857 sayılı İş Kanunu'),
        sss: [{ soru: 'Hafta tatili ve resmî tatiller izin süresine sayılır mı?', cevap: 'Hayır. İzin süresine rastlayan ulusal bayram, hafta tatili ve genel tatil günleri yıllık izin süresinden sayılmaz (4857 sayılı İş Kanunu 56).' }],
        adimlar: ['İşe giriş tarihini ve doğum tarihini girin.', 'Kıdem yılına göre izin süresi 14, 20 ya da 26 gün olarak belirlenir.', 'Yaş koşulu varsa süre en az 20 güne tamamlanır.'],
      };
    case 'cmk-tarife': {
      const t = [...cmk].sort((a, b) => b.yil - a.yil)[0];
      return {
        cumle: `${t.yil} CMK ücret tarifesinde müdafi ve vekillere ödenecek ücretler görev türüne göre ${tl(Math.min(...t.tutarlar))} ile ${tl(Math.max(...t.tutarlar))} arasındadır; bu ücret karşı tarafa yükletilen AAÜT vekâlet ücretinden ayrıdır.`,
        kaynak: CMK,
        sss: [{ soru: 'CMK ücreti ile vekâlet ücreti aynı şey mi?', cevap: `Hayır. CMK görevlendirme ücreti, baro tarafından görevlendirilen müdafi ya da vekile ${t.yil} CMK ücret tarifesine göre ödenir; karşı tarafa yükletilen vekâlet ücreti ise avukatlık asgari ücret tarifesine göre belirlenir.` }],
        adimlar: ['Görevlendirmenin yılını seçin.', 'Görevin türünü (soruşturma evresi ya da mahkeme) bulun.', 'Tablodaki tutar o yıl ve görev için tarifedeki ücrettir; yıllar yan yana karşılaştırılır.'],
      };
    }
    case 'lojman': {
      const l = kamu.lojman;
      return {
        cumle: `Kamu konutu tahsis puanında hizmet yılı başına ${l.hizmetYil}, eş için ${l.es}, her çocuk için ${l.cocuk}, bakmakla yükümlü diğer aile bireyi için ${l.digerAile} puan verilir; daha önce kamu konutunda oturulan her yıl için ${Math.abs(l.oturmaYil)} puan düşülür.`,
        sss: [{ soru: 'Daha önce kamu konutunda oturmak puanı nasıl etkiler?', cevap: `Daha önce kamu konutunda oturulan her yıl için ${Math.abs(l.oturmaYil)} puan düşülür; hizmet yılı ve aile bireyleri ise puanı artırır.` }],
        adimlar: ['Hizmet yılını, aile durumunu ve daha önce kamu konutunda oturduğunuz süreyi girin.', 'Her bilgi puan cetvelindeki karşılığıyla puanlanır.', 'Artı ve eksi puanlar toplanarak toplam puan gösterilir.'],
      };
    }
    case 'ilksan':
      return {
        cumle: `İLKSAN emekli yardımı ödenen aidat toplamı, son aidat ve üyelik yılına bağlı tutar olmak üzere üç kalemden oluşur; yardım için en az ${kamu.ilksan.asgariAy} ay üyelik aranır.`,
        sss: [{ soru: 'İLKSAN emekli yardımı için en az ne kadar üyelik gerekir?', cevap: `Yardım için en az ${kamu.ilksan.asgariAy} ay (${kamu.ilksan.asgariAy / 12} yıl) üyelik aranır.` }],
        adimlar: ['Aidat toplamını, son aidatı ve üyelik süresini girin.', 'Üç kalem ayrı ayrı hesaplanır.', 'Kalemler toplanarak emekli yardımı gösterilir.'],
      };
    case 'hizmet-68b':
      return {
        cumle: '657 sayılı Kanunun 68/B maddesi için hizmet süreleri 360 gün bir yıl sayılarak toplanır; kamu, askerlik ve mezuniyet sonrası özel sektör hizmeti ayrı ayrı değerlendirilir.',
        kaynak: MEVZUAT('657', '657 sayılı Devlet Memurları Kanunu'),
        sss: [{ soru: 'Hizmet süresinde bir yıl kaç gün sayılır?', cevap: 'Hesapta 360 gün bir yıl, 30 gün bir ay sayılır; kamu, askerlik ve mezuniyet sonrası özel sektör süreleri gün olarak toplanıp yıl, ay ve güne çevrilir.' }],
        adimlar: ['Kamu, askerlik ve mezuniyet sonrası özel sektör hizmet sürelerini girin.', 'Her süre gün olarak toplanır ve 360 gün bir yıl sayılır.', 'Toplam süre yıl, ay ve gün olarak gösterilir.'],
      };
    case 'asgari-ucret': {
      return {
        cumle: `${vergi.yil} yılında brüt asgari ücret ${tl(vergi.asgariBrut)}; ücretlilerin asgari ücrete isabet eden gelir vergisi ve damga vergisi istisnadır (GVK 23/18, DVK 9). İstisna, asgari ücretin kümülatif matrahı üzerinden aylara göre ayrıca hesaplanır.`,
        kaynak: { ad: 'Gelir İdaresi Başkanlığı 2026 ücret geliri duyurusu', url: vergi.kaynak[1] },
        sss: [{ soru: `${vergi.yil} asgari ücret gelir vergisi istisnası neden her ay farklı?`, cevap: `İstisna, asgari ücretin aylık matrahının (brüt − %${vergi.isciPrimOrani} işçi primi) yıl içindeki kümülatif toplamına göre hesaplanır. Kümülatif matrah üst vergi dilimine geçtiği aylarda istisna tutarı artar.` }],
        adimlar: [`Brüt asgari ücretten %${vergi.isciPrimOrani} işçi primi düşülerek aylık matrah bulunur.`, 'Matrahlar aylara göre kümülatif toplanır ve gelir vergisi tarifesi uygulanır.', `Damga vergisi istisnası brüt ücretin binde ${String(vergi.damgaOrani).replace('.', ',')}'idir.`, 'Her ay için gelir ve damga vergisi istisna tutarı gösterilir.'],
      };
    }
    case 'isci-4d':
      return {
        cumle: `4/D işçi bordrosunda işçi payı SGK primi %${isci.sgkCalisan}, işsizlik sigortası primi %${isci.issizlikCalisan}'dir; gelir ve damga vergisinde asgari ücret istisnası uygulanır. Ücret, yardım, tediye ve ikramiye toplu iş sözleşmesindeki tutarlarla girilir.`,
        kaynak: { ad: 'SGK prime esas kazanç tutarları', url: isci.kaynaklar[3] },
        sss: [{ soru: 'Yemek yardımında istisna ne kadar?', cevap: `Nakit yemek yardımının günlük ${tl(isci.yemekSgkGunlukIstisna)} kısmı SGK priminden, ${tl(isci.yemekVergiGunlukIstisna)} kısmı gelir vergisinden istisnadır; aşan kısım ücrete eklenir.` }],
        adimlar: ['Günlük ücreti, gün sayısını, sosyal yardımları ve varsa tediye ile ikramiyeyi girin.', `Prime esas kazançtan %${isci.sgkCalisan} SGK ve %${isci.issizlikCalisan} işsizlik işçi payı düşülür.`, 'Gelir vergisi kümülatif matraha göre hesaplanır, asgari ücret istisnası düşülür.', 'Sendika aidatı ve diğer kesintiler düşülerek net ücret gösterilir.'],
      };
    case 'hukuk-kasa':
      return {
        cumle: 'Adliye kasa hesabında banka hesapları ve fiziki kasa toplamı, maliyeye aktarılacak tutar, stopaj ve damga vergisi gibi yükümlülüklerin toplamıyla karşılaştırılır; fark sıfır olmalıdır.',
        sss: [], adimlar: ['Banka hesap bakiyelerini ve fiziki kasa tutarını girin.', 'Maliyeye aktarılacak tutar, stopaj, damga vergisi ve diğer yükümlülükleri girin.', 'İki toplam arasındaki fark gösterilir; fark varsa kayıtlar yeniden kontrol edilir.'],
      };
    case 'iflas-idare-ucreti': {
      const t = son(iflas.tarifeler), ilk = t.dilimler[0], sonD = t.dilimler.at(-1)!;
      return {
        cumle: `${gun(t.baslangic)} tarihinden itibaren iflas idaresi ücreti, pay cetvelinde adi alacaklılara ödenecek toplam üzerinden ilk ${tl(ilk.miktar!)} için %${String(ilk.oran).replace('.', ',')} ile başlayıp en üst dilimde %${String(sonD.oran).replace('.', ',')}'e inen ${t.dilimler.length} kademeli oranla hesaplanır; icra mahkemesi bu tutarın bir katı fazlasına kadar ücret takdir edebilir.`,
        kaynak: { ad: t.resmiGazete, url: t.kaynak },
        sss: [{ soru: 'Rehinli alacak için iflas idaresine ek ücret ödenir mi?', cevap: `Rehinli alacağın paraya çevrilmesi için ek ücret ödenebilir; bu ücret, rehinli alacak üzerinden aynı oranlarla bulunan tutarın %${t.rehinliEkUcretAzamiYuzde}'ini geçemez.` }],
        adimlar: ['Pay cetvelinde adi alacaklılara ödenecek toplam tutarı girin.', 'Tutar tarifedeki dilimlere bölünür; her dilim kendi oranıyla çarpılır.', 'Dilim ücretleri toplanarak tarifeye göre ücret bulunur.', `Mahkemenin takdir edebileceği en yüksek tutar ve varsa rehinli alacak ek ücretinin üst sınırı (%${t.rehinliEkUcretAzamiYuzde}) gösterilir.`],
      };
    }
    case 'enflasyon-orani':
      return {
        cumle: 'Aylık enflasyon oranları toplanmaz, bileşik olarak çarpılır: dönem oranı = (1 + ay₁) × (1 + ay₂) × … − 1. Toplama yöntemi bileşik oranın altında kalır.',
        kaynak: { ad: 'TÜİK enflasyon ve fiyat istatistikleri', url: 'https://data.tuik.gov.tr/Kategori/GetKategori?p=enflasyon-ve-fiyat-106' },
        sss: [{ soru: 'Aylık enflasyon oranları neden toplanmaz?', cevap: 'Her ayın artışı bir önceki ayın artmış fiyatı üzerine gelir. Bu yüzden dönem oranı aylık oranların toplamıyla değil, (1 + oran) çarpanlarının çarpımıyla bulunur; toplama yöntemi gerçek artışın altında kalır.' }],
        adimlar: ['Aylık değişim oranlarını girin.', 'Her ay için (1 + oran) çarpanı hesaplanır.', 'Çarpanlar çarpılıp 1 çıkarılarak dönem oranı bulunur; toplamayla arasındaki fark gösterilir.'],
      };
  }
  return null;
}

export function aracOlgusu(arac: Arac): AracOlgusu | null {
  const ozel = ozelOlgu(arac);
  if (ozel) return ozel;
  if (arac.category === 'maas' && KATSAYI_ARACLARI.has(arac.id)) {
    const d = son(ayarlar.donemler);
    const kaynak = { ad: 'Hazine ve Maliye Bakanlığı mali ve sosyal haklar genelgesi', url: d.kaynak };
    return {
      cumle: `${donemAraligi(d)} döneminde memur maaş katsayıları: aylık katsayı ${katsayi(d.memur_maas_aylik_katsayi)}, taban aylık katsayısı ${katsayi(d.taban_aylik_katsayi)}, yan ödeme katsayısı ${katsayi(d.yan_odeme_katsayi)}. Hesap bu dönemin katsayılarıyla yapılır.`,
      kaynak,
      sss: [
        { soru: `${donemAraligi(d)} döneminde memur maaş katsayısı kaç?`, cevap: `Memur aylık katsayısı ${katsayi(d.memur_maas_aylik_katsayi)}, taban aylık katsayısı ${katsayi(d.taban_aylik_katsayi)}, yan ödeme katsayısı ${katsayi(d.yan_odeme_katsayi)}'dır. Kaynak: ${kaynak.ad}.` },
        { soru: 'Katsayılar nereden alınıyor?', cevap: 'Her altı aylık dönemde Hazine ve Maliye Bakanlığının yayımladığı mali ve sosyal haklar genelgesinden alınır. Önceki dönemler katsayı arşivinde (657.com.tr/memur-maas-katsayilari/) listelenir.' },
        { soru: 'Sonuç neden bordromdan farklı çıkabilir?', cevap: 'Bordroda işveren primleri gelir ve kesinti toplamına eklenebilir, gelir vergisi yıl içindeki kümülatif matraha göre değişir ve kuruma özgü ödemeler bulunabilir. Araç çalışana ait gelir ve kesintileri gösterir; kesin tutar için kurumunuzun bordrosu esas alınır.' },
      ],
      adimlar: [
        'Hesap dönemini ve hesaba esas bilgileri (unvan, derece/kademe, hizmet yılı, aile durumu gibi) girin.',
        `Araç, seçilen dönemin katsayılarını ortak kayıttan alır; ${donemAraligi(d)} için aylık katsayı ${katsayi(d.memur_maas_aylik_katsayi)}'dır.`,
        'Gösterge esaslı kalemler gösterge ile ilgili katsayının çarpımıyla, oran esaslı ödemeler kanun ve genelgedeki oranlarla hesaplanır.',
        'Varsa gelir vergisi, damga vergisi ve sosyal güvenlik kesintileri yürürlükteki tarife ve oranlarla düşülür.',
        'Net tutar ve kalem dökümü gösterilir; kesin tutar için kurumunuzun bordrosu esas alınır.',
      ],
    };
  }
  if (HARC_ARACLARI.has(arac.id)) {
    const h = son(hukukTarifeleri.harclar), v = son(hukukTarifeleri.vekalet);
    const asliye = v.mahkemeler.find(m => m.id === 'asliye');
    const binde = String(h.nisbiBinde).replace('.', ',');
    return {
      cumle: `${gun(h.baslangic)} – ${h.bitis ? gun(h.bitis) : 'halen'} döneminde maktu karar ve ilam harcı ${tl(h.maktu)}, başvurma harcı ${tl(h.basvuruAsliye)}, nispi karar ve ilam harcı binde ${binde}${asliye ? `; ${gun(v.baslangic)} tarihli avukatlık asgari ücret tarifesine göre asliye hukuk mahkemesinde maktu vekâlet ücreti ${tl(asliye.maktu)}` : ''}. Hesap karar ya da işlem tarihindeki tarifeyle yapılır.`,
      kaynak: { ad: '492 sayılı Harçlar Kanunu genel tebliği (GİB)', url: h.kaynak },
      sss: [
        { soru: 'Maktu karar ve ilam harcı ne kadar?', cevap: `${gun(h.baslangic)} tarihinden itibaren ${tl(h.maktu)}. Başvurma harcı asliye mahkemelerinde ${tl(h.basvuruAsliye)}, sulh mahkemelerinde ${tl(h.basvuruSulh)}'dir.` },
        { soru: 'Nispi karar ve ilam harcı nasıl hesaplanır?', cevap: `Dava değerinin binde ${binde}'i alınır; davanın açılışında peşin alınan harç (nispi harcın 1/${h.pesinPayda}'i) karar harcından düşülür.` },
        ...(asliye ? [{ soru: 'Asliye hukuk mahkemesinde maktu vekâlet ücreti ne kadar?', cevap: `${gun(v.baslangic)} tarihli avukatlık asgari ücret tarifesine göre ${tl(asliye.maktu)}. Para ile ölçülebilen davalarda nispi ücret hesaplanır; nispi ücret maktu ücretin altında kalamaz.` }] : []),
        { soru: 'Hangi tarifenin kullanılacağı nasıl belirlenir?', cevap: 'Harçta işlemin yapıldığı tarihteki tarife, vekâlet ücretinde karar tarihindeki avukatlık asgari ücret tarifesi uygulanır. Araçta tarih alanı bu seçimi yapar.' },
      ],
      adimlar: [
        'Karar ya da işlem tarihini seçin; araç o tarihte yürürlükteki harç ve avukatlık asgari ücret tarifesini kullanır.',
        'Dava değerini ve tarafların vekille temsil edilip edilmediğini girin.',
        `Para ile ölçülemeyen işlerde maktu harç (${tl(h.maktu)}), para ile ölçülenlerde dava değerinin binde ${binde}'i karar ve ilam harcı olarak hesaplanır.`,
        `Açılışta alınan peşin harç (nispi harcın 1/${h.pesinPayda}'i) ve ödenmiş diğer harçlar karar harcından düşülerek bakiye bulunur.`,
        'Vekâlet ücreti tarifenin nispi basamaklarıyla hesaplanır ve maktu ücretin altında kalmaz; sonuç ve döküm gösterilir.',
      ],
    };
  }
  if (arac.id === 'kesinlesme') {
    return {
      cumle: 'Ceza kararının kesinleşme tarihi, tebliğ ya da tefhim tarihine kanun yolu süresi eklenerek bulunur; süre adli tatilde biterse CMK 331/4, resmî tatilde biterse CMK 39/4 uyarınca uzar.',
      kaynak: CMK,
      sss: [
        { soru: 'Kesinleşme için tebliğ tarihi tek başına yeterli mi?', cevap: 'Hayır. Kanun yolu türü ve süresi, kararın yüzüne karşı açıklanıp açıklanmadığı ve tebliğ tarihi birlikte değerlendirilir.' },
        { soru: 'Süre tatile denk gelirse ne olur?', cevap: 'Adli tatilde biten süreler CMK 331/4 uyarınca adli tatilin bitiminden itibaren üç gün uzar; resmî tatil ve hafta sonuna denk gelen son gün CMK 39/4 uyarınca izleyen iş gününe geçer.' },
      ],
      adimlar: [
        'Tebliğ ya da tefhim tarihini ve kanun yolu süresini girin.',
        'Araç süreyi tebliğ tarihinin ertesi gününden başlatarak son günü bulur.',
        'Son gün hafta sonuna ya da resmî tatile denk gelirse izleyen iş gününe geçirilir (CMK 39/4).',
        'Süre adli tatilde bitiyorsa adli tatilin bitiminden itibaren üç gün uzatılır; tebliğ adli tatile denk gelmişse adli tatilin bittiği gün esas alınır (CMK 331/4).',
        'Kanun yoluna başvurulmamışsa kesinleşme tarihi süre bitiminin ertesi günü olarak gösterilir.',
      ],
    };
  }
  if (arac.category === 'teftis') {
    const t = TEFTIS[arac.id];
    return {
      cumle: t?.cumle ?? '', ...(t ? { kaynak: t.kaynak } : {}),
      sss: [
        { soru: 'Yüklediğim UYAP dosyası sunucuya gönderiliyor mu?', cevap: 'Hayır. Dosya tarayıcınızda okunur ve işlenir; sunucuya yüklenmez.' },
        { soru: 'Sonuç bir teftiş tespiti yerine geçer mi?', cevap: 'Hayır. Araç kayıtları ölçütlere göre listeler ve karşılaştırır; tespit ve değerlendirme müfettişe ya da denetimi yapan kişiye aittir.' },
      ],
      adimlar: [],
    };
  }
  return null;
}
