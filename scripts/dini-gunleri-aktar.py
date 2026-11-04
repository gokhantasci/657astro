"""Diyanet takvim tablolarını 2026–2031 arşivine aktarır; kaynak HTML saklanır."""
from html.parser import HTMLParser
from urllib.request import urlopen,Request
from pathlib import Path
import re,json
class Tables(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.row=[];self.cell=None
 def handle_starttag(self,t,a):
  if t=='tr':self.row=[]
  if t in ['td','th']:self.cell=''
 def handle_data(self,s):
  if self.cell is not None:self.cell+=s
 def handle_endtag(self,t):
  if t in ['td','th'] and self.cell is not None:self.row.append(re.sub(r'\s+',' ',self.cell).strip());self.cell=None
  if t=='tr' and self.row:self.rows.append(self.row)
root=Path(__file__).resolve().parents[1];cache=root/'artifacts/dini-gunler';cache.mkdir(parents=True,exist_ok=True)
all=[]
months=['OCAK','ŞUBAT','MART','NİSAN','MAYIS','HAZİRAN','TEMMUZ','AĞUSTOS','EYLÜL','EKİM','KASIM','ARALIK']
for year in range(2026,2032):
 url='https://vakithesaplama.diyanet.gov.tr/'+('dinigunler.php?yil=2026' if year==2026 else f'icerik.php?icerik={dict(zip(range(2027,2032),[154,185,186,187,188]))[year]}')
 s=urlopen(Request(url,headers={'User-Agent':'657.com.tr takvim kontrolu'}),timeout=30).read().decode('utf-8')
 (cache/f'{year}.html').write_text(s,encoding='utf-8');p=Tables();p.feed(s)
 count=0
 for r in p.rows:
  # Hicri gün/ay/yıl, miladi gün/ay-yıl, hafta günü, günün adı.
  if len(r)<7:continue
  m=re.search(r'([A-ZÇĞİÖŞÜ]+)\s*-\s*(20\d{2})',r[4])
  day=re.search(r'\d{1,2}',r[3])
  if not m or not day or int(m[2])!=year or m[1] not in months:continue
  if not re.search('[A-ZÇĞİÖŞÜa-zçğıöşü]',r[-1]):continue
  date=f'{year}-{months.index(m[1])+1:02}-{int(day[0]):02}'
  all.append({'tarih':date,'ad':r[-1],'kaynak':url});count+=1
 if count<10:raise ValueError(f'{year}: beklenen dini günler bulunamadı: {p.rows[:3]}')
(root/'src/data/dini-gunler.json').write_text(json.dumps(all,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
print(f'{len(all)} dini gün kaydı aktarıldı.')
