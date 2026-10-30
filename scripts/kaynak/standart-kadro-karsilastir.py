"""Aynı unvan/derecede açık ödeme oranı eşleşen Memurlar.net bordrolarını bağlar.

Koşul adının benzemesi yeterli değildir: ek gösterge, yan ödeme, ÖHT ve ek ödeme
ayrı ayrı eşleşmelidir. Ek ödeme kalemi bulunan farklı rejimler karıştırılmaz.
"""
import json,re
from pathlib import Path
from ozkansoft import KOK
from memurlar import sayi

folder=KOK/'artifacts/kaynak-onbellek'
mahep=json.loads((KOK/'tests/fixtures/standart-kadro-bordrolari.json').read_text(encoding='utf-8'))
rules=json.loads((KOK/'src/data/standart-kadro-kurallari.json').read_text(encoding='utf-8'))
inventory=json.loads((KOK/'src/data/maas-kaynak-envanteri.json').read_text(encoding='utf-8'))['unvanlar']
source=json.loads((folder/'memurlar-oranlar.json').read_text(encoding='utf-8'))
mapping={}
for u in inventory:
 codes=[x['kod'] for x in u['kaynaklar'] if x['kaynak']=='ozkan']
 m=[x['kod'] for x in u['kaynaklar'] if x['kaynak']=='memurlar']
 for c in codes:
  if m:mapping[c]=m[0]
title={u['kod']:u for u in rules['unvanlar']}
fixtures=[];pending=[]
for f in mahep:
 code,_,degree=f['key'].split('|');slug=mapping.get(code)
 if not slug:continue
 t=title[f['kod']];family=next(v['aile'] for v in t['varyantlar'] if v['id']==f['kosul']);rule=rules['aileler'][family]['dereceler'][degree]
 matches=0
 for key,rows in source.items():
  if not rows or not key.startswith(slug+'|') or not key.endswith('|'+degree):continue
  r={x[0]:x for x in rows if len(x)>=3}
  if f'Gösterge Aylığı ({degree}/1)' not in r:continue
  def rate(label):return sayi(r[label][1]) if label in r else 0
  if any(rate(label)!=rule.get(field,0) for label,field in [('Ek Gösterge Aylığı','ekGosterge'),('Yan Ödeme Aylığı','yanOdeme'),('Özel Hizmet Tazminatı','ozelHizmet'),('Ek Ödeme','ekOdeme'),('Denetim Tazminatı','denetim')]):continue
  unsupported=[x for x in r if x in ['Üniversite Ödeneği','Yükseköğretim Tazminatı','Makam Tazminatı','İlave Ücret','İl Adalet Hizmetleri Tazminatı','Fazla Mesai']]
  if unsupported:continue
  def amount(label):return abs(sayi(r[label][2]) or 0) if label in r else 0
  fixtures.append({**f,'memurlarKey':key,'memurlar':{'gelir':amount('İstihaklar Toplamı'),'emKes':amount('M.Y.Ö. Sigortası'),'gss':amount('G.S.S. Primi'),'damga':amount('Damga Vergisi'),'gv':amount('Gelir Vergisi'),'net':amount('Net Maaş')}});matches+=1
 if not matches:pending.append(f['key'])
(KOK/'tests/fixtures/standart-kadro-cift-kaynak.json').write_text(json.dumps(fixtures,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
(folder/'standart-kadro-cift-kaynak-bekleyen.json').write_text(json.dumps(pending),encoding='utf-8')
print('cift kaynak bordro',len(fixtures),'mahep profili bekleyen',len(pending))
