import type { APIRoute } from 'astro';
import { araclar, aracHref, kategoriler } from '../../lib/tools';

// Anasayfa aramasının araç önerileri: {t: başlık, h: adres, k: kategori, d: açıklama, kw: anahtar sözcükler}.
// İlk HTML hafif kalsın diye sayfaya gömülmez; arama kutusuna ilk odaklanıldığında yüklenir (scripts/anasayfa-arama.ts).
export const GET: APIRoute = () => {
  const kategoriAd = new Map(kategoriler.map((k) => [k.id, k.short]));
  const liste = araclar
    .map((a) => ({ t: a.title, h: aracHref(a), k: kategoriAd.get(a.category) ?? 'Araç', d: a.description, kw: a.keywords }))
    .filter((a) => Boolean(a.h));
  return new Response(JSON.stringify(liste), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
