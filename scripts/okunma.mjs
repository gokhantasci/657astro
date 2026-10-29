// Yayından sonraki okunma sayılarını Google Analytics 4'ten çekip src/data/okunma.json → "ga" alanına yazar.
// Statik sitede sayaç tutulamadığı için WordPress'ten aktarılan sayının (wp) üstüne GA sayfa görüntülemeleri eklenir.
//
// Gerekenler (GitHub Actions gizli değişkenleri):
//   GA_HIZMET_HESABI  Google Cloud hizmet hesabının JSON anahtarı (GA4 mülkünde "Görüntüleyen" yetkisi verilmiş olmalı)
//   GA_MULK           GA4 mülk kimliği (657.com.tr: 423987214)
// okunma.json → "ga_baslangic" (yayın günü, YYYY-AA-GG) boşsa hiçbir şey yapılmaz; aksi hâlde WordPress dönemindeki
// görüntülemeler iki kez sayılırdı. Bağımlılık yoktur: JWT node:crypto ile imzalanır.
import { readFile, writeFile } from 'node:fs/promises';
import { createSign } from 'node:crypto';

const HEDEF = new URL('../src/data/okunma.json', import.meta.url);
const veri = JSON.parse(await readFile(HEDEF, 'utf8'));
const anahtar = process.env.GA_HIZMET_HESABI;
const mulk = process.env.GA_MULK;

if (!veri.ga_baslangic) { console.log('okunma: ga_baslangic boş (site henüz yayında değil); atlandı.'); process.exit(0); }
if (!anahtar || !mulk) { console.log('okunma: GA_HIZMET_HESABI ya da GA_MULK tanımlı değil; atlandı.'); process.exit(0); }

const hesap = JSON.parse(anahtar);
const b64 = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
const simdi = Math.floor(Date.now() / 1000);
const govde = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: hesap.client_email, scope: 'https://www.googleapis.com/auth/analytics.readonly', aud: 'https://oauth2.googleapis.com/token', iat: simdi, exp: simdi + 3600 })}`;
const imza = createSign('RSA-SHA256').update(govde).sign(hesap.private_key, 'base64url');
const tokenYanit = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${govde}.${imza}` }),
});
if (!tokenYanit.ok) throw new Error(`GA erişim anahtarı alınamadı: ${tokenYanit.status} ${await tokenYanit.text()}`);
const { access_token } = await tokenYanit.json();

const ga = {};
for (let offset = 0; ; offset += 100000) {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${mulk}:runReport`, {
    method: 'POST', headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ dateRanges: [{ startDate: veri.ga_baslangic, endDate: 'today' }], dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }], limit: 100000, offset }),
  });
  if (!r.ok) throw new Error(`GA raporu alınamadı: ${r.status} ${await r.text()}`);
  const rapor = await r.json();
  for (const satir of rapor.rows ?? []) {
    // Sorgu dizesi ve yer imi atılır; adresler sitedeki gibi / ile biter.
    let yol = decodeURIComponent(satir.dimensionValues[0].value.split(/[?#]/)[0]);
    if (!yol.endsWith('/')) yol += '/';
    ga[yol] = (ga[yol] ?? 0) + Number(satir.metricValues[0].value);
  }
  if (offset + 100000 >= (rapor.rowCount ?? 0)) break;
}
veri.ga = Object.fromEntries(Object.entries(ga).sort(([a], [b]) => a.localeCompare(b)));
veri.ga_guncelleme = new Date().toISOString();
await writeFile(HEDEF, JSON.stringify(veri, null, 0) + '\n');
console.log(`okunma: ${Object.keys(ga).length} adres güncellendi (${veri.ga_baslangic} sonrası).`);
