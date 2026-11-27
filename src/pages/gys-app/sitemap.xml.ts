import type { APIRoute } from 'astro';
import mufredat from '../../data/gys-mufredat.json';
import { gysKonular, gysSinavlar, gysSorular, gysUrl, konuYolu, sinavYolu, soruYolu } from '../../lib/gys-yayin';

// gys.657.com.tr site haritası. Sunucu bu dosyayı alt alan adının /sitemap.xml adresinden verir;
// Search Console'da gys.657.com.tr mülküne bu adres eklenir. Ana sitenin haritasına girmez.
// Kişisel araç sayfaları (/performans/, /studyo/) içerik taşımadığı için listelenmez.
const SABIT = ['/', '/sinavlar/', '/konular/', '/sorular/', '/mulakat/', '/canli-sinav/', '/ilanlar/'];

export const GET: APIRoute = () => {
  const tarih = String((mufredat as { guncelleme?: string }).guncelleme || '').slice(0, 10);
  const yollar = [
    ...SABIT,
    ...gysSinavlar.map((s) => sinavYolu(s.dugum.id)),
    ...gysKonular.map((k) => konuYolu(k.id)),
    ...gysSorular.map((s) => soruYolu(s.id)),
  ];
  const satirlar = [...new Set(yollar)]
    .map((y) => `<url><loc>${gysUrl(y)}</loc>${/^\d{4}-\d{2}-\d{2}$/.test(tarih) ? `<lastmod>${tarih}</lastmod>` : ''}</url>`)
    .join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${satirlar}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
