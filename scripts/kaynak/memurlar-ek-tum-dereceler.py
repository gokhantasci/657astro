"""Yeni eklenen Memurlar.net standart unvanlarında tüm derece sınırlarını toplar."""
import json,os,re
import memurlar as m
from ozkansoft import Program

p=m.KOK/'artifacts/kaynak-onbellek';rules=json.loads((m.KOK/'src/data/memurlar-ek-kurallari.json').read_text(encoding='utf-8'))
slugs={u['id'].removeprefix('memurlar-') for u in rules['unvanlar']}
inventory=json.loads((m.KOK/'artifacts/maas-dogrulama/memurlar-ui-bordrolar.json').read_text(encoding='utf-8'))['inventory']
boundary=json.loads((p/'memurlar-sinir-profilleri.json').read_text(encoding='utf-8'))
out=p/'memurlar-ek-tum-dereceler.json';data=json.loads(out.read_text(encoding='utf-8')) if out.exists() else {'profiller':{},'reddedilen':{}}
def save():
 tmp=out.with_suffix('.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8');os.replace(tmp,out)
for u in inventory:
 if u['id'] not in slugs:continue
 for c in u.get('conditions') or [{'value':''}]:
  for degree in range(1,16):
   key=f"{u['id']}|{c['value']}|{degree}"
   if key in data['profiller'] or key in data['reddedilen']:continue
   if key in boundary['profiller']:data['profiller'][key]=boundary['profiller'][key];continue
   if key in boundary['reddedilen']:data['reddedilen'][key]=boundary['reddedilen'][key];continue
   t=m.maas(u['id'],c['value'],degree,'1',Salary_Tax='1');allrows=m.satirlar(t)
   first=next((i for i,r in enumerate(allrows) if r and r[0]=='İstihaklar'),-1)
   if first<0:data['reddedilen'][key]={'neden':'sonuc-yok'};save();continue
   last=next((i for i in range(first+1,len(allrows)) if allrows[i] and allrows[i][0]=='Not'),len(allrows));rows=[r for r in allrows[first:last] if len(r)>=2];selected=Program.alanlar(t)
   shown=next((re.search(r'\((\d+)/(\d+)\)',r[0]).groups() for r in rows if r[0].startswith('Gösterge Aylığı (')),None)
   if shown!=(str(degree),'1') or selected.get('Salary_Condition','')!=c['value']:data['reddedilen'][key]={'neden':'derece-veya-kosul-uyusmazligi'}
   else:data['profiller'][key]={'ad':u['ad'],'sonuclar':rows,'secimler':{k:v for k,v in selected.items() if k.startswith('Salary_')}}
   save()
 print(u['id'],'profil',len(data['profiller']),'ret',len(data['reddedilen']),flush=True)
save()
