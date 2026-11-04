"""İndekslenebilir HTML sayfalarının köke bağlı gezinme hedeflerini doğrular."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,unquote
from concurrent.futures import ThreadPoolExecutor
import subprocess,json,sys
class Page(HTMLParser):
 def __init__(self):super().__init__();self.noindex=False;self.links=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='meta' and a.get('name')=='robots' and 'noindex' in a.get('content',''):self.noindex=True
  if tag=='a' and a.get('href','').startswith('/') and not a['href'].startswith('//'):self.links.append(a['href'])
root=Path('dist')
def check(path):
 p=Page();p.feed(Path(path).read_text(encoding='utf-8'))
 if p.noindex:return []
 errors=[]
 for href in set(p.links):
  target=root/unquote(urlsplit(href).path).lstrip('/')
  if not target.is_file() and not (target/'index.html').is_file():errors.append({'source':str(Path(path).relative_to(root)),'href':href})
 return errors
files=subprocess.check_output(['rg','--files','dist','-g','*.html'],text=True,encoding='utf-8').splitlines()
with ThreadPoolExecutor(max_workers=8)as pool:errors=[e for row in pool.map(check,files)for e in row]
Path('artifacts/baglanti-denetim.json').write_text(json.dumps(errors,ensure_ascii=False,indent=1),encoding='utf-8')
print(f'{len(files)} HTML; {len(errors)} eksik kök bağlantısı. Rapor: artifacts/baglanti-denetim.json')
sys.exit(bool(errors))
