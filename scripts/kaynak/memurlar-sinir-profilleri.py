"""Bütün unvan/koşullarda sınır dereceler: önce kaynak kapsamını kapatır.

Brüt ödeme kalemleri envanteri ile net maaş sağlaması ayrı kaydedilir. Bu tarama,
yılın ilk ücret ödemesi olan Ekim 2026 sentetik profilini kullanır.
"""
import json,os,re
from pathlib import Path
import memurlar as m
from ozkansoft import Program

folder=m.KOK/'artifacts/kaynak-onbellek'
inv=json.loads((m.KOK/'artifacts/maas-dogrulama/memurlar-ui-bordrolar.json').read_text(encoding='utf-8'))['inventory']
mapping=json.loads((m.KOK/'src/data/maas-kaynak-envanteri.json').read_text(encoding='utf-8'))['unvanlar']
mh=json.loads((folder/'mahep-dogrulanmis-profiller.json').read_text(encoding='utf-8'))['unvanlar']
degrees={}
for u in mapping:
 mem=[x['kod'] for x in u['kaynaklar'] if x['kaynak']=='memurlar'];oz=[x['kod'] for x in u['kaynaklar'] if x['kaynak']=='ozkan']
 if mem and oz and oz[0] in mh:degrees[mem[0]]=sorted({int(d) for c in mh[oz[0]]['kosullar'] for d in c['dereceler']})
out=folder/'memurlar-sinir-profilleri.json'
data=json.loads(out.read_text(encoding='utf-8')) if out.exists() else {'profiller':{},'reddedilen':{}}
def save():
 tmp=out.with_suffix('.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8');os.replace(tmp,out)
for index,u in enumerate(inv):
 ds=degrees.get(u['id'],[1,9]);ds=list(dict.fromkeys([ds[0],ds[-1]]))
 for c in u.get('conditions') or [{'value':''}]:
  for degree in ds:
   key=f"{u['id']}|{c['value']}|{degree}"
   if key in data['profiller'] or key in data['reddedilen']:continue
   t=m.maas(u['id'],c['value'],str(degree),'1',Salary_Tax='',Salary_P_Date='2026-10-01')
   rs=m.satirlar(t);start=next((i for i,r in enumerate(rs) if r and r[0]=='İstihaklar'),None)
   if start is None:data['reddedilen'][key]={'neden':'sonuc-yok'};save();continue
   end=next((i for i in range(start+1,len(rs)) if rs[i] and rs[i][0]=='Not'),len(rs))
   rows=[r for r in rs[start:end] if len(r)>=2]
   actual=Program.alanlar(t)
   shown=next((re.search(r'\((\d+)/(\d+)\)',r[0]).groups() for r in rows if r[0].startswith('Gösterge Aylığı (')),None)
   if shown and shown!=(str(degree),'1'):data['reddedilen'][key]={'neden':'derece-uyusmazligi','donen':shown}
   else:data['profiller'][key]={'ad':u['ad'],'sonuclar':rows,'secimler':{k:v for k,v in actual.items() if k.startswith('Salary_')},'profil':{'ay':10,'yil':2026,'hizmet':0,'baslangic':'2026-10-01','oncekiMatrah':0,'sendika':False,'bes':False}}
   save()
 print(index+1,len(inv),u['id'],'profil',len(data['profiller']),'ret',len(data['reddedilen']),flush=True)
save()
