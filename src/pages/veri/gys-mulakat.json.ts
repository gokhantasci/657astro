import { sorular } from '../../lib/mulakat';

export const prerender = true;

export function GET() {
  const veri = sorular.map((s) => ({
    id: s.slug,
    s: s.soru,
    c: s.cevap,
    m: s.mulakat ? 1 : 0,
  }));
  return new Response(JSON.stringify(veri), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
