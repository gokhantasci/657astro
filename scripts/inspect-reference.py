from html.parser import HTMLParser
from pathlib import Path
class Scan(HTMLParser):
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='script' and a.get('src') and not a['src'].startswith('data:'):print('JS',a['src'])
  if tag=='form':print('FORM',a)
for name in ['ozkan','memurlar','memurozluk','kadim']:
 print('\n'+name)
 b=Path('artifacts/maas-dogrulama/'+name+'.html').read_bytes()
 try:d=b.decode('utf-8')
 except UnicodeDecodeError:d=b.decode('cp1254')
 Scan().feed(d)
