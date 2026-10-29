"""Gözlenen bordrolardan sayısal kural verisi/fixture üretir; kaynak kod kopyalamaz."""
import json,re,unicodedata
from pathlib import Path
root=Path('src/data');work=Path('artifacts/maas-dogrulama')
d=json.loads((work/'memurlar-ui-bordrolar.json').read_text('utf-8'))
def number(v):return float(re.sub(r'[^\d.\-]','',v.replace(',','')))
valid=[];rejected=[]
for i,r in enumerate(d['observations']):
 f={f['id']:f['value'] for f in r['fields']}
 if any(v is None for v in f.values()) or not r.get('title') or not r['rows']:
  rejected.append({'index':i,'neden':'Eksik sonuç'});continue
 g=next((x for x in r['rows'] if x[0].startswith('Gösterge Aylığı (')),None)
 if g and g[0]!=f"Gösterge Aylığı ({f['_Salary_Degree']}/{f['_Salary_Grade']})":
  rejected.append({'index':i,'neden':'Girdi ile sonuç derecesi farklı'});continue
 valid.append((r,f))
family={};fixtures=[]
for r,f in valid:
 if f['_Salary_Position']!='muhendis' or f['_Salary_Tax']!='' or f['_Salary_Date']!='2026-10-15':continue
 rows={x[0]:x[1:] for x in r['rows'] if len(x)==3}
 g=f['_Salary_Degree'];family[g]={'ekGosterge':number(rows['Ek Gösterge Aylığı'][0]),'yanOdeme':number(rows['Yan Ödeme Aylığı'][0]),'ozelHizmet':number(rows['Özel Hizmet Tazminatı'][0]),'ekOdeme':number(rows['Ek Ödeme'][0])}
 fixtures.append({'unvan':'muhendis','derece':g+'/1','kosul':r['condition'],'ay':10,'hizmetYili':0,'bes':False,'gelir':number(rows['İstihaklar Toplamı'][1]),'net':number(rows['Net Maaş'][1]),'damga':abs(number(rows['Damga Vergisi'][1])),'matrah':number(rows['Gelir Vergisi Matrahı'][1])})
assert set(family)==set(map(str,range(1,9))),family
members=[('muhendis','Mühendis'),('mimar','Mimar'),('ic-mimar','İç Mimar'),('peyzaj-mimari','Peyzaj Mimarı'),('bolge-plancisi','Bölge Plancısı'),('sehir-plancisi','Şehir Plancısı')]
for id,ad in members:
 checks=[(r,f) for r,f in valid if f['_Salary_Position']==id and f['_Salary_Degree']=='8' and f['_Salary_Date']=='2026-10-15']
 assert checks,id
 rows={x[0]:x[1:] for x in checks[-1][0]['rows'] if len(x)==3}
 for label,key in [('Ek Gösterge Aylığı','ekGosterge'),('Yan Ödeme Aylığı','yanOdeme'),('Özel Hizmet Tazminatı','ozelHizmet'),('Ek Ödeme','ekOdeme')]:assert number(rows[label][0])==family['8'][key],id
out={'kaynak':'https://www.memurlar.net/maas/','gozlemTarihi':'2026-10-29','aileler':{'teknik-lisans':{'dereceler':family,'adalet':False,'mezuniyet':1}},'unvanlar':[{'id':id,'ad':ad,'kod':1001+i,'aile':'teknik-lisans','dusuk':{'derece':'8/1','hizmetYili':0,'mezuniyet':1}} for i,(id,ad) in enumerate(members)]}
if (root/'unvan-ek-kurallari.json').exists():
 previous=json.loads((root/'unvan-ek-kurallari.json').read_text('utf-8'))
 out['aileler']={**previous['aileler'],**out['aileler']}
 member_ids={u['id'] for u in out['unvanlar']}
 out['unvanlar']+= [u for u in previous['unvanlar'] if u['id'] not in member_ids]
(root/'unvan-ek-kurallari.json').write_text(json.dumps(out,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
Path('tests/fixtures/dis-kaynak-muhendis.json').write_text(json.dumps(fixtures,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
profiles=json.loads((root/'unvan-profilleri.json').read_text('utf-8'))
for u in out['unvanlar']:
 if not any(p['id']==u['id'] for p in profiles):profiles.append({k:u[k] for k in ['id','ad','kod','dusuk']})
(root/'unvan-profilleri.json').write_text(json.dumps(profiles,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
(work/'gecersiz-gozlemler.json').write_text(json.dumps(rejected,ensure_ascii=False,indent=1),encoding='utf-8')
print('Geçerli gözlem:',len(valid),'reddedilen:',len(rejected),'yeni unvan:',len(members))
