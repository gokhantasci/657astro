"""Maaş yazılarının mevcut adreslerini ve arşiv gövdelerini taşır."""
from wp_common import fetch, Clean
from pathlib import Path
import json,re,html
rows=[]
base='https://657.com.tr/wp-json/wp/v2/posts?search=maas&per_page=100&orderby=id&order=asc&_fields=id,slug,title,content,date,modified'
page=1
while True:
    batch,pages=fetch(base+'&page='+str(page));rows.extend(batch)
    if page>=pages:break
    page+=1
out=[]
for r in rows:
    if not re.search(r'maasi-20\d\d(?:-\d+)?$',r['slug']):continue
    cleaner=Clean();cleaner.feed(r['content']['rendered'])
    out.append({'slug':r['slug'],'baslik':html.unescape(r['title']['rendered']),'icerik':''.join(cleaner.out),'yil':int(re.search(r'maasi-(20\d\d)',r['slug'])[1]),'tarih':r['modified'][:10]})
Path('src/data/maas-yazilari.json').write_text(json.dumps(out,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
print(len(out),'maaş yazısı');print('\n'.join(x['baslik'] for x in out if x['yil']==2026))
