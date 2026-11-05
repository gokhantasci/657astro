"""Resmî tarife bağlantılarını ve denetlenebilir kaynak metinlerini toplar."""
from pathlib import Path
from urllib.parse import urljoin
from concurrent.futures import ThreadPoolExecutor
import requests, json, io
from bs4 import BeautifulSoup
from pypdf import PdfReader

OUT=Path('artifacts/tarife-kaynaklari'); OUT.mkdir(parents=True,exist_ok=True)
INDEX={
 'icra':'https://iidb.adalet.gov.tr/Home/SayfaDetay/ucret-tarifesi',
 'bilirkisi':'https://bilirkisilik.adalet.gov.tr/Home/SayfaDetay/bilirkisilik-asgari-ucret-tarifesi02072020031131',
 'arabulucu':'https://adb.adalet.gov.tr/Home/SayfaDetay/ucret-tarifeleri30092020013011',
}
def fetch(item):
 name,url=item
 try:
  r=requests.get(url,timeout=35);r.raise_for_status()
  (OUT/(name+('.pdf' if r.content[:4]==b'%PDF' else '.html'))).write_bytes(r.content)
  if r.content[:4]==b'%PDF':
   text='\n'.join(p.extract_text() or '' for p in PdfReader(io.BytesIO(r.content)).pages)
  else:
   r.encoding=r.apparent_encoding;s=BeautifulSoup(r.text,'html.parser')
   text=s.get_text(' ',strip=True)
   links=[{'ad':a.get_text(' ',strip=True),'url':urljoin(url,a['href'])} for a in s.select('a[href]') if any(y in a.get_text() for y in ['2024','2025','2026'])]
   (OUT/(name+'-links.json')).write_text(json.dumps(links,ensure_ascii=False,indent=2),encoding='utf-8')
  (OUT/(name+'.txt')).write_text(text,encoding='utf-8')
  print(name,'OK',len(text),flush=True)
 except Exception as e: print(name,'ERROR',str(e)[:120],flush=True)
if __name__=='__main__':
 import sys,re
 if '--belgeler' in sys.argv:
  INDEX={}
  for group in ['icra','bilirkisi','arabulucu']:
   for i,a in enumerate(json.loads((OUT/(group+'-links.json')).read_text(encoding='utf-8'))):INDEX[f'{group}-{i}']=a['url']
  for year,date in [(2023,'20231024'),(2024,'20241023'),(2025,'20251028')]:
   for label,n in [('avans',3 if year==2023 else 4 if year==2024 else 2),('hakem',4 if year==2023 else 5 if year==2024 else 3),('hmktanik',5 if year==2023 else 6 if year==2024 else 4)]:INDEX[f'{label}-{year}']=f'https://www.resmigazete.gov.tr/eskiler/{year}/10/{date}-{n}.htm'
  INDEX.update({'uzlastir-2024':'https://alternatifcozumler.adalet.gov.tr/Resimler/Mevzuat/20120241440202024 Uzlaştırmacı Asgari Ücret Tarifesi.pdf','uzlastir-2025':'https://alternatifcozumler.adalet.gov.tr/Resimler/icon/3112202409594320241231.pdf','uzlastir-2026':'https://www.resmigazete.gov.tr/eskiler/2025/12/20251231-5.htm','sigorta-2024':'https://www.sigortatahkim.org/content/CmsFiles/bilirkisiucrettarifesi2024.pdf','sigorta-2025':'https://www.sigortatahkim.org/manset/34','sigorta-2026':'https://www.sigortatahkim.org/content/CmsFiles/bilirkisitarife2026.pdf','tanik-2024':'https://www.resmigazete.gov.tr/eskiler/2023/12/20231228-3.htm','tanik-2025':'https://www.resmigazete.gov.tr/eskiler/2024/12/20241228-4.htm','tanik-2026':'https://www.resmigazete.gov.tr/eskiler/2025/12/20251226-5.htm','thh':'https://tuketici.ticaret.gov.tr/duyurular/tuketici-hakem-heyetleri-bilirkisilik-ucret-tarifesi'})
 with ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(fetch,INDEX.items()))
