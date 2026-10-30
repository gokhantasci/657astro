"""Doğrulanmış MAHEP seçimlerinden standart 657 ödeme cetvelleri çıkarır.

Eksik / özel rejim kalemleri tahmin edilmez. Her kabul, bütün ödeme kalemlerinin
ve prim matrahının ayrıca uzlaşmasını gerektirir; kaynak bordro fixture'ı saklanır.
"""
import hashlib,json,re
from fractions import Fraction
from collections import defaultdict
from pathlib import Path
from ozkansoft import KOK,sayi

p=KOK/'artifacts/kaynak-onbellek'
audit=json.loads((p/'mahep-profil-denetimi.json').read_text(encoding='utf-8'))['gecerli']
observed=json.loads((p/'mahep-dogrulanmis-profiller.json').read_text(encoding='utf-8')) if (p/'mahep-dogrulanmis-profiller.json').exists() else {}
audit.update({k:v['sonuclar'] for k,v in observed.get('profiller',{}).items()})
extra=json.loads((p/'mahep-ozel-profiller.json').read_text(encoding='utf-8')) if (p/'mahep-ozel-profiller.json').exists() else {}
audit.update({k:v['sonuclar'] for k,v in extra.get('profiller',{}).items()})
inventory=json.loads((p/'mahep-envanter.json').read_text(encoding='utf-8'))
names=dict(json.loads((p/'mahep-guncel-unvanlar.json').read_text(encoding='utf-8')))
base=json.loads((KOK/'src/data/unvan-ek-kurallari.json').read_text(encoding='utf-8'))
keep={u['ad'] for u in base['unvanlar']} | {'Öğretmen'}
legacy=json.loads((KOK/'src/data/memur-maas-secenekler.json').read_text(encoding='utf-8'))['unvanlar']
legacy_codes={u['ad']:u['kod'] for u in legacy if sum(v['kod']==u['kod'] for v in legacy)==1}
local_code=lambda code,name:legacy_codes.get(name,20000+int(code))
degree={x['derece']:x['gosterge'] for x in json.loads((KOK/'src/data/dereceler.json').read_text(encoding='utf-8'))}
settings=json.loads((KOK/'src/data/ayarlar.json').read_text(encoding='utf-8'))
kat=next(x for x in settings['donemler'] if x['baslangic']=='2026-07-01')
a,b,y=kat['memur_maas_aylik_katsayi'],kat['taban_aylik_katsayi'],kat['yan_odeme_katsayi']
mh=settings['maas_parametreleri']['maas_hesaplama_gosterge']
r=lambda x:round(x+1e-8,2)
neutral={'AylikTutar','EkGosterge','TabanAylik','YanOdeme','OzelHizmetTazminati','EkOdeme','IlaveOdemeEk40','MalulYasVeOlDevletGelir','GenSagSigPirDevletGelir','GelirlerToplami','DamgaVergisi','MalulYasVeOlDevletKesinti','MalulYasVeOlKisi','GenSagSigPirDevletKesinti','GenSagSigPirKisi','KesintilerToplami','AylikVergiMatrahi','GVIstisnasiFaydalanilanBilgi','GVIstisnasiKalanBilgi','DVIstisnasiFaydalanilanBilgi','GelirVergisi'}
groups=defaultdict(dict);fixtures=[];rejected=[]
for key,raw in audit.items():
 code,condition,d=key.split('|');name=names.get(code,'')
 if not name or name in keep:continue
 v={k:sayi(x) for k,x in raw.items()};v={k:x for k,x in v.items() if x is not None}
 extras={k:x for k,x in v.items() if k not in neutral and k not in ['MakamGorevTazminati','TemsilTazminati','FazlaMesai','TayinBedeli','PEKFarkBilgi','DenetimTazminati','EkTazminat','UniversiteOdenegi','EgitimOgretimOdenegi','YuksekogretimTazminati'] and x!=0}
 if extras:
  rejected.append({'key':key,'ad':name,'neden':'ayri-odeme-kalemi','kalemler':extras});continue
 def amount(k):return v.get(k,0)
 def close(x,z,tol=.011):return abs(x-z)<=tol
 if not close(amount('AylikTutar'),r(degree.get(d+'/1',-1)*a)):
  rejected.append({'key':key,'ad':name,'neden':'gosterge-eslesmiyor'});continue
 rule={'ekGosterge':round(amount('EkGosterge')/a),'yanOdeme':round(amount('YanOdeme')/y),'ozelHizmet':round(amount('OzelHizmetTazminati')/(mh*a)*100,2),'ekOdeme':round(amount('EkOdeme')/(mh*a)*100,2)}
 # Sağlık ek ödemesi net korunur: çıplak orana GV ve DV brütleştirmesi eklenir.
 # Yalnız nominal tam puan ve kaynak GV matrahı birlikte uzlaşırsa kabul edilir.
 if not close(r(rule['ekOdeme']*mh*a/100),amount('EkOdeme')):
  nominal=round(amount('EkOdeme')*(1-.15-.00759)/(1-.00759)/(mh*a)*100)
  gross=r(r(r(nominal*mh*a/100)*(1-.00759))/(1-.15-.00759))
  taxbase=sum(amount(k) for k in ['AylikTutar','EkGosterge','TabanAylik','YanOdeme','EkOdeme'])-amount('MalulYasVeOlKisi')-amount('GenSagSigPirKisi')
  if close(gross,amount('EkOdeme')) and close(taxbase,amount('AylikVergiMatrahi'),.021):rule.update(ekOdeme=nominal,netEkOdeme=True)
 if amount('DenetimTazminati'):rule['denetim']=round(amount('DenetimTazminati')/(mh*a)*100,2)
 pay={k:r(z) for k,z in {'EkGosterge':rule['ekGosterge']*a,'YanOdeme':rule['yanOdeme']*y,'OzelHizmetTazminati':rule['ozelHizmet']*mh*a/100,'EkOdeme':rule['ekOdeme']*mh*a/100}.items()}
 if rule.get('netEkOdeme'):pay['EkOdeme']=r(r(pay['EkOdeme']*(1-.00759))/(1-.15-.00759))
 if amount('EkTazminat'):rule['ekTazminat']=round(amount('EkTazminat')/(mh*a)*100,2);pay['EkTazminat']=r(rule['ekTazminat']*mh*a/100)
 if amount('FazlaMesai'):rule['fazlaMesai']=round(amount('FazlaMesai')/(mh*a)*100,2);pay['FazlaMesai']=r(rule['fazlaMesai']*mh*a/100)
 if amount('TayinBedeli'):rule['tayin']=round(amount('TayinBedeli')/a);pay['TayinBedeli']=r(rule['tayin']*a)
 for field,sourcefield in [('makamGorev','MakamGorevTazminati'),('temsil','TemsilTazminati')]:
  if amount(sourcefield):rule[field]=round(amount(sourcefield)/a);pay[sourcefield]=r(rule[field]*a)
 if rule.get('temsil'):
  nominal=round(rule['temsil']/.8)
  if close(r(r(nominal*a)*.8),amount('TemsilTazminati'),.005):rule['temsilNominal']=nominal;pay['TemsilTazminati']=r(r(nominal*a)*.8)
 if 'denetim' in rule:pay['DenetimTazminati']=r(rule['denetim']*mh*a/100)
 for field,sourcefield in [('universite','UniversiteOdenegi'),('egitimOgretim','EgitimOgretimOdenegi'),('yuksekogretim','YuksekogretimTazminati')]:
  if amount(sourcefield):
   rule[field]=float(Fraction(amount(sourcefield)/(mh*a)*100).limit_denominator(12));pay[sourcefield]=r(rule[field]*mh*a/100)
 if any(not close(z,amount(k)) for k,z in pay.items()):
  rejected.append({'key':key,'ad':name,'neden':'oran-yuvarlamasi'});continue
 incomes=sum(amount(k) for k in ['AylikTutar','EkGosterge','TabanAylik','YanOdeme','OzelHizmetTazminati','EkOdeme','IlaveOdemeEk40','MakamGorevTazminati','TemsilTazminati','FazlaMesai','TayinBedeli','PEKFarkBilgi','DenetimTazminati','EkTazminat','UniversiteOdenegi','EgitimOgretimOdenegi','YuksekogretimTazminati'])
 personalGross=amount('GelirlerToplami')-amount('MalulYasVeOlDevletGelir')-amount('GenSagSigPirDevletGelir')
 primBase=sum(amount(k) for k in ['AylikTutar','EkGosterge','TabanAylik','OzelHizmetTazminati','DenetimTazminati','UniversiteOdenegi'])
 if rule.get('makamGorev') or rule.get('temsil'):
  nominal=round((amount('MalulYasVeOlKisi')/.09-primBase)/a)
  if nominal>=0:rule['tazminatPrimGostergesi']=nominal;part=min(nominal,rule.get('makamGorev',0));primBase+=r(part*a)+r((nominal-part)*a)
 if not(close(incomes,personalGross,.021) and close(r(primBase*.09),amount('MalulYasVeOlKisi')) and close(r(primBase*.05),amount('GenSagSigPirKisi')) and close(amount('TabanAylik'),r(1000*b)) and close(amount('IlaveOdemeEk40'),r(settings['sabitler']['seyyanen_zam_gosterge']*a))):
  rejected.append({'key':key,'ad':name,'neden':'gelir-veya-prim-matrahi'});continue
 label=next((text for c,text in inventory[code]['kosullar'] if c==condition),name)
 newcondition=next((x for x in observed.get('unvanlar',{}).get(code,{}).get('kosullar',[]) if x['kod']==condition),None)
 if newcondition:label=newcondition['ad']
 # Eski önbellekte bozulmuş koşul adı insan adına tahminle çevrilmez.
 if '\ufffd' in label:
  rejected.append({'key':key,'ad':name,'neden':'kosul-adi-bozuk'});continue
 variant='k'+(condition or 'standart')
 family='mahep-'+code+'-'+variant
 groups[(code,condition,name,label)][d]=rule
 fixtures.append({'kaynak':'MAHEP','key':key,'kod':local_code(code,name),'kosul':variant,'ad':name,'derece':d+'/1','gelir':r(incomes),'emKes':amount('MalulYasVeOlKisi'),'gss':amount('GenSagSigPirKisi'),'damga':amount('DamgaVergisi'),'gv':amount('GelirVergisi'),'net':r(amount('GelirlerToplami')-amount('KesintilerToplami'))})

families={};titles={}
for (code,condition,name,label),rules in groups.items():
 variant='k'+(condition or 'standart');family='mahep-'+code+'-'+variant
 # Kaynakta seçili öğrenim, koşul etiketiyle ayrıca tanımlanmıştır.
 education=2 if re.search(r'lise|ortaokul|ilkokul|ilköğretim',label,re.I) and not re.search(r'lisans|yüksek|önlisans',label,re.I) else 1
 families[family]={'dereceler':dict(sorted(rules.items(),key=lambda x:int(x[0]))),'adalet':False,'mezuniyet':education,'aciklama':'MAHEP ödeme ve prim kalemleriyle doğrulanmış standart profil. Kaynakta ayrı ödeme kalemi bulunan koşullar ayrıca incelenir.'}
 if code not in titles:titles[code]={'id':'mahep-'+code,'ad':name,'kod':local_code(code,name),'eskiProfil':name in legacy_codes,'aile':family,'varyantlar':[],'dusuk':{'derece':str(max(map(int,rules)))+'/1','hizmetYili':0,'mezuniyet':education}}
 titles[code]['varyantlar'].append({'id':variant,'ad':label,'aile':family})

out={'kaynak':'https://www.ozkansoft.com/mahep.php','gozlemTarihi':'2026-10-30','aileler':families,'unvanlar':list(titles.values())}
(KOK/'src/data/standart-kadro-kurallari.json').write_text(json.dumps(out,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
(KOK/'tests/fixtures/standart-kadro-bordrolari.json').write_text(json.dumps(fixtures,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
(p/'standart-kadro-reddedilenler.json').write_text(json.dumps(rejected,ensure_ascii=False),encoding='utf-8')
print('unvan',len(titles),'kosul',len(families),'bordro',len(fixtures),'reddedilen',len(rejected),flush=True)
