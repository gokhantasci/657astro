"""Önceki oturumun salt okunur tema kopyasından maaş verilerini aktarır."""
import json, re, html, sys
from pathlib import Path

if len(sys.argv) != 2:
    raise SystemExit('Kullanım: python scripts/import-maas.py <salt-okunur-tema-kopyası>')
tema = Path(sys.argv[1])
page = (tema / 'memur.html').read_text(encoding='utf-8')
params = json.loads(re.search(r'var TeftisMaasVars = (.*?);', page).group(1))['salaryParams']
p = Path('src/data/ayarlar.json')
data = json.loads(p.read_text(encoding='utf-8'))
# Seyyanen gösterge ortak sabitlerden okunur; ikinci kopyası tutulmaz.
params.pop('seyyanen_zam_gosterge')
data['maas_parametreleri'] = params
old = json.loads((tema / 'katsayilar.json').read_text(encoding='utf-8-sig'))
fark = next(x for x in old if x['durum'] == 'farkkatsayilarenf')
data['donemler'][0]['fark14'] = {k:v for k,v in fark.items() if k not in ('durum','enflasyon')}
p.write_text(json.dumps(data, ensure_ascii=False, indent=1)+'\n', encoding='utf-8')
p = Path('src/data/memur-maas-secenekler.json')
data = json.loads(p.read_text(encoding='utf-8'))
for key, name in [('ogretmen_alt_gorev','slcAltGorevUnvani'),('ogretmen_alan','slcAlan')]:
    options = {}
    for select in re.findall(r'<select[^>]*name="'+name+r'"[^>]*>(.*?)</select>',page,re.S):
        for value, label in re.findall(r'<option[^>]*value="(\d+)"[^>]*>(.*?)</option>',select,re.S):
            options[int(value)] = html.unescape(re.sub('<[^>]+>','',label)).strip()
    data[key] = [{'kod':k,'ad':v} for k,v in sorted(options.items())]
p.write_text(json.dumps(data, ensure_ascii=False, indent=1)+'\n', encoding='utf-8')
print('Öğretmen seçenekleri:', len(data['ogretmen_alt_gorev']), len(data['ogretmen_alan']))
