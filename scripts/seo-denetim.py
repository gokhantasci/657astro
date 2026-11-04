"""Üretim HTML'inde h1, canonical, açıklama, yapısal veri ve sitemap hedeflerini denetler."""
import json,sys,subprocess,xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse,unquote

class Page(HTMLParser):
 def __init__(self):
  super().__init__();self.h1=0;self.canonical=[];self.description=[];self.noindex=False;self.ld=[];self.script=None;self.image_errors=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='h1':self.h1+=1
  if tag=='link' and a.get('rel')=='canonical':self.canonical.append(a.get('href',''))
  if tag=='meta' and a.get('name')=='description':self.description.append(a.get('content',''))
  if tag=='meta' and a.get('name')=='robots' and 'noindex' in a.get('content',''):self.noindex=True
  if tag=='img' and 'alt' not in a:self.image_errors+=1
  if tag=='script' and a.get('type')=='application/ld+json':self.script=''
 def handle_data(self,data):
  if self.script is not None:self.script+=data
 def handle_endtag(self,tag):
  if tag=='script' and self.script is not None:
   try:self.ld.append(json.loads(self.script))
   except json.JSONDecodeError:self.ld.append(None)
   self.script=None

root=Path(sys.argv[1] if len(sys.argv)>1 else 'dist');errors=[];count=0;canonicals={};skipped=0
files=[Path(p) for p in subprocess.check_output(['rg','--files',str(root),'-g','*.html'],text=True,encoding='utf-8').splitlines()]
def parse(path):
 p=Page();p.feed(path.read_text(encoding='utf-8'));return path,p
pool=ThreadPoolExecutor(max_workers=8)
for path,p in pool.map(parse,files):
 count+=1
 if count%2000==0:print('HTML',count,flush=True)
 if p.noindex:skipped+=1;continue
 issues=[]
 if p.h1!=1:issues.append('h1:'+str(p.h1))
 if len(p.canonical)!=1 or not p.canonical[0].startswith('https://657.com.tr/'):issues.append('canonical')
 if len(p.description)!=1 or not p.description[0].strip():issues.append('description')
 if not p.ld or None in p.ld:issues.append('jsonld')
 if p.image_errors:issues.append('alt:'+str(p.image_errors))
 for c in p.canonical:
  if c in canonicals:issues.append('duplicate canonical:'+canonicals[c])
  canonicals[c]=str(path.relative_to(root))
 if issues:errors.append({'path':str(path.relative_to(root)),'issues':issues})
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'};urls=0
for sm in root.glob('sitemap-*.xml'):
 for tag in ET.parse(sm).getroot().findall('s:url/s:loc',ns):
  urls+=1;p=unquote(urlparse(tag.text).path).strip('/');target=root/p/'index.html'
  if not target.is_file():errors.append({'sitemap':sm.name,'missing':p})
result={'html':count,'noindex':skipped,'sitemapUrls':urls,'errors':errors};out=Path('artifacts/seo-denetim.json');out.write_text(json.dumps(result,ensure_ascii=False,indent=1),encoding='utf-8');print(json.dumps({k:v for k,v in result.items() if k!='errors'}),'errors',len(errors));sys.exit(bool(errors))
