"""Tarama PDF'ler için yerel, yeniden başlatılabilir ikinci OCR geçişi.

İsteğe bağlı çalışma ortamı: Python 3.12, torch CUDA, surya-ocr==0.17.1,
transformers==4.57.3, pymupdf==1.28.2. Site derlemesinde OCR çalıştırılmaz.
Ham tanıma çıktısı kaynak SHA256/sayfa ile saklanır; kendiliğinden yayımlanmaz.
"""
import os
os.environ.setdefault('RECOGNITION_BATCH_SIZE','64')
os.environ.setdefault('DETECTOR_BATCH_SIZE','2')
os.environ.setdefault('TORCH_DEVICE','cuda')
os.environ.setdefault('DISABLE_TQDM','true')
import argparse,hashlib,json,time
from pathlib import Path
import pymupdf
from PIL import Image
from surya.foundation import FoundationPredictor
from surya.recognition import RecognitionPredictor
from surya.detection import DetectionPredictor

ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--cache',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);ap.add_argument('--batch',type=int,default=6);args=ap.parse_args()
rows=json.loads((ROOT/'src/data/adalet-genelgeleri.json').read_text(encoding='utf-8'))
tasks=[];seen=set()
for r in rows:
 if r['sha256'] in seen:continue
 seen.add(r['sha256'])
 source=args.cache/(hashlib.sha256(r['kaynak'].encode()).hexdigest()[:12]+'.pdf')
 for p in r['sayfalar']:
  if p['yontem']=='pdf':continue
  out=args.output/r['sha256']/f'{p["no"]}.json'
  if not out.exists():tasks.append((source,p['no'],out))
print(json.dumps({'pending':len(tasks)}),flush=True)
rec=RecognitionPredictor(FoundationPredictor());rec.disable_tqdm=True
det=DetectionPredictor();det.disable_tqdm=True
start=time.time()
for i in range(0,len(tasks),args.batch):
 batch=tasks[i:i+args.batch];images=[]
 for source,n,out in batch:
  with pymupdf.open(source) as d:
   pix=d[n-1].get_pixmap(dpi=220,colorspace=pymupdf.csRGB)
   images.append(Image.frombytes('RGB',[pix.width,pix.height],pix.samples))
 predictions=rec(images,det_predictor=det,math_mode=False)
 for (source,n,out),p in zip(batch,predictions):
  out.parent.mkdir(parents=True,exist_ok=True)
  out.write_text(p.model_dump_json(indent=1),encoding='utf-8')
 print(json.dumps({'done':min(i+len(batch),len(tasks)),'total':len(tasks),'seconds':round(time.time()-start)}),flush=True)
