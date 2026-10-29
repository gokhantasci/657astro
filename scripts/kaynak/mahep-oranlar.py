"""MAHEP'ten her unvan × koşul × derece için ödeme kalemlerini toplar (2026 Temmuz–Aralık, Ekim ayı).

Profil sabit tutulur: kademe 1, kıdem 0, bekâr, çocuksuz, sendikasız, BES/İLKSAN yok, görev yeri varsayılan.
Böylece her kalem doğrudan ödeme oranına çevrilebilir (bkz. mahep-kurallar.py).
Çıktı: artifacts/kaynak-onbellek/mahep-oranlar.json  {"<unvan>|<koşul>|<derece>": {kalem: "tutar", ...}}
Kullanım: python mahep-oranlar.py [unvan_kodu ...]
"""
import json, sys
from ozkansoft import Program, KOK

ENVANTER = KOK / 'artifacts' / 'kaynak-onbellek' / 'mahep-envanter.json'
CIKTI = KOK / 'artifacts' / 'kaynak-onbellek' / 'mahep-oranlar.json'
SABIT = {'slcButceDonemiSecimi': '30', 'slcHesaplanacakAySecimi': '10', 'slcKademe': '1', 'slcKidemYili': '0',
         'slcEsCalismaDurumu': '0', 'slcCocukYardimiK1': '0', 'slcCocukYardimiK2': '0', 'slcSendikaUyeligi': '0',
         'slcILKSANUyeligi': '0', 'slcOKBESUyeligi': '0', 'slcGoreveBaslamaTarihi': '1',
         'txtGVIstisnasiFaydalanilanInt': '0', 'txtGVIstisnasiFaydalanilanFra': '00',
         'txtDVIstisnasiFaydalanilanInt': '0', 'txtDVIstisnasiFaydalanilanFra': '00'}

envanter = json.loads(ENVANTER.read_text(encoding='utf-8'))
secili = sys.argv[1:] or list(envanter)
sonuc = json.loads(CIKTI.read_text(encoding='utf-8')) if CIKTI.exists() else {}
p = Program('mahep', bekleme=1.2)
p.ac()
n = 0
for kod in secili:
    u = envanter[kod]
    kosullar = u['kosullar'] or [('', '')]
    p.gonder({'slcGorevUnvaniSecimi1': kod}, hesapla=False)
    for kv, _ in kosullar:
        for derece in u['dereceler']:
            anahtar = f'{kod}|{kv}|{derece}'
            if anahtar in sonuc: continue
            alan = {**SABIT, 'slcGorevUnvaniSecimi1': kod, 'slcDerece': derece, 'slcDereceEmeklilik': derece, 'slcDereceTerfi': derece}
            if kv: alan['slcGorevUnvaniSecimi2'] = kv
            t = p.gonder(alan)
            sonuc[anahtar] = p.sonuclar(t)
            n += 1
            if n % 25 == 0:
                CIKTI.write_text(json.dumps(sonuc, ensure_ascii=False), encoding='utf-8')
                print(n, anahtar, u['ad'], flush=True)
CIKTI.write_text(json.dumps(sonuc, ensure_ascii=False), encoding='utf-8')
print('tamam', len(sonuc))
