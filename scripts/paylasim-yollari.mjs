// Paylaşılabilir hesap adresleri: /memur-maas-hesaplama/yazi-isleri-muduru/3-1/sendika-uyesi/
// Statik çıktıda yalnız aracın kendi sayfası vardır; alt yollar aynı sayfayı açar, seçimleri tarayıcı betiği okur.
// Geliştirme ve önizleme sunucusu bu eklentiyle, GitHub Pages 404 yedeğiyle, yayında Cloudflare yeniden yazma kuralıyla çalışır.
import {readFileSync} from 'node:fs';

// Dosya yükleyerek çalışan teftiş araçları ve alt sayfası olan dizinler paylaşım adresine katılmaz.
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

/** Alt yol bir paylaşım adresiyse aracın kök yolunu, değilse null döndürür. */
export function paylasimHedefi(pathname, yollar) {
  let yol;
  try { yol = decodeURIComponent(pathname.split('?')[0]); } catch { return null; }
  if (/\.[a-z0-9]{1,8}$/i.test(yol)) return null;
  for (const kok of yollar) if (yol.startsWith(kok) && yol.length > kok.length) return kok;
  return null;
}

export function paylasimPlugin() {
  const yollar = paylasimYollari();
  const ara = (req, _res, next) => {
    const [yol, sorgu] = (req.url || '/').split('?');
    const kok = paylasimHedefi(yol, yollar);
    if (kok) req.url = kok + (sorgu ? '?' + sorgu : '');
    next();
  };
  return {
    name: '657-paylasim-adresleri',
    configureServer(server) { server.middlewares.use(ara); },
    configurePreviewServer(server) { server.middlewares.use(ara); },
  };
}
