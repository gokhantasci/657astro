"""Adli çevre kaynağını (WordPress All Import'a verilen teskilat_guncel.json) src/data/adli-teskilat.json olarak alır.

Sayfalar derlemede bu dosyadan üretilir (src/lib/adlicevre.ts); yeni listeyi elle bu dosyanın yerine koymak da yeterlidir.
Kullanım:
  python scripts/import-adlicevre.py <dosya.json>   yerel dosyadan
  python scripts/import-adlicevre.py --sunucu       canlı sunucudan salt okunur (ssh takma adı kickhex-production)
"""
import json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEDEF = ROOT / 'src/data/adli-teskilat.json'
UZAK = '/home/kickadmin/web/657.com.tr/public_html/wp-content/uploads/wpallimport/files/teskilat_guncel.json'
ALANLAR = ['il', 'mahal', 'bolge', 'teskilat', 'durum', 'bagli_adliye', 'bagli_acm', 'bagli_bam', 'cbs_var', 'en_yakin_acm']

if len(sys.argv) < 2: raise SystemExit(__doc__)
ham = subprocess.run(['ssh', 'kickhex-production', f'cat {UZAK}'], capture_output=True, check=True).stdout if sys.argv[1] == '--sunucu' \
    else Path(sys.argv[1]).read_bytes()
veri = json.loads(ham.decode('utf-8-sig'))
assert isinstance(veri, list) and veri, 'Liste bekleniyordu.'
for i, k in enumerate(veri):
    eksik = [a for a in ALANLAR if a not in k]
    if eksik: raise SystemExit(f'{i}. kayıtta eksik alan: {eksik}')
HEDEF.write_text(json.dumps([{a: str(k[a]).strip() for a in ALANLAR} for k in veri], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print(len(veri), 'adli teşkilat kaydı yazıldı:', HEDEF)
