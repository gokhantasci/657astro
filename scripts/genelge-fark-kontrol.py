"""Tanıma farklarını kaynak satırı kırpılarak, daha yüksek çözünürlükte okur."""
import argparse,csv,hashlib,json,subprocess,time
from concurrent.futures import ThreadPoolExecutor,as_completed
from pathlib import Path
import pymupdf
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--cache',type=Path,required=True);ap.add_argument('--report',type=Path,required=True);ap.add_argument('--work',type=Path,required=True);ap.add_argument('--workers',type=int,default=4);ap.add_argument('--orientasyon',action='store_true');args=ap.parse_args()
rows=json.loads((ROOT/'src/data/adalet-genelgeleri.json').read_text(encoding='utf-8'))
sources={r['sha256']:args.cache/(hashlib.sha256(r['kaynak'].encode()).hexdigest()[:12]+'.pdf') for r in reversed(rows)}
output=args.work/'kontrol';output.mkdir(parents=True,exist_ok=True)
seen=set();tasks=[]
for r in json.loads(args.report.read_text(encoding='utf-8'))['farklar']:
 eid=r['kontrol']
 if eid in seen:continue
 old_file=output/(eid+'.json')
 if old_file.exists():
  old=json.loads(old_file.read_text(encoding='utf-8'))
  if not args.orientasyon or old.get('orientasyonKontrolu'):continue
  if (output/(eid+'-90.png')).exists():
   old['orientasyonKontrolu']=True;old_file.write_text(json.dumps(old,ensure_ascii=False),encoding='utf-8');continue
 seen.add(eid);tasks.append(r)
def recognize(stem):
 inner='/work/kontrol/'+stem
 subprocess.run(['docker','exec','-e','OMP_THREAD_LIMIT=1','657-belge-ocr-best','tesseract',inner+'.png',inner,'--tessdata-dir','/work','-l','tur','--psm','7','-c','tessedit_create_tsv=1','-c','tessedit_create_txt=1'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 with (output/(stem+'.tsv')).open(encoding='utf-8') as f:ws=[w for w in csv.DictReader(f,delimiter='\t',quoting=csv.QUOTE_NONE) if w['level']=='5' and w['text'].strip()]
 return {'metin':' '.join(w['text'] for w in ws),'guven':round(sum(float(w['conf']) for w in ws)/len(ws),2) if ws else 0}
def work(r):
 eid=r['kontrol'];W,H=r['boyut'];x,y,right,bottom=r['bbox']
 old_file=output/(eid+'.json');original=output/(eid+'.png')
 if args.orientasyon and old_file.exists() and original.exists():
  old=json.loads(old_file.read_text(encoding='utf-8'));im=Image.open(original);im.rotate(180,expand=True).save(output/(eid+'-180.png'))
  newer=recognize(eid+'-180');result=max([old,newer],key=lambda q:q['guven']);result['orientasyonKontrolu']=True
  old_file.write_text(json.dumps(result,ensure_ascii=False),encoding='utf-8');return result
 with pymupdf.open(sources[r['sha256']]) as d:
  p=d[r['sayfa']-1];sx=p.rect.width/W;sy=p.rect.height/H
  clip=pymupdf.Rect(max(0,x*sx-2),max(0,y*sy-2),min(p.rect.width,right*sx+2),min(p.rect.height,bottom*sy+2))
  pix=p.get_pixmap(dpi=400,clip=clip,colorspace=pymupdf.csRGB)
 im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
 if im.height>im.width*1.6:
  results=[]
  for angle in [90,270]:
   stem=eid+'-'+str(angle);im.rotate(angle,expand=True).save(output/(stem+'.png'));results.append(recognize(stem))
  result=max(results,key=lambda q:q['guven'])
 else:
  im.save(output/(eid+'.png'));result=recognize(eid)
  if args.orientasyon:
   im.rotate(180,expand=True).save(output/(eid+'-180.png'));result=max([result,recognize(eid+'-180')],key=lambda q:q['guven'])
 result['orientasyonKontrolu']=args.orientasyon
 (output/(eid+'.json')).write_text(json.dumps(result,ensure_ascii=False),encoding='utf-8')
 return result
start=time.time();print(json.dumps({'pending':len(tasks)}),flush=True)
with ThreadPoolExecutor(max_workers=args.workers) as pool:
 for i,f in enumerate(as_completed([pool.submit(work,r) for r in tasks]),1):
  f.result()
  if i%25==0 or i==len(tasks):print(json.dumps({'done':i,'total':len(tasks),'seconds':round(time.time()-start)}),flush=True)
