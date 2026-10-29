import { z } from 'zod';
import raw from '../data/wp-yonlendirmeler.json' with { type: 'json' };
import { HARITA_GRUPLARI, haritaKayitlari } from './site-haritasi';
import { adliKayitlar, adliYonlendirmeler } from './adlicevre';
import { terimler } from './sozluk';
import { sorular } from './mulakat';

// WordPress Redirection kurallarının statik karşılığı: canonical + noindex + meta yenileme sayfaları.
// GitHub Pages HTTP 301 veremez; gerçek 301 için aynı kurallar Cloudflare'de kurulabilir (docs/cloudflare-yonlendirmeler.md).
const veri = z.object({ aciklama: z.string(), kurallar: z.array(z.object({ eski: z.string().startsWith('/'), yeni: z.string().startsWith('/') })) }).parse(raw);

export async function wpYonlendirmeleri() {
  const sayfalar = new Set((await Promise.all(HARITA_GRUPLARI.map(haritaKayitlari))).flat().map(k => k.loc));
  // Başka rotaların ürettiği yönlendirme sayfaları da dolu adres sayılır.
  const dolu = new Set([...sayfalar,
    ...terimler.map(t => `/kelimeler/${t.slug}/`), ...sorular.map(s => `/sozlukyeni/${s.slug}/`),
    ...adliYonlendirmeler.map(y => `/adlicevre/${y.eski}/`)]);
  const liste = new Map<string, string>();
  // WordPress'teki kalıp kuralları: eski /posts/... adresleri (ziyaret sayısı yüksek).
  for (const k of adliKayitlar) {
    const kok = k.slug.match(/^(.+)-adliyesi-yargi-cevresi$/)?.[1];
    if (kok) liste.set(`/posts/adlicevre/${kok}-adli-yargi-cevresi/`, `/adlicevre/${k.slug}/`);
  }
  for (const t of terimler) liste.set(`/posts/kelimeler/${t.slug}/`, `/kelime/${t.slug}/`);
  for (const s of sorular) liste.set(`/posts/sozlukyeni/${s.slug}/`, `/${s.slug}/`);
  const atlanan: string[] = [];
  for (const { eski, yeni } of veri.kurallar) {
    if (dolu.has(eski)) continue; // Sitede sayfası olan adres yönlendirilmez.
    if (!sayfalar.has(yeni)) { atlanan.push(`${eski} → ${yeni}`); continue; }
    liste.set(eski, yeni);
  }
  return { yonlendirmeler: [...liste].filter(([eski]) => !dolu.has(eski)).map(([eski, yeni]) => ({ eski, yeni })), atlanan };
}
