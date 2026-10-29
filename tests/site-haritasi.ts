import type { APIRequestContext } from '@playwright/test';
// /sitemap.xml bir dizindir; testler bütün grup haritalarının birleşik metnine bakar.
export async function tumSiteHaritasi(request: APIRequestContext) {
  const dizin = await (await request.get('/sitemap.xml')).text();
  const gruplar = [...dizin.matchAll(/<loc>https:\/\/657\.com\.tr(\/sitemap-[a-z]+\.xml)<\/loc>/g)].map(m => m[1]);
  return (await Promise.all(gruplar.map(async g => (await request.get(g)).text()))).join('\n');
}
