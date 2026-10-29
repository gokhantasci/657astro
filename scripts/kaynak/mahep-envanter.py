"""MAHEP unvan envanteri: her unvanın koşul (alt unvan) seçenekleri ve derece aralığı.

Çıktı: artifacts/kaynak-onbellek/mahep-envanter.json
Unvan seçimi formu sunucuya gönderir; dönen sayfadaki slcGorevUnvaniSecimi2 ve slcDerece listeleri okunur.
"""
import json, sys
from ozkansoft import Program, KOK

CIKTI = KOK / 'artifacts' / 'kaynak-onbellek' / 'mahep-envanter.json'
p = Program('mahep', bekleme=1.2)
acilis = p.ac()
unvanlar = p.secenekler(acilis, 'slcGorevUnvaniSecimi1')
onceki = json.loads(CIKTI.read_text(encoding='utf-8')) if CIKTI.exists() else {}
for i, (kod, ad) in enumerate(unvanlar, 1):
    if kod in onceki: continue
    t = p.gonder({'slcGorevUnvaniSecimi1': kod}, hesapla=False, temel=acilis)
    onceki[kod] = {
        'ad': ad,
        'kosullar': p.secenekler(t, 'slcGorevUnvaniSecimi2'),
        'dereceler': [v for v, _ in p.secenekler(t, 'slcDerece')],
        'kademeler': [v for v, _ in p.secenekler(t, 'slcKademe')],
        'alt_gorev': len(p.secenekler(t, 'slcAltGorevUnvani')),
    }
    if i % 10 == 0:
        CIKTI.write_text(json.dumps(onceki, ensure_ascii=False, indent=1), encoding='utf-8')
        print(i, '/', len(unvanlar), ad, flush=True)
CIKTI.write_text(json.dumps(onceki, ensure_ascii=False, indent=1), encoding='utf-8')
print('tamam', len(onceki))
