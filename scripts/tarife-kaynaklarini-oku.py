from urllib.request import urlopen
from pathlib import Path
from pypdf import PdfReader
import io
p=Path(__file__).resolve().parents[1]/'artifacts/tarife-tarih';p.mkdir(exist_ok=True)
urls={'aaut2023':'https://www.barobirlik.org.tr/dosyalar/belgeler/AvUcretTarifesi/tbb2023.pdf','aaut2024':'https://www.barobirlik.org.tr/dosyalar/belgeler/AvUcretTarifesi/tbb2024.pdf','cmk2025':'https://d.barobirlik.org.tr/2025/CMKUcretTarifesitarife2025.pdf'}
for name,u in urls.items():
 data=urlopen(u,timeout=30).read();(p/f'{name}.pdf').write_bytes(data)
 (p/f'{name}.txt').write_text('\n'.join(x.extract_text() or '' for x in PdfReader(io.BytesIO(data)).pages),encoding='utf-8')
print('3 resmî kaynak metni alındı.')
