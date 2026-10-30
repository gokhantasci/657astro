"""Bütün unvan/koşul/dereceler: canlı geçiş, dönen seçim kontrolü ve atomik kayıt.

--sinirlar yalnız derece aralığının iki ucunu toplar. Varsayılan tüm derecelerdir.
Önbellek, ancak istenen seçimlerle gerçekten eşleşiyorsa kullanılır.
"""
import argparse
import json
import os
from ozkansoft import Program, KOK
from mahep_profil import alanlar, secim_farklari

parser=argparse.ArgumentParser()
parser.add_argument('--sinirlar',action='store_true')
parser.add_argument('--unvan',nargs='*')
args=parser.parse_args()
folder=KOK/'artifacts/kaynak-onbellek'
out=folder/'mahep-dogrulanmis-profiller.json'
data=json.loads(out.read_text(encoding='utf-8')) if out.exists() else {'profiller':{},'reddedilen':{},'unvanlar':{}}

def kaydet():
    tmp=out.with_suffix('.tmp')
    tmp.write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8');os.replace(tmp,out)

p=Program('mahep',bekleme=1.2)
titles=p.secenekler(p.ac(),'slcGorevUnvaniSecimi1')
n=0
for code,name in titles:
    if args.unvan and code not in args.unvan:continue
    known=data['unvanlar'].get(code,{}).get('kosullar',[])
    if not args.sinirlar and known and all(f"{code}|{c['kod']}|{d}" in data['profiller'] for c in known for d in c['dereceler']):continue
    # Eski bir önbelleğin gizli durum/belirtecinden yeni form gönderilmez.
    page=p.gonder({'slcGorevUnvaniSecimi1':code},hesapla=False,yenile=True)
    conditions=p.secenekler(page,'slcGorevUnvaniSecimi2') or [('',name)]
    data['unvanlar'][code]={'ad':name,'kosullar':[]}
    for condition,label in conditions:
        if condition:page=p.gonder({'slcGorevUnvaniSecimi2':condition},hesapla=False,yenile=True)
        degrees=[v for v,_ in p.secenekler(page,'slcDerece')]
        data['unvanlar'][code]['kosullar'].append({'kod':condition,'ad':label,'dereceler':degrees})
        if args.sinirlar and degrees:degrees=list(dict.fromkeys([degrees[0],degrees[-1]]))
        for degree in degrees:
            key=f'{code}|{condition}|{degree}'
            if key in data['profiller']:continue
            expected=alanlar(code,condition,degree)
            page=p.gonder(expected,beklenen={k:v for k,v in expected.items() if k.startswith('slc')})
            delta=secim_farklari(page,expected)
            if delta:
                page=p.gonder(expected,yenile=True)
                delta=secim_farklari(page,expected)
            values=p.sonuclar(page)
            if delta or not values:
                data['reddedilen'][key]={'secimFarklari':delta,'sonucVar':bool(values)}
            else:
                data['profiller'][key]={'secimler':Program.alanlar(page),'sonuclar':values}
                data['reddedilen'].pop(key,None)
            n+=1
            if n%10==0:
                kaydet();print('profil',n,'toplam',len(data['profiller']),'ret',len(data['reddedilen']),name,degree,flush=True)
        kaydet()
    print('unvan tamam',code,name,flush=True)
kaydet()
print('tamam',len(data['profiller']),len(data['reddedilen']),flush=True)
