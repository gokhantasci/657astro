import fs from 'node:fs';
const SITE = 'https://657.com.tr';
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const sm = new Map(d.sm);
const inbound = new Map(d.inbound);
const P = d.pages;
const isErr = p => /^\/\d{3}\.html$/.test(p.p);
const stub = p => p.refresh;
const noidx = p => /noindex/i.test(p.robots);
const idx = P.filter(p => !isErr(p) && !stub(p) && !noidx(p));
const grp = p => sm.get(p.p)?.group || 'sitemap-disi';
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const pct = (a, b) => b ? +(100 * a / b).toFixed(1) : 0;

const r = {};
r.toplam = P.length; r.hata = P.filter(isErr).length; r.yonlendirme = P.filter(stub).length; r.noindex = P.filter(p => !stub(p) && !isErr(p) && noidx(p)).length; r.indekslenebilir = idx.length;
r.noindexOrnek = P.filter(p => !stub(p) && !isErr(p) && noidx(p)).slice(0, 15).map(p => p.p);
r.sitemap = sm.size;
r.sitemapYok = [...sm.keys()].filter(u => !P.find(p => p.p === u)).slice(0, 20);
const pmap = new Map(P.map(p => [p.p, p]));
r.sitemapYokSay = [...sm.keys()].filter(u => !pmap.has(u)).length;
r.sitemapNoindex = [...sm.keys()].filter(u => pmap.has(u) && (noidx(pmap.get(u)) || stub(pmap.get(u)))).length;
r.indeksSitemapDisi = idx.filter(p => !sm.has(p.p)).length;
r.indeksSitemapDisiOrnek = idx.filter(p => !sm.has(p.p)).slice(0, 20).map(p => p.p);
r.lastmodYok = [...sm.values()].filter(v => !v.lastmod).length;

// Başlık ve açıklama
const cnt = k => { const m = new Map(); idx.forEach(p => { const v = (p[k] || '').trim(); if (v) m.set(v, (m.get(v) || 0) + 1); }); return m; };
const tc = cnt('title'), dc = cnt('desc');
r.titleYok = idx.filter(p => !p.title).length;
r.titleTekrar = idx.filter(p => p.title && tc.get(p.title) > 1).length;
r.titleTekrarOrnek = [...tc].filter(([, v]) => v > 1).sort((a, b) => b[1] - a[1]).slice(0, 10);
r.titleKisa = idx.filter(p => p.title && p.title.length < 30).length;
r.titleUzun = idx.filter(p => p.title.length > 65).length;
r.titleUzunOrnek = idx.filter(p => p.title.length > 65).slice(0, 5).map(p => [p.p, p.title.length, p.title]);
r.titleMed = med(idx.map(p => p.title.length));
r.descYok = idx.filter(p => !p.desc).length;
r.descTekrar = idx.filter(p => p.desc && dc.get(p.desc.trim()) > 1).length;
r.descTekrarOrnek = [...dc].filter(([, v]) => v > 1).sort((a, b) => b[1] - a[1]).slice(0, 8);
r.descKisa = idx.filter(p => p.desc && p.desc.length < 70).length;
r.descUzun = idx.filter(p => p.desc && p.desc.length > 160).length;
r.descMed = med(idx.map(p => (p.desc || '').length));
r.canonYok = idx.filter(p => !p.canonical).length;
r.canonFarkli = idx.filter(p => p.canonical && decodeURIComponent(p.canonical) !== SITE + p.p).length;
r.canonFarkliOrnek = idx.filter(p => p.canonical && decodeURIComponent(p.canonical) !== SITE + p.p).slice(0, 10).map(p => [p.p, p.canonical]);
r.langYok = P.filter(p => p.lang !== 'tr').length;
r.viewportYok = P.filter(p => !p.viewport).length;
r.h1Yok = idx.filter(p => p.h1all === 0).length;
r.h1Cok = idx.filter(p => p.h1all > 1).length;
r.h1CokOrnek = idx.filter(p => p.h1all > 1).slice(0, 8).map(p => p.p);
r.h1YokOrnek = idx.filter(p => p.h1all === 0).slice(0, 8).map(p => p.p);
r.baslikAtlama = idx.filter(p => p.skip > 0).length;
r.baslikAtlamaOrnek = idx.filter(p => p.skip > 0).slice(0, 8).map(p => p.p);
r.ogEksik = idx.filter(p => !p.og.title || !p.og.description || !p.og.image || !p.og.url).length;
r.ogImageVarsayilan = idx.filter(p => /paylasim\.png$/.test(p.og.image || '')).length;
r.twYok = idx.filter(p => !p.tw).length;
r.imgAltYok = idx.reduce((a, p) => a + p.imgNoAlt, 0); r.imgBoyutYok = idx.reduce((a, p) => a + p.imgNoDim, 0); r.img = idx.reduce((a, p) => a + p.imgs, 0);
r.ldHata = P.reduce((a, p) => a + p.ldErr, 0);
r.tabloScope = (() => { const t = idx.reduce((a, p) => a + p.tables, 0); return t ? idx.reduce((a, p) => a + (p.tabloScope ?? 0), 0) / t : 1; })();
r.kirik = d.broken.length; r.kirikOrnek = d.broken.sort((a, b) => b[1] - a[1]).slice(0, 25);
r.kirikSayfa = new Set(d.broken.flatMap(b => b[2])).size;
r.canliMutlak = d.liveLinks.reduce((a, [, v]) => a + v, 0);
r.slashsiz = d.noSlash.reduce((a, [, v]) => a + v, 0); r.slashsizOrnek = d.noSlash.sort((a, b) => b[1] - a[1]).slice(0, 10);
r.yetim = idx.filter(p => p.p !== '/' && !inbound.get(p.p)).length;
const yetimG = {}; idx.filter(p => p.p !== '/' && !inbound.get(p.p)).forEach(p => yetimG[grp(p)] = (yetimG[grp(p)] || 0) + 1); r.yetimGrup = yetimG;
r.yetimOrnek = idx.filter(p => p.p !== '/' && !inbound.get(p.p)).slice(0, 15).map(p => p.p);
r.boyutMed = med(idx.map(p => p.bytes)); r.boyutMax = idx.reduce((a, p) => p.bytes > a.bytes ? p : a, { bytes: 0 }); r.boyutMax = [r.boyutMax.p, r.boyutMax.bytes];
r.buyuk200 = idx.filter(p => p.bytes > 200000).length;
r.buyukOrnek = idx.filter(p => p.bytes > 200000).sort((a, b) => b.bytes - a.bytes).slice(0, 8).map(p => [p.p, p.bytes]);

// Gruplar
const G = {};
for (const p of idx) {
  const g = grp(p); const x = G[g] ||= { n: 0, words: [], thin: 0, faq: 0, qa: 0, art: 0, qHead: 0, official: 0, ext: 0, date: 0, author: 0, table: 0, list: 0, types: {}, bread: 0, webapp: 0, ld0: 0, times: 0 };
  x.n++; x.words.push(p.words); if (p.words < 150) x.thin++;
  const t = p.types;
  if (t.includes('FAQPage')) x.faq++; if (t.includes('QAPage') || t.includes('Question')) x.qa++;
  if (t.some(y => /Article|BlogPosting|NewsArticle/.test(y))) x.art++;
  if (t.includes('BreadcrumbList')) x.bread++;
  if (t.some(y => /WebApplication|SoftwareApplication/.test(y))) x.webapp++;
  if (p.qHead > 0) x.qHead++; if (p.official > 0) x.official++; if (p.ext > 0) x.ext++;
  if (p.lastmod) x.date++; if (p.times) x.times++; if (p.author) x.author++; if (p.tables) x.table++; if (p.lists) x.list++;
  for (const y of new Set(t)) x.types[y] = (x.types[y] || 0) + 1;
}
for (const [g, x] of Object.entries(G)) { x.wordsMed = med(x.words); delete x.words; x.types = Object.fromEntries(Object.entries(x.types).sort((a, b) => b[1] - a[1]).slice(0, 12)); }
r.gruplar = G;
// İnce sayfa örnekleri
r.inceOrnek = idx.filter(p => p.words < 150).slice(0, 15).map(p => [p.p, grp(p), p.words]);
const bakil = ['/', '/araclar/', '/memur-maas-hesaplama/', '/enflasyon-farki-hesaplama-robotu/', '/yargilamagideri/', '/kesinlesme/', '/hukuk-sozlugu/', '/cikmis-mulakat-sorulari/', '/adlicevre/', '/unvan-maaslari/', '/yazilar/', '/asistan/'];
r.ornekler = bakil.map(u => pmap.get(u)).filter(Boolean).map(p => ({ p: p.p, title: p.title, tl: p.title.length, desc: p.desc, dl: (p.desc || '').length, types: [...new Set(p.types)], words: p.words, h1: p.h1all, qHead: p.qHead, official: p.official, lastmod: p.lastmod, bytes: p.bytes, scripts: p.scripts, first: p.first }));
// bir sözlük, bir mülakat, bir adli çevre, bir unvan sayfası örneği
for (const g of ['sozluk', 'mulakat', 'adlicevre', 'maas', 'yazilar', 'sayfalar', 'sitemap-disi']) { const p = idx.find(q => grp(q) === g && q.p.split('/').length > 3) || idx.find(q => grp(q) === g); if (p) r.ornekler.push({ grup: g, p: p.p, title: p.title, desc: p.desc, types: [...new Set(p.types)], words: p.words, qHead: p.qHead, official: p.official, lastmod: p.lastmod, first: p.first }); }
console.log(JSON.stringify(r, null, 1));
