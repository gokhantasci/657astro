// Cloudflare Worker'ını depodaki veriden üretir: cloudflare/worker.js (docs/cloudflare-yayin-kurallari.md).
// Kullanım: node scripts/cloudflare-worker.mjs  → çıktıyı Cloudflare panelindeki Worker'a yapıştırın ya da wrangler ile yayımlayın.
// Listeler (410, paylaşım kökleri) değiştiğinde betik yeniden çalıştırılır; tests/cloudflare-worker.spec.ts dosyanın güncel olduğunu denetler.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { paylasimYollari } from './paylasim-yollari.mjs';

export function workerKaynagi() {
  const eksik = JSON.parse(readFileSync('docs/seo-canli-eksik-adresler.json', 'utf8')).gruplar;
  const gone = [...new Set(Object.values(eksik).flat().filter(x => x.not).map(x => x.yol))].sort();
  const araclar = JSON.parse(readFileSync('src/data/araclar.json', 'utf8')).araclar;
  const paylasim = [...paylasimYollari(araclar)].sort((a, b) => b.length - a.length);
  // Yoast alt site haritaları ve WordPress beslemeleri yeni karşılıklarına 301 ile gider.
  const yoast = ['post-sitemap.xml', 'post-sitemap2.xml', 'post-sitemap3.xml', 'page-sitemap.xml', 'kelimeler-sitemap.xml', 'kelimeler-sitemap2.xml', 'kelimeler-sitemap3.xml', 'adlicevre-sitemap.xml', 'adlicevre-sitemap2.xml', 'category-sitemap.xml', 'post_tag-sitemap.xml', 'post_tag-sitemap2.xml', 'post_tag-sitemap3.xml', 'author-sitemap.xml', 'teftis-pages-sitemap.xml', 'wp-sitemap.xml'];
  return `// ÜRETİLMİŞ DOSYA — elle düzenlemeyin: node scripts/cloudflare-worker.mjs
// 657.com.tr/* rotasına bağlanır. Eski sunucuda kalan yollar (/_657-servis/*, /modeller/*, /dosyalar/uygulamalar/*, /wp-*)
// bu Worker'a hiç gelmez: o yollar için Worker'sız rota ve Origin Rule (DNS kaydı: kaynak.657.com.tr) kullanılır.
const GONE = new Set(${JSON.stringify(gone)});
const PAYLASIM = ${JSON.stringify(paylasim)};
const YOAST = new Set(${JSON.stringify(yoast.map(y => '/' + y))});
const FEED = /^\\/(?:feed|rss|comments\\/feed|feed\\/atom|feed\\/rss2|(?:category|tag)\\/[^/]+\\/feed)\\/?$/;
const ETIKET = /^\\/tag\\/([^/]+)\\/?(?:page\\/\\d+\\/?)?$/;
const YENILE = /<meta http-equiv="refresh" content="0;url=([^"]+)"/i;

const yonlendir = (url, yol) => Response.redirect(new URL(yol, url.origin).href, 301);

export default {
  async fetch(req) {
    const url = new URL(req.url);
    let yol;
    try { yol = decodeURIComponent(url.pathname); } catch { yol = url.pathname; }
    if (GONE.has(yol)) return new Response('Bu içerik kişisel veri içerdiği için yayından kaldırıldı.', { status: 410, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400' } });
    if (FEED.test(yol)) return yonlendir(url, '/feed.xml');
    if (YOAST.has(yol)) return yonlendir(url, '/sitemap.xml');
    const etiket = yol.match(ETIKET);
    if (etiket) return yonlendir(url, '/yazilar/?q=' + encodeURIComponent(etiket[1].replace(/-/g, ' ')));
    // Paylaşılabilir hesap adresi: aracın kök sayfası 200 ile döner; seçimleri tarayıcı betiği okur.
    const kok = !/\\.[a-z0-9]{1,8}$/i.test(yol) && PAYLASIM.find(p => yol.startsWith(p) && yol.length > p.length);
    if (kok) {
      const hedef = new URL(url); hedef.pathname = kok;
      const y = await fetch(hedef.href, { headers: req.headers, cf: { cacheEverything: true } });
      return new Response(y.body, { status: y.ok ? 200 : y.status, headers: y.headers });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return fetch(req);
    const yanit = await fetch(req);
    // Derlemedeki meta-refresh yönlendirme sayfaları (eski sözlük, WordPress kuralları) gerçek 301 olur.
    // Yalnız ilk parça okunur; gerisi akış olarak iletilir (büyük sayfalar belleğe alınmaz).
    if (yanit.status === 200 && yanit.body && (yanit.headers.get('content-type') || '').includes('text/html')) {
      const okuyucu = yanit.body.getReader();
      const ilk = await okuyucu.read();
      if (ilk.done) return new Response(null, yanit);
      const m = new TextDecoder().decode(ilk.value.slice(0, 2048)).match(YENILE);
      if (m) { okuyucu.cancel(); return yonlendir(url, m[1].replace(/&amp;/g, '&')); }
      const akis = new ReadableStream({
        start(c) { c.enqueue(ilk.value); },
        async pull(c) { const p = await okuyucu.read(); if (p.done) c.close(); else c.enqueue(p.value); },
        cancel(r) { okuyucu.cancel(r); },
      });
      return new Response(akis, { status: yanit.status, statusText: yanit.statusText, headers: yanit.headers });
    }
    return yanit;
  },
};
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync('cloudflare', { recursive: true });
  writeFileSync('cloudflare/worker.js', workerKaynagi());
  console.log('cloudflare/worker.js yazıldı.');
}
