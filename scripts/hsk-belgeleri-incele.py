"""HSK rehber ve karar eklerini indirir; metin/tablo inceleme çıktısı üretir."""
from pathlib import Path
from lxml import html
from urllib.request import urlopen
from urllib.parse import urljoin,urlsplit
from concurrent.futures import ThreadPoolExecutor
import json,re,hashlib
import fitz
root=Path('artifacts/hsk-20261104')
rehber=json.loads((root/'adli-ve-idari-yargi-listesi.json').read_text(encoding='utf-8'))
names={'Ağır Ceza Merkezleri':'adli-rehber','Cumhuriyet Başsavcılıkları':'bassavcilik','BAM Merkezleri Haritası':'bam-harita','İdari Yargı Merkezleri':'idari-rehber','BİM Merkezleri Haritası':'bim-harita'}
jobs=[(names[a['ad']],a['url'])for a in rehber['baglantilar']if a['ad']in names]
pages=[]
for year in [2024,2025,2026]:
 for a in json.loads((root/f'Arsiv-duyuru-{year}.json').read_text(encoding='utf-8'))['baglantilar']:
  if re.search('çevre|faaliyete|bölge derecesi',a['ad'],re.I):pages.append(a)
for a in pages:
 slug=urlsplit(a['url']).path.strip('/');p=root/(slug+'.html')
 if not p.exists():p.write_bytes(urlopen(a['url'],timeout=30).read())
 d=html.fromstring(p.read_bytes());body=d.find_class('icicerik')[0]
 a['metin']=body.text_content().strip();a['ekler']=[]
 for n in body.xpath('.//a[@href]'):
  u=urljoin(a['url'],n.get('href'))
  if '.pdf' in u.lower()and urlsplit(u).hostname in ['hsk.gov.tr','www.hsk.gov.tr']:
   name=urlsplit(u).path.split('/')[-1];a['ekler'].append({'ad':n.text_content(),'url':u,'dosya':name});jobs.append((name.removesuffix('.pdf'),u))
(root/'kararlar.json').write_text(json.dumps(pages,ensure_ascii=False,indent=1),encoding='utf-8')
def pdf(job):
 name,url=job;p=root/(name+'.pdf')
 if not p.exists():p.write_bytes(urlopen(url,timeout=30).read())
 doc=fitz.open(p);texts=[page.get_text(sort=True)for page in doc]
 (root/(name+'.txt')).write_text('\n\n'.join(texts),encoding='utf-8')
 if name in ['adli-rehber','idari-rehber','bam-harita','bim-harita']:
  doc[0].get_pixmap(matrix=fitz.Matrix(1.3,1.3)).save(root/(name+'-sayfa1.png'))
 return {'dosya':name+'.pdf','url':url,'sayfa':len(doc),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
with ThreadPoolExecutor(max_workers=4)as pool:manifest=list(pool.map(pdf,list(dict.fromkeys(jobs))))
(root/'belgeler.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=1),encoding='utf-8')
for row in manifest:print(json.dumps(row,ensure_ascii=False))
d=html.fromstring((root/'en-yakin-asliye-hukuk-mahkemeleri.html').read_bytes());print('ASLIYE HUKUK:',[n.text_content()[:600]for n in d.find_class('icicerik')]);print('ASLIYE EKLER:',d.xpath('//a[contains(@href,"Eklentiler")]/@href'))
