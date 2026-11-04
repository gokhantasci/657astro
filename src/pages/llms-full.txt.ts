import type { APIRoute } from 'astro';
import { kategoriler, kategoriAraclari, aracHref } from '../lib/tools';
import { terimler, terimHref } from '../lib/sozluk';
import { adliKayitlar, adliHref } from '../lib/adlicevre';
import { ayarlar } from '../lib/settings';
import { donemAraligi, katsayi, tl, gun, buyukHarfDuzelt } from '../lib/bicim';
import hukukTarifeleri from '../data/hukuk-tarifeleri.json';
import tebligat from '../data/tebligat-ucretleri.json';

// llms.txt'nin genişletilmiş hâli (llmstxt.org): yanıt motorları için sitenin olgu dökümü.
// Bütün sayılar ortak veri kaynaklarından (ayarlar.json, hukuk-tarifeleri.json, tebligat-ucretleri.json) üretilir; elle yazılmaz.
export const GET: APIRoute = ({ site }) => {
  const mutlak = (href: string) => new URL(href, site).href;
  const duz = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const donemler = [...ayarlar.donemler].sort((a, b) => b.baslangic.localeCompare(a.baslangic));
  const harc = [...hukukTarifeleri.harclar].sort((a, b) => b.baslangic.localeCompare(a.baslangic))[0];
  const vekalet = [...hukukTarifeleri.vekalet].sort((a, b) => b.baslangic.localeCompare(a.baslangic))[0];
  const posta = (tebligat.tablolar as Record<string, { tutar: number; baslangic: string; bitis: string | null }[]>).posta?.find(t => t.bitis === null);
  const metin = [
    '# 657.com.tr · genişletilmiş olgu dökümü', '',
    `> ${ayarlar.site.aciklama} Sonuçlar bilgilendirme amaçlıdır; resmî işlemde mevzuat ve kurum kaydı esas alınır. Kısa özet: ${mutlak('/llms.txt')}`, '',
    `Hazırlayan: ${ayarlar.site.kurucu.ad} (${mutlak(ayarlar.site.kurucu.yol)}). İletişim: ${ayarlar.site.eposta}.`, '',
    '## Memur maaş katsayıları (bütün dönemler)', '',
    ...donemler.map(d => `- ${donemAraligi(d)}: aylık ${katsayi(d.memur_maas_aylik_katsayi)}, taban ${katsayi(d.taban_aylik_katsayi)}, yan ödeme ${katsayi(d.yan_odeme_katsayi)}. Kaynak: ${d.kaynak}`), '',
    '## Yargı harçları (güncel tarife)', '',
    `${gun(harc.baslangic)} – ${harc.bitis ? gun(harc.bitis) : 'halen'} (kaynak: ${harc.kaynak}):`,
    `- Maktu karar ve ilam harcı: ${tl(harc.maktu)}`,
    `- Başvurma harcı: asliye ${tl(harc.basvuruAsliye)}, sulh ${tl(harc.basvuruSulh)}`,
    `- İstinaf başvuru harcı: ${tl(harc.istinafBasvuru)}; temyiz başvuru harcı: ${tl(harc.temyizBasvuru)}`,
    `- Nispi karar ve ilam harcı: binde ${String(harc.nisbiBinde).replace('.', ',')}`, '',
    '## Avukatlık asgari ücret tarifesi (güncel maktu ücretler)', '',
    `${gun(vekalet.baslangic)} – ${vekalet.bitis ? gun(vekalet.bitis) : 'halen'} (kaynak: ${vekalet.kaynak}):`,
    ...vekalet.mahkemeler.map(m => `- ${m.ad}: ${tl(m.maktu)}`), '',
    ...(posta ? ['## Tebligat ücreti', '', `- ${gun(posta.baslangic)} tarihinden bu yana posta tebligat ücreti: ${tl(posta.tutar)} (${mutlak('/yargilamagideri/')})`, ''] : []),
    '## Araçlar', '',
    ...kategoriler.flatMap(k => [`### ${k.title}`, '', ...kategoriAraclari(k.id).filter(t => aracHref(t)).map(t => `- [${t.title}](${mutlak(aracHref(t)!)}): ${t.description}`), '']),
    '## Hukuk sözlüğü', '',
    ...terimler.map(t => `- [${buyukHarfDuzelt(t.terim)}](${mutlak(terimHref(t))}): ${duz(t.anlam)}`), '',
    '## Adliye yargı çevreleri', '',
    ...adliKayitlar.map(k => `- [${k.baslik}](${mutlak(adliHref(k))}): ${duz(k.ozet)}`), '',
  ].join('\n');
  return new Response(metin, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
