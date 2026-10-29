"""Bir defalık yerel kaynak aktarımı. Arşiv tutarlarını yeniden hesaplamaz."""
import json,re,unicodedata,hashlib,shutil
from pathlib import Path
from html import unescape
from xml.etree import ElementTree as ET
root=Path('src/data');target=root/'maas-arsivleri';target.mkdir(exist_ok=True)
def norm(s):return unicodedata.normalize('NFD',s.lower().replace('ı','i')).encode('ascii','ignore').decode().strip()
def save(path,data):
 if path.exists():raise ValueError('Mevcut kayıt korunur: '+str(path))
 path.write_text(json.dumps(data,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
old=json.loads((root/'maas-yazilari.json').read_text('utf-8'))
options=json.loads((root/'memur-maas-secenekler.json').read_text('utf-8'))['unvanlar']
catalog=[]
for x in old:
 ad=re.sub(r'\s+Maaşı\s+20\d\d.*$','',x['baslik'],flags=re.I)
 u=next(u for u in options if norm(u['ad'])==norm(ad))
 mudur=u['kod'] in [1,4,5,10,11,12]
 profile={'derece':'6/1' if mudur else '13/3','hizmetYili':6 if mudur else 1,'mezuniyet':1 if mudur else 2}
 if u['kod'] in [17,46,50]:profile={'derece':'9/3' if u['kod']==17 else '9/1','hizmetYili':0,'mezuniyet':1}
 catalog.append({'id':re.sub(r'-maasi-20\d\d.*$','',x['slug']),'ad':ad,'kod':u['kod'],'dusuk':profile})
save(root/'unvan-profilleri.json',catalog)
lookup={x['id']:x for x in catalog}
def yayin(id,yil,etiket,baslangic=None,bitis=None):return {'surum':1,'donemId':id,'yil':yil,'etiket':etiket,'baslangic':baslangic,'bitis':bitis,'tur':'aktarim','kayitlar':[]}
def kayit(id,values,kaynak,varsayimlar=[]):
 a,b=values
 return {'unvanId':id,'dusuk':a,'yuksek':b,'kaynak':kaynak,'varsayimlar':varsayimlar,'uyari':"Kaynakta 'en yüksek' tutarı düşük örnekten küçük yayımlanmış; tutarlar değiştirilmeden korunmuştur." if a is not None and b is not None and b<a else None}
def money(s):
 try:return float(re.sub(r'[^\d.,]','',s).replace(',','.'))
 except ValueError:return None
y=yayin('2026-01-arsiv',2026,'Ocak–Haziran 2026 · yayımlanan arşiv','2026-01-01','2026-06-30')
for x,c in zip(old,catalog):
 amounts=re.findall(r'Maaş\s*:\s*([\d.,]+)',unescape(x['icerik']))
 if len(amounts)>=2:y['kayitlar'].append(kayit(c['id'],[money(v) for v in amounts[:2]],'https://657.com.tr/'+x['slug']+'/', ['Kaynak tablodaki düşük örnek: lise, 13/3, 1 yıl, bekâr, çocuksuz, diğer iller.','Kaynak tablodaki yüksek örnek: lisans, 1/4, 30 yıl, evli, 3 çocuk, İstanbul/Ankara/İzmir.']))
save(target/'2026-01-arsiv.json',y)
y=yayin('2024-01-arsiv',2024,'Ocak–Haziran 2024 · yayımlanan arşiv','2024-01-01','2024-06-30')
sources=json.loads(Path('artifacts/maas-2024-kaynaklar.json').read_text('utf-8'))
aliases={'Veri Hazırlama Kontrol İşletmeni (VHKİ)':'veri-hazirlama-ve-kontrol-isletmeni','Öğretmen, Başöğretmen, Uzman Öğretmen':'ogretmen','İtfaiye Eri / İtfaiyeci':'itfaiye-eri'}
for x in sources:
 ad=re.sub(r'^Ocak 2024 | Maaş(?:ı|ları)$','',x['title']).replace(' (Memur)','')
 c=lookup.get(aliases.get(ad,'')) or next((c for c in catalog if norm(c['ad'])==norm(ad)),None)
 if not c:raise ValueError('Eşleşmeyen eski unvan: '+ad)
 assert len(x['values'])==2
 y['kayitlar'].append(kayit(c['id'],x['values'],x['url'],x['rows']))
save(target/'2024-01-arsiv.json',y)
xml=Path('D:/wp28-3/wordpress/wp-content/uploads/wpallimport/uploads/c2a0ab30a144c8f898af2ecb7c329d6c/maaslar.xml')
log=Path('D:/wp28-3/wordpress/wp-content/uploads/wpallimport/logs/a03e52950ad806ac48e81109ff779650/2.html')
assert 'Ambar Memuru Maaşı 2025' in log.read_text('utf-8')
dest=Path('public/kaynaklar/maas');dest.mkdir(parents=True,exist_ok=True);shutil.copyfile(xml,dest/'2025-maaslar.xml')
y=yayin('2025-arsiv',2025,'2025 · yayımlanan arşiv (ay belirtilmemiş)')
y['aciklama']='2025 başlıklı WordPress maaş aktarımındaki değerlerdir. Kaynak dosyada ay/dönem belirtilmemiştir; Ocak veya Temmuz olarak sınıflandırılmaz.'
y['kaynakOzeti']={'dosyaSha256':hashlib.sha256(xml.read_bytes()).hexdigest(),'kanit':'06.12.2025 tarihli WP All Import 2 numaralı işlem kaydı: 2025 başlıklı maaş yazıları.'}
for node in ET.parse(xml).getroot():
 ad=node.findtext('unvan').strip();c=next((c for c in catalog if norm(c['ad'])==norm(ad)),None)
 if c:y['kayitlar'].append(kayit(c['id'],[money(node.findtext('dusuk')),money(node.findtext('yuksek'))],'/kaynaklar/maas/2025-maaslar.xml',['Kaynak dosyada derece, aile ve kesinti ayrıntıları belirtilmemiştir.']))
save(target/'2025-arsiv.json',y)
print('Unvan:',len(catalog),'2024:',len(sources),'2025:',len(y['kayitlar']))
