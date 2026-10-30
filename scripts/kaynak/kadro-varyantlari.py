"""Standart unvanların her birinde iki ek kişisel profil, seçili alan kontrolüyle."""
import argparse,json,os
from ozkansoft import KOK,Program
from mahep_profil import alanlar,secim_farklari

arg=argparse.ArgumentParser();arg.add_argument('--limit',type=int,default=0);args=arg.parse_args()
rules=json.loads((KOK/'src/data/standart-kadro-kurallari.json').read_text(encoding='utf-8'))
out=KOK/'artifacts/kaynak-onbellek/kadro-kisisel-profiller.json'
data=json.loads(out.read_text(encoding='utf-8')) if out.exists() else {'profiller':{},'reddedilen':{}}
def save():
 tmp=out.with_suffix('.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8');os.replace(tmp,out)
p=Program('mahep',bekleme=1.5);p.ac()
for i,u in enumerate(rules['unvanlar']):
 if args.limit and i>=args.limit:break
 code=u['id'].removeprefix('mahep-');condition=u['varyantlar'][0]['id'].removeprefix('k');condition='' if condition=='standart' else condition
 if all(code+'|'+name in data['profiller'] for name in ['aile-5510','kidem-engel-5434']):continue
 rule=rules['aileler'][u['varyantlar'][0]['aile']];degree=str(min(map(int,rule['dereceler'])))
 page=p.gonder({'slcGorevUnvaniSecimi1':code},hesapla=False,yenile=True)
 if condition:page=p.gonder({'slcGorevUnvaniSecimi2':condition},hesapla=False,yenile=True)
 for name,year,law,married,kids,big,disabled,union,bes in [('aile-5510',16,5510,True,1,1,0,True,5),('kidem-engel-5434',25,5434,False,0,0,1,False,3)]:
  key=code+'|'+name
  if key in data['profiller']:continue
  q={**alanlar(code,condition,degree),'slcKidemYili':str(year),'slcKidemYiliTerfi':str(year),'slcKademe':'2','slcKademeEmeklilik':'2','slcKademeTerfi':'2','slcGoreveBaslamaTarihi':'1' if law==5510 else '0','slcEsCalismaDurumu':'2' if married else '0','slcCocukYardimiK1':str(kids),'slcCocukYardimiK2':str(big),'slcEngelliCocukYardimiK1':str(disabled),'slcEngelliCocukYardimiK2':'0','slcSendikaUyeligi':'12' if union else '0','slcOKBESUyeligi':str(bes),'slcEngellilikIndirimiDerecesi':'3' if law==5434 else '0','rdoGVOS':'15'}
  page=p.gonder(q,beklenen={k:v for k,v in q.items() if k.startswith('slc')});delta=secim_farklari(page,q)
  if delta:
   page=p.gonder(q,yenile=True);delta=secim_farklari(page,q)
  if delta:data['reddedilen'][key]=delta
  else:
   data['reddedilen'].pop(key,None)
   data['profiller'][key]={'ad':u['ad'],'girdi':{'unvan':u['kod'],'unvanKosulu':u['varyantlar'][0]['id'],'derece':degree+'/2','mezuniyet':rule['mezuniyet'],'hizmetYili':year,'kanun':law,'esCalismiyor':married,'cocuk':{'kucuk':kids,'buyuk':big,'engelliKucuk':disabled,'engelliBuyuk':0},'sendika':union,'bes':True,'besOran':bes,'ay':10,'engellilikDerecesi':3 if law==5434 else 0},'secimler':p.alanlar(page),'sonuclar':p.sonuclar(page)}
  save()
 print(i+1,len(rules['unvanlar']),u['ad'],'profiller',len(data['profiller']),'ret',len(data['reddedilen']),flush=True)
save()
