"""Açık bordro çıktılarından istatistikçi oranlarını ve sentetik test örneklerini çıkarır."""
import json,re
from pathlib import Path
data=json.loads(Path('artifacts/maas-dogrulama/memurlar-ui-bordrolar.json').read_text('utf-8'))
def num(v):return float(re.sub(r'[^\d.\-]','',v.replace(',','')))
rules={};cases={}
for r in data['observations']:
 f={a['id']:a['value'] for a in r['fields']}
 if f.get('_Salary_Position')!='istatistikci' or f.get('_Salary_Tax')!='' or f.get('_Salary_Date')!='2026-10-15':continue
 rows={x[0]:x[1:] for x in r['rows'] if len(x)==3}
 degree=f['_Salary_Degree'];dk=degree+'/1'
 if 'Gösterge Aylığı ('+dk+')' not in rows:continue
 assert f['_Salary_Grade']=='1' and f['_Salary_TotalYears']=='0' and f['_Salary_Bes']=='false'
 rules[degree]={key:num(rows[label][0]) if label in rows else 0 for key,label in [('ekGosterge','Ek Gösterge Aylığı'),('yanOdeme','Yan Ödeme Aylığı'),('ozelHizmet','Özel Hizmet Tazminatı'),('ekOdeme','Ek Ödeme')]}
 cases[degree]={'unvan':'istatistikci','kod':1007,'derece':dk,'ay':10,'hizmetYili':0,'bes':False,**{k:num(rows[label][1]) for k,label in [('gelir','İstihaklar Toplamı'),('net','Net Maaş'),('matrah','Gelir Vergisi Matrahı')]},'damga':abs(num(rows['Damga Vergisi'][1]))}
assert set(rules)==set(map(str,range(1,10))),rules.keys()
p=Path('src/data/unvan-ek-kurallari.json');out=json.loads(p.read_text('utf-8'))
out['aileler']['istatistikci']={'dereceler':rules,'adalet':False,'mezuniyet':1}
member={'id':'istatistikci','ad':'İstatistikçi','kod':1007,'aile':'istatistikci','dusuk':{'derece':'9/1','hizmetYili':0,'mezuniyet':1}}
out['unvanlar']=[u for u in out['unvanlar'] if u['id']!=member['id']]+[member]
p.write_text(json.dumps(out,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
p=Path('src/data/unvan-profilleri.json');profiles=json.loads(p.read_text('utf-8'))
profiles=[u for u in profiles if u['id']!=member['id']]+[{k:member[k] for k in ['id','ad','kod','dusuk']}]
p.write_text(json.dumps(profiles,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
Path('tests/fixtures/dis-kaynak-istatistikci.json').write_text(json.dumps(list(cases.values()),ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
print('İstatistikçi: 9 derece ve 9 gerçek bordro örneği kaydedildi.')
