"""657'nin yayımladığı DPB dizinini ve resmî görüş PDF'lerini yerel arşive aktarır."""
from pathlib import Path
from html.parser import HTMLParser
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request,urlopen
from urllib.parse import urlsplit,unquote
import json,hashlib,re
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parent.parent
raw=json.loads((ROOT/'artifacts/kaynak-onbellek/wp-dosyalar-dpb.json').read_text(encoding='utf-8'))
post=next(r for r in raw if str(r['ID'])=='1073')
class Links(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.href=None;self.text=[]
 def handle_starttag(self,tag,attrs):
  if tag=='a':self.href=dict(attrs).get('href');self.text=[]
 def handle_data(self,text):
  if self.href:self.text.append(text)
 def handle_endtag(self,tag):
  if tag=='a' and self.href:
   if self.href.lower().endswith('.pdf'):self.rows.append((self.href,''.join(self.text).strip()))
   self.href=None
p=Links();p.feed(post['post_content'])
links=dict(p.rows);folder=ROOT/'public/dosyalar/dpb';folder.mkdir(parents=True,exist_ok=True)
def get(item):
 url,title=item;url=url.replace('http://','https://');name=Path(unquote(urlsplit(url).path)).name
 # Ege dizininde 404 olan iki görüşün Bartın Üniversitesi resmî arşiv kopyası.
 fallback={'28aaa.pdf':'https://cdn.bartin.edu.tr/personel/ae8f57c8ad4254b5019c6fb31b079871/28_CZBhbfs.pdf',
           '29aaa.pdf':'https://cdn.bartin.edu.tr/personel/ae8f57c8ad4254b5019c6fb31b079871/29_noWZlfU.pdf'}
 url=fallback.get(name,url)
 if not re.fullmatch(r'[a-zA-Z0-9_.-]+',name):raise ValueError('Geçersiz dosya adı')
 target=folder/name
 try:
  if not target.exists():
   with urlopen(Request(url,headers={'User-Agent':'657-archive/1.0'}),timeout=35) as r:body=r.read(20*1024*1024)
   if not body.startswith(b'%PDF-'):raise ValueError('PDF olmayan yanıt')
   target.write_bytes(body)
  pdf=PdfReader(target);text='\n'.join(page.extract_text() for page in pdf.pages)
  return {'id':name[:-4],'baslik':title,'kaynak':url,'dosya':'/dosyalar/dpb/'+name,'metin':re.sub(r'\s+',' ',text).strip(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sayfa':len(pdf.pages)}
 except Exception as e:return {'kaynak':url,'baslik':title,'hata':type(e).__name__}
rows=[]
with ThreadPoolExecutor(max_workers=3) as pool:
 for i,row in enumerate(pool.map(get,links.items()),1):
  rows.append(row)
  if i%50==0:print('DPB',i,'/',len(links),flush=True)
ok=[r for r in rows if 'hata' not in r];bad=[r for r in rows if 'hata' in r]
(ROOT/'src/data/dpb-gorusleri.json').write_text(json.dumps(ok,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
(ROOT/'artifacts/dpb-aktarim-hatalari.json').write_text(json.dumps(bad,ensure_ascii=False,indent=1),encoding='utf-8')
print('DPB tamamlandı:',len(ok),'görüş/bülten;',len(bad),'alınamayan kaynak')
