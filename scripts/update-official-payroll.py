import json
from pathlib import Path
p=Path('src/data/ayarlar.json');d=json.loads(p.read_text(encoding='utf-8'))
k=d['donemler'][0]
k['memur_maas_aylik_katsayi']=1.575512;k['yan_odeme_katsayi']=0.499649
k['kaynak']='https://ms.hmb.gov.tr/uploads/2026/07/2026-Yili-Temmuz-Ayina-Ait-Mali-ve-Sosyal-Haklara-Iliskin-Genelge-9b5304ed658d77cb.pdf'
k['gelir_vergisi_istisna']=4537.75
k['fark14'].update(aylik_katsayi=0.187641,taban_ayligi_katsayi=3.072122,yan_odeme_katsayi=0.059508)
p.write_text(json.dumps(d,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
