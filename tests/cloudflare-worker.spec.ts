import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { workerKaynagi } from '../scripts/cloudflare-worker.mjs';

test('cloudflare/worker.js depodaki veriyle güncel', () => {
  expect(readFileSync('cloudflare/worker.js', 'utf8')).toBe(workerKaynagi());
});

test('Worker: 410, besleme, Yoast, etiket, paylaşım adresi ve meta-refresh → 301', async () => {
  const worker = (await import(pathToFileURL('cloudflare/worker.js').href)).default;
  const istekler: string[] = [];
  const sahte = (govde: string, tur = 'text/html; charset=utf-8') => new Response(govde, { status: 200, headers: { 'content-type': tur } });
  let sonAyar: { cf?: { resolveOverride?: string } } | undefined;
  globalThis.fetch = (async (girdi: RequestInfo | URL, ayar?: { cf?: { resolveOverride?: string } }) => {
    const u = typeof girdi === 'string' ? girdi : girdi instanceof URL ? girdi.href : girdi.url;
    istekler.push(new URL(u).pathname); sonAyar = ayar;
    if (u.includes('/memur-maas-hesaplama/zabit-katibi/')) return new Response('yok', { status: 404 });
    if (u.includes('/hukuk-mahkemeleri/tam-kabul/')) return sahte('<meta http-equiv="refresh" content="0;url=/tam-kabul-hesaplama/">');
    if (u.includes('/kelimeler/ab-nak-ne-demek/')) return sahte('<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/kelime/ab-nak-ne-demek/"><link rel="canonical" href="https://657.com.tr/kelime/ab-nak-ne-demek/">');
    return sahte('<!doctype html><title>Sayfa</title>' + 'x'.repeat(50000));
  }) as typeof fetch;
  const al = (yol: string) => worker.fetch(new Request('https://657.com.tr' + yol));
  const gone = JSON.parse(readFileSync('docs/seo-canli-eksik-adresler.json', 'utf8'));
  const ilkGone = Object.values(gone.gruplar as Record<string, { yol: string; not?: string }[]>).flat().find(x => x.not)!.yol;
  expect((await al(ilkGone)).status).toBe(410);
  for (const [yol, hedef] of [['/feed/', '/feed.xml'], ['/comments/feed/', '/feed.xml'], ['/category/haberler/feed/', '/feed.xml'], ['/post-sitemap2.xml', '/sitemap.xml'], ['/tag/enflasyon-farki/', '/yazilar/?q=enflasyon%20farki'], ['/kelimeler/ab-nak-ne-demek/', '/kelime/ab-nak-ne-demek/'], ['/hukuk-mahkemeleri/tam-kabul/', '/tam-kabul-hesaplama/']]) {
    const y = await al(yol);
    expect(y.status, yol).toBe(301);
    expect(y.headers.get('location'), yol).toBe('https://657.com.tr' + hedef);
  }
  for (const yol of ['/_657-servis/oneriler', '/modeller/piper/hazir.json', '/dosyalar/uygulamalar/a.exe', '/denetimtutanagi.docx', '/wp-admin/', '/wp-json/wp/v2/posts']) {
    await al(yol);
    expect(sonAyar?.cf?.resolveOverride, yol).toBe('kaynak.657.com.tr');
  }
  await al('/dosyalar/');
  expect(sonAyar?.cf?.resolveOverride).toBeUndefined();
  istekler.length = 0;
  const p = await al('/memur-maas-hesaplama/zabit-katibi/evli/');
  expect(p.status).toBe(200);
  expect(istekler).toEqual(['/memur-maas-hesaplama/zabit-katibi/evli/', '/memur-maas-hesaplama/']);
  const n = await al('/memur-maas-hesaplama/');
  expect(n.status).toBe(200);
  expect((await n.text()).length).toBeGreaterThan(50000);
});
