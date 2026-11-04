"""Arşiv sayaçlarına göre en çok okunan, kişisel liste içermeyen haberleri aktarır."""
from pathlib import Path
from urllib.parse import urlencode
from wp_common import Clean
from yayin_filtresi import yayin_disi
import json,re,html,subprocess,unicodedata
root=Path(__file__).resolve().parents[1]
views=json.loads((root/'src/data/okunma.json').read_text(encoding='utf-8'))['wp']
cards={x['slug'] for x in json.loads((root/'src/data/mulakat.json').read_text(encoding='utf-8'))}
def norm(s):return ''.join(c for c in unicodedata.normalize('NFD',s.lower().replace('ı','i')) if unicodedata.category(c)!='Mn')
def excluded(title,body=''):
 return yayin_disi(title,body)
slugs=[p.strip('/') for p,n in sorted(views.items(),key=lambda v:-v[1]) if p.count('/')==2 and p.strip('/') not in cards and not excluded(p)][:80]
rows=[]
for start in range(0,len(slugs),20):
 query=urlencode({'per_page':100,'slug':','.join(slugs[start:start+20]),'_fields':'slug,title,content,date,modified'})
 cmd='curl -ks --resolve "657.com.tr:443:$(hostname -I | cut -d" " -f1)" '+"'https://657.com.tr/wp-json/wp/v2/posts?"+query+"'"
 rows+=json.loads(subprocess.run(['ssh','-o','BatchMode=yes','kickhex-production',cmd],capture_output=True,check=True).stdout)
saved=[]
for r in rows:
 slug=r['slug'];dest=root/'src/content/yazilar'/f'{slug}.md'
 if dest.exists() or re.search(r'maasi-20\d\d$',slug) or slug in ['avukatlik-asgari-ucret-tarifesi-2024','cmk-avukatlik-asgari-ucret-tarifesi-2024']:continue
 title=html.unescape(re.sub('<[^>]+>','',r['title']['rendered']));body=r['content']['rendered']
 if excluded(title,body):continue
 clean=Clean();clean.feed(body);body=''.join(clean.out)
 desc=re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',body))).strip()[:160]
 if not desc:continue
 fields=dict(title=title,description=desc,date=r['date'][:10],updated=r['modified'][:10],kategori=['Faydalı'],kaynak='https://657.com.tr/'+slug+'/')
 dest.write_text('---\n'+'\n'.join(k+': '+json.dumps(v,ensure_ascii=False) for k,v in fields.items())+'\n---\n\n'+body+'\n',encoding='utf-8');saved.append(slug)
# İstenmeyen eski yazılar yayından ve kaynak deposundan çıkarılır; kişisel içerik rapora kopyalanmaz.
removed=[]
for path in (root/'src/content/yazilar').glob('*.md'):
 s=path.read_text(encoding='utf-8');m=re.search(r'^title: (.+)$',s,re.M)
 if m and excluded(m[1],s):removed.append(path.stem);path.unlink()
report={'aktarilan':saved,'yayindanKaldirilan':removed,'kriter':'Kararname ve sicil/ad-soyad/görev yeri listeleri hariç; soru kartları aktarılmaz.'}
(root/'src/data/yazi-aktarim-denetimi.json').write_text(json.dumps(report,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
print(len(saved),'popüler yazı aktarıldı;',len(removed),'uygun olmayan eski yazı kaldırıldı.')
