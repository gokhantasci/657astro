"""Yalnız önceden yetkilendirilmiş ayrı 657-oneri servisine sayaç ekler."""
from pathlib import Path
import shutil,subprocess,os,json,time
from urllib.request import urlopen
p=Path('/opt/657-oneri/current')
if str(p.resolve())!='/opt/657-oneri/current':raise RuntimeError('Servis dizini doğrulanamadı.')
app=p/'app.py';nextapp=p/'app.py.next';manifest=p/'dosya-kimlikleri.json.next'
compile(nextapp.read_text(encoding='utf-8'),str(nextapp),'exec')
if len(json.loads(manifest.read_text(encoding='utf-8')))!=9:raise RuntimeError('Dosya listesi doğrulanamadı.')
backup=p/'app.py.before-indirme-20261103'
if not backup.exists():shutil.copy2(app,backup)
os.replace(manifest,p/'dosya-kimlikleri.json');os.replace(nextapp,app)
try:
 subprocess.run(['systemctl','restart','657-oneri'],check=True)
 for attempt in range(15):
  try:
   with urlopen('http://127.0.0.1:4326/api/indirme?id=kesinlesme-hesaplama',timeout=2) as r:
    result=json.load(r)
   if not isinstance(result.get('sayi'),int):raise RuntimeError('Sayaç yanıtı doğrulanamadı.')
   break
  except Exception:
   if attempt==14:raise
   time.sleep(1)
 print('Ayrı servis aktif; indirme sayacı salt okunur kontrolü geçti.')
except Exception:
 shutil.copy2(backup,app);subprocess.run(['systemctl','restart','657-oneri'],check=True);raise
