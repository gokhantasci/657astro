import {readFileSync, writeFileSync} from 'node:fs';

const ALANLAR = new Set(['maas', 'yargi', 'hukuk', 'uygulama']);

let onbellek;
export function paylasimYollari(arac) {
  if (!arac && onbellek) return onbellek;
  const kaynak = arac ?? JSON.parse(readFileSync(new URL('../src/data/araclar.json', import.meta.url), 'utf8')).araclar;
  const sonuc = kaynak.filter(a => a.tasindi && a.path && ALANLAR.has(a.category) && a.path.startsWith('/') && !a.path.startsWith('//'))
    .map(a => a.path).sort((a, b) => b.length - a.length);
  if (!arac) onbellek = sonuc;
  return sonuc;
}

export function paylasimHedefi(pathname, yollar) {
  let yol;
  try { yol = decodeURIComponent(pathname.split('?')[0]); } catch { return null; }
  if (/\.[a-z0-9]{1,8}$/i.test(yol)) return null;
  for (const kok of yollar) if (yol.startsWith(kok) && yol.length > kok.length) return kok;
  return null;
}

const FEED_PATTERN = /^\/(?:feed|rss|comments\/feed|feed\/atom|feed\/rss2|(?:category|tag)\/[^/]+\/feed)\/?$/i;

export function devMiddlewareKur(server) {
  const yollar = paylasimYollari();

  const wrapTrailingSlash = () => {
    const origIdx = server.middlewares.stack.findIndex(m => m.handle?.name === 'devTrailingSlash');
    if (origIdx !== -1 && server.middlewares.stack[origIdx].handle?.name !== 'devTrailingSlashWrapper') {
      const origTrailing = server.middlewares.stack[origIdx].handle;
      server.middlewares.stack[origIdx].handle = function devTrailingSlashWrapper(req, res, next) {
        const rawUrl = req.url || '/';
        const [yol, sorgu] = rawUrl.split('?');

        // 1. RSS Feed yönlendirmeleri (/feed -> /feed.xml)
        if (FEED_PATTERN.test(yol)) {
          res.statusCode = 301;
          res.setHeader('Location', '/feed.xml');
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('301 Redirect to /feed.xml');
          return;
        }

        // Canlı Hesaplama API'si (GET & POST: /api/hesaplama ve /_657-servis/api/hesaplama)
        if (yol === '/api/hesaplama' || yol === '/_657-servis/api/hesaplama') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.setHeader('Content-Type', 'application/json; charset=utf-8');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          const sayacDosya = new URL('../src/data/hesaplama-sayaclari.json', import.meta.url);
          const sayacOku = () => {
            try { return JSON.parse(readFileSync(sayacDosya, 'utf8')); }
            catch { return { sayaclar: {} }; }
          };

          if (req.method === 'POST') {
            let govde = '';
            req.on('data', parca => { govde += parca; });
            req.on('end', () => {
              try {
                const { tur } = JSON.parse(govde || '{}');
                const veri = sayacOku();
                if (veri.sayaclar && veri.sayaclar[tur]) {
                  veri.sayaclar[tur].bugun = (veri.sayaclar[tur].bugun || 0) + 1;
                  veri.sayaclar[tur].buHafta = (veri.sayaclar[tur].buHafta || 0) + 1;
                  veri.sayaclar[tur].buYil = (veri.sayaclar[tur].buYil || 0) + 1;
                  veri.sayaclar[tur].toplam = (veri.sayaclar[tur].toplam || 0) + 1;
                  writeFileSync(sayacDosya, JSON.stringify(veri, null, 2), 'utf8');
                }
                const toplam = Object.values(veri.sayaclar || {}).reduce((acc, s) => acc + (s.toplam || 0), 0);
                res.statusCode = 200;
                res.end(JSON.stringify({ basarili: true, toplam, sayaclar: veri.sayaclar }));
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ hata: 'Geçersiz istek' }));
              }
            });
            return;
          }

          const veri = sayacOku();
          const toplam = Object.values(veri.sayaclar || {}).reduce((acc, s) => acc + (s.toplam || 0), 0);
          res.statusCode = 200;
          res.end(JSON.stringify({ basarili: true, toplam, sayaclar: veri.sayaclar }));
          return;
        }

        // 2. Paylaşım URL'leri (ör. /maas-hesaplama/v1/... -> /maas-hesaplama/)
        const kok = paylasimHedefi(yol, yollar);
        if (kok) {
          req.url = kok + (sorgu ? '?' + sorgu : '');
        }

        // 3. Eksik trailing-slash isteklerini tamamla (Astro dev 404 yerine sitemizin sayfasına veya özel 404 sayfasına yönlendir)
        const isViteInternal = yol.startsWith('/@') || yol.startsWith('/__') || yol.startsWith('/src/') || yol.startsWith('/node_modules/');
        if (!isViteInternal && !yol.endsWith('/') && !/\.[a-z0-9]{1,8}$/i.test(yol)) {
          res.statusCode = 301;
          res.setHeader('Location', yol + '/' + (sorgu ? '?' + sorgu : ''));
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end();
          return;
        }

        return origTrailing(req, res, next);
      };
      console.log('[paylasimPlugin] devTrailingSlash wrapped successfully');
    }
  };

  if (server.httpServer) {
    server.httpServer.once('listening', wrapTrailingSlash);
  }
  process.nextTick(wrapTrailingSlash);
  setTimeout(wrapTrailingSlash, 100);
  setTimeout(wrapTrailingSlash, 1000);
}

export function paylasimPlugin() {
  return {
    name: '657-paylasim-adresleri',
    enforce: 'pre',
    configureServer(server) {
      devMiddlewareKur(server);
    },
    configurePreviewServer(server) {
      devMiddlewareKur(server);
    },
  };
}
