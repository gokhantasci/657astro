import json,re
from pathlib import Path
p=Path('src/data/araclar.json');d=json.loads(p.read_text(encoding='utf-8'))
s=Path('src/lib/kamu-katalog.ts').read_text(encoding='utf-8')
items=re.findall(r"id:'([^']+)',path:'([^']+)',title:'([^']+)',description:'([^']+)'",s)
assert len(items)==11
for id,path,title,description in items:
    existing=next((x for x in d['araclar'] if x.get('path')==path),None)
    if existing:existing['tasindi']=True
    else:d['araclar'].append({'id':id,'title':title,'category':'maas','path':path,'description':description,'keywords':title,'tasindi':True})
p.write_text(json.dumps(d,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
print(len(d['araclar']),'araç')
