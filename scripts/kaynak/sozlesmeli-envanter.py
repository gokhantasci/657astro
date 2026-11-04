"""Canlı Memurlar.net seçimlerini mevcut 4/B unvanlarıyla karşılaştırır."""
import re,json
from pathlib import Path
from memurlar import getir,secenekler
root=Path(__file__).resolve().parents[2]
t=getir('/maas/sozlesmeli/',{'_657kontrol':'20261103'})
(root/'artifacts/sozlesmeli-canli-20261103.html').write_text(t,encoding='utf-8')
names=re.findall(r'<select[^>]*(?:id|name)="([^"]+)"',t)
for name in names:
 opts=secenekler(t,name)
 if 'Position' in name:
  (root/'artifacts/sozlesmeli-canli-secimler.json').write_text(json.dumps({'alan':name,'secimler':opts},ensure_ascii=False,indent=1),encoding='utf-8')
  print(name,len(opts),opts[:3])
  current=json.loads((root/'src/data/sozlesmeli-unvanlar.json').read_text(encoding='utf-8'))['unvanlar']
  missing=[(slug,ad) for slug,ad in opts if slug and slug not in {u.get('kaynakUnvan') for u in current}]
  print('Eksik kaynak unvanı:',missing)
  (root/'tests/fixtures/sozlesmeli-unvanlar-20261103.json').write_text(json.dumps({'tarih':'2026-11-03','kaynak':'https://www.memurlar.net/maas/sozlesmeli/','unvanlar':[{'slug':slug,'ad':ad} for slug,ad in opts if slug]},ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
