"""Resmî genelge dizini -> kaynak SHA256 + sayfa metinleri; OCR çıktısı ayrıca işaretlenir."""
import hashlib,json,os,re,subprocess,tempfile,threading,unicodedata,time
from urllib.error import HTTPError
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urljoin,quote
from concurrent.futures import ThreadPoolExecutor,as_completed
from bs4 import BeautifulSoup
import pymupdf

ROOT=Path(__file__).resolve().parents[1]
SOURCE='https://adalet.gov.tr/genelgeler'
CACHE=Path(os.getenv('GENELGE_KAYNAK_KLASORU',str(ROOT/'artifacts/genelge-kaynaklari')))
CACHE.mkdir(parents=True,exist_ok=True)
def fetch(url):
 for attempt in range(3):
  try:
   with urlopen(Request(quote(url,safe=':/%?=&'),headers={'User-Agent':'Mozilla/5.0 (657 document archive)','Accept-Language':'tr-TR'}),timeout=90) as r:return r.read()
  except Exception as error:
   if attempt==2:raise
   delay=max(60,int(error.headers.get('Retry-After','60'))) if isinstance(error,HTTPError) and error.code==429 else attempt+1
   time.sleep(min(delay,120))
html=fetch(SOURCE)
(CACHE/'dizin.html').write_bytes(html)
soup=BeautifulSoup(html,'html.parser');records=[];seen=set();grup='Adalet Bakanlığı'
for tr in soup.select('tr'):
 cells=tr.select('td');link=tr.select_one('a[href]')
 if not cells:continue
 title=cells[0].get_text(' ',strip=True)
 if not link:
  if title:grup=title
  continue
 url=urljoin(SOURCE,link['href'])
 if '.pdf' not in url.lower() or (title,url) in seen:continue
 seen.add((title,url));records.append(dict(baslik=title,kaynak=url,grup=grup))

process=subprocess.Popen(['node',str(ROOT/'scripts/ocr-genelge.mjs')],cwd=ROOT,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=open(CACHE/'ocr.log','w',encoding='utf-8'),text=True,encoding='utf-8',bufsize=1)
ready=json.loads(process.stdout.readline());assert ready.get('ready'),ready
pending={};lock=threading.Lock();serial=0
def reader():
 for line in process.stdout:
  response=json.loads(line)
  with lock:
   item=pending.get(response['id'])
   if item:item['response']=response;item['event'].set()
 with lock:
  for item in pending.values():item['response']={'error':'OCR işlemi kapandı'};item['event'].set()
threading.Thread(target=reader,daemon=True).start()
def ocr(image):
 global serial
 with lock:
  serial+=1;key=serial;item={'event':threading.Event()};pending[key]=item
  process.stdin.write(json.dumps({'id':key,'path':str(image)})+'\n');process.stdin.flush()
 if not item['event'].wait(180):raise RuntimeError('OCR zaman aşımı')
 with lock:pending.pop(key)
 result=item['response']
 if result.get('error'):raise RuntimeError(result['error'])
 return result

def convert(record):
 key=hashlib.sha256(record['kaynak'].encode()).hexdigest()[:12]
 pdf_path=CACHE/(key+'.pdf');output=CACHE/(key+'.json')
 access=record['kaynak']
 if access=='https://rayp.adalet.gov.tr/Resimler/pdf/171.pdf':
  access='https://bilirkisilik.adalet.gov.tr/Resimler/SayfaDokuman/272020154552171nolugenelgeveekleri.pdf'
 if record['baslik'].startswith('68/1') and '63-2-' in access:
  access='https://rayp.adalet.gov.tr/Resimler/pdf/68-1.pdf'
  source=CACHE/(hashlib.sha256(access.encode()).hexdigest()[:12]+'.json')
  if source.exists():
   same=json.loads(source.read_text(encoding='utf-8'));same.update(record);same['erisimKaynak']=access;same['kaynakNotu']='Bakanlık dizinindeki 68/1 bağlantısı 63/2 belgesine gittiğinden, aynı resmî dizindeki 68/1 PDF’si kullanıldı.'
   output.write_text(json.dumps(same,ensure_ascii=False,indent=1)+'\n',encoding='utf-8');return same
 if access.startswith('http://www.icdenetim.adalet.gov.tr/'):
  access='https://web.archive.org/web/20141023003625id_/http://www.icdenetim.adalet.gov.tr:80/Genelge/genelge_01.pdf'
 if output.exists():return {**json.loads(output.read_text(encoding='utf-8')),**record}
 if not pdf_path.exists():pdf_path.write_bytes(fetch(access))
 body=pdf_path.read_bytes();assert body.startswith(b'%PDF-')
 pdf=pymupdf.open(stream=body,filetype='pdf');pages=[]
 for n,page in enumerate(pdf,1):
  text=page.get_text('text',sort=True).strip();letters=sum(c.isalpha() for c in text)
  row={'no':n,'metin':text,'yontem':'pdf'}
  if letters<100:
   with tempfile.TemporaryDirectory(prefix='657-genelge-') as temp:
    image=Path(temp)/'sayfa.png';page.get_pixmap(dpi=250).save(image);result=ocr(image)
   row.update(metin=result['text'].strip(),yontem='ocr',guven=result['confidence'],dusukGuven=result['lowConfidence'])
  pages.append(row)
 slug=unicodedata.normalize('NFKD',record['baslik'].lower().translate(str.maketrans('ı','i'))).encode('ascii','ignore').decode()
 slug=re.sub('[^a-z0-9]+','-',slug).strip('-')[:100]
 item={**record,'id':slug+'-'+key[:6],'dizin':SOURCE,'sha256':hashlib.sha256(body).hexdigest(),'sayfalar':pages,'sayfa':len(pages)}
 if access!=record['kaynak']:item['erisimKaynak']=access
 output.write_text(json.dumps(item,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
 return item

results=[];errors=[]
try:
 with ThreadPoolExecutor(max_workers=3) as pool:
  jobs={pool.submit(convert,r):r for r in records}
  for future in as_completed(jobs):
   try:
    r=future.result();results.append(r);print(json.dumps({'done':len(results),'total':len(records),'title':r['baslik'],'pages':r['sayfa']},ensure_ascii=False),flush=True)
   except Exception as e:errors.append({**jobs[future],'hata':str(e)});print('ERROR',str(e),flush=True)
finally:
 try:process.stdin.close()
 except OSError:pass
 process.wait(timeout=60)
(CACHE/'hatalar.json').write_text(json.dumps(errors,ensure_ascii=False,indent=1),encoding='utf-8')
if errors:raise RuntimeError(f'{len(errors)} kaynak aktarılmadı; kısmi veri yayına yazılmadı.')
results.sort(key=lambda r:r['baslik'])
published=[{**r,'sayfalar':[p if p['yontem']=='pdf' else {'no':p['no'],'metin':'','yontem':'tarama'} for p in r['sayfalar']]} for r in results]
# OCR, doğrulanmadan kamuya açık özgün metin verisi yapılmaz; ham sonuç CACHE içinde kalır.
(ROOT/'src/data/adalet-genelgeleri.json').write_text(json.dumps(published,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
print('COMPLETE',len(results),sum(r['sayfa'] for r in results),flush=True)
