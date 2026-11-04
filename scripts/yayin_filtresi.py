import re,unicodedata
def normalize(s):return ''.join(c for c in unicodedata.normalize('NFD',s.lower().replace('ı','i')) if unicodedata.category(c)!='Mn')
def yayin_disi(title,body=''):
 b,m=normalize(title),normalize(body)
 return bool(re.search('kararname|atama kararlari|ust duzey gorev degisimi|nakil sonuclari|atama sonuclari|uyeliklerine secme kararlari',b) or re.search(r'sicil\s*(no|numara)|adi\s*(ve\s*)?soyadi|ad\s*soyad',m) and re.search('gorev yeri|atan|nakil|kararname',m))
