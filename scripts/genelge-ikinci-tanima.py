"""İkinci bağımsız OCR: proje için ayrılmış Tesseract/tur-best konteyneri.

Kaynaklar yalnız yerel Docker konteynerine bağlanır, haricî OCR servisine gitmez.
Python ve tesseract çıktıları sayfa/SHA256 ile yeniden kullanılabilir.
"""
import argparse,hashlib,json,subprocess,time
from concurrent.futures import ThreadPoolExecutor,as_completed
from pathlib import Path
import pymupdf

ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--cache',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);args=ap.parse_args()
tasks=[];seen=set()
for r in json.loads((ROOT/'src/data/adalet-genelgeleri.json').read_text(encoding='utf-8')):
 if r['sha256'] in seen:continue
 seen.add(r['sha256'])
 for p in r['sayfalar']:
  if p['yontem']=='pdf':continue
  stem=Path(r['sha256'])/str(p['no'])
  if not (args.output/stem.with_suffix('.tsv')).exists():tasks.append((args.cache/(hashlib.sha256(r['kaynak'].encode()).hexdigest()[:12]+'.pdf'),p['no'],stem))
def work(task):
 source,n,stem=task
 dest=args.output/stem;dest.parent.mkdir(parents=True,exist_ok=True)
 with pymupdf.open(source) as d:d[n-1].get_pixmap(dpi=300,colorspace=pymupdf.csRGB).save(dest.with_suffix('.png'))
 inner='/work/'+stem.as_posix()
 subprocess.run(['docker','exec','-e','OMP_THREAD_LIMIT=1','657-belge-ocr-best','tesseract',inner+'.png',inner,'--tessdata-dir','/work','-l','tur','--psm','3','-c','tessedit_create_tsv=1','-c','tessedit_create_txt=1'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 if not dest.with_suffix('.tsv').exists():raise RuntimeError(str(stem))
 dest.with_suffix('.png').unlink()
 return stem.as_posix()
start=time.time();print(json.dumps({'pending':len(tasks)}),flush=True)
with ThreadPoolExecutor(max_workers=4) as pool:
 for i,f in enumerate(as_completed([pool.submit(work,t) for t in tasks]),1):
  name=f.result()
  if i%5==0 or i==len(tasks):print(json.dumps({'done':i,'total':len(tasks),'seconds':round(time.time()-start)}),flush=True)
