"""Bağımsız OCR çıktılarından paragraf/madde düzeni; farklar ayrı raporlanır.

Metinler dil modeliyle yeniden yazılmaz. İki tanıma arasındaki farklar kaynak
görüntüsüyle incelenebilir; açık düzeltmeler JSON dosyasından uygulanır.
"""
import argparse,csv,difflib,hashlib,html,json,re,statistics
from collections import defaultdict
from pathlib import Path
import pymupdf
import cv2,numpy as np

ROOT=Path(__file__).resolve().parents[1]
def esc(s):
 s=re.sub(r'([\\`*\[\]_|])',r'\\\1',html.escape(s,quote=False))
 s=re.sub(r'^(\d+)([.)])(?=\s)',r'\1\\\2',s)
 return re.sub(r'^([+-])(?=\s)',r'\\\1',s)
def key(s):return re.sub(r'[^\w]','',s).casefold()
def plain(s):return re.sub('<[^>]+>','',s)
def verified_fragment(text,variant,correct):
 if correct in text or key(correct) in key(text):return text
 if variant in text:return text.replace(variant,correct,1)
 if len(variant)<10:return text
 chars=[];positions=[]
 for i,c in enumerate(text):
  if c.isalnum() or c=='_':
   for folded in c.casefold():chars.append(folded);positions.append(i)
 needle=key(variant);at=''.join(chars).find(needle)
 if at<0 or not needle:return text
 start=positions[at];end=positions[at+len(needle)-1]+1
 return text[:start]+re.sub(r'^\W+|\W+$','',correct)+text[end:]
def lines(words):
 out={}
 for w in words:
  k=(w['block_num'],w['par_num'],w['line_num'])
  out.setdefault(k,[]).append(w)
 return out
def load_tsv(p):
 with p.open(encoding='utf-8') as f:raw=list(csv.DictReader(f,delimiter='\t',quoting=csv.QUOTE_NONE))
 size=(float(raw[0]['width']),float(raw[0]['height']))
 words=[]
 for i,w in enumerate(raw):
  if w['level']!='5' or not w['text'].strip():continue
  words.append({**w,'i':i,**{k:float(w[k]) for k in ['left','top','width','height','conf']}})
 return size,words
def audit(words,size,surya,fast,sha,n,evidence=None):
 W,H=size;SW,SH=surya['image_bbox'][2:];risks=[];changes=[]
 fast_lines=[s for s in fast.splitlines() if s.strip()]
 for line in surya['text_lines']:
  x1,y1,x2,y2=line['bbox'];x1=x1/SW*W;x2=x2/SW*W;y1=y1/SH*H;y2=y2/SH*H
  ws=[w for w in words if y1-4< w['top']+w['height']/2<y2+4 and x1-8<w['left']+w['width']/2<x2+8]
  ws.sort(key=lambda w:w['left'])
  if not ws:continue
  box=[round(x1),round(y1),round(x2),round(y2)]
  eid=hashlib.sha256(json.dumps([sha,n,box],sort_keys=True).encode()).hexdigest()[:20]
  visual=(evidence or {}).get(eid)
  if visual and visual.get('gorsel'):
   original=' '.join(w['text'] for w in ws)
   ws[0]['text']=visual['metin']
   for w in ws[1:]:w['text']=''
   changes.append({'once':original,'sonra':visual['metin'],'sayfa':n,'sha256':sha,'kontrol':eid,'yontem':'kaynak-gorseli'})
   continue
  st=plain(line['text']).split();bt=[w['text'] for w in ws]
  seq=difflib.SequenceMatcher(None,[key(t) for t in bt],[key(t) for t in st],autojunk=False)
  fast_match=difflib.get_close_matches(' '.join(bt),fast_lines,n=1,cutoff=.45)
  fast_words=set(key(t) for t in (fast_match[0].split() if fast_match else []))
  for op,a,b,c,d in seq.get_opcodes():
   if op=='equal':continue
   before=' '.join(bt[a:b]);after=' '.join(st[c:d]);selected=ws[a:b]
   if not before or not after:continue
   decision=next((v for v in (evidence or {}).get(eid,{}).get('parcalar',[]) if v['once']==before and v['ikinci']==after),None)
   if decision:
    selected[0]['text']=decision['dogru']
    for w in selected[1:]:w['text']=''
    changes.append({'once':before,'sonra':decision['dogru'],'sayfa':n,'sha256':sha,'kontrol':eid,'yontem':'kaynak-gorseli'});continue
   # Birinci ve eski tanıma aynı sözcüğü veriyorsa yeni modelin farklı
   # okuması otomatik olarak kaynak metne geçirilmez.
   primary=min((w['conf'] for w in selected),default=0)
   numeric=re.findall(r'\d+',before)!=re.findall(r'\d+',after)
   consensus=(b-a==d-c==1 and key(after) in fast_words and key(before) not in fast_words)
   if consensus and line['confidence']>(.95 if numeric else .9):
    selected[0]['text']=after;changes.append({'once':before,'sonra':after,'sayfa':n,'sha256':sha});continue
   if key(before)==key(after):continue
   before_context=key(' '.join(bt[max(a-2,0):min(b+2,len(bt))]));after_context=key(' '.join(st[max(c-2,0):min(d+2,len(st))]))
   third=(evidence or {}).get(eid)
   if third and third['guven']>=75:
    candidate=key(third['metin']);supports_before=bool(before_context and before_context in candidate);supports_after=bool(after_context and after_context in candidate)
    if supports_before and not supports_after:continue
    if supports_after and not supports_before:
     selected[0]['text']=after
     for q in selected[1:]:q['text']=''
     changes.append({'once':before,'sonra':after,'sayfa':n,'sha256':sha,'kontrol':eid});continue
   risks.append({'sha256':sha,'sayfa':n,'once':before,'ikinci':after,'guven':round(primary,1),'ikinciGuven':round(line['confidence'],3),'rakam':numeric,'bbox':box,'boyut':size,'kontrol':eid,'onceBaglam':before_context,'ikinciBaglam':after_context,'altbilgi':y1>H*.88,'tekrarTanima':third})
 return risks,changes

def source_graphics(page,words,size,sha,n):
 """Doğrulama kodları OCR ile yeniden yazılmaz; kaynak altbilgisi korunur."""
 W,H=size
 footer=[w['top'] for ws in lines(words).values() if min(w['top'] for w in ws)>H*.81 and re.search(r'UYAP|Doğrulama|doğrulama|elektronik imza|güvenli.*imza',' '.join(w['text'] for w in ws)) for w in ws]
 if not footer:return words,None,None
 y=min(footer)-10
 dest=ROOT/'public/dosyalar/belge-gorselleri'/f'{sha[:16]}-{n}-dogrulama.png';dest.parent.mkdir(parents=True,exist_ok=True)
 clip=pymupdf.Rect(0,y/H*page.rect.height,page.rect.width,page.rect.height)
 if not dest.exists():page.get_pixmap(dpi=150,clip=clip,colorspace=pymupdf.csRGB).save(dest)
 return [w for w in words if w['top']<y],f'![Kaynak belgenin doğrulama bilgileri](/dosyalar/belge-gorselleri/{dest.name})',y

def source_tables(page,words,size):
 """Taranmış belgenin çizgili hücrelerini kaynak görüntüsünden bulur."""
 pix=page.get_pixmap(dpi=150,colorspace=pymupdf.csGRAY)
 a=np.frombuffer(pix.samples,dtype=np.uint8).reshape(pix.height,pix.width)
 bw=cv2.adaptiveThreshold(a,255,cv2.ADAPTIVE_THRESH_MEAN_C,cv2.THRESH_BINARY_INV,35,7)
 bw=cv2.morphologyEx(bw,cv2.MORPH_CLOSE,np.ones((1,3),np.uint8))
 hor=cv2.morphologyEx(bw,cv2.MORPH_OPEN,np.ones((1,max(35,pix.width//25)),np.uint8))
 ver=cv2.morphologyEx(bw,cv2.MORPH_OPEN,np.ones((max(20,pix.height//40),1),np.uint8))
 grid=cv2.morphologyEx(hor|ver,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
 contours,hierarchy=cv2.findContours(grid,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE)
 if hierarchy is None:return [],set()
 groups=defaultdict(list)
 for i,c in enumerate(contours):
  x,y,w,h=cv2.boundingRect(c)
  if w<8 or h<12 or w*h>pix.width*pix.height*.6:continue
  parent=hierarchy[0][i][3]
  if parent<0:continue
  while hierarchy[0][parent][3]>=0:parent=hierarchy[0][parent][3]
  # Uncertainty in a cropped edge must not create a spurious table.
  if sum(np.mean(grid[yy:yy+1,x:x+w]>0) for yy in [y,y+h-1])<1:continue
  groups[parent].append((x,y,x+w,y+h))
 def ticks(values):
  groups=[]
  for v in sorted(values):
   if not groups or v-groups[-1][-1]>7:groups.append([])
   groups[-1].append(v)
  return [statistics.median(g) for g in groups]
 tables=[];used=set();W,H=size
 for group in groups.values():
  if len(group)<4:continue
  xs=ticks([v for c in group for v in (c[0],c[2])]);ys=ticks([v for c in group for v in (c[1],c[3])])
  if len(xs)<3 or len(ys)<3 or xs[-1]-xs[0]<pix.width*.25:continue
  group_words=list(words)
  # Bazı taramalarda model ayrı hücrelerdeki sıra numaralarını tek uzun
  # satır olarak döndürür. Tanınmış değerler hücre merkezlerine dağıtılır;
  # eksik sayı veya yeni bir değer üretilmez.
  for u in words:
   tokens=u['text'].split()
   if len(tokens)<3 or not all(t.isdigit() for t in tokens):continue
   if u['width']>u['height']*2:
    centers=[(xs[i]+xs[i+1])/2 for i in range(len(xs)-1) if u['left']/W*pix.width<=(xs[i]+xs[i+1])/2<=(u['left']+u['width'])/W*pix.width]
    if len(centers)!=len(tokens):continue
    replacements=[{**u,'i':f"{u['i']}-{i}",'text':t,'table_text':t,'left':cx/pix.width*W-3,'width':6} for i,(cx,t) in enumerate(zip(centers,tokens))]
   elif u['height']>u['width']*2:
    centers=[(ys[i]+ys[i+1])/2 for i in range(len(ys)-1) if u['top']/H*pix.height<=(ys[i]+ys[i+1])/2<=(u['top']+u['height'])/H*pix.height]
    if len(centers)!=len(tokens):continue
    replacements=[{**u,'i':f"{u['i']}-{i}",'text':t,'table_text':t,'top':cy/pix.height*H-3,'height':6} for i,(cy,t) in enumerate(zip(centers,tokens))]
   else:continue
   group_words=[q for q in group_words if q['i']!=u['i']]+replacements;used.add(u['i'])
  cells=[]
  for x,y,r,b in group:
   members=[q for q in group_words if x<=(q['left']+q['width']/2)/W*pix.width<=r and y<=(q['top']+q['height']/2)/H*pix.height<=b]
   if not members:text=''
   else:
    vertical=sum(q['height']>q['width']*1.6 for q in members)>len(members)/2
    if vertical:members.sort(key=lambda q:q['left'])
    else:members.sort(key=lambda q:(q['top'],q['left']))
    text='<br>'.join(html.escape(q.get('table_text',q['text'])).replace('\n','<br>') for q in members)
   xi=min(range(len(xs)),key=lambda j:abs(xs[j]-x));xe=min(range(len(xs)),key=lambda j:abs(xs[j]-r))
   yi=min(range(len(ys)),key=lambda j:abs(ys[j]-y));ye=min(range(len(ys)),key=lambda j:abs(ys[j]-b))
   if xe<=xi or ye<=yi:continue
   cells.append((yi,xi,ye-yi,xe-xi,text,members))
  if len(cells)<4 or sum(bool(c[4]) for c in cells)<2:continue
  # Soluk/kopuk bir kenar bir hücrenin kapalı konturunu yok edebilir.
  # Aynı tablonun diğer satır/sütun çizgileriyle belirlenen boş konum tamamlanır.
  occupied={(yy,xx) for yi,xi,rs,cs,*_ in cells for yy in range(yi,yi+rs) for xx in range(xi,xi+cs)}
  for yi in range(len(ys)-1):
   for xi in range(len(xs)-1):
    if (yi,xi) in occupied:continue
    x,y,r,b=xs[xi],ys[yi],xs[xi+1],ys[yi+1]
    members=[q for q in group_words if x<=(q['left']+q['width']/2)/W*pix.width<r and y<=(q['top']+q['height']/2)/H*pix.height<b]
    members.sort(key=lambda q:(q['top'],q['left']))
    text='<br>'.join(html.escape(q.get('table_text',q['text'])).replace('\n','<br>') for q in members)
    cells.append((yi,xi,1,1,text,members))
  html_rows=[]
  for row in sorted(set(c[0] for c in cells)):
   tags=[]
   for yi,xi,rs,cs,text,members in sorted(cells,key=lambda c:c[1]):
    if yi!=row:continue
    vertical=bool(members) and sum(q['height']>q['width']*1.6 for q in members)>len(members)/2
    attr=(' class="belge-dikey"' if vertical else '')+(f' rowspan="{rs}"' if rs>1 else '')+(f' colspan="{cs}"' if cs>1 else '')
    if text in ['Х','Χ']:text='X'
    tags.append(f'<td{attr}>{text}</td>');used.update(q['i'] for q in members)
   html_rows.append('<tr>'+''.join(tags)+'</tr>')
  cols='<colgroup>'+''.join(f'<col style="width:{(xs[i+1]-xs[i])/(xs[-1]-xs[0])*100:.3f}%">' for i in range(len(xs)-1))+'</colgroup>'
  minimum_width=max(650,min(2400,round(32/min((xs[i+1]-xs[i])/(xs[-1]-xs[0]) for i in range(len(xs)-1)))))
  tables.append((ys[0]/pix.height*H,f'<div class="belge-tablo">\n<table style="min-width:{minimum_width}px">\n'+cols+'\n<tbody>\n'+'\n'.join(html_rows)+'\n</tbody>\n</table>\n</div>'))
 return tables,used

def corrected_lines(words,size,surya,fast,sha,n,evidence):
 """Satır düzeni görsel tanımadan; metin tercihi bağımsız tanıma karşılaştırmasından."""
 W,H=size;SW,SH=surya['image_bbox'][2:];units=[]
 fast_lines=[s for s in fast.splitlines() if s.strip()]
 for index,line in enumerate(surya['text_lines']):
  x,y,r,b=line['bbox'];x=x/SW*W;r=r/SW*W;y=y/SH*H;b=b/SH*H
  if (x<W*.02 or y<H*.025) and len(plain(line['text']).strip())<=3 and line['confidence']<.65:continue
  ws=sorted([w for w in words if y-4<w['top']+w['height']/2<b+4 and x-8<w['left']+w['width']/2<r+8],key=lambda w:w['left'])
  box=[round(x),round(y),round(r),round(b)];eid=hashlib.sha256(json.dumps([sha,n,box],sort_keys=True).encode()).hexdigest()[:20]
  third=evidence.get(eid)
  st=plain(line['text'].replace('<br>',' ')).split();bt=[w['text'] for w in ws];text=' '.join(st)
  if third and third.get('gorsel'):text=third['metin']
  elif third and b-y>(r-x)*1.6 and third.get('guven',0)>=85 and .8<=len(third.get('metin',''))/max(1,len(text))<=1.25 and difflib.SequenceMatcher(None,key(text),key(third['metin'])).ratio()>=.85:
   # Dikey/ters dizgide tam sayfa OCR yerine döndürülmüş kaynak satırının
   # yüksek çözünürlüklü tanıması kullanılır; eksik satır kabul edilmez.
   text=third['metin']
  elif ws and b-y<(r-x)*1.6:
   fast_match=difflib.get_close_matches(' '.join(bt),fast_lines,n=1,cutoff=.5)
   fast_key=key(fast_match[0]) if fast_match else ''
   patches=[]
   for op,a,z,c,d in difflib.SequenceMatcher(None,[key(t) for t in bt],[key(t) for t in st],autojunk=False).get_opcodes():
    if op=='equal' or not bt[a:z] or not st[c:d]:continue
    decision=next((v for v in (third or {}).get('parcalar',[]) if v['once']==' '.join(bt[a:z]) and v['ikinci']==' '.join(st[c:d])),None)
    if decision:patches.append((c,d,decision['dogru'].split()));continue
    bc=key(' '.join(bt[max(a-2,0):min(z+2,len(bt))]));sc=key(' '.join(st[max(c-2,0):min(d+2,len(st))]))
    third_key=key(third['metin']) if third and third['guven']>=75 else ''
    best_proved=bool(third_key and bc in third_key and sc not in third_key)
    old_proved=bool(fast_key and bc in fast_key and sc not in fast_key and min(w['conf'] for w in ws[a:z])>=75)
    if best_proved or old_proved:patches.append((c,d,bt[a:z]))
   for c,d,replacement in reversed(patches):st[c:d]=replacement
   text=' '.join(st)
  for decision in (third or {}).get('parcalar',[]):text=verified_fragment(text,decision['ikinci'],decision['dogru'])
  segments=re.split(r'<br\s*/?>',line['text']);breaks=[];offset=0
  for segment in segments[:-1]:offset+=len(plain(segment).split());breaks.append(offset)
  tw=text.split();table_text=''.join(('\n' if i in breaks else ' ') + w if i else w for i,w in enumerate(tw))
  units.append({'i':index,'text':text,'table_text':table_text,'left':x,'top':y,'width':r-x,'height':b-y,'conf':line['confidence']*100,'block_num':index,'par_num':0,'line_num':0})
 return units

def format_lines(units,size,tables,used):
 W,H=size
 us=[u for u in units if u['i'] not in used and u['text'].strip()]
 horizontal=[u for u in us if u['width']>u['height']*1.3 or len(u['text'])<8]
 median=statistics.median([u['height'] for u in horizontal]) if horizontal else 30
 lefts=sorted(u['left'] for u in horizontal);margin=lefts[max(0,int(len(lefts)*.1)-1)] if lefts else W*.1
 us.sort(key=lambda u:(u['top'],u['left']))
 rows=[]
 for u in us:
  if rows and abs((u['top']+u['height']/2)-statistics.mean(q['top']+q['height']/2 for q in rows[-1]))<min(median,u['height'])*.45 and all(u['left']>=q['left']+q['width']-4 or u['left']+u['width']<=q['left']+4 for q in rows[-1]):rows[-1].append(u)
  else:rows.append([u])
 paragraphs=[];current=None
 for row in rows:
  row.sort(key=lambda u:u['left']);text=' '.join(u['text'] for u in row)
  x=min(u['left'] for u in row);right=max(u['left']+u['width'] for u in row);y=min(u['top'] for u in row);bottom=max(u['top']+u['height'] for u in row)
  center=abs((x+right)/2-W/2)<W*.08 and right-x<W*.8
  kind='body'
  if re.match(r'^(Sayı|Konu)\s*:',text):kind='meta'
  elif center and y<H*.24 and (text.isupper() or re.search(r'Müdürlüğü|Başkanlığı|Bakanlığı|^T\.C\.',text)):kind='kurum'
  elif center and re.match(r'^GENELGE|^No\s*:',text):kind='kurum'
  elif text.isupper() and len(text)<200:kind='heading'
  elif x>W*.5 and right-x<W*.4 and y>H*.4:kind='imza'
  elif re.fullmatch(r'\d+\s*/\s*\d+',text) and y>H*.85:kind='numara'
  marker=bool(re.match(r'^(?:\(?\d+[).\-]|[a-zçğıöşü]\))\s',text))
  if current:
   gap=y-current['bottom'];indented=x>margin+median*1.2
   can_join=(kind==current['kind'] and gap<median*.8 and not marker and not (kind=='body' and indented))
   if current['kind']=='meta' and current['text'].startswith('Konu') and kind=='body' and y<H*.35:can_join=True;kind='meta'
   if kind=='meta' and re.match(r'^(Sayı|Konu)\s*:',text):can_join=False
   if can_join:
    sep='  \n' if kind in ['kurum','meta','imza'] else ' '
    if current['text'].endswith('-') and re.match(r'^[a-zçğıöşü]',text) and kind=='body':current['text']=current['text'][:-1]+text
    else:current['text']+=sep+text
    current['bottom']=bottom;continue
  current={'text':text,'top':y,'bottom':bottom,'kind':kind};paragraphs.append(current)
 chunks=list(tables)
 for p in paragraphs:
  text=p['text'];kind=p['kind'];body=esc(text)
  # İki boşluk + satır sonu Markdown'da özgün kısa başlık satırlarını korur.
  if kind in ['kurum','meta','imza','numara']:
   klass={'kurum':'belge-kurum','meta':'belge-ust-bilgi','imza':'belge-imza','numara':'kaynak-ozgun-numara'}[kind]
   body=f'<div class="{klass}">\n\n'+body+'\n\n</div>'
  elif kind=='heading':body='## '+body
  if re.match(r'^\d+\.\s',body):body=re.sub(r'^(\d+)\.',r'\1\\.',body)
  chunks.append((p['top'],body))
 chunks.sort(key=lambda c:c[0])
 return '\n\n'.join(c[1] for c in chunks)

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--cache',type=Path,required=True);ap.add_argument('--surya',type=Path,required=True);ap.add_argument('--tesseract',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);ap.add_argument('--report',type=Path,required=True);ap.add_argument('--tekrar-tanima',type=Path);ap.add_argument('--belge');ap.add_argument('--sayfa',type=int);ap.add_argument('--sayfa-listesi',type=Path);args=ap.parse_args()
 selected={(r['sha256'],r['sayfa']) for r in json.loads(args.sayfa_listesi.read_text(encoding='utf-8'))} if args.sayfa_listesi else None
 evidence={}
 if args.tekrar_tanima:
  for f in args.tekrar_tanima.glob('*.json'):
   evidence[f.stem]=json.loads(f.read_text(encoding='utf-8'))
 visual_file=ROOT/'src/data/belge-gorsel-kontrolleri.json'
 if visual_file.exists():evidence.update(json.loads(visual_file.read_text(encoding='utf-8')))
 partial_file=ROOT/'src/data/belge-fark-kontrolleri.json'
 if partial_file.exists():
  for item in json.loads(partial_file.read_text(encoding='utf-8')):evidence.setdefault(item['kontrol'],{}).setdefault('parcalar',[]).append(item)
 rows=json.loads((ROOT/'src/data/adalet-genelgeleri.json').read_text(encoding='utf-8'));seen=set();risks=[];changes=[];done=0;pending=0
 corrections_file=ROOT/'src/data/belge-metin-duzeltmeleri.json'
 corrections=json.loads(corrections_file.read_text(encoding='utf-8')) if corrections_file.exists() else []
 for r in rows:
  if args.belge and not r['id'].startswith(args.belge):continue
  sha=r['sha256']
  if selected is not None and not any(s==sha for s,n in selected):continue
  if sha in seen:continue
  seen.add(sha);cache_key=hashlib.sha256(r['kaynak'].encode()).hexdigest()[:12]
  raw=json.loads((args.cache/(cache_key+'.json')).read_text(encoding='utf-8'))
  source=pymupdf.open(args.cache/(cache_key+'.pdf'))
  for p in r['sayfalar']:
   if args.sayfa and p['no']!=args.sayfa:continue
   if selected is not None and (sha,p['no']) not in selected:continue
   if p['yontem']=='pdf':continue
   n=p['no'];t=args.tesseract/sha/f'{n}.tsv';s=args.surya/sha/f'{n}.json'
   if not t.exists() or not s.exists():pending+=1;continue
   size,words=load_tsv(t);raw_words=[dict(w) for w in words];surya=json.loads(s.read_text(encoding='utf-8'))
   rs,cs=audit(words,size,surya,raw['sayfalar'][n-1]['metin'],sha,n,evidence);changes+=cs
   units=corrected_lines(raw_words,size,surya,raw['sayfalar'][n-1]['metin'],sha,n,evidence)
   units,footer,footer_y=source_graphics(source[n-1],units,size,sha,n)
   risks.extend(q for q in rs if footer_y is None or q['bbox'][1]<footer_y)
   tables,used=source_tables(source[n-1],units,size)
   body=format_lines(units,size,tables,used)
   if footer:body+='\n\n'+footer
   for fix in [f for f in corrections if f['sha256']==sha and f['sayfa']==n]:
    before=esc(fix['once']);after=esc(fix['sonra'])
    if before not in body:raise ValueError(f'Düzeltmenin kaynak parçası yok: {sha}/{n}: {before}')
    body=body.replace(before,after,1)
   dest=args.output/sha/f'{n}.md';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(body+'\n',encoding='utf-8');done+=1
   if done%50==0:print(json.dumps({'formatted':done,'differences':len(risks)}),flush=True)
 args.report.write_text(json.dumps({'done':done,'pending':pending,'farklar':risks,'ucuncuTanimaUyusmalari':changes},ensure_ascii=False,indent=1),encoding='utf-8')
 print(json.dumps({'done':done,'pending':pending,'differences':len(risks),'numericDifferences':sum(r['rakam'] and not r['altbilgi'] for r in risks),'consensus':len(changes)}),flush=True)

if __name__=='__main__':main()
