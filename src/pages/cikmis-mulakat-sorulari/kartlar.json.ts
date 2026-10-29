import type { APIRoute } from 'astro';
import { sorular } from '../../lib/mulakat';
import { okunma } from '../../lib/okunma';

// Kart uygulamasının verisi: [slug, soru, cevap, mülakat sorusu mu (1/0), okunma sayısı]. Tarayıcı bir kez indirip önbellekte tutar.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(sorular.map(s => [s.slug, s.soru, s.cevap, s.mulakat ? 1 : 0, okunma(`/${s.slug}/`)])), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
