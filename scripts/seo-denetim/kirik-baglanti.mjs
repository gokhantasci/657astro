// Derleme sonunda dist/ içindeki iç bağlantıları denetler; hedefi olmayan bağlantı varsa derlemeyi durdurur.
// Eski Nginx sunucusunda kalan yollar (docs/cloudflare-yayin-kurallari.md) ve bilerek hata durumu döndüren
// /hatalar/ bağlantıları sayılmaz. Elle: node scripts/seo-denetim/kirik-baglanti.mjs dist
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://657.com.tr';
const HARIC = [/^\/dosyalar\/uygulamalar\//, /^\/_657-servis\//, /^\/modeller\//, /^\/denetimtutanagi\.docx$/, /^\/\d{3}\/$/, /^\/[45]xx\/$/];

// GitHub Pages proje yolunda (BASE_PATH=/657astro) bağlantılar taban yoluyla yazılır; denetimden önce taban çıkarılır.
export function kirikBaglantilar(dist, taban = process.env.BASE_PATH || '/') {
  const base = '/' + taban.replace(/^\/+|\/+$/g, '');
  const dosyalar = [];
  const gez = d => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) gez(p); else if (e.name.endsWith('.html')) dosyalar.push(p); } };
  gez(dist);
  const yol = f => '/' + relative(dist, f).replace(/\\/g, '/').replace(/index\.html$/, '');
  const var_ = new Set(dosyalar.map(f => { try { return decodeURIComponent(yol(f)); } catch { return yol(f); } }));
  const kirik = new Map();
  for (const f of dosyalar) {
    const html = readFileSync(f, 'utf8');
    if (/http-equiv=["']?refresh/i.test(html.slice(0, 4000))) continue;
    const kaynak = yol(f);
    for (const m of html.matchAll(/<a\b[^>]*\shref=["']([^"'#?]+)/gi)) {
      let h = m[1].replace(/&amp;/g, '&');
      if (h.startsWith(SITE)) h = h.slice(SITE.length) || '/';
      if (base !== '/' && (h === base || h.startsWith(base + '/'))) h = h.slice(base.length) || '/';
      if (!h.startsWith('/') || h.startsWith('//')) { if (/^[a-z]+:/i.test(h) || h.startsWith('//')) continue; h = posix.join(kaynak.endsWith('/') ? kaynak : posix.dirname(kaynak) + '/', h); }
      let t; try { t = decodeURIComponent(h); } catch { t = h; }
      if (HARIC.some(r => r.test(t))) continue;
      const dosya = /\.[a-z0-9]{2,5}$/i.test(t) && !t.endsWith('.html');
      const tamam = dosya ? existsSync(join(dist, t)) : var_.has(t.endsWith('/') || t.endsWith('.html') ? t : t + '/');
      if (!tamam) (kirik.get(t) ?? kirik.set(t, new Set()).get(t)).add(kaynak);
    }
  }
  return [...kirik].map(([hedef, kaynaklar]) => ({ hedef, kaynaklar: [...kaynaklar].slice(0, 5), adet: kaynaklar.size }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const sonuc = kirikBaglantilar(process.argv[2] || 'dist');
  for (const k of sonuc) console.log(`${k.hedef} ← ${k.kaynaklar.join(', ')}${k.adet > 5 ? ` (+${k.adet - 5})` : ''}`);
  console.log(`${sonuc.length} kırık hedef.`);
  process.exitCode = sonuc.length ? 1 : 0;
}
