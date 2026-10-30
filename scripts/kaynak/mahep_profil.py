"""MAHEP gözlemini dönen seçimlerle doğrular; hatalı önbellekten kural üretmez."""
import hashlib
import json
from pathlib import Path
from ozkansoft import Program, KOK

SABIT = {'slcButceDonemiSecimi': '30', 'slcHesaplanacakAySecimi': '10', 'slcKademe': '1', 'slcKidemYili': '0',
         'slcEsCalismaDurumu': '0', 'slcCocukYardimiK1': '0', 'slcCocukYardimiK2': '0', 'slcSendikaUyeligi': '0',
         'slcILKSANUyeligi': '0', 'slcOKBESUyeligi': '0', 'slcGoreveBaslamaTarihi': '1',
         'txtGVIstisnasiFaydalanilanInt': '0', 'txtGVIstisnasiFaydalanilanFra': '00',
         'txtDVIstisnasiFaydalanilanInt': '0', 'txtDVIstisnasiFaydalanilanFra': '00'}

def alanlar(kod, kosul, derece):
    d = {**SABIT, 'slcGorevUnvaniSecimi1': kod, 'slcDerece': str(derece), 'slcDereceEmeklilik': str(derece), 'slcDereceTerfi': str(derece)}
    if kosul:
        d['slcGorevUnvaniSecimi2'] = kosul
    return d

def secim_farklari(t, beklenen):
    actual = Program.alanlar(t)
    return {k: {'istenen':str(v), 'donen':actual.get(k)} for k,v in beklenen.items() if k.startswith('slc') and actual.get(k) != str(v)}

def onbellek_yolu(alan):
    key = hashlib.sha1(json.dumps(['mahep', sorted((k,str(v)) for k,v in alan.items()), True],ensure_ascii=False).encode()).hexdigest()
    return KOK / 'artifacts/kaynak-onbellek/ozkansoft' / f'{key}.html'

if __name__ == '__main__':
    folder=KOK/'artifacts/kaynak-onbellek'
    kaynak=json.loads((folder/'mahep-oranlar.json').read_text(encoding='utf-8'))
    gecerli, fark, eksik = {}, {}, []
    for key, sonuc in kaynak.items():
        code,condition,degree=key.split('|')
        expected=alanlar(code,condition,degree)
        file=onbellek_yolu(expected)
        if not file.exists():
            eksik.append(key);continue
        metin=file.read_text(encoding='utf-8'); delta=secim_farklari(metin,expected)
        if delta:
            fark[key]=delta
        elif Program.sonuclar(metin)==sonuc:
            gecerli[key]=sonuc
        else:
            fark[key]={'sonuc':'JSON ile HTML kalemleri uyuşmuyor'}
    (folder/'mahep-profil-denetimi.json').write_text(json.dumps({'gecerli':gecerli,'farklar':fark,'htmlEksik':eksik},ensure_ascii=False),encoding='utf-8')
    print(json.dumps({'toplam':len(kaynak),'girdiEslesen':len(gecerli),'uyusmayan':len(fark),'htmlEksik':len(eksik)},ensure_ascii=False))
