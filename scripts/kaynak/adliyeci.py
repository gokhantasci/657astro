"""Adliyeci.org WebForms hesaplarına sentetik girdiler gönderir; form tokenları yayımlanmaz."""
import hashlib,html,http.cookiejar,json,re,time,urllib.parse,urllib.request
from pathlib import Path
from ozkansoft import KOK,Program

class Adliyeci:
 def __init__(self,path):
  self.url='http://adliyeci.org/'+path;self.op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()));self.page=self.request()
 def request(self,data=None):
  time.sleep(.5)
  req=urllib.request.Request(self.url,data=urllib.parse.urlencode(data).encode() if data else None,headers={'User-Agent':'Mozilla/5.0','Referer':self.url})
  return self.op.open(req,timeout=30).read().decode('utf-8')
 def change(self,name,value):
  d=Program.alanlar(self.page);d.update(__EVENTTARGET=name,__EVENTARGUMENT='');d[name]=value;self.page=self.request(d)
 def calculate(self,values,button='Button1'):
  d=Program.alanlar(self.page)
  if set(values)-set(d):raise ValueError('Kaynakta form alanı bulunamadı: '+str(set(values)-set(d)))
  d.update(__EVENTTARGET='',__EVENTARGUMENT='');d.update(values);d[button]='HESAPLA';self.page=self.request(d)
  actual=Program.alanlar(self.page)
  if any(actual.get(k)!=v for k,v in values.items()):raise ValueError('Kaynak girdi geri dönüşü uyuşmuyor.')
  spans={i:re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',t))).strip() for i,t in re.findall(r'<span[^>]*id="([^"]+)"[^>]*>(.*?)</span>',self.page,re.S)}
  nums={i:[float(x.replace('.','').replace(',','.')) for x in re.findall(r'\d+(?:\.\d{3})*,\d{2}',t)] for i,t in spans.items()}
  return {i:n for i,n in nums.items() if n and not i.startswith('RequiredField') and i!='lblson'}

if __name__=='__main__':
 folder=KOK/'artifacts/kaynak-onbellek/adliyeci';folder.mkdir(parents=True,exist_ok=True)
 common={'kutubashar':'732','kutupeshar':'732','kututamhar':'0','kutuıslhar':'0','kutukeshar':'0','kutubilmas':'1000','kututebmas':'100'}
 cases=[
  ('tam-kabul','TAM%20KABUL.aspx',{'DropDownList5':'1'},{**common,'kutudavdeg':'100000'}),
  ('kismen-kabul','KISMENKABUL.aspx',{'DropDownList5':'1'},{**common,'kutudavdegtop':'100000','kutudavdeg':'60000'}),
  ('red','REDD%C4%B0NE1.aspx',{'DropDownList5':'1'},{'kutudavdeg':'100000','kutupeshar':'732','kututamhar':'0','kutuıslhar':'0'}),
  ('acilmamis-once','ACILMAMI%C5%9E.aspx',{'DropDownList5':'1','DropDownList6':'1'},{'kutudavdeg':'100000','kutupeshar':'1000','kututamhar':'0','kutuıslhar':'0'}),
  ('acilmamis-sonra','ACILMAMI%C5%9E.aspx',{'DropDownList5':'1','DropDownList6':'0'},{'kutudavdeg':'100000','kutupeshar':'1000','kututamhar':'0','kutuıslhar':'0'}),
  ('feragat-once','FERAGAT-SULH.aspx',{'DropDownList5':'1','DropDownList6':'1'},{'kutudavdeg':'100000','kutupeshar':'732','kututamhar':'0','kutuıslhar':'0'}),
  ('feragat-sonra','FERAGAT-SULH.aspx',{'DropDownList5':'1','DropDownList6':'0'},{'kutudavdeg':'100000','kutupeshar':'732','kututamhar':'0','kutuıslhar':'0'}),
  ('nafaka-tam','NAFAKATAM.aspx',{}, {**common,'kutudavdeg':'500'}),
  ('nafaka-kismen','NAFAKAKISMEN.aspx',{}, {**common,'kutudavdegtop':'10000','kutudavdeg':'6000'}),
  ('maddi','maddi.aspx',{'DropDownList5':'1'},{'kutudavdegtop':'1000000','kutudavdeg':'50000'}),
  ('manevi','manevi.aspx',{'DropDownList5':'1'},{'kutudavdegtop':'1000000','kutudavdeg':'50000'}),
  ('islah','islahharci.aspx',{}, {'txtishdeg':'100000','txtonce':'10000','DropDownList1':'0'}),
  ('istinaf','%C4%B0ST%C4%B0NAFHARCI.aspx',{}, {'txtishdeg':'100000','DropDownList1':'0'}),
  ('istinaf-cismani','%C4%B0ST%C4%B0NAFHARCI.aspx',{}, {'txtishdeg':'1000000','DropDownList1':'1'}),
  ('aile-istinaf','A%C4%B0LE%C4%B0ST%C4%B0NAF.aspx',{}, {'txtishdeg':'100000','DropDownList1':'0'}),
  ('paylasim','daval%C4%B11234.aspx',{}, {'DropDownList3':'1','paytop':'2000','txt1':'Kurgu A','dav1':'3','txt2':'Kurgu B','dav2':'1'}),
  ('kesinlesme','KES%C4%B0NLESME.aspx',{}, {'tebtar':'2026-01-28'}),
 ]
 results=[]
 for ident,path,changes,values in cases:
  file=folder/(ident+'.json')
  if file.exists():results.append(json.loads(file.read_text(encoding='utf-8')));continue
  p=Adliyeci(path)
  for name,value in changes.items():p.change(name,value)
  nums=p.calculate(values,'Button3' if ident=='aile-istinaf' else 'Button1')
  row={'id':ident,'url':p.url,'degisiklikler':changes,'form':values,'sayilar':nums}
  file.write_text(json.dumps(row,ensure_ascii=False,indent=1),encoding='utf-8');(folder/(ident+'.html')).write_text(p.page,encoding='utf-8');results.append(row);print(ident,json.dumps(nums),flush=True)
 (KOK/'tests/fixtures/adliyeci-canli-20261030.json').write_text(json.dumps(results,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
