"""Tekniker koşullarını birbirine birleştirmeden gözlenen derecelerle kaydeder."""
import json,re,sys
from pathlib import Path
data=json.loads(Path('artifacts/maas-dogrulama/memurlar-ui-bordrolar.json').read_text('utf-8'))
slug,name,code=('programci','Programcı',1009) if '--programci' in sys.argv else ('tekniker','Tekniker',1008)
def num(v):return float(re.sub(r'[^\d.\-]','',v.replace(',','')))
conditions={'2 Yıllık Yüksek Öğrenim Mezunu':('onlisans',10),'4 Yıllık Yüksek Öğrenim Mezunu':('dort-yil',9),'Lisans Mezunu':('lisans',9),'Mesleki üst öğrenim (Mühendis mezunu)':('muhendis',8),'Mesleki üst öğrenim (Teknik Öğretmen)':('teknik-ogretmen',9),'Önlisans Mezunu':('onlisans-mezunu',10)}
families={};cases={}
for r in data['observations']:
 f={a['id']:a['value'] for a in r['fields']}
 if f.get('_Salary_Position')!=slug or f.get('_Salary_Tax')!='' or f.get('_Salary_Date')!='2026-10-15' or r['condition'] not in conditions:continue
 rows={x[0]:x[1:] for x in r['rows'] if len(x)==3};degree=f['_Salary_Degree'];dk=degree+'/1'
 if 'Gösterge Aylığı ('+dk+')' not in rows:continue
 assert f['_Salary_Grade']=='1' and f['_Salary_TotalYears']=='0' and f['_Salary_Bes']=='false'
 variant,entry=conditions[r['condition']]
 rules={key:num(rows[label][0]) if label in rows else 0 for key,label in [('ekGosterge','Ek Gösterge Aylığı'),('yanOdeme','Yan Ödeme Aylığı'),('ozelHizmet','Özel Hizmet Tazminatı'),('ekOdeme','Ek Ödeme')]}
 families.setdefault(variant,{})[degree]=rules
 cases[(variant,degree)]={'unvan':slug,'kod':code,'kosul':variant,'kosulAdi':r['condition'],'derece':dk,'ay':10,'hizmetYili':0,'bes':False,**{k:num(rows[label][1]) for k,label in [('gelir','İstihaklar Toplamı'),('net','Net Maaş'),('matrah','Gelir Vergisi Matrahı')]},'damga':abs(num(rows['Damga Vergisi'][1])),'kaynakSatirlar':r['rows']}
for label,(variant,entry) in conditions.items():assert set(families[variant])==set(map(str,range(1,entry+1)))
p=Path('src/data/unvan-ek-kurallari.json');out=json.loads(p.read_text('utf-8'))
for label,(variant,entry) in conditions.items():out['aileler'][slug+'-'+variant]={'dereceler':families[variant],'adalet':False,'mezuniyet':1,'aciklama':name+': '+label+'.'}
member={'id':slug,'ad':name,'kod':code,'aile':slug+'-onlisans','varyantlar':[{'id':v,'ad':label,'aile':slug+'-'+v} for label,(v,entry) in conditions.items()],'dusuk':{'derece':'10/1','hizmetYili':0,'mezuniyet':1}}
out['unvanlar']=[u for u in out['unvanlar'] if u['id']!=member['id']]+[member]
p.write_text(json.dumps(out,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
p=Path('src/data/unvan-profilleri.json');profiles=json.loads(p.read_text('utf-8'))
profiles=[u for u in profiles if u['id']!=member['id']]+[{k:member[k] for k in ['id','ad','kod','dusuk']}]
p.write_text(json.dumps(profiles,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
Path('tests/fixtures/dis-kaynak-'+slug+'.json').write_text(json.dumps(list(cases.values()),ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
print(name+':',len(cases),'derece/koşul bordrosu kaydedildi.')
