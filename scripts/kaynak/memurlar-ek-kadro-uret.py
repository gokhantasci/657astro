"""MAHEP'te adı bulunmayan Memurlar.net standart 657 unvanları.

666/2802 ve ayrı ödeme rejimleri otomatik standart 657 sayılmaz. Kaynak toplamı,
her ödeme ve iki prim matrahı uzlaşmadan bir derece yayımlanmaz.
"""
import json,re,zlib
from collections import defaultdict
from ozkansoft import KOK
from memurlar import sayi

read=lambda p:json.loads((KOK/p).read_text(encoding='utf-8'))
local={u['ad'].casefold() for f in ['src/data/memur-maas-secenekler.json','src/data/unvan-ek-kurallari.json','src/data/standart-kadro-kurallari.json'] for u in read(f)['unvanlar']}
names={s['kod']:u['ad'] for u in read('src/data/maas-kaynak-envanteri.json')['unvanlar'] if u['ad'].casefold() not in local for s in u['kaynaklar'] if s['kaynak']=='memurlar'}
data=read('artifacts/kaynak-onbellek/memurlar-sinir-profilleri.json')['profiller']
path=KOK/'artifacts/kaynak-onbellek/memurlar-ek-tum-dereceler.json'
if path.exists():data.update(json.loads(path.read_text(encoding='utf-8'))['profiller'])
settings=read('src/data/ayarlar.json');k=next(x for x in settings['donemler'] if x['baslangic']=='2026-07-01');a,b,y=k['memur_maas_aylik_katsayi'],k['taban_aylik_katsayi'],k['yan_odeme_katsayi'];mh=settings['maas_parametreleri']['maas_hesaplama_gosterge'];r=lambda x:round(x+1e-8,2)
groups=defaultdict(dict);fixtures=[];pending=[]
labels={'Gösterge Aylığı','Ek Gösterge Aylığı','Taban Aylığı','Yan Ödeme Aylığı','Özel Hizmet Tazminatı','Ek Ödeme','İlave Seyyanen Ödenek'}
for key,v in data.items():
 slug,condition,degree=key.split('|')
 if slug not in names:continue
 selected=v['secimler'];rows=v['sonuclar'];record={row[0]:row for row in rows if len(row)>=3}
 if selected.get('Salary_Position')!=slug or selected.get('Salary_Condition','')!=condition or selected.get('Salary_Degree')!=degree:continue
 first=next((i for i,row in enumerate(rows) if row and row[0]=='İstihaklar'),-1);last=next((i for i,row in enumerate(rows) if row and row[0]=='Kesintiler'),-1)
 income=rows[first+1:last] if first>=0 and last>first else []
 unknown=[row[0] for row in income if row and row[0] not in labels and not row[0].startswith('Gösterge Aylığı (')]
 if unknown:pending.append({'key':key,'ad':names[slug],'neden':'ayri-rejim-kalemleri','kalemler':unknown});continue
 def val(label):return abs(sayi(record[label][2]) or 0) if label in record else 0
 def rate(label):return sayi(record[label][1]) or 0 if label in record else 0
 indicator=next((row for row in income if row[0]==f'Gösterge Aylığı ({degree}/1)'),None)
 if not indicator:pending.append({'key':key,'ad':names[slug],'neden':'derece-kademe-uyusmuyor'});continue
 gosterge=sayi(indicator[1]);rule={'ekGosterge':rate('Ek Gösterge Aylığı'),'yanOdeme':rate('Yan Ödeme Aylığı'),'ozelHizmet':rate('Özel Hizmet Tazminatı'),'ekOdeme':rate('Ek Ödeme')}
 expected={f'Gösterge Aylığı ({degree}/1)':r(gosterge*a),'Ek Gösterge Aylığı':r(rule['ekGosterge']*a),'Taban Aylığı':r(1000*b),'Yan Ödeme Aylığı':r(rule['yanOdeme']*y),'Özel Hizmet Tazminatı':r(rule['ozelHizmet']*mh*a/100),'Ek Ödeme':r(rule['ekOdeme']*mh*a/100),'İlave Seyyanen Ödenek':r(settings['sabitler']['seyyanen_zam_gosterge']*a)}
 gross=sum(expected.values());prim=(gosterge+rule['ekGosterge'])*a+1000*b+rule['ozelHizmet']*mh*a/100
 if any(abs(amount-val(label))>.011 for label,amount in expected.items()) or abs(gross-val('İstihaklar Toplamı'))>.021 or abs(r(prim*.09)-val('M.Y.Ö. Sigortası'))>.011 or abs(r(prim*.05)-val('G.S.S. Primi'))>.011:
  pending.append({'key':key,'ad':names[slug],'neden':'gelir-veya-prim-uyusmuyor'});continue
 code=100000000+zlib.crc32(slug.encode());variant='m'+str(zlib.crc32(condition.encode()))
 groups[(slug,condition,variant,code)][degree]=rule
 fixtures.append({'key':key,'kod':code,'kosul':variant,'derece':degree+'/1','gelir':val('İstihaklar Toplamı'),'emKes':val('M.Y.Ö. Sigortası'),'gss':val('G.S.S. Primi'),'damga':val('Damga Vergisi'),'gv':val('Gelir Vergisi'),'net':val('Net Maaş')})
families={};titles={}
for (slug,condition,variant,code),rules in groups.items():
 family='memurlar-'+slug+'-'+variant;education=2 if re.search(r'lise|ortaokul|ilkokul',condition,re.I) and not re.search(r'lisans|yüksek',condition,re.I) else 1
 families[family]={'dereceler':dict(sorted(rules.items(),key=lambda x:int(x[0]))),'adalet':False,'mezuniyet':education,'aciklama':'Memurlar.net ödeme kalemleri ve prim matrahı denetlenmiş 657 profili. Yalnız kaydedilen dereceler desteklenir.'}
 if slug not in titles:titles[slug]={'id':'memurlar-'+slug,'ad':names[slug],'kod':code,'aile':family,'varyantlar':[],'dusuk':{'derece':str(max(map(int,rules)))+'/1','hizmetYili':0,'mezuniyet':education}}
 titles[slug]['varyantlar'].append({'id':variant,'ad':condition or 'Standart görev','aile':family})
out={'kaynak':'https://www.memurlar.net/maas/','gozlemTarihi':'2026-10-30','aileler':families,'unvanlar':list(titles.values())}
(KOK/'src/data/memurlar-ek-kurallari.json').write_text(json.dumps(out,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
(KOK/'tests/fixtures/memurlar-ek-bordrolar.json').write_text(json.dumps(fixtures,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
(KOK/'artifacts/kaynak-onbellek/memurlar-ek-kadro-bekleyen.json').write_text(json.dumps(pending,ensure_ascii=False),encoding='utf-8')
print('Ek Memurlar unvan',len(titles),'kosul',len(families),'bordro',len(fixtures),'bekleyen',len(pending))
