"""Yerel kaynak taramalarını sayar; boş sonuçları ve çelişkileri doğrulanmış saymaz.

python scripts/kaynak/onbellek_raporu.py
Kaynak dosyaları değiştirilmez; çıktı JSON'dur. Bu rapor sayısal bordro karşılaştırması değildir.
"""
import json
from pathlib import Path

KOK = Path(__file__).resolve().parents[2]
klasor = KOK / 'artifacts/kaynak-onbellek'
rapor = {}
for kaynak in ('mahep', 'memurlar'):
    birlesik, celiski = {}, set()
    dosyalar = [klasor / f'{kaynak}-oranlar.json', *sorted(klasor.glob(f'{kaynak}-oranlar-*.json'))]
    for dosya in dosyalar:
        if not dosya.exists():
            continue
        veri = json.loads(dosya.read_text(encoding='utf-8'))
        for anahtar, sonuc in veri.items():
            if anahtar in birlesik and birlesik[anahtar] != sonuc:
                celiski.add(anahtar)
            birlesik[anahtar] = sonuc
    dolu = {k: v for k, v in birlesik.items() if v and k not in celiski}
    rapor[kaynak] = {
        'toplam_kayit': len(birlesik),
        'bos_sonuc': sum(not v for v in birlesik.values()),
        'celiskili_kayit': len(celiski),
        'dolu_celiskisiz_kayit': len(dolu),
        'dolu_sonucu_olan_kaynak_unvan_kodu': len({k.split('|')[0] for k in dolu}),
        'aciklama': 'Dolu sonuç, yerel hesapla karşılaştırılmış veya tüm koşulları kapsanmış demek değildir.',
    }
print(json.dumps(rapor, ensure_ascii=False, indent=2))
