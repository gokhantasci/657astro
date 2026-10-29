import json,re
from pathlib import Path
data=json.loads(Path('artifacts/maas-dogrulama/memurlar-ui-bordrolar.json').read_text('utf-8'))
def num(v):return float(re.sub(r'[^\d.\-]','',v.replace(',','')))
conditions={'Önlisans veya Lisans Mezunu':('yuksekogrenim',1),'Lise veya Ortaokul Mezunu':('lise',2)}
families={};cases={}
for r in data['observations']:
 f={a['id']:a['value'] for a in r['fields']}
 if f.get('_Salary_Position')!='cezaevi-muduru' or f.get('_Salary_Tax')!='' or f.get('_Salary_Date')!='2026-10-15' or r['condition'] not in conditions:continue
 rows={x[0]:x[1:] for x in r['rows'] if len(x)==3};degree=f['_Salary_Degree'];dk=degree+'/1'
 if 'Gösterge Aylığı ('+dk+')' not in rows:continue
 assert f['_Salary_Grade']=='1' and f['_Salary_TotalYears']=='0' and f['_Salary_Bes']=='false' and f['_Salary_Location_City']=='6'
 variant,edu=conditions[r['condition']]
 assert num(rows['İl Adalet Hizmetleri Tazminatı'][0])==15
 families.setdefault(variant,{})[degree]={key:num(rows[label][0]) if label in rows else 0 for key,label in [('ekGosterge','Ek Gösterge Aylığı'),('yanOdeme','Yan Ödeme Aylığı'),('ozelHizmet','Özel Hizmet Tazminatı'),('ekOdeme','Ek Ödeme')]}
 cases[(variant,degree)]={'unvan':'cezaevi-muduru','kod':10,'kosul':variant,'mezuniyet':edu,'derece':dk,**{k:num(rows[label][1]) for k,label in [('gelir','İstihaklar Toplamı'),('net','Net Maaş'),('matrah','Gelir Vergisi Matrahı')]},'damga':abs(num(rows['Damga Vergisi'][1])),'kaynakSatirlar':r['rows']}
for variant,edu in conditions.values():assert set(families[variant])==set(map(str,range(1,7)))
p=Path('src/data/unvan-ek-kurallari.json');out=json.loads(p.read_text('utf-8'))
for label,(variant,edu) in conditions.items():out['aileler']['cezaevi-muduru-'+variant]={'dereceler':families[variant],'adalet':True,'mezuniyet':edu,'aciklama':'Cezaevi müdürü: '+label+'. Özel +13 puan koşulu dahil değildir.'}
member={'id':'cezaevi-muduru','ad':'Cezaevi Müdürü','kod':10,'aile':'cezaevi-muduru-yuksekogrenim','varyantlar':[{'id':v,'ad':label,'aile':'cezaevi-muduru-'+v} for label,(v,edu) in conditions.items()],'dusuk':{'derece':'6/1','hizmetYili':6,'mezuniyet':1}}
out['unvanlar']=[u for u in out['unvanlar'] if u['id']!=member['id']]+[member]
p.write_text(json.dumps(out,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
Path('tests/fixtures/dis-kaynak-cezaevi-muduru.json').write_text(json.dumps(list(cases.values()),ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
print('Cezaevi müdürü: 12 kaynak bordrosuyla eksik oranlar tamamlandı.')
