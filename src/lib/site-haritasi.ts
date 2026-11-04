import { getCollection } from 'astro:content';
import { terimler, harfler, terimHref } from './sozluk';
import { sorular, soruHref, sayfaSayisi, sayfaHref, sayfa } from './mulakat';
import { araclar } from './tools';
import { adliKayitlar, adliHref } from './adlicevre';
import { maasYazilari, maasYillari, maasYayinlari, unvanDonemleri } from './maas-yazilari';
import { yayinTarihi } from './unvan-yayin';
import { ayarlar } from './settings';
import hskIzleme from '../data/hsk-yargi-cevresi-izleme.json';
import hukukTarifeleri from '../data/hukuk-tarifeleri.json';
import {yaziKategorileri,kategoriYolu} from './yazi-kategorileri';
import {dpbGorusleri,dpbYol,dpbKopyaMi,dpbTarihSayi} from './dpb';

// Site haritası grupları. /sitemap.xml bunların dizinidir (Search Console'a bu adres verilir).
// Yalnızca bu sitede üretilen ve dizine eklenecek sayfalar girer; yönlendirme (noindex) sayfaları girmez.
export interface HaritaKaydi { loc: string; lastmod?: string }
const sabit = ['/', '/araclar/', '/gokhan-tasci-profil/', '/bolum/teftis/', '/bolum/hesaplamalar/', '/yazilar/', '/asistan/', '/dosyalar/', '/ozel-gunler/', '/cmk-avukatlik-asgari-ucret-tarifesi/', '/avukatlik-asgari-ucret-tarifesi/', '/devlet-personel-baskanligi-mutalaalari/', ...dpbGorusleri.filter(g=>!dpbKopyaMi(g)).map(g=>dpbYol(g.id)), '/unvan-maaslari/', '/memur-maas-katsayilari/', '/hukuk-sozlugu/', '/cikmis-mulakat-sorulari/', '/adlicevre/',
  '/oneri/', '/iletisim/', '/657-com-tr-gizlilik-politikasi-ve-kvkk-aydinlatma-metni/', '/hizmet-sartlari-ve-kullanim-kosullari-2/'];

// lastmod yalnız içerikte gerçekten bulunan bir tarihten gelir; derleme tarihi kullanılmaz.
const enSon = (liste: (string | undefined | null)[]) => liste.filter((x): x is string => Boolean(x)).sort().at(-1);
const isoGun = (g: string, a: string, y: string) => `${y}-${a.padStart(2, '0')}-${g.padStart(2, '0')}`;
// DPB görüşü: başlıktaki "(04/06/2014-2768)" görüş tarihi.
const dpbTarihi = (baslik: string) => dpbTarihSayi(baslik).tarih;
// Adli çevre: kayıt metnindeki en son değişiklik tarihi (işlenen HSK kararı, özel çevre kararı, duyuru ya da bölge adliye değişikliği).
// Planlanan (henüz gelmemiş) değişiklik tarihleri lastmod olamaz. Üst sınır makine saatinden değil veriden gelir:
// HSK duyuru izleme kaydında işlenmiş son duyurunun tarihi.
const adliUst = enSon(hskIzleme.duyurular.map(d => d.date)) ?? '';
const kararTarihi = (metin: string) => { const ust = adliUst;
  return enSon([...metin.replace(/<[^>]+>/g, ' ').matchAll(/(\d{2})\/(\d{2})\/(\d{4})/g)].map(m => isoGun(m[1], m[2], m[3])).filter(t => t <= ust)); };
export const HARITA_GRUPLARI = ['sayfalar', 'yazilar', 'sozluk', 'mulakat', 'adlicevre', 'maas'] as const;
export type HaritaGrubu = (typeof HARITA_GRUPLARI)[number];

export async function haritaKayitlari(grup: HaritaGrubu): Promise<HaritaKaydi[]> {
  switch (grup) {
    case 'sayfalar': {
      // Araçlarda lastmod, dayandığı verinin yürürlük tarihidir (Layout.astro dateModified ile aynı kural).
      const son = (l: { baslangic: string }[]) => l.map(x => x.baslangic).sort().at(-1);
      const tarih = (yol: string) => { const t = araclar.find(a => a.tasindi && a.path === yol); if (!t) return undefined;
        return t.category === 'maas' ? son(ayarlar.donemler) : ['yargi', 'hukuk'].includes(t.category) ? [son(hukukTarifeleri.harclar), son(hukukTarifeleri.vekalet)].filter(Boolean).sort().at(-1) : undefined; };
      const yazilar = await getCollection('yazilar', y => !y.data.taslak);
      const yaziTarihi = (y: (typeof yazilar)[number]) => (y.data.updated ?? y.data.date).toISOString().slice(0, 10);
      const dpb = new Map(dpbGorusleri.map(g => [dpbYol(g.id), dpbTarihi(g.baslik)]));
      const kategori = new Map(yaziKategorileri.map(k => [`/yazilar/kategori/${k.id}/`, enSon(yazilar.filter(y => (y.data.kategori ?? []).some(c => kategoriYolu(c) === `/yazilar/kategori/${k.id}/`)).map(yaziTarihi))]));
      const bolum = (b: string) => enSon(araclar.filter(t => t.tasindi && t.path && (b === 'teftis' ? t.category === 'teftis' : ['maas', 'yargi', 'hukuk'].includes(t.category))).map(t => tarih(t.path!)));
      return [...new Set([...sabit,...yaziKategorileri.map(k=>`/yazilar/kategori/${k.id}/`), ...araclar.filter(t => t.tasindi && t.path).map(t => t.path!)])]
        .map(loc => ({ loc, lastmod: tarih(loc) ?? dpb.get(loc) ?? kategori.get(loc) ?? (loc === '/yazilar/' ? enSon(yazilar.map(yaziTarihi)) : loc.startsWith('/bolum/') ? bolum(loc.split('/')[2]) : undefined) }));
    }
    case 'yazilar': return (await getCollection('yazilar', y => !y.data.taslak))
      .map(y => ({ loc: `/${y.id}/`, lastmod: (y.data.updated ?? y.data.date).toISOString().slice(0, 10) }));
    case 'sozluk': return [...harfler.map(h => ({ loc: `/hukuk-sozlugu/harf/${h.slug}/`, lastmod: enSon(h.terimler.map(t => t.tarih)) })), ...terimler.map(t => ({ loc: terimHref(t), lastmod: t.tarih }))];
    case 'mulakat': return [...Array.from({ length: sayfaSayisi - 1 }, (_, i) => ({ loc: sayfaHref(i + 2), lastmod: enSon(sayfa(i + 2).map(s => s.tarih)) })), ...sorular.map(s => ({ loc: soruHref(s), lastmod: s.tarih }))];
    case 'adlicevre': return adliKayitlar.map(k => ({ loc: adliHref(k), lastmod: k.tarih ?? kararTarihi(k.icerik) }));
    // lastmod: o sayfadaki en son yayımlanan dönemin başlangıcı (derleme tarihi değil).
    case 'maas': {
      const yilSon = (y: number) => maasYayinlari.filter(a => a.yil === y).map(yayinTarihi).filter((x): x is string => Boolean(x)).sort().at(-1);
      return [...maasYillari.map(y => ({ loc: `/unvan-maaslari/${y}/`, lastmod: yilSon(y) })),
        ...maasYazilari.map(k => ({ loc: `/${k.slug}/`, lastmod: unvanDonemleri(k.unvanId, k.yil).map(d => yayinTarihi(d.yayin)).filter((x): x is string => Boolean(x)).sort().at(-1) }))];
    }
  }
}
const xml = (govde: string) => new Response(`<?xml version="1.0" encoding="UTF-8"?>${govde}`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
export const haritaYaniti = (kayitlar: HaritaKaydi[], site: URL) => xml(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${
  kayitlar.map(k => `<url><loc>${new URL(k.loc, site).href}</loc>${k.lastmod ? `<lastmod>${k.lastmod}</lastmod>` : ''}</url>`).join('')}</urlset>`);
export const dizinYaniti = async (site: URL) => {
  const satirlar = await Promise.all(HARITA_GRUPLARI.map(async g => {
    const son = (await haritaKayitlari(g)).map(k => k.lastmod).filter(Boolean).sort().at(-1);
    return `<sitemap><loc>${new URL(`/sitemap-${g}.xml`, site).href}</loc>${son ? `<lastmod>${son}</lastmod>` : ''}</sitemap>`;
  }));
  return xml(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${satirlar.join('')}</sitemapindex>`);
};
