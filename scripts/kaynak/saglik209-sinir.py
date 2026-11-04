"""209 ek 3 hekim koşullarının alt derecelerinde sendika/BES/aile kontrolü."""
import json,os
from ozkansoft import KOK,Program
from mahep_profil import alanlar,secim_farklari

rules=json.loads((KOK/'src/data/standart-kadro-kurallari.json').read_text(encoding='utf-8'));out=KOK/'artifacts/kaynak-onbellek/kadro-kisisel-profiller.json';data=json.loads(out.read_text(encoding='utf-8'));p=Program('mahep',bekleme=1.5);p.ac()
for u in rules['unvanlar']:
 for v in u['varyantlar']:
  rule=rules['aileler'][v['aile']];ds=[int(d) for d,r in rule['dereceler'].items() if r.get('saglik209')]
  if not ds:continue
  code=u['id'].removeprefix('mahep-');condition=v['id'].removeprefix('k');condition='' if condition=='standart' else condition
  for degree in sorted(ds):
   key=f'{code}|saglik209-{v["id"]}-{degree}'
   if key in data['profiller']:continue
   base=p.gonder({'slcGorevUnvaniSecimi1':code},hesapla=False,yenile=True)
   if condition:base=p.gonder({'slcGorevUnvaniSecimi2':condition},hesapla=False,yenile=True)
   q={**alanlar(code,condition,degree),'slcKidemYili':'16','slcEsCalismaDurumu':'2','slcCocukYardimiK1':'1','slcCocukYardimiK2':'1','slcSendikaUyeligi':'12','slcOKBESUyeligi':'5','rdoGVOS':'15'}
   t=p.gonder(q,temel=base,beklenen={k:v for k,v in q.items() if k.startswith('slc')});delta=secim_farklari(t,q)
   if delta:raise ValueError(f'Secim uyusmazligi: {key}')
   data['profiller'][key]={'ad':u['ad'],'girdi':{'unvan':u['kod'],'unvanKosulu':v['id'],'derece':str(degree)+'/1','mezuniyet':rule['mezuniyet'],'hizmetYili':16,'kanun':5510,'esCalismiyor':True,'cocuk':{'kucuk':1,'buyuk':1,'engelliKucuk':0,'engelliBuyuk':0},'sendika':True,'bes':True,'besOran':5,'ay':10},'secimler':p.alanlar(t),'sonuclar':p.sonuclar(t)}
   tmp=out.with_suffix('.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8');os.replace(tmp,out);print(key,'ok',flush=True)
