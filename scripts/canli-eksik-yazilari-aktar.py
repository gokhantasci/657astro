"""Canlı WordPress'te olup Astro'da bulunmayan yazıları aktarır (SEO yol haritası P0-1).

Kaynak liste: docs/seo-canli-eksik-adresler.json → gruplar.post. Yazılar herkese açık REST API'den okunur (yalnız okuma).
Aktarılmayanlar ve nedeni docs/seo-yazi-aktarimi.json dosyasına yazılır:
  - kisisel: kararname, atama/tayin sonucu, ad-soyad ya da sicil listesi içerebilir (bunlar 410 alır, aktarılmaz)
  - mulakat: soru kartı; mülakat soruları ayrı veri setinden yayımlanır
  - bulunamadi: REST API yazıyı döndürmedi
Görseller wp_common.Clean ile atılır (izin verilen etiketler arasında img yok). Kullanım: python scripts/canli-eksik-yazilari-aktar.py
"""
import html, json, re, sys, time
from pathlib import Path
from urllib.parse import quote
sys.path.insert(0, str(Path(__file__).resolve().parent))
from wp_common import Clean, fetch

KOK = Path(__file__).resolve().parents[1]
API = 'https://657.com.tr/wp-json/wp/v2'
KISISEL = re.compile(r'kararname|kura\b|atama sonu|tayin sonu|tayinleri|nakil sonu|isteğe bağlı (atama|nakil)|müstemir|mazeret|sicil|adı soyadı|ad soyad|t\.?\s?c\.? kimlik|havuz|birleştirilmiş liste|seçme kararları|üyeliklerine seçilen|görevden alındı|yeni atama|personel listesi', re.I)

def trk(m): return m.replace('I', 'ı').replace('İ', 'i').lower()

eksik = json.loads((KOK / 'docs/seo-canli-eksik-adresler.json').read_text(encoding='utf-8'))['gruplar']['post']
mevcut = {p.stem for p in (KOK / 'src/content/yazilar').glob('*.md')}
hedef = [x['yol'].strip('/') for x in eksik if 'not' not in x and x['yol'].strip('/') not in mevcut]
kategoriler, _ = fetch(f'{API}/categories?per_page=100&_fields=id,name')
kat = {k['id']: html.unescape(k['name']) for k in kategoriler}

rapor = {'aciklama': __doc__.strip().splitlines()[0], 'aktarilan': [], 'aktarilmayan': []}
for i in range(0, len(hedef), 20):
    grup = hedef[i:i + 20]
    satirlar, _ = fetch(f'{API}/posts?per_page=20&_fields=slug,title,content,date,modified,categories&slug=' + ','.join(quote(s, safe='') for s in grup))
    bulunan = {r['slug']: r for r in satirlar}
    for slug in grup:
        r = bulunan.get(slug) or bulunan.get(quote(slug, safe='').lower())
        if not r:
            rapor['aktarilmayan'].append({'yol': f'/{slug}/', 'neden': 'bulunamadi'}); continue
        baslik = html.unescape(re.sub('<[^>]+>', '', r['title']['rendered'])).strip()
        govde = r['content']['rendered']
        adlar = [kat.get(c, '') for c in r.get('categories', [])]
        if any(re.search(r'hatırlatma|mülakat', a, re.I) for a in adlar):
            rapor['aktarilmayan'].append({'yol': f'/{slug}/', 'baslik': baslik, 'neden': 'mulakat'}); continue
        # Python'un büyük/küçük harf eşlemesi Türkçe değildir (I → i); metin önce Türkçe kurala göre küçültülür.
        if KISISEL.search(trk(baslik + ' ' + re.sub('<[^>]+>', ' ', govde))):
            rapor['aktarilmayan'].append({'yol': f'/{slug}/', 'baslik': baslik, 'neden': 'kisisel'}); continue
        temiz = Clean(); temiz.feed(govde); govde = ''.join(temiz.out).strip()
        metin = re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', ' ', govde))).strip()
        if len(metin) < 40:
            rapor['aktarilmayan'].append({'yol': f'/{slug}/', 'baslik': baslik, 'neden': 'icerik-yok'}); continue
        aciklama = metin[:157].rsplit(' ', 1)[0] + '…' if len(metin) > 160 else metin
        alanlar = {'title': baslik, 'description': aciklama, 'date': r['date'][:10], 'updated': r['modified'][:10],
                   'kategori': [a for a in adlar if a and a not in ('Manşet', 'Genel', 'Kategorisiz')] or ['Haberler'],
                   'kaynak': f'https://657.com.tr/{slug}/'}
        on = '---\n' + '\n'.join(k + ': ' + json.dumps(v, ensure_ascii=False) for k, v in alanlar.items()) + '\n---\n\n'
        (KOK / 'src/content/yazilar' / f'{slug}.md').write_text(on + govde + '\n', encoding='utf-8')
        rapor['aktarilan'].append({'yol': f'/{slug}/', 'baslik': baslik})
    time.sleep(1)

(KOK / 'docs/seo-yazi-aktarimi.json').write_text(json.dumps(rapor, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
from collections import Counter
print('aktarılan', len(rapor['aktarilan']), dict(Counter(x['neden'] for x in rapor['aktarilmayan'])))
