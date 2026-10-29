import { getCollection } from 'astro:content';
import { terimler, harfler, terimHref } from './sozluk';
import { sorular, soruHref, sayfaSayisi, sayfaHref } from './mulakat';
import { araclar } from './tools';
import { adliKayitlar, adliHref } from './adlicevre';
import { maasYazilari, maasYillari } from './maas-yazilari';

// Site haritası grupları. /sitemap.xml bunların dizinidir (Search Console'a bu adres verilir).
// Yalnızca bu sitede üretilen ve dizine eklenecek sayfalar girer; yönlendirme (noindex) sayfaları girmez.
export interface HaritaKaydi { loc: string; lastmod?: string }
const sabit = ['/', '/araclar/', '/yazilar/', '/unvan-maaslari/', '/hukuk-sozlugu/', '/cikmis-mulakat-sorulari/', '/adlicevre/',
  '/oneri/', '/iletisim/', '/657-com-tr-gizlilik-politikasi-ve-kvkk-aydinlatma-metni/', '/hizmet-sartlari-ve-kullanim-kosullari-2/'];

export const HARITA_GRUPLARI = ['sayfalar', 'yazilar', 'sozluk', 'mulakat', 'adlicevre', 'maas'] as const;
export type HaritaGrubu = (typeof HARITA_GRUPLARI)[number];

export async function haritaKayitlari(grup: HaritaGrubu): Promise<HaritaKaydi[]> {
  switch (grup) {
    case 'sayfalar': return [...new Set([...sabit, ...araclar.filter(t => t.tasindi && t.path).map(t => t.path!)])].map(loc => ({ loc }));
    case 'yazilar': return (await getCollection('yazilar', y => !y.data.taslak))
      .map(y => ({ loc: `/${y.id}/`, lastmod: (y.data.updated ?? y.data.date).toISOString().slice(0, 10) }));
    case 'sozluk': return [...harfler.map(h => ({ loc: `/hukuk-sozlugu/harf/${h.slug}/` })), ...terimler.map(t => ({ loc: terimHref(t), lastmod: t.tarih }))];
    case 'mulakat': return [...Array.from({ length: sayfaSayisi - 1 }, (_, i) => ({ loc: sayfaHref(i + 2) })), ...sorular.map(s => ({ loc: soruHref(s), lastmod: s.tarih }))];
    case 'adlicevre': return adliKayitlar.map(k => ({ loc: adliHref(k), lastmod: k.tarih }));
    case 'maas': return [...maasYillari.map(y => ({ loc: `/unvan-maaslari/${y}/` })), ...maasYazilari.map(k => ({ loc: `/${k.slug}/` }))];
  }
}
const xml = (govde: string) => new Response(`<?xml version="1.0" encoding="UTF-8"?>${govde}`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
export const haritaYaniti = (kayitlar: HaritaKaydi[], site: URL) => xml(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${
  kayitlar.map(k => `<url><loc>${new URL(k.loc, site).href}</loc>${k.lastmod ? `<lastmod>${k.lastmod}</lastmod>` : ''}</url>`).join('')}</urlset>`);
export const dizinYaniti = async (site: URL) => {
  const satirlar = await Promise.all(HARITA_GRUPLARI.map(async g => {
    const son = (await haritaKayitlari(g)).map(k => k.lastmod).filter(Boolean).sort().at(-1);
    return `<sitemap><loc>${new URL(`/sitemap-${g}.xml`, site).href}</loc>${son ? `<lastmod>${son}</lastmod>` : ''}</sitemap>`;
  }));
  return xml(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${satirlar.join('')}</sitemapindex>`);
};
