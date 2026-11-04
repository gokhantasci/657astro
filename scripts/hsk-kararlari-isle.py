from pathlib import Path
import json
root=Path(__file__).resolve().parents[1];p=root/'src/data/adli-teskilat-degisiklikleri.json';d=json.loads(p.read_text(encoding='utf-8'));extras=[]
def add(mahal,date,no,url,fields,**ek):extras.append(dict(mahal=mahal,tarih=date,karar=no,kaynak=url,alanlar=fields,**ek))
add('Çerkeş','2026-05-15','576','https://hsk.gov.tr/Eklentiler/070520261522576pdf.pdf',dict(bagli_acm='Çankırı',en_yakin_acm=''),kararTarihi='2026-05-06')
for il in ['Malatya','Adıyaman','Elazığ','Tunceli']:
 extras.append(dict(il=il,tarih='2026-09-01',karar='574',kararTarihi='2026-05-06',kaynak='https://hsk.gov.tr/Eklentiler/070520261519574pdf.pdf',alanlar=dict(bagli_bam='Malatya'),notu='Kararda 01/09/2026 faaliyeti planlanmıştır. Bakanlığın 10/09/2026 tarihli kurumsal açıklamasında kuruluş/faaliyet ayrıca teyit edilmiştir.'))
acm={'Sandıklı':['Sandıklı','Hocalar','Kızılören'],'Serik':['Serik'],'Suşehri':['Suşehri','Akıncılar','Gölova','İmranlı','Koyulhisar'],'Ortaca':['Ortaca','Dalaman','Köyceğiz']}
for merkez,mahalleler in acm.items():
 for mahal in mahalleler:
  add(mahal,'2026-09-10','700','https://hsk.gov.tr/Eklentiler/15052026111813052026-tarihli-ve-700-sayili-kararpdf.pdf',dict(bagli_acm=merkez,en_yakin_acm='',**(dict(teskilat='ACM') if mahal==merkez else {})),kararTarihi='2026-05-13',notu='Karar, mahkemenin faaliyete geçmesiyle uygulanır. 10/09/2026 Bakanlık açıklamasında merkezlerin faaliyeti teyit edilmiştir; bu tarih mahkemenin ilk faaliyet tarihi olarak sunulmaz.',teyit='https://basin.adalet.gov.tr/adalette-alti-ayda-kapsamli-donusum')
keys={(r.get('mahal'),r.get('il'),r['karar']) for r in extras};d=[r for r in d if (r.get('mahal'),r.get('il'),r['karar']) not in keys]+extras
d.sort(key=lambda r:r['tarih']);p.write_text(json.dumps(d,ensure_ascii=False,indent=1)+'\n',encoding='utf-8');print(len(d),'teşkilat alan değişikliği.')
