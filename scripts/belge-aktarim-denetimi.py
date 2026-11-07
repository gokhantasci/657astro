"""Markdown'ın kaynak PDF metninden sözcük veya sayı kaybetmesini denetler.

Görsel kontrolden bağımsız bir kayıp/ekleme raporudur; hukuk metnini düzeltmez.
Kaynak sırası ayrıca temsilci belgelerde tarayıcı testiyle doğrulanır.
"""
import collections,html,json,re,unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
old=json.loads((ROOT/'src/data/dpb-sayfa-metinleri.json').read_text(encoding='utf-8'))
def norm(s):
 s=re.sub(r'(?<=[a-zçğıöşü])-\s+(?=[a-zçğıöşü])','',s)
 return collections.Counter(re.findall(r'[\w]+',unicodedata.normalize('NFKC',html.unescape(s))))
errors=[]
for id,ps in old.items():
 path=ROOT/'src/content/belgeler/dpb'/(id+'.md');text=path.read_text(encoding='utf-8').split('---',2)[2]
 text=re.sub(r'<div class="kaynak-sayfa-no"[^>]*>.*?</div>','',text)
 text=re.sub(r'!\[[^\]]*\]\([^)]+\)','',text);text=re.sub(r'\[([^\]]*)\]\([^)]+\)',r'\1',text)
 text=re.sub(r'<[^>]*>','',text)
 text=re.sub(r'\\([\\`*\[\]_|.])',r'\1',text)
 original=[]
 for p in ps:
  t=p['metin'];t=re.sub(r'(?m)^\s*'+str(p['no'])+r'\s*$','',t);original.append(t)
 expected=norm('\n\n'.join(original));actual=norm(text)
 missing=expected-actual;extra=actual-expected
 if missing or extra:errors.append({'id':id,'missing':dict(missing),'extra':dict(extra)})
out=ROOT/'artifacts/belge-aktarim-denetimi.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(errors,ensure_ascii=False,indent=1),encoding='utf-8')
print(json.dumps({'checked':len(old),'different':len(errors),'missingWords':sum(sum(r['missing'].values()) for r in errors),'extraWords':sum(sum(r['extra'].values()) for r in errors)}))
