"""Sentetik kişisel karşılaştırmaları geçici form alanları olmadan yayımlar."""
import json
from ozkansoft import KOK

rules=json.loads((KOK/'src/data/standart-kadro-kurallari.json').read_text(encoding='utf-8'))
codes={u['id'].removeprefix('mahep-'):u['kod'] for u in rules['unvanlar']}
data=json.loads((KOK/'artifacts/kaynak-onbellek/kadro-kisisel-profiller.json').read_text(encoding='utf-8'))
allowed={'GelirlerToplami','KesintilerToplami','MalulYasVeOlDevletGelir','GenSagSigPirDevletGelir','EmKesKarsiligi','GelirVergisi','DamgaVergisi','SendikaAidati','BESKesintisi','GenSagSigPirKisi','MalulYasVeOlKisi','EmekliKesenegiKisi'}
out=[]
for key,v in data['profiller'].items():
 code=key.split('|')[0]
 if code not in codes:continue
 out.append({'id':key,'girdi':{**v['girdi'],'unvan':codes[code]},'sonuclar':{k:x for k,x in v['sonuclar'].items() if k in allowed}})
(KOK/'tests/fixtures/kadro-kisisel-profiller.json').write_text(json.dumps(out,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
print('sentetik profil',len(out))
