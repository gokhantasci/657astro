// Yıllık veri dosyaları (vergi.json, hukuk-tarifeleri.json, yolluk.json, cmk-tarifeleri.json)
// yeni yıla güncellendiğinde idempotent yıllık tarife/vergi/yolluk haberlerini otomatik üretir.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const yazilarDir = new URL('src/content/yazilar/', root);
await mkdir(yazilarDir, { recursive: true });

const okuJson = async (rel) => JSON.parse(await readFile(new URL(rel, root), 'utf8'));
const tl = (n) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
const sayi = (n) => n.toLocaleString('tr-TR');

let yazilan = 0;

async function yaz(slug, { title, description, date, kategori, kaynak, gorsel, gorselAlt }, body) {
  const url = new URL(`${slug}.md`, yazilarDir);
  let eski = '';
  try {
    eski = await readFile(url, 'utf8');
  } catch {}
  if (eski && !eski.includes('<!-- 657:yillik-otomatik -->')) {
    return; // Elle yazılmış makale varsa üzerine yazılmaz
  }
  const originalDate = eski.match(/^date: "([^"]+)"$/m)?.[1] ?? date;
  const front = {
    title,
    description,
    date: originalDate,
    ...(originalDate !== date ? { updated: date } : {}),
    kategori,
    kaynak,
    gorsel,
    gorselAlt,
  };
  const text =
    '---\n' +
    Object.entries(front)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join('\n') +
    '\n---\n<!-- 657:yillik-otomatik -->\n\n' +
    body.trimEnd() +
    '\n';
  if (eski !== text) await writeFile(url, text, 'utf8');
  yazilan++;
}

// 1. Gelir Vergisi Dilimleri ve Asgari Ücret İstisnası (vergi.json)
const vergi = await okuJson('src/data/vergi.json');
{
  const yil = vergi.yil;
  let onceki = 0;
  const dilimSatirlari = vergi.dilimler.map((d) => {
    const aralik =
      d.sinir === null
        ? `${sayi(onceki)} TL’den fazlası`
        : onceki === 0
          ? `${sayi(d.sinir)} TL’ye kadar`
          : `${sayi(onceki)} TL – ${sayi(d.sinir)} TL arası`;
    if (d.sinir !== null) onceki = d.sinir;
    return `| ${aralik} | %${d.oran} |`;
  });

  const body = [
    `**${yil} yılı** gelir vergisi tarifesi, brüt asgari ücret (**${tl(vergi.asgariBrut)}**) ve engellilik indirimi tutarları yürürlüğe girdi. Ücret gelirlerine uygulanan vergi dilimleri memur, sözleşmeli personel ve işçi net maaşlarını yıl içinde doğrudan etkilemektedir.`,
    '',
    `## ${yil} Yılı Ücret Gelirleri Gelir Vergisi Dilimleri`,
    '',
    '| Yıllık Kümülatif Matrah Dilimi | Vergi Oranı |',
    '|---|---:|',
    ...dilimSatirlari,
    '',
    `## ${yil} Yılı Engellilik İndirimi ve Diğer Göstergeler`,
    '',
    `- **Brüt Asgari Ücret:** ${tl(vergi.asgariBrut)}`,
    `- **Damga Vergisi Oranı:** Binde ${vergi.damgaOrani.toLocaleString('tr-TR')}`,
    `- **1. Derece Engellilik İndirimi:** ${tl(vergi.engellilikIndirimleri[1] ?? 0)}`,
    `- **2. Derece Engellilik İndirimi:** ${tl(vergi.engellilikIndirimleri[2] ?? 0)}`,
    `- **3. Derece Engellilik İndirimi:** ${tl(vergi.engellilikIndirimleri[3] ?? 0)}`,
    '',
    '## İlgili 657.com.tr Hesaplama Araçları',
    '',
    '- [Asgari Ücret İstisna Oranları](/asgari-ucret-istisna-oranlari/)',
    '- [Memur Maaş Hesaplama Robotu](/memur-maas-hesaplama/)',
    '- [Brütten Nete ve Netten Brüte Hesaplama](/brutten-nete-hesaplama/)',
  ].join('\n');

  await yaz(
    `${yil}-gelir-vergisi-dilimleri-ve-asgari-ucret-istisnasi`,
    {
      title: `${yil} Gelir Vergisi Dilimleri, Brüt Asgari Ücret ve Engellilik İndirimi Tutarları`,
      description: `${yil} yılı ücret gelirleri vergi dilimleri, ${tl(vergi.asgariBrut)} brüt asgari ücret ve 1-2-3. derece engellilik indirimi tablosu.`,
      date: `${yil}-01-01`,
      kategori: ['Ekonomi', 'Maaş', 'Haberler'],
      kaynak: vergi.kaynak?.[0] ?? 'https://gib.gov.tr/',
      gorsel: './gorseller/kapak-tarifeler.jpg',
      gorselAlt: `${yil} yılı gelir vergisi dilimleri ve vergi tarifesi kapak görseli`,
    },
    body
  );
}

// 2. Yargı Harçları (hukuk-tarifeleri.json)
const hukukTarifeleri = await okuJson('src/data/hukuk-tarifeleri.json');
{
  const sirali = [...hukukTarifeleri.harclar].sort((a, b) => b.baslangic.localeCompare(a.baslangic));
  const guncel = sirali[0];
  const onceki = sirali[1];
  const yil = Number(guncel.baslangic.slice(0, 4));
  const satir = (ad, simdi, eskiVal) =>
    `| ${ad} | ${eskiVal != null ? tl(eskiVal) : '—'} | **${tl(simdi)}** |`;

  const body = [
    `492 sayılı Harçlar Kanunu uyarınca **${yil} yılı** yargı harçları (${guncel.baslangic} – ${guncel.bitis}) yürürlüğe girdi. Başvuru, maktu karar, istinaf ve temyiz harçlarındaki güncel tutarlar aşağıdaki tabloda özetlenmiştir.`,
    '',
    `## ${yil} Yılı Yargı Harçları Karşılaştırma Tablosu`,
    '',
    `| Harç Kalemi | ${onceki ? onceki.baslangic.slice(0, 4) : 'Önceki Dönem'} | ${yil} Güncel |`,
    '|---|---:|---:|',
    satir('Asliye / İdare Mahkemesi Başvuru Harcı', guncel.basvuruAsliye, onceki?.basvuruAsliye),
    satir('Sulh Mahkemesi Başvuru Harcı', guncel.basvuruSulh, onceki?.basvuruSulh),
    satir('Maktu Karar ve İlam Harcı', guncel.maktu, onceki?.maktu),
    satir('İstinaf Kanun Yolu Başvuru Harcı', guncel.istinafBasvuru, onceki?.istinafBasvuru),
    satir('Temyiz Kanun Yolu Başvuru Harcı', guncel.temyizBasvuru, onceki?.temyizBasvuru),
    satir('Temyiz Maktu Karar Harcı', guncel.temyizMaktu, onceki?.temyizMaktu),
    `| Nispi Karar ve İlam Harcı Oranı | Binde ${onceki?.nisbiBinde ?? guncel.nisbiBinde} | **Binde ${guncel.nisbiBinde}** |`,
    `| Nafaka Nispi Harç Oranı | Binde ${onceki?.nafakaBinde ?? guncel.nafakaBinde} | **Binde ${guncel.nafakaBinde}** |`,
    '',
    '## İlgili 657.com.tr Hesaplama Araçları',
    '',
    '- [Dava Açma Masrafları Hesaplama](/dava-acma-masraflari/)',
    '- [İstinaf ve Temyiz Harcı Hesaplama](/istinaf-temyiz-harci-hesaplama/)',
    '- [Islah Harcı Hesaplama](/islah-harci-hesaplama/)',
    '- [Yargılama Gideri Hesaplama](/yargilamagideri/)',
  ].join('\n');

  await yaz(
    `${yil}-yargi-harclari-basvuru-istinaf-ve-temyiz-harclari`,
    {
      title: `${yil} Yargı Harçları: Dava Başvuru, Maktu, İstinaf ve Temyiz Harcı Tablosu`,
      description: `${yil} yılı 492 sayılı Harçlar Kanunu yargı harçları: Asliye ve Sulh başvuru, maktu karar, istinaf ve temyiz harçları karşılaştırması.`,
      date: guncel.baslangic,
      kategori: ['Tarifeler', 'Hukuk', 'Haberler'],
      kaynak: guncel.kaynak,
      gorsel: './gorseller/kapak-tarifeler.jpg',
      gorselAlt: `${yil} yılı yargı harçları ve mahkeme tarifelerini temsil eden 657.com.tr kapak görseli`,
    },
    body
  );
}

// 3. Harcırah ve Yolluk Gündelikleri (yolluk.json)
const yolluk = await okuJson('src/data/yolluk.json');
{
  const yil = yolluk.yil;
  const body = [
    `${yil} Yılı Merkezi Yönetim Bütçe Kanunu’na bağlı **H-Cetveli** uyarınca kamu personelinin yurt içi geçici ve sürekli görev yolluklarında esas alınan gündelik tutarları belirlendi.`,
    '',
    `## ${yil} Yılı H-Cetveli Yurt İçi Gündelik Tutarları`,
    '',
    '| Kadro / Ek Gösterge Grubu | Günlük Gündelik |',
    '|---|---:|',
    ...yolluk.gundelikler.map((g) => `| ${g.ad} | **${tl(g.tutar)}** |`),
    '',
    '## Konaklama Çarpanları',
    '',
    `- İlk 10 gün için gündeliğin **${yolluk.konaklama[0]?.carpan ?? 1.6} katına** kadar konaklama gideri ödenir.`,
    '- 11–90. günler arası gündeliğin **%50’si**, takip eden 90 gün için **%40’ı** esas alınır.',
    '',
    '## İlgili 657.com.tr Hesaplama Araçları',
    '',
    '- [Geçici Görev Yolluğu Hesaplama](/gecici-gorev-yollugu-hesaplama/)',
    '- [Sürekli Görev Yolluğu Hesaplama](/surekli-gorev-yollugu/)',
    '- [Türkiye Kamu Misafirhaneleri Haritası](/kamu-misafirhaneleri/)',
  ].join('\n');

  await yaz(
    `${yil}-harcirah-ve-yolluk-gundelikleri-h-cetveli`,
    {
      title: `${yil} Harcırah ve Yolluk Gündelikleri (H-Cetveli): Geçici ve Sürekli Görev Tutarları`,
      description: `${yil} yılı H-Cetveli memur yurt içi gündelik tutarları, konaklama tavanları ve geçici/sürekli görev yolluğu hesaplama araçları.`,
      date: `${yil}-01-01`,
      kategori: ['Maaş', 'Tarifeler', 'Haberler'],
      kaynak: yolluk.kaynak,
      gorsel: './gorseller/kapak-tarifeler.jpg',
      gorselAlt: `${yil} yılı harcırah ve yolluk gündelikleri H-Cetveli kapak görseli`,
    },
    body
  );
}

// 4. CMK Müdafi ve Vekil Ücret Tarifesi (cmk-tarifeleri.json)
const cmkList = await okuJson('src/data/cmk-tarifeleri.json');
{
  const sirali = [...cmkList].sort((a, b) => b.yil - a.yil);
  const guncel = sirali[0];
  const onceki = sirali[1];
  const kalemler = [
    'Soruşturma evresi takibi',
    'Sulh Ceza Hâkimliği takibi',
    'Asliye Ceza Mahkemesi takibi',
    'Seri muhakeme usulü takibi',
    'Ağır Ceza Mahkemesi takibi',
    'Çocuk Mahkemesi takibi',
    'Çocuk Ağır Ceza Mahkemesi takibi',
    'İcra Ceza / Fikri ve Sınai Haklar Ceza',
    'Bölge Adliye Mahkemesi (İstinaf) duruşmalı',
    'Yargıtay duruşmalı işler',
  ];

  const body = [
    `Ceza Muhakemesi Kanunu (CMK) gereğince görevlendirilen müdafi ve vekillere ödenecek **${guncel.yil} yılı CMK ücret tarifesi** yürürlüğe girdi.`,
    '',
    `## ${guncel.yil} Yılı CMK Ücret Tarifesi Karşılaştırması`,
    '',
    `| Görevlendirme Aşaması | ${onceki ? onceki.yil : 'Önceki Yıl'} | ${guncel.yil} Güncel |`,
    '|---|---:|---:|',
    ...kalemler.map(
      (ad, i) =>
        `| ${ad} | ${onceki?.tutarlar?.[i] != null ? tl(onceki.tutarlar[i]) : '—'} | **${tl(guncel.tutarlar[i])}** |`
    ),
    '',
    '## İlgili 657.com.tr Araçları ve Tarifeler',
    '',
    '- [CMK Müdafi ve Vekil Ücret Tarifesi (Yıllar Karşılaştırması)](/cmk-avukatlik-asgari-ucret-tarifesi/)',
    '- [Avukatlık Asgari Ücret Tarifesi (AAÜT)](/avukatlik-asgari-ucret-tarifesi/)',
    '- [Nispi Vekâlet Ücreti Hesaplama](/nispi-vekalet-ucreti-hesaplama/)',
    '- [Serbest Meslek Makbuzu Hesaplama](/serbest-meslek-makbuzu-hesaplama/)',
  ].join('\n');

  await yaz(
    `${guncel.yil}-cmk-mudafi-ve-vekil-ucret-tarifesi`,
    {
      title: `${guncel.yil} CMK Müdafi ve Vekil Ücret Tarifesi: Soruşturma, Asliye ve Ağır Ceza Ücretleri`,
      description: `${guncel.yil} yılı CMK zorunlu müdafi ve vekil görevlendirme ücretleri ile önceki yıl karşılaştırma tablosu.`,
      date: `${guncel.yil}-01-01`,
      kategori: ['Tarifeler', 'Hukuk', 'Haberler'],
      kaynak: guncel.kaynak,
      gorsel: './gorseller/kapak-adalet-mevzuat.jpg',
      gorselAlt: `${guncel.yil} yılı CMK müdafi ve vekil ücret tarifesini temsil eden 657.com.tr kapak görseli`,
    },
    body
  );
}

console.log(`${yazilan} yıllık otomatik tarife/vergi/yolluk haberi hazır.`);
