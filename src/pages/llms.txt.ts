import type { APIRoute } from 'astro';
import { kategoriler, kategoriAraclari, aracHref } from '../lib/tools';
import { terimler } from '../lib/sozluk';
import { sorular } from '../lib/mulakat';
import { adliKayitlar } from '../lib/adlicevre';
import { ayarlar } from '../lib/settings';
import { donemAraligi, katsayi } from '../lib/bicim';

// Yanıt motorları ve dil modelleri için sitenin düz metin özeti (llmstxt.org biçimi).
export const GET: APIRoute = ({ site }) => {
  const mutlak = (href: string) => new URL(href, site).href;
  const bolumler = kategoriler.map(k => [
    `## ${k.title}`, '', k.description, '',
    ...kategoriAraclari(k.id).filter(t => aracHref(t)).map(t => `- [${t.title}](${mutlak(aracHref(t)!)}): ${t.description}`),
  ].join('\n'));
  const sayi = (n: number) => n.toLocaleString('tr-TR');
  // Güncel katsayılar yanıt motorlarının sık sorulan sorusudur; ortak kayıttan okunur.
  const d = [...ayarlar.donemler].sort((a, b) => b.baslangic.localeCompare(a.baslangic))[0];
  const metin = [
    '# 657.com.tr', '',
    '> Kamu personeli ve adliye çalışanları için hesaplama ve kontrol araçları: memur maaşı, enflasyon farkı, yolluk, yargılama gideri, harç, kesinleşme ve teftiş kontrolleri. Sonuçlar bilgilendirme amaçlıdır; resmî işlemde mevzuat esas alınır.', '',
    `Araç dizini: ${mutlak('/araclar/')}`,
    `Hukuk sözlüğü (${sayi(terimler.length)} terim, her terim /kelime/<adres>/ sayfasında): ${mutlak('/hukuk-sozlugu/')}`,
    `Çıkmış mülakat soruları (${sayi(sorular.length)} soru ve cevap, her soru kök adresinde): ${mutlak('/cikmis-mulakat-sorulari/')}`, '',
    `Adliye yargı çevreleri (${sayi(adliKayitlar.length)} kayıt): ${mutlak('/adlicevre/')}`,
    `Unvanlara göre örnek maaşlar: ${mutlak('/unvan-maaslari/')}`, '',
    '## Güncel memur katsayıları', '',
    `${donemAraligi(d)} dönemi (kaynak: ${d.kaynak}):`,
    `- Memur aylık katsayısı: ${katsayi(d.memur_maas_aylik_katsayi)}`,
    `- Taban aylık katsayısı: ${katsayi(d.taban_aylik_katsayi)}`,
    `- Yan ödeme katsayısı: ${katsayi(d.yan_odeme_katsayi)}`, '',
    ...bolumler, '',
    '## Site', '',
    `- [İletişim](${mutlak('/iletisim/')}): ${ayarlar.site.eposta}`,
    `- [Terim ve soru önerin](${mutlak('/oneri/')})`,
    `- [Site haritası](${mutlak('/sitemap.xml')})`,
  ].join('\n');
  return new Response(`${metin}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
