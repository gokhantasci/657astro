// SEO / AIO / GEO / AEO taraması: node scripts/seo-denetim/tara.mjs dist <cikti.json>; özet: node scripts/seo-denetim/ozet.mjs <cikti.json>
// Statik çıktı (dist/) için SEO / AIO / GEO / AEO denetimi. Yalnızca okur.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2];
const SITE = 'https://657.com.tr';
const out = process.argv[3];

function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc); else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}
const files = walk(DIST);
const rel = f => '/' + path.relative(DIST, f).replace(/\\/g, '/').replace(/index\.html$/, '');
const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'");
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')); return m ? decode(m[2] ?? m[3] ?? m[4] ?? '') : null; };
const metaBy = (html, key, val) => { for (const m of html.matchAll(/<meta\b[^>]*>/gi)) { if ((attr(m[0], key) || '').toLowerCase() === val) return attr(m[0], 'content'); } return null; };
const strip = s => decode(s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// Sitemap
const smUrls = new Map(); // url -> {group, lastmod}
for (const f of fs.readdirSync(DIST).filter(f => /^sitemap-.*\.xml$/.test(f))) {
  const x = fs.readFileSync(path.join(DIST, f), 'utf8');
  for (const m of x.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = (m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1];
    const lm = (m[1].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1];
    if (loc) smUrls.set(decodeURIComponent(loc.replace(SITE, '')), { group: f.replace(/^sitemap-|\.xml$/g, ''), lastmod: lm || null });
  }
}

const pages = [];
const inbound = new Map();
const existing = new Set(files.map(rel).map(p => decodeURIComponent(p)));
const broken = new Map();
const liveLinks = new Map();
const noSlash = new Map();
let n = 0;
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const p = decodeURIComponent(rel(f));
  const head = (html.match(/<head[\s\S]*?<\/head>/i) || [''])[0];
  const title = decode(((head.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '').trim());
  const desc = metaBy(head, 'name', 'description');
  const robots = metaBy(head, 'name', 'robots') || '';
  const refresh = metaBy(head, 'http-equiv', 'refresh');
  const canonTag = (head.match(/<link\b[^>]*rel=["']?canonical[^>]*>/i) || [])[0];
  const canonical = canonTag ? attr(canonTag, 'href') : null;
  const lang = attr((html.match(/<html\b[^>]*>/i) || [''])[0], 'lang');
  const og = { title: metaBy(head, 'property', 'og:title'), description: metaBy(head, 'property', 'og:description'), image: metaBy(head, 'property', 'og:image'), url: metaBy(head, 'property', 'og:url'), type: metaBy(head, 'property', 'og:type') };
  const tw = metaBy(head, 'name', 'twitter:card');
  const viewport = metaBy(head, 'name', 'viewport');
  const ld = []; let ldErr = 0;
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const j = JSON.parse(m[1]); (Array.isArray(j) ? j : (j['@graph'] || [j])).forEach(x => ld.push(x)); } catch { ldErr++; }
  }
  const types = ld.flatMap(x => [].concat(x['@type'] || []));
  const main = (html.match(/<main[\s\S]*?<\/main>/i) || [html])[0];
  const text = strip(main);
  const words = text ? text.split(' ').length : 0;
  const h1 = [...main.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => strip(m[1]));
  const h1all = [...html.matchAll(/<h1\b/gi)].length;
  const hs = [...main.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m => ({ l: +m[1], t: strip(m[2]) }));
  let skip = 0; for (let i = 1; i < hs.length; i++) if (hs[i].l - hs[i - 1].l > 1) skip++;
  const qHead = hs.filter(h => h.l >= 2 && /\?\s*$/.test(h.t)).length;
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
  const imgNoAlt = imgs.filter(t => attr(t, 'alt') === null).length;
  const imgNoDim = imgs.filter(t => !attr(t, 'width') || !attr(t, 'height')).length;
  const tables = (main.match(/<table\b/gi) || []).length;
  const tabloScope = [...main.matchAll(/<table\b[\s\S]*?<\/table>/gi)].filter(m => /scope="col"/.test(m[0])).length;
  const dogrudanYanit = /class="dogrudan-yanit"/.test(html), adimlar = /class="hesap-adimlari"/.test(html);
  const lists = (main.match(/<(ol|ul)\b/gi) || []).length;
  const dl = (main.match(/<dl\b/gi) || []).length;
  const times = (main.match(/<time\b/gi) || []).length;
  const ext = [];
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)[^"']*["'][^>]*>/gi)) {
    let h = decode(m[1]);
    if (/^(mailto|tel|javascript|data):/i.test(h)) continue;
    if (h.startsWith(SITE)) { liveLinks.set(p, (liveLinks.get(p) || 0) + 1); h = h.slice(SITE.length) || '/'; }
    if (/^https?:\/\//i.test(h)) { ext.push(h); continue; }
    if (!h.startsWith('/')) h = path.posix.join(p.endsWith('/') ? p : path.posix.dirname(p) + '/', h);
    h = h.split('?')[0];
    let t; try { t = decodeURIComponent(h); } catch { t = h; }
    if (/\.[a-z0-9]{2,5}$/i.test(t) && !t.endsWith('.html')) { if (!fs.existsSync(path.join(DIST, t))) broken.set(t, (broken.get(t) || new Set()).add(p)); continue; }
    if (!t.endsWith('/') && !t.endsWith('.html')) { noSlash.set(t, (noSlash.get(t) || 0) + 1); t = t + '/'; }
    if (!existing.has(t)) broken.set(t, (broken.get(t) || new Set()).add(p));
    else if (t !== p) inbound.set(t, (inbound.get(t) || 0) + 1);
  }
  const official = ext.filter(u => /\.gov\.tr|resmigazete|mevzuat\.gov|adalet\.gov|hsk\.gov|uyap|yargitay|danistay|anayasa\.gov|tuik|hmb\.gov|sgk\.gov|memurlar\.net|dpb/i.test(u)).length;
  const scripts = (html.match(/<script\b[^>]*src=/gi) || []).length;
  const lastmod = ld.map(x => x.dateModified || x.datePublished).find(Boolean) || null;
  const author = ld.some(x => x.author);
  pages.push({ p, bytes: Buffer.byteLength(html), title, desc, robots, refresh: !!refresh, canonical, lang, og, tw, viewport: !!viewport, types, ldErr, words, h1: h1.length, h1all, skip, qHead, hsCount: hs.length, imgs: imgs.length, imgNoAlt, imgNoDim, tables, lists, dl, times, ext: ext.length, official, scripts, lastmod, author, tabloScope, dogrudanYanit, adimlar, faqQ: ld.filter(x => [].concat(x['@type']).includes('FAQPage')).reduce((a, x) => a + (x.mainEntity?.length || 0), 0), first: text.slice(0, 220) });
  if (++n % 2000 === 0) console.error(n, '/', files.length);
}

fs.writeFileSync(out, JSON.stringify({ pages, sm: [...smUrls], broken: [...broken].map(([k, v]) => [k, v.size, [...v].slice(0, 3)]), liveLinks: [...liveLinks], noSlash: [...noSlash], inbound: [...inbound] }));
console.error('bitti', pages.length);
