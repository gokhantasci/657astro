"""M65 ilavesi: Memurlar taban oranı + resmî karar; MAHEP 10/1 kontrolüyle."""
import json,re
from pathlib import Path
data=json.loads(Path('artifacts/maas-dogrulama/memurlar-ui-bordrolar.json').read_text('utf-8'))
def num(v):return float(re.sub(r'[^\d.\-]','',v.replace(',','')))
conditions={'Lise veya Ortaokul Mezunu':('lise',2,12),'Önlisans veya Lisans Mezunu':('yuksekogrenim',1,9)}
families={};cases={}
for r in data['observations']:
 f={a['id']:a['value'] for a in r['fields']}
 if f.get('_Salary_Position')!='arsiv-memuru' or f.get('_Salary_Tax')!='' or f.get('_Salary_Date')!='2026-10-15' or r['condition'] not in conditions:continue
 rows={x[0]:x[1:] for x in r['rows'] if len(x)==3};degree=f['_Salary_Degree'];dk=degree+'/1'
 if 'Gösterge Aylığı ('+dk+')' not in rows:continue
 assert f['_Salary_Grade']=='1' and f['_Salary_TotalYears']=='0' and f['_Salary_Bes']=='false'
 variant,edu,entry=conditions[r['condition']]
 rule={key:num(rows[label][0]) if label in rows else 0 for key,label in [('ekGosterge','Ek Gösterge Aylığı'),('yanOdeme','Yan Ödeme Aylığı'),('ozelHizmet','Özel Hizmet Tazminatı'),('ekOdeme','Ek Ödeme')]}
 rule['ozelHizmet']+=10
 families.setdefault(variant,{})[degree]=rule
 cases[(variant,degree)]={'kod':1010,'kosul':variant,'mezuniyet':edu,'derece':dk,'gelir':num(rows['İstihaklar Toplamı'][1]),'net':num(rows['Net Maaş'][1]),'damga':abs(num(rows['Damga Vergisi'][1])),'kaynakSatirlar':r['rows']}
for variant,edu,entry in conditions.values():assert set(families[variant])==set(map(str,range(1,entry+1)))
p=Path('src/data/unvan-ek-kurallari.json');out=json.loads(p.read_text('utf-8'))
scope='2025/1 Hakem Kurulu Kararı 65. madde şartlarını sağlayan, döner sermaye veya başka toplu sözleşme ilavesi bulunmayan GİH personeli: +10 puan. Diğer ödeme rejimleri bu modelde yoktur.'
for label,(variant,edu,entry) in conditions.items():out['aileler']['arsiv-memuru-'+variant]={'dereceler':families[variant],'adalet':False,'mezuniyet':edu,'aciklama':scope}
member={'id':'arsiv-memuru','ad':'Arşiv Memuru','kod':1010,'aile':'arsiv-memuru-lise','varyantlar':[{'id':v,'ad':label+' — Madde 65 kapsamı','aile':'arsiv-memuru-'+v} for label,(v,edu,entry) in conditions.items()],'dusuk':{'derece':'10/1','hizmetYili':0,'mezuniyet':2}}
out['unvanlar']=[u for u in out['unvanlar'] if u['id']!=member['id']]+[member]
p.write_text(json.dumps(out,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
p=Path('src/data/unvan-profilleri.json');profiles=json.loads(p.read_text('utf-8'))
for u in profiles:
 if u['id']==member['id']:
  u.update({k:member[k] for k in ['kod','dusuk']});u['uyari']='Kaynak araçlarda 13/3 sonucu alınamadığından düşük örnek 10/1 olarak gösterilir; bu tutar yasal giriş derecesi veya mutlak en düşük maaş iddiası değildir. '+scope
p.write_text(json.dumps(profiles,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
Path('tests/fixtures/dis-kaynak-arsiv-memuru.json').write_text(json.dumps(list(cases.values()),ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
print('Arşiv memuru: 21 taban bordro + M65; 10/1 MAHEP örneğiyle ayrı kontrol.')
