// Katsayı dönemi (ayarlar.json) değiştikçe idempotent kadrolu, sözleşmeli ve emekli maaş haberlerini otomatik üretir.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { register } from 'node:module';

register(
  'data:text/javascript,' +
    encodeURIComponent(
      `import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export async function resolve(specifier, context, nextResolve) {
  try { return await nextResolve(specifier, context); } catch (err) {
    if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\\.[a-z0-9]+$/i.test(specifier) && context.parentURL) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return nextResolve(specifier + '.ts', context);
    }
    throw err;
  }
}`
    )
);

const { guncelYayin, unvanlar, maasHref } = await import('../src/lib/maas-yazilari.ts');
const { donem, maasKatsayilari } = await import('../src/lib/maas-veri.ts');
const {
  sozlesmeliYazilari,
  emekliYazilari,
  sozlesmeliOrnekleri,
  emekliOrnekleri,
} = await import('../src/lib/maas-statu-yayin.ts');

const root = new URL('../', import.meta.url);
const yazilarDir = new URL('src/content/yazilar/', root);
await mkdir(yazilarDir, { recursive: true });

const tl = (n) =>
  n == null
    ? '—'
    : n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';

const yil = guncelYayin.yil;
const ayNo = Number(donem.baslangic.slice(5, 7));
const donemSlug = ayNo === 1 ? 'ocak' : ayNo === 7 ? 'temmuz' : String(ayNo).padStart(2, '0');
const etiket = guncelYayin.etiket;
const tarih = donem.baslangic;
const k = maasKatsayilari(donem, 'maas');

let yazilan = 0;
async function yaz(slug, title, description, body) {
  const url = new URL(`${slug}.md`, yazilarDir);
  let eski = '';
  try {
    eski = await readFile(url, 'utf8');
  } catch {}
  if (eski && !eski.includes('<!-- 657:maas-otomatik -->')) {
    throw new Error(`Elle yazılmış içerik üzerine yazılmaz: ${slug}`);
  }
  const originalDate = eski.match(/^date: "([^"]+)"$/m)?.[1] ?? tarih;
  const front = {
    title,
    description,
    date: originalDate,
    ...(originalDate !== tarih ? { updated: tarih } : {}),
    kategori: ['Maaş', 'Haberler'],
    kaynak: donem.kaynak,
    gorsel: './gorseller/kapak-maas.jpg',
    gorselAlt: 'Kamu personeli maaş katsayıları ve bordro hesaplamalarını temsil eden 657.com.tr kapak görseli',
  };
  const text =
    '---\n' +
    Object.entries(front)
      .map(([key, val]) => `${key}: ${JSON.stringify(val)}`)
      .join('\n') +
    '\n---\n<!-- 657:maas-otomatik -->\n\n' +
    body.trimEnd() +
    '\n';
  if (eski !== text) await writeFile(url, text, 'utf8');
  yazilan++;
}

const katsayiTablosu = [
  '## Dönem Katsayıları',
  '',
  '| Katsayı | Değer |',
  '|---|---:|',
  `| Memur Aylık Katsayısı | ${k.aylik.toFixed(6)} |`,
  `| Taban Aylık Katsayısı | ${k.taban.toFixed(6)} |`,
  `| Yan Ödeme Katsayısı | ${k.yanOdeme.toFixed(6)} |`,
  `| Yürürlük Dönemi | ${donem.baslangic} – ${donem.bitis} |`,
].join('\n');

// 1. Kadrolu Memur Maaşları (308 ünvan — alfabetik)
const kadroluSatirlar = [...unvanlar]
  .sort((a, b) => a.ad.localeCompare(b.ad, 'tr-TR'))
  .map((u) => {
    const kayit = guncelYayin.kayitlar.find((x) => x.unvanId === u.id);
    return { u, dusuk: kayit?.dusuk ?? null, yuksek: kayit?.yuksek ?? null };
  });
const hesaplananKadrolu = kadroluSatirlar.filter((x) => x.dusuk !== null && x.yuksek !== null).length;

const kadroluBody = [
  `**${etiket}** katsayılarına göre **${unvanlar.length} kadrolu memur ünvanı** için en düşük (bekâr, çocuksuz, yeni başlayan) ve en yüksek (30 yıl kıdemli, çalışmayan eş, iki çocuk, sendikalı) net maaş örnekleri otomatik olarak güncellendi (${hesaplananKadrolu} doğrulanmış ünvan).`,
  '',
  'Kendi derece, kademe, hizmet yılı ve aile bilgilerinize göre kesin bordronuzu [Memur Maaş Hesaplama Robotu](/memur-maas-hesaplama/) üzerinden hesaplayabilir; tüm dönem arşivine [Ünvan Maaşları](/unvan-maaslari/) dizininden ulaşabilirsiniz.',
  '',
  katsayiTablosu,
  '',
  `## ${etiket} Kadrolu Ünvan Maaşları (${unvanlar.length} Ünvan — Alfabetik)`,
  '',
  '| Ünvan | En Düşük Net Maaş | En Yüksek Net Maaş |',
  '|---|---:|---:|',
  ...kadroluSatirlar.map(
    ({ u, dusuk, yuksek }) =>
      `| [${u.ad}](${maasHref(u.id, yil)}) | ${dusuk === null ? 'Özel koşul' : tl(dusuk)} | ${yuksek === null ? 'Özel koşul' : tl(yuksek)} |`
  ),
  '',
  `## Diğer Statü Maaşları (${etiket})`,
  '',
  `- [${etiket} 4/B Sözleşmeli Personel Maaşları](/${yil}-${donemSlug}-sozlesmeli-personel-maaslari/)`,
  `- [${etiket} Emekli Memur Maaşları ve İkramiyeleri](/${yil}-${donemSlug}-emekli-memur-maaslari/)`,
].join('\n');

await yaz(
  `${yil}-${donemSlug}-kadrolu-memur-maaslari`,
  `${etiket} Kadrolu Memur Maaşları: ${unvanlar.length} Ünvan En Düşük ve En Yüksek Tablosu`,
  `${etiket} dönemi HMB katsayılarına göre ${unvanlar.length} kadrolu memur ünvanının en düşük ve en yüksek net maaş tablosu ve ünvan sayfaları.`,
  kadroluBody
);

// 2. 4/B Sözleşmeli Personel Maaşları (60 ünvan — alfabetik)
const sozSatirlar = sozlesmeliYazilari.map((s) => {
  const ornekler = sozlesmeliOrnekleri(s.id);
  const netler = ornekler.flatMap((v) => v.ornekler.map((o) => o.sonuc?.net).filter((n) => typeof n === 'number'));
  const minNet = netler.length ? Math.min(...netler) : null;
  const maxNet = netler.length ? Math.max(...netler) : null;
  return { s, minNet, maxNet };
});

const sozBody = [
  `**${etiket}** katsayılarına göre 657 sayılı Kanun'un 4/B maddesi kapsamındaki **${sozlesmeliYazilari.length} sözleşmeli personel ünvanı** için 0 yıl (en düşük) ve 25 yıl (en yüksek) net maaş örnekleri güncellendi.`,
  '',
  'Kendi sözleşme ücretiniz, hizmet yılınız ve aile bilgilerinize göre hesap yapmak için [Sözleşmeli Memur Maaş Hesaplama](/sozlesmeli-memur-maas-hesaplama/) aracını kullanabilirsiniz.',
  '',
  katsayiTablosu,
  '',
  `## ${etiket} 4/B Sözleşmeli Personel Maaşları (${sozlesmeliYazilari.length} Ünvan — Alfabetik)`,
  '',
  '| Sözleşmeli Ünvan | En Düşük Net (0 Yıl) | En Yüksek Net (25 Yıl) |',
  '|---|---:|---:|',
  ...sozSatirlar.map(({ s, minNet, maxNet }) => `| [${s.ad}](/${s.slug}/) | ${tl(minNet)} | ${tl(maxNet)} |`),
  '',
  `## Diğer Statü Maaşları (${etiket})`,
  '',
  `- [${etiket} Kadrolu Memur Maaşları](/${yil}-${donemSlug}-kadrolu-memur-maaslari/)`,
  `- [${etiket} Emekli Memur Maaşları ve İkramiyeleri](/${yil}-${donemSlug}-emekli-memur-maaslari/)`,
].join('\n');

await yaz(
  `${yil}-${donemSlug}-sozlesmeli-personel-maaslari`,
  `${etiket} 4/B Sözleşmeli Personel Maaşları: ${sozlesmeliYazilari.length} Ünvan En Düşük ve En Yüksek Tablosu`,
  `${etiket} dönemi katsayılarına göre ${sozlesmeliYazilari.length} adet 4/B sözleşmeli personel ünvanının 0 yıl en düşük ve 25 yıl en yüksek net maaş tablosu.`,
  sozBody
);

// 3. Emekli Memur Maaşları ve İkramiyeleri (308 ünvan — alfabetik)
const emekliSatirlar = emekliYazilari
  .map((e) => {
    const ornekler = emekliOrnekleri(e.unvanId);
    const y25 = ornekler.find((o) => o.girdi.hizmetYili === 25)?.sonuc ?? null;
    const y30 = ornekler.find((o) => o.girdi.hizmetYili === 30)?.sonuc ?? null;
    return { e, y25, y30 };
  })
  .filter((x) => x.y25 !== null && x.y30 !== null);

const emekliBody = [
  `**${etiket}** katsayılarına göre 5434 sayılı Kanun kapsamındaki **${emekliSatirlar.length} memur ünvanı** için 25 yıl ve 30 yıl hizmet üzerinden emekli aylığı ve emekli ikramiyesi örnekleri güncellendi.`,
  '',
  'Kendi kadro dereceniz, emekliliğe esas dereceniz ve hizmet sürenizle hesaplama yapmak için [Emekli Memur Maaş Hesaplama](/emekli-memur-maas-hesaplama/) aracını kullanabilirsiniz.',
  '',
  katsayiTablosu,
  '',
  `## ${etiket} Emekli Memur Maaşları ve İkramiyeleri (${emekliSatirlar.length} Ünvan — Alfabetik)`,
  '',
  '| Ünvan | 25 Yıl Aylık | 25 Yıl İkramiye | 30 Yıl Aylık | 30 Yıl İkramiye |',
  '|---|---:|---:|---:|---:|',
  ...emekliSatirlar.map(
    ({ e, y25, y30 }) =>
      `| [${e.ad}](/${e.slug}/) | ${tl(y25.net)} | ${tl(y25.ikramiye)} | ${tl(y30.net)} | ${tl(y30.ikramiye)} |`
  ),
  '',
  `## Diğer Statü Maaşları (${etiket})`,
  '',
  `- [${etiket} Kadrolu Memur Maaşları](/${yil}-${donemSlug}-kadrolu-memur-maaslari/)`,
  `- [${etiket} 4/B Sözleşmeli Personel Maaşları](/${yil}-${donemSlug}-sozlesmeli-personel-maaslari/)`,
].join('\n');

await yaz(
  `${yil}-${donemSlug}-emekli-memur-maaslari`,
  `${etiket} Emekli Memur Maaşları ve İkramiyeleri: ${emekliSatirlar.length} Ünvan 25 ve 30 Yıl Tablosu`,
  `${etiket} dönemi katsayılarına göre ${emekliSatirlar.length} memur ünvanının 25 yıl ve 30 yıl emekli aylığı ile emekli ikramiyesi tablosu.`,
  emekliBody
);

console.log(`${yazilan} otomatik dönem maaş haberi hazır (${etiket}: ${unvanlar.length} kadrolu, ${sozlesmeliYazilari.length} sözleşmeli, ${emekliSatirlar.length} emekli).`);
