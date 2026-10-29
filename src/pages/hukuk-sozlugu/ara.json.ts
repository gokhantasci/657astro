import type { APIRoute } from 'astro';
import { terimler, kisa } from '../../lib/sozluk';

// Sözlük araması için küçük indeks: [terim, slug, kısa anlam]. Sayfa ilk aramada bir kez indirir.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(terimler.map(t => [t.terim, t.slug, kisa(t.anlam, 90)])), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
