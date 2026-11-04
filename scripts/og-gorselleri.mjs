// Sayfaya özel paylaşım görseli (SEO yol haritası P2-3). Derleme sonunda dist/ taranır: varsayılan görseli (paylasim.png) kullanan
// dizinlenebilir her sayfa için başlık ve bölüm adı yazılı 1200×630 JPEG üretilir ve og:image / twitter:image ona çevrilir.
// Görseller yalnız dist/og/ altında üretilir; depoya girmez. Elle: node scripts/og-gorselleri.mjs dist
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SITE = 'https://657.com.tr';
const VARSAYILAN = `${SITE}/paylasim.png`;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const coz = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

function satirlar(metin, genislik, en) {
  const kelime = metin.split(/\s+/), out = [];
  let s = '';
  for (const k of kelime) {
    if ((s + ' ' + k).trim().length > genislik) { if (s) out.push(s); s = k; } else s = (s + ' ' + k).trim();
    if (out.length === en) break;
  }
  if (out.length < en && s) out.push(s);
  if (out.length === en && kelime.join(' ').length > out.join(' ').length) out[en - 1] = out[en - 1].replace(/\s*\S*$/, '') + '…';
  return out;
}

function bolum(yol, html) {
  if (yol.startsWith('/kelime/') || yol.startsWith('/hukuk-sozlugu/')) return 'Hukuk sözlüğü';
  if (yol.startsWith('/adlicevre/')) return 'Adli çevre';
  if (yol.startsWith('/dpb-gorusleri/')) return 'DPB görüşü';
  if (yol.startsWith('/unvan-maaslari/') || /-maasi-\d{4}\/$/.test(yol)) return 'Unvan maaşları';
  if (/"@type":"FAQPage"/.test(html) && /Çıkmış mülakat/.test(html)) return 'Çıkmış mülakat soruları';
  if (/"@type":"WebApplication"/.test(html)) return 'Hesaplama aracı';
  if (/"@type":"Article"/.test(html)) return 'Yazı';
  return '657.com.tr';
}

function svg(baslik, alt) {
  const s = satirlar(baslik, 30, 4);
  const boy = s.length > 3 ? 60 : 68, y0 = 300 - ((s.length - 1) * boy * 1.18) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#132036"/><rect y="618" width="1200" height="12" fill="#c8102e"/>
<rect x="72" y="64" width="112" height="60" rx="8" fill="#c8102e"/>
<text x="128" y="107" text-anchor="middle" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="#ffffff">657</text>
<text x="198" y="107" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="#ffffff">.com.tr</text>
<text x="72" y="190" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="30" fill="#aab6c9">${esc(alt)}</text>
${s.map((t, i) => `<text x="72" y="${Math.round(y0 + 70 + i * boy * 1.18)}" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="${boy}" font-weight="700" fill="#ffffff">${esc(t)}</text>`).join('\n')}
<text x="72" y="568" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="28" fill="#aab6c9">Kamu personeli için hesap ve kontrol araçları</text>
</svg>`;
}

export async function ogGorselleriniUret(dist) {
  const dosyalar = [];
  const gez = d => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) { if (e.name !== 'og' && e.name !== '_astro') gez(p); } else if (e.name === 'index.html') dosyalar.push(p); } };
  gez(dist);
  mkdirSync(join(dist, 'og'), { recursive: true });
  const isler = [];
  for (const f of dosyalar) {
    const html = readFileSync(f, 'utf8');
    if (!html.includes(`content="${VARSAYILAN}"`) || /name="robots" content="noindex/.test(html) || /http-equiv="refresh"/i.test(html.slice(0, 3000))) continue;
    const yol = '/' + relative(dist, f).replace(/\\/g, '/').replace(/index\.html$/, '');
    const baslik = coz((html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || '').replace(/\s*\|\s*[^|]*657\.com\.tr\s*$/, '').replace(/\s*\|\s*[^|]+$/, '');
    if (!baslik || yol === '/') continue;
    const ad = createHash('sha1').update(yol).digest('hex').slice(0, 16) + '.jpg';
    isler.push({ f, html, ad, baslik, alt: bolum(yol, html) });
  }
  let i = 0;
  const calis = async () => {
    for (let is; (is = isler[i++]);) {
      const hedef = join(dist, 'og', is.ad);
      if (!existsSync(hedef)) await sharp(Buffer.from(svg(is.baslik, is.alt))).jpeg({ quality: 78, mozjpeg: true }).toFile(hedef);
      const url = `${SITE}/og/${is.ad}`;
      writeFileSync(is.f, is.html.replace(/(<meta (?:property="og:image"|name="twitter:image") content=")[^"]*(")/g, `$1${url}$2`));
    }
  };
  await Promise.all(Array.from({ length: 8 }, calis));
  return isler.length;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(`${await ogGorselleriniUret(process.argv[2] || 'dist')} paylaşım görseli üretildi.`);
}
