// Yayın sonrası güncellenen ve ana URL'leri IndexNow API (Bing, Yandex, Seznam, Naver, Yep) üzerinden otomatik bildirir.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const HOST = '657.com.tr';
const KEY = '657a9c4e2b8f1d0e5a7c3b9f4e2d8a1c';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const DRY_RUN = process.argv.includes('--dry-run');
const MAX_URLS = Number(process.env.INDEXNOW_MAX_URLS || 2000);

const distDir = resolve('dist');
if (!existsSync(distDir)) {
  console.log('[indexnow] dist/ bulunamadı; önce npm run build çalıştırılmalı.');
  process.exit(0);
}

const sitemapFiles = readdirSync(distDir).filter((f) => /^sitemap-.*\.xml$/i.test(f));
const entries = [];
for (const file of sitemapFiles) {
  const xml = readFileSync(join(distDir, file), 'utf8');
  for (const m of xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)) {
    entries.push({ loc: m[1].trim(), lastmod: m[2]?.trim() ?? '' });
  }
}

// Öncelik: en güncel lastmod tarihine sahip sayfalar + ana dizinler.
const oncelikli = new Set([
  `https://${HOST}/`,
  `https://${HOST}/araclar/`,
  `https://${HOST}/memur-maas-hesaplama/`,
  `https://${HOST}/sozlesmeli-memur-maas-hesaplama/`,
  `https://${HOST}/emekli-memur-maas-hesaplama/`,
  `https://${HOST}/enflasyon-farki-hesaplama-robotu/`,
  `https://${HOST}/unvan-maaslari/`,
  `https://${HOST}/hukuk-sozlugu/`,
  `https://${HOST}/cikmis-mulakat-sorulari/`,
  `https://${HOST}/gys/`,
  `https://${HOST}/on-parmak/`,
  `https://${HOST}/kamu-misafirhaneleri/`,
  `https://${HOST}/adalet-bakanligi-genelgeleri/`,
  `https://${HOST}/devlet-personel-baskanligi-mutalaalari/`,
  `https://${HOST}/kurum-haberleri/`,
  `https://${HOST}/asistan/`,
  `https://${HOST}/rakamlarla-657/`,
]);

const sirali = [...entries].sort((a, b) => {
  const pa = oncelikli.has(a.loc) ? 1 : 0;
  const pb = oncelikli.has(b.loc) ? 1 : 0;
  if (pa !== pb) return pb - pa;
  return b.lastmod.localeCompare(a.lastmod) || a.loc.localeCompare(b.loc);
});

const urlList = [...new Set(sirali.map((e) => e.loc))].slice(0, MAX_URLS);
if (!urlList.length) {
  console.log('[indexnow] Gönderilecek URL bulunamadı.');
  process.exit(0);
}

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList,
};

if (DRY_RUN) {
  console.log(`[indexnow] Dry-run: ${urlList.length} URL hazır (toplam sitemap: ${entries.length}). İlk 5:`, urlList.slice(0, 5));
  process.exit(0);
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(20000),
});

if (res.ok || res.status === 202) {
  console.log(`[indexnow] Başarılı (HTTP ${res.status}): ${urlList.length} URL IndexNow'a bildirildi.`);
} else {
  const txt = await res.text().catch(() => '');
  console.error(`[indexnow] Uyarı (HTTP ${res.status}): ${txt.slice(0, 300)}`);
  process.exitCode = 1;
}
