"""Öncelik verilen tarife, sınav ve kararname grubundan en yeni 50 yazıyı aktarır."""
from wp_common import fetch, Clean
from pathlib import Path
from urllib.parse import quote, urlsplit, unquote
from urllib.request import urlopen, Request
from urllib.error import HTTPError
import json, re, html, sys

root=Path(__file__).resolve().parents[1]
legacy_root=Path(sys.argv[sys.argv.index('--legacy-root')+1]).resolve() if '--legacy-root' in sys.argv else None
kartlar={r['slug'] for r in json.loads((root/'src/data/mulakat.json').read_text(encoding='utf-8'))}
manifest_path=root/'artifacts/sources/yazi-aktarim.json'
# Önceki bu aktarımın oluşturduğu kart kopyalarını kaldır; asıl kart verisi korunur.
if manifest_path.exists():
    onceki=json.loads(manifest_path.read_text(encoding='utf-8'))
    for slug in onceki.get('eklenen',[]):
        if slug in kartlar and re.fullmatch('[a-z0-9-]+',slug):
            target=(root/'src/content/yazilar'/f'{slug}.md').resolve()
            if target.parent==(root/'src/content/yazilar').resolve():target.unlink(missing_ok=True)
rows={}
for term in ['tarife','ücret','mülakat','kararname','nakil','atama','GYS','ÜDS']:
    base='https://657.com.tr/wp-json/wp/v2/posts?per_page=100&orderby=id&order=asc&_fields=id,slug,title,content,date,modified&search='+quote(term)
    page=1
    while True:
        batch,pages=fetch(base+'&page='+str(page))
        for r in batch:rows[r['id']]=r
        if page>=pages:break
        page+=1
regex=r'tarife|ucret|mulakat|kararname|nakil|atama|gys|uds'
candidates=[r for r in rows.values() if r['slug'] not in kartlar and re.search(regex,r['slug']) and not re.search(r'maasi-20\d\d',r['slug']) and r['date'][:10]<='2026-10-29']
candidates.sort(key=lambda r:(r['date'],r['id']),reverse=True)
selected=candidates[:50]
saved=[];assets={};missing=[]

def asset(url):
    u=urlsplit(url)
    if u.hostname not in ('657.com.tr','www.657.com.tr') or not (u.path.startswith('/wp-content/uploads/') or re.search(r'\.(pdf|rar|zip|xlsx|docx)$',u.path,re.I)):return url
    # Yalnızca metinde gerçekten başvurulan dosyalar; hedef public/ altında kalır.
    relative=unquote(u.path).lstrip('/')
    destination=(root/'public'/relative).resolve()
    if not destination.is_relative_to((root/'public').resolve()):raise ValueError('Geçersiz varlık yolu')
    if not destination.exists():
        destination.parent.mkdir(parents=True,exist_ok=True)
        try:
            with urlopen(Request('https://657.com.tr'+quote(u.path,safe='/%'),headers={'User-Agent':'657-static-migration/1.0'})) as response:
                destination.write_bytes(response.read())
        except HTTPError as error:
            print('Kaynakta bulunamadı:',url)
            local=(legacy_root/relative).resolve() if legacy_root else None
            if local and local.is_relative_to(legacy_root) and local.is_file():
                destination.write_bytes(local.read_bytes())
                assets[u.path]=destination.stat().st_size
                return u.path
            if error.code!=404 or '/' in u.path.strip('/'):raise
            fallback='https://657.com.tr/wp-content/themes/teftis/657/'+quote(u.path.strip('/'))
            with urlopen(Request(fallback,headers={'User-Agent':'657-static-migration/1.0'})) as response:
                destination.write_bytes(response.read())
    assets[u.path]=destination.stat().st_size
    return u.path

class WithImages(Clean):
    allowed=Clean.allowed|{'img'}
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='img' and not self.skip:
            src=attrs.get('data-src') or attrs.get('data-lazy-src') or attrs.get('src','')
            if 'data:image' in src:return
            if src.startswith('/'):src='https://657.com.tr'+src
            if not src.startswith(('https://','http://')):return
            try:src=asset(src)
            except HTTPError as error:
                if error.code!=404:raise
                missing.append(src)
                self.out.append('<p>Bu arşiv yazısının görseli kaynakta bulunamadı.</p>')
                return
            self.out.append('<img src="'+html.escape(src,quote=True)+'" alt="'+html.escape(attrs.get('alt',''),quote=True)+'" loading="lazy"/>')
        elif tag=='a':
            href=attrs.get('href','')
            if href.startswith('/') and (href.startswith('/wp-content/uploads/') or re.search(r'\.(pdf|rar|zip|xlsx|docx)$',href,re.I)):href='https://657.com.tr'+href
            attrs['href']=asset(href)
            super().handle_starttag(tag,list(attrs.items()))
        else:super().handle_starttag(tag,list(attrs.items()))

for r in selected:
    slug=r['slug']
    if not re.fullmatch(r'[a-z0-9-]+',slug):raise ValueError(slug)
    dest=root/'src/content/yazilar'/f'{slug}.md'
    originals={'rize-egitim-merkezine-kenan-ipek-ismi-verildi','ptt-uets-ucret-tarifesi-guncellemesi-yayimladi','haziran-ayi-enflasyon-rakamlari-aciklandi-2','adalet-bakanligi-kadrolu-personelin-istege-bagli-nakil-sonuclari-yayimlandi'}
    if dest.exists() and ('--refresh' not in sys.argv or slug in originals):continue
    cleaner=WithImages();cleaner.feed(r['content']['rendered'])
    body=''.join(cleaner.out)
    text=html.unescape(re.sub('<[^>]+>',' ',body));text=re.sub(r'\s+',' ',text).strip()
    if not text:continue
    category='Kararnameler' if re.search('kararname|nakil|atama',slug) else 'Sınavlar' if re.search('mulakat|gys|uds',slug) else 'Tarifeler'
    fields={'title':html.unescape(r['title']['rendered']),'description':text[:157]+'…' if len(text)>160 else text,'date':r['date'][:10],'updated':r['modified'][:10],'kategori':[category],'kaynak':'https://657.com.tr/'+slug+'/'}
    front='\n'.join(k+': '+json.dumps(v,ensure_ascii=False) for k,v in fields.items())
    dest.write_text('---\n'+front+'\n---\n\n'+body+'\n',encoding='utf-8')
    saved.append(slug)
manifest={'aktarim':'2026-10-29','secilen':len(selected),'eklenen':saved,'varliklar':assets,'eksik_gorseller':missing}
(root/'artifacts/sources/yazi-aktarim.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=1),encoding='utf-8')
print(len(saved),'yazı eklendi;',len(assets),'varlık indirildi.')
