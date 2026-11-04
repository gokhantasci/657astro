// SEO / AIO / GEO / AEO puanı: docs/seo-aio-geo-aeo-denetimi-20261103.md'deki ağırlıklarla, ölçütleri tarama ve Lighthouse sayılarından hesaplar.
// Kullanım: node scripts/seo-denetim/puan.mjs <tara.json> <ozet.json> [lighthouse-klasörü]
// Her ölçüt 0–1 oranıdır; puan = Σ ağırlık × oran. Elle verilen puan yoktur; formül her ölçütün yanında yazılıdır.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [taraYolu, ozetYolu, lhKlasor] = process.argv.slice(2);
const d = JSON.parse(readFileSync(taraYolu, 'utf8')), o = JSON.parse(readFileSync(ozetYolu, 'utf8'));
const sm = new Map(d.sm);
const idx = d.pages.filter(p => !p.refresh && !/noindex/i.test(p.robots) && !/^\/\d{3}\.html$/.test(p.p));
const n = idx.length, oran = (a, b) => (b ? a / b : 1), sinir = x => Math.max(0, Math.min(1, x));
const grup = p => sm.get(p.p)?.group ?? 'diger';
const araclar = JSON.parse(readFileSync('src/data/araclar.json', 'utf8')).araclar.filter(a => a.tasindi && a.path);
const aracSayfa = idx.filter(p => araclar.some(a => a.path === p.p));
// Hesap aracı: maaş, harç ve hukuk alanlarında sayısal sonuç üreten araçlar; belge, sorgu ve liste araçları hariç.
const BELGE = new Set(['udf', 'udf-goruntuleyici', 'udf-editor', 'udf-birlestirme', 'konsolosluk', 'almanya-posta', 'derdest', 'bosanma-karari', 'hukuk-mahkemeleri', 'hukuk-kasa']);
const hesap = aracSayfa.filter(p => { const a = araclar.find(a => a.path === p.p); return ['maas', 'yargi', 'hukuk'].includes(a.category) && !BELGE.has(a.id); });
const makale = idx.filter(p => p.types.some(t => /Article/.test(t)));
// Lighthouse ortalamaları (mobil ve masaüstü birlikte).
let lh = null;
if (lhKlasor && existsSync(lhKlasor)) {
  const r = readdirSync(lhKlasor).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(lhKlasor, f), 'utf8')));
  const ort = k => r.reduce((a, l) => a + (l.categories[k]?.score ?? 0), 0) / r.length;
  lh = { perf: ort('performance'), a11y: ort('accessibility'), bp: ort('best-practices'), seo: ort('seo'), adet: r.length };
}
const canli = existsSync('docs/seo-canli-eksik-adresler.json') ? JSON.parse(readFileSync('docs/seo-canli-eksik-adresler.json', 'utf8')).gruplar : {};
const wp = JSON.parse(readFileSync('src/data/wp-yonlendirmeler.json', 'utf8')).kurallar.map(k => k.eski);
const var_ = new Set(d.pages.map(p => p.p));
const canliEksik = Object.entries(canli).flatMap(([g, l]) => l.map(x => ({ g, ...x })));
// Etiketler 404 yedeği/Worker ile /yazilar/?q= adresine gider; not alanlılar bilinçli 410'dur.
const canliKarsilanan = canliEksik.filter(x => x.g === 'post_tag' || x.not || var_.has(x.yol) || wp.includes(x.yol)).length;

const alanlar = {
  SEO: [
    ['Taranabilirlik ve adres korunması', 15, 'ort(site haritası kapsamı, canonical doğru, canlı adres karşılanma, lastmod)', (oran(idx.filter(p => sm.has(p.p)).length, n) + oran(idx.filter(p => p.canonical && decodeURIComponent(p.canonical) === 'https://657.com.tr' + p.p).length, n) + oran(canliKarsilanan, canliEksik.length) + oran(sm.size - o.lastmodYok, sm.size)) / 4],
    ['Başlık etiketi', 10, '1 − (65+ karakter + tekrar + 30− karakter) / sayfa', 1 - (o.titleUzun + o.titleTekrar + o.titleKisa) / n],
    ['Meta açıklama', 8, '1 − (70− + 160+ + tekrar) / sayfa', 1 - (o.descKisa + o.descUzun + o.descTekrar) / n],
    ['Başlık hiyerarşisi', 7, '1 − (h1 yok + çok h1 + sıra atlama) / sayfa', 1 - (o.h1Yok + o.h1Cok + o.baslikAtlama) / n],
    ['Yapılandırılmış veri', 12, 'ort(araçta WebApplication, makalede tarih+yazar)', (oran(aracSayfa.filter(p => p.types.includes('WebApplication')).length, aracSayfa.length) + oran(makale.filter(p => p.lastmod && p.author).length, makale.length)) / 2],
    ['İç bağlantı', 10, '1 − (kırık hedef − Nginx yolları) / 100 − yetim / sayfa', 1 - Math.max(0, o.kirik - 12) / 100 - oran(o.yetim, n)],
    ['Performans', 12, 'Lighthouse performans ortalaması', lh?.perf ?? 0],
    ['Mobil ve erişilebilirlik', 8, 'Lighthouse erişilebilirlik ortalaması', lh?.a11y ?? 0],
    ['Sosyal paylaşım', 5, '1 − varsayılan OG görseli / sayfa', 1 - oran(o.ogImageVarsayilan, n)],
    ['İçerik kalitesi', 13, '1 − 150 kelimeden kısa sayfa / sayfa', 1 - oran(Object.values(o.gruplar).reduce((a, g) => a + g.thin, 0), n)],
  ],
  AIO: [
    ['Yapay zekâ tarayıcı erişimi', 20, 'robots.txt yapay zekâ botlarını engellemiyor ve llms.txt + llms-full.txt var', (/Disallow:\s*\/\s*$/m.test(readFileSync('dist/robots.txt', 'utf8')) ? 0 : 0.5) + (existsSync('dist/llms.txt') && existsSync('dist/llms-full.txt') ? 0.5 : 0)],
    ['İçeriğin sunucuda üretilmesi', 20, 'boş <main> olmayan sayfa oranı', 1 - oran(idx.filter(p => p.words < 20).length, n)],
    ['Varlık tanımı', 15, 'Organization: founder, description, email, PNG logo; WebSite: creator', (() => { const h = readFileSync('dist/index.html', 'utf8'); return ['"founder"', '"description"', '"email"', 'logo.png', '"creator"'].filter(k => h.includes(k)).length / 5; })()],
    ['Tazelik sinyali', 20, 'ort(lastmod oranı, hesap aracında dateModified, makalede tarih)', (oran(sm.size - o.lastmodYok, sm.size) + oran(hesap.filter(p => p.lastmod).length, hesap.length) + oran(makale.filter(p => p.lastmod).length, makale.length)) / 3],
    ['Snippet izinleri', 10, 'max-image-preview:large olan sayfa oranı (ana sayfa örneği)', readFileSync('dist/index.html', 'utf8').includes('max-image-preview:large') ? 1 : 0],
    ['Makinenin okuyabileceği veri', 15, 'tablo sayfalarında scope="col" oranı (ana şablonlar)', o.tabloScope ?? 0],
  ],
  GEO: [
    ['Kaynak ve atıf', 25, 'hesap araçları + makale + maaş sayfalarında resmî kaynak bağlantısı oranı', oran([...hesap, ...makale].filter(p => p.official > 0).length, hesap.length + makale.length)],
    ['Uzmanlık ve güven', 20, 'profil sayfası, founder, makalede yazar, araçta yazar', (Number(var_.has('/gokhan-tasci-profil/')) + Number(readFileSync('dist/index.html', 'utf8').includes('"founder"')) + oran(makale.filter(p => p.author).length, makale.length) + oran(aracSayfa.filter(p => p.author).length, aracSayfa.length)) / 4],
    ['Alıntılanabilir olgu', 15, 'hesap aracında doğrudan yanıt cümlesi oranı', oran(hesap.filter(p => p.dogrudanYanit).length, hesap.length)],
    ['Özgünlük ve derinlik', 15, '1 − ince sayfa oranı', 1 - oran(Object.values(o.gruplar).reduce((a, g) => a + g.thin, 0), n)],
    ['Tazelik', 15, 'AIO tazelik ile aynı formül', null],
    ['Marka ve varlık tutarlılığı', 10, 'başlık soneki ve og:site_name tutarlılığı', oran(idx.filter(p => / \| 657\.com\.tr$/.test(p.title) || p.p === '/').length, n)],
  ],
  AEO: [
    ['Soru biçimli içerik', 20, 'hesap aracında SSS (soru başlığı ya da FAQPage) oranı', oran(hesap.filter(p => p.types.includes('FAQPage')).length, hesap.length)],
    ['İlk paragrafta doğrudan yanıt', 25, 'hesap aracında doğrudan yanıt oranı', oran(hesap.filter(p => p.dogrudanYanit).length, hesap.length)],
    ['FAQ ve soru şeması', 15, 'araç + mülakat sayfalarında FAQPage oranı', oran([...aracSayfa, ...idx.filter(p => grup(p) === 'mulakat' && p.p.split('/').length === 3)].filter(p => p.types.includes('FAQPage')).length, aracSayfa.length + idx.filter(p => grup(p) === 'mulakat' && p.p.split('/').length === 3).length)],
    ['Tablo ve liste', 15, 'tablo ya da liste içeren sayfa oranı', oran(idx.filter(p => p.tables || p.lists || p.dl).length, n)],
    ['Adım adım anlatım', 15, 'hesap aracında numaralı adım (HowTo/ol) oranı', oran(hesap.filter(p => p.adimlar).length, hesap.length)],
    ['Kısa özet', 10, 'hesap aracında doğrudan yanıt oranı', oran(hesap.filter(p => p.dogrudanYanit).length, hesap.length)],
  ],
};
const tazelik = alanlar.AIO.find(x => x[0] === 'Tazelik sinyali')[3];
alanlar.GEO.find(x => x[0] === 'Tazelik')[3] = tazelik;

const sonuc = {};
for (const [ad, liste] of Object.entries(alanlar)) {
  let toplam = 0;
  console.log(`\n## ${ad}`);
  for (const [olcut, agirlik, formul, deger] of liste) {
    const v = sinir(deger ?? 0); toplam += agirlik * v;
    console.log(`${String((v * 100).toFixed(1)).padStart(6)}%  ×${String(agirlik).padStart(2)}  ${olcut}  (${formul})`);
  }
  sonuc[ad] = toplam;
  console.log(`= ${toplam.toFixed(1)} / 100`);
}
const genel = sonuc.SEO * 0.35 + sonuc.AIO * 0.2 + sonuc.GEO * 0.25 + sonuc.AEO * 0.2;
console.log(`\nGenel: ${genel.toFixed(1)} / 100${lh ? `  (Lighthouse ${lh.adet} ölçüm)` : '  (Lighthouse yok: performans ve erişilebilirlik 0 sayıldı)'}`);
