"""Memurlar.net kadrolu maaş robotundan her unvan × koşul × derece için kalemleri ve oranları toplar.

Unvan ve koşul listesi: artifacts/maas-dogrulama/memurlar-ui-bordrolar.json → inventory.
Profil MAHEP taramasıyla aynıdır: Ekim 2026, kademe 1, hizmet 0, bekâr, çocuksuz, sendikasız, BES yok.
Çıktı: artifacts/kaynak-onbellek/memurlar-oranlar.json  {"<unvan>|<koşul>|<derece>": [[kalem, oran, tutar], ...]}
"""
import json, sys
import memurlar as m

ENV = m.KOK / 'artifacts' / 'maas-dogrulama' / 'memurlar-ui-bordrolar.json'
CIKTI = m.KOK / 'artifacts' / 'kaynak-onbellek' / 'memurlar-oranlar.json'
envanter = json.loads(ENV.read_text(encoding='utf-8'))['inventory']
secili = set(sys.argv[1:])
sonuc = json.loads(CIKTI.read_text(encoding='utf-8')) if CIKTI.exists() else {}
n = 0
for u in envanter:
    if secili and u['id'] not in secili: continue
    for k in (u.get('conditions') or [{'value': ''}]):
        bos = 0
        for derece in range(1, 16):
            anahtar = f"{u['id']}|{k['value']}|{derece}"
            if anahtar in sonuc:
                continue
            t = m.maas(u['id'], k['value'], derece)
            rs = m.satirlar(t)
            i = next((i for i, r in enumerate(rs) if r and r[0].startswith('Gösterge Aylığı')), None)
            if i is None:
                sonuc[anahtar] = None
            else:
                j = next((j for j in range(i, len(rs)) if rs[j] and rs[j][0] == 'Not'), len(rs))
                sonuc[anahtar] = [r for r in rs[i - 1:j] if len(r) >= 2]
            n += 1
            if n % 25 == 0:
                CIKTI.write_text(json.dumps(sonuc, ensure_ascii=False), encoding='utf-8')
                print(n, anahtar, flush=True)
CIKTI.write_text(json.dumps(sonuc, ensure_ascii=False), encoding='utf-8')
print('tamam', len(sonuc))
