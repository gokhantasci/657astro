"""2024 sonrası tarife arşivinin ilk aktarımı. Üretimde ağ erişimi gerektirmez."""
from pathlib import Path
import json,re
from bs4 import BeautifulSoup
D=Path('src/data'); A=Path('artifacts/tarife-kaynaklari')
def load(n):return json.loads((D/(n+'.json')).read_text(encoding='utf-8'))
def links(n):return json.loads((A/(n+'-links.json')).read_text(encoding='utf-8'))
def rg(s):return 'https://www.resmigazete.gov.tr/eskiler/'+s
def row(ad,tutar,birim='TL'):return dict(ad=ad,tutar=tutar,birim=birim)
def rec(start,source,rows,note='',end=None):return dict(baslangic=start,bitis=end,kaynak=source,kalemler=rows,notu=note)
def tariff(slug,ad,donem,notu,records,arac=None):return dict(slug=slug,ad=ad,periyot=donem,aciklama=notu,kayitlar=records,arac=arac)
def table(n):
 s=BeautifulSoup(Path('src/content/yazilar/'+n+'.md').read_text(encoding='utf-8'),'html.parser')
 return [[c.get_text(' ',strip=True) for c in t.find_all(['td','th'])] for t in s.select('table tr')]
T=[]
T.append(tariff('avukatlik-asgari-ucret','Avukatlık Asgari Ücret Tarifesi','Yayım / değişiklik tarihinde','Maktu ücretler ve nispi dilimler karar tarihinde yürürlükteki tarifeye göre uygulanır.',[rec(v['baslangic'],v['kaynak'],[row(m['ad'],m['maktu']) for m in v['mahkemeler']]+[row('Nispi dilim '+str(i+1)+(' (sonraki kısım)' if b['miktar'] is None else ' · '+str(b['miktar'])+' TL'),b['oran'],'%') for i,b in enumerate(v['basamaklar'])],end=v['bitis']) for v in load('hukuk-tarifeleri')['vekalet']],'/nispi-vekalet-ucreti-hesaplama/'))
cmkad=['Soruşturma evresi','Sulh ceza hâkimliği','Asliye ceza mahkemesi','Seri muhakeme','Ağır ceza mahkemesi','Çocuk mahkemesi','Çocuk ağır ceza mahkemesi','İcra ceza, fikrî ve sınaî haklar ceza / infaz hâkimliği','Bölge adliye mahkemesinde duruşmalı dava','Yargıtayda duruşmalı dava']
T.append(tariff('cmk-mudafi','CMK Müdafii Ücret Tarifesi','Yıllık','Görevlendirilen müdafi ve vekillere ödenecek brüt ücretlerdir.',[rec(str(v['yil'])+'-01-01',v['kaynak'],[row(a,t) for a,t in zip(cmkad,v['tutarlar'])],end=str(v['yil'])+'-12-31') for v in load('cmk-tarifeleri')],'/cmk-avukatlik-asgari-ucret-tarifesi/'))
thh=load('thh-bilirkisi'); kats=load('katsayi-gecmisi'); ay=load('ayarlar')['donemler']; kats=[k for k in kats if '2024'<=k['baslangic']<'2026']+[dict(baslangic=k['baslangic'],bitis=k['bitis'],aylik=k['memur_maas_aylik_katsayi'],kaynak=k['kaynak']) for k in ay]
thhsource='https://tuketici.ticaret.gov.tr/data/5e819a8e13b876a1b04c7a4a/T%C3%9CKET%C4%B0C%C4%B0%20HAKEM%20HEYETLER%C4%B0%20B%C4%B0L%C4%B0RK%C4%B0%C5%9E%C4%B0L%C4%B0K%20%C3%9CCRET%20TAR%C4%B0FES%C4%B0.pdf'
T.append(tariff('tuketici-hakem-heyeti-bilirkisi','Tüketici Hakem Heyeti Bilirkişi Ücret Tarifesi','Ocak / Temmuz katsayısı','Ayrı yıllık sabit ücret yerine Ticaret Bakanlığı ürün göstergesi × ilgili dönemin memur aylık katsayısı kullanılır. Tablodaki tutarlar brüttür.',[rec(k['baslangic'],thhsource,[row(u['ad'],round(u['gosterge']*k['aylik'],2)) for u in thh['urunler']],f"Aylık katsayı: {k['aylik']}; katsayı kaynağı: {k['kaynak']}",k['bitis']) for k in kats],'/tuketici-hakem-heyeti-bilirkisi-ucret-hesaplama/'))
uzad=['Teklif aşaması olumsuz','Olumlu sonuç · 2–3 kişi','Olumlu sonuç · 4–6 kişi','Olumlu sonuç · 7–9 kişi','Olumlu sonuç · 10+ kişi','Olumsuz sonuç · 2–3 kişi','Olumsuz sonuç · 4–6 kişi','Olumsuz sonuç · 7–9 kişi','Olumsuz sonuç · 10+ kişi']
uz=[]
for year in [2024,2025,2026]:
 p=A/f'uzlastir-{year}.txt'
 text=p.read_text(encoding='utf-8') if p.exists() else BeautifulSoup(Path('src/content/yazilar/2026-yili-uzlastirmaci-asgari-ucret-tarifesi-yayimlandi.md').read_text(encoding='utf-8'),'html.parser').get_text(' ',strip=True)
 pairs=re.findall(r'(\d[\d.]*,00)\s*[-–]\s*(\d[\d.]*,00)',text)
 if year==2024:pairs=[(str(a)+',00',str(b)+',00') for a,b in [(590,885),(1775,2375),(2375,2965),(2965,3560),(3560,4155),(885,1180),(1180,1480),(1480,1775),(1775,2070)]]
 vals=[]
 for ad,(lo,hi) in zip(uzad,pairs):vals.extend([row(ad+' · alt sınır',float(lo.replace('.','').replace(',','.'))),row(ad+' · üst sınır',float(hi.replace('.','').replace(',','.')))])
 source={'2024':'https://www.resmigazete.gov.tr/eskiler/2023/12/20231231-7.htm','2025':'https://alternatifcozumler.adalet.gov.tr/Resimler/icon/3112202409594320241231.pdf','2026':rg('2025/12/20251231-5.htm')}[str(year)]
 uz.append(rec('2023-12-31' if year==2024 else '2024-12-31' if year==2025 else '2025-12-31',source,vals,'Ücret, emek ve dosya kapsamına göre alt ve üst sınır arasında takdir edilir.'))
T.append(tariff('uzlastirmaci','Uzlaştırmacı Ücret Tarifesi','Yıllık / yayım tarihinde','Taraf sayısı ve uzlaştırma sonucuna göre alt–üst sınırlar.',uz))
ar=[]
for y,i,minu,tic in [(2024,2,4000,6000),(2025,1,6000,9000),(2026,0,9000,13000)]:
 ar.append(rec(f'{y}-01-01',links('arabulucu')[i]['url'],[row('Anlaşma hâlinde asgari ücret',minu),row('Ticari / ortaklığın giderilmesi asgari ücret',tic)],'Saatlik ücretler, taraf sayısı, seri uyuşmazlıklar ve nispi ücret dilimleri için resmî cetvelin bütününü inceleyin.'))
T.append(tariff('arabuluculuk','Arabuluculuk Ücret Tarifesi','Yıllık','Arabuluculuk faaliyetinin sona erdiği tarihteki tarife uygulanır. Alt sınırlar, saatlik ücretlerin veya nispi dilimlerin yerine geçmez.',ar))
bk=[]
for y,i,vals in [(2024,2,[1100,1100,1100,1820,1460,2200,1820,1100,1100,1820,2200,2320,2930,3000]),(2025,1,[1600,1600,1600,2700,2100,3200,2700,1600,1600,2700,3200,3400,4200,4400]),(2026,0,[2200,2200,2200,3600,2800,4100,3600,2200,2200,3600,4100,4200,5100,5900])]:
 bk.append(rec(f'{y}-01-01',links('bilirkisi')[i]['url'],[row(a,v) for a,v in zip(['İcra ve iflas daireleri / satış memurlukları','Sulh hukuk / tüketici','İcra hukuk / icra ceza','Asliye hukuk','Aile / iş / kadastro','Asliye ticaret / fikri ve sınai haklar','İdare ve vergi','Cumhuriyet başsavcılığı soruşturmaları','Sulh ceza hâkimliği','Asliye ceza','Ağır ceza','Bölge adliye / bölge idare','Yargıtay / Danıştay ilk derece','Özel hukuk tüzel kişisi'],vals)],'Resmî cetveldeki asgari brüt ücretler.'))
T.append(tariff('bilirkisilik-asgari','Bilirkişilik Asgari Ücret Tarifesi','Yıllık','Görevlendirme tarihinde yürürlükteki asgari brüt ücret uygulanır; merciin artırma ve indirme yetkisi saklıdır.',bk))
tan=[rec(f'{y}-01-01',s,[row('Günlük alt sınır',lo),row('Günlük üst sınır',hi)],'Yol, ikamet ve beslenme giderleri ayrıca karşılanır. Vergi, resim ve harçtan muaftır.',f'{y}-12-31') for y,s,lo,hi in [(2024,rg('2023/12/20231228-3.htm'),60,100),(2025,'https://cigm.adalet.gov.tr/Resimler/SayfaDokuman/301220241611022025%20Y%C4%B1l%C4%B1%20Tan%C4%B1kl%C4%B1k%20%C3%9Ccret%20Tarifesi.pdf',100,150),(2026,rg('2025/12/20251226-5.htm'),130,200)]]
for slug,ad in [('taniklik','Tanıklık Ücret Tarifesi'),('cmk-taniklik','CMK Tanıklık Ücret Tarifesi')]:T.append(tariff(slug,ad,'Yıllık','Tanıklık Ücret Tarifesi, CMK m.61 kapsamındaki ceza tanıklığı tarifesidir. Bu iki ad aynı mevzuatı gösterir; HMK tanık tarifesi ayrıdır.',tan))
ic=links('icra')
T.append(tariff('iflas-idaresi','İflas İdaresi Ücreti, Yazı ve Tebliğ Masrafı Tarifesi','Yeni tebliğ yayımlandığında','2025 yılında da 2024 tarifesi uygulanır; her yıl yeni tebliğ yayımlanması zorunlu değildir.',[rec('2024-01-01',ic[0]['url'],[row('İlk 50.000 TL için oran',6,'%')],'Diğer dilimler ve masraflar resmî tebliğde.', '2025-12-31'),rec('2026-01-01',ic[1]['url'],[row('Dilim '+str(i+1)+(' · sonraki kısım' if d['miktar'] is None else ' · '+str(d['miktar'])+' TL'),d['oran'],'%') for i,d in enumerate(load('iflas-idaresi')['tarifeler'][-1]['dilimler'])])],'/iflas-idare-ucreti-hesaplama/'))
T.append(tariff('lisansli-yediemin','Lisanslı Yediemin Depoları Yönetmeliği Ücret Tarifesi','Yıllık','Muhafaza, çekici, nakliye, hamaliye ve çilingir ücretleri bölge ve mal türüne göre Ek-1 cetvelindedir.',[rec(f'{y}-01-01',ic[i]['url'],[row('Muhammen bedel üst sınır hesabındaki eşik',esik)],'Bu eşik depolama ücreti değildir. Günlük muhafaza ücretleri ve bölge ayrımı için resmî kaynağın Ek-1 cetvelini açın.') for y,i,esik in [(2024,2,20000),(2025,3,40000),(2026,4,60000)]]))
sales=['Taşınmaz mallar','Otomobil ve diğer yük vasıtaları','Kamyonet / minibüs / midibüs / arazi taşıtı','Kamyon / otobüs / çekici','İş makinesi / römork / çekici+römork','Taşınır mallar']
T.append(tariff('satis-giderleri','Satış Giderleri Tarifesi','Yıllık','Satış talebinin yapıldığı tarihteki tarife uygulanır. Tutarlar peşin yatırılan gider avansıdır.',[rec(f'{y}-01-01',ic[i]['url'],[row(a,v) for a,v in zip(sales,vs)]) for y,i,vs in [(2024,5,[25000,15000,16000,18500,20500,2000]),(2025,6,[36000,21500,23000,26500,29500,3000]),(2026,7,[40000,28000,30000,35000,39000,4000])]]))
for slug,title,kind in [('hmk-gider-avansi','HMK Gider Avansı Tarifesi','avans'),('hmk-hakem','HMK Hakem Ücret Tarifesi','hakem'),('hmk-tanik','HMK Tanık Ücret Tarifesi','tanik')]:
 records=[]
 for year,date,nums in [(2023,'20231024',[3,4,5]),(2024,'20241023',[4,5,6]),(2025,'20251028',[2,3,4])]:
  idx=['avans','hakem','tanik'].index(kind)
  rows=([row('Diğer iş ve işlemler gider avansı',{2023:250,2024:400,2025:530}[year]),row('Taraf başına tebligat sayısı',5,'adet')] if kind=='avans' else [row('İlk dilimde tek hakem oranı',5,'%'),row('İlk dilimde 3+ hakem oranı',8,'%')] if kind=='hakem' else [row('Tanık alt sınır',{2023:60,2024:100,2025:130}[year]),row('Tanık üst sınır',{2023:100,2024:150,2025:200}[year])])
  records.append(rec(f'{year}-10-'+date[-2:],rg(f'{year}/10/{date}-{nums[idx]}.htm'),rows,'Avans: taraf sayısı × 5 tebligat bedeli + diğer giderler.' if kind=='avans' else 'Nispi dilimler kademeli uygulanır; tüm dilimler resmî cetveldedir.' if kind=='hakem' else 'Kaybedilen zamanla orantılı; yol, konaklama ve beslenme ayrıca.'))
 T.append(tariff(slug,title,'Yeni tarifenin yayım tarihinde','Yıl seçimi, o takvim yılında yürürlükte kalan önceki tarife ile yıl içinde yayımlanan yeni tarifeyi birlikte gösterir.',records))
sigad=['Adli trafik','Değer kaybı tazminatı','Değer kaybı hariç motorlu araç sigortaları','Sakatlık / destekten yoksun kalma','Yangın / doğal afet / mühendislik','Sağlık / hastalık / hayat','Tarım sigortaları','Diğer']
T.append(tariff('sigorta-tahkim-bilirkisi','Sigorta Tahkim Komisyonu Bilirkişi Ücret Tarifesi','Yıllık / Komisyon duyurusu','Sigorta tahkimi bilirkişilik ücretleri, Adalet Bakanlığı bilirkişilik asgari ücretlerinden ayrı tutulur.',[rec(f'{y}-01-01',s,[row(a,v) for a,v in zip(sigad,vs)]) for y,s,vs in [(2024,'https://www.sigortatahkim.org/content/CmsFiles/bilirkisiucrettarifesi2024.pdf',[1200,1000]+[1900]*6),(2025,'https://www.sigortatahkim.org/content/CmsFiles/bilirkisiucrettarifesi2025.pdf',[1732.56,1443.80]+[2743.22]*6),(2026,'https://www.sigortatahkim.org/content/CmsFiles/bilirkisitarife2026.pdf',[2260,1880]+[3590]*6)]]))
by={t['slug']:t for t in T}
by['sigorta-tahkim-bilirkisi']['kayitlar'][0]['baslangic']='2024-02-01'
by['sigorta-tahkim-bilirkisi']['kayitlar'][1]['kaynak']='https://www.sigortatahkim.org/content/CmsFiles/bilirkisitarifesi2025.pdf'
by['uzlastirmaci']['kayitlar'][0]['kaynak']='https://alternatifcozumler.adalet.gov.tr/Resimler/Mevzuat/20120241440202024%20Uzla%C5%9Ft%C4%B1rmac%C4%B1%20Asgari%20%C3%9Ccret%20Tarifesi.pdf'
by['iflas-idaresi']['kayitlar'][0]['kalemler']=[row('Dilim '+str(i+1),v,'%') for i,v in enumerate([6,5,4,3,2,1,.75,.5,.25])]
by['iflas-idaresi']['kayitlar'][0]['notu']='Dilim genişlikleri sırasıyla 50.000, 100.000, 200.000, 300.000, 400.000, 500.000, 1.000.000 ve 1.500.000 TL; kalan kısım son orandadır. Masraf avansı tahmini yazı ve normal tebligat masrafının üç katıdır.'
for r in by['iflas-idaresi']['kayitlar']:r['kalemler']=[row('Dilim '+str(i+1),v['tutar'],'%') for i,v in enumerate(r['kalemler'])]
# Ücret cetvelleri PDF görüntüsü üzerinden satır satır doğrulanmıştır.
hourly={2024:[[520,1100,1200,1300],[900,1900,2000,2100],[520,1100,1200,1300],[520,1100,1200,1300],[580,1200,1300,1400],[600,1400,1500,1600],[550,1150,1250,1350]],2025:[[785,1650,1750,1850],[1150,2350,2450,2550],[785,1650,1750,1850],[785,1650,1750,1850],[835,1750,1850,1950],[900,2000,2100,2200],[785,1650,1750,1850]],2026:[[1000,2200,2300,2400],[1500,3200,3300,3400],[1130,2460,2560,2660],[1000,2200,2300,2400],[1170,2540,2640,2740],[1170,2540,2640,2740],[1000,2200,2300,2400]]}
for r in by['arabuluculuk']['kayitlar']:
 y=int(r['baslangic'][:4])
 for ad,vs in zip(['Aile','Ticari','İşçi–işveren','Tüketici','Kira / komşuluk / kat mülkiyeti','Ortaklığın giderilmesi','Diğer'],hourly[y]):
  r['kalemler'] += [row(ad+' · '+s+' · saatlik',v) for s,v in zip(['2 taraf, taraf başına','3–5 taraf toplam','6–10 taraf toplam','11+ taraf toplam'],vs)]
 widths=[200000,320000,520000,1040000,3120000,4160000,8320000,None] if y==2024 else [300000,480000,780000,1560000,4680000,6240000,12480000,None] if y==2025 else [600000,960000,1560000,3120000,9360000,12480000,24960000,None]
 for i,(w,a,b) in enumerate(zip(widths,[6,5,4,3,2,1.5,1,.5],[9,7.5,6,4.5,3,2.5,1.5,1])):
  r['kalemler'] += [row('Nispi dilim '+str(i+1)+' · bir arabulucu',a,'%'),row('Nispi dilim '+str(i+1)+' · birden fazla arabulucu',b,'%')]
 r['notu']='Saatlik tutarlarda iki taraf için taraf başına; 3 ve üzeri taraf için toplam ücret esas alınır. Nispi dilim genişlikleri: '+', '.join(str(w) if w else 'kalan kısım' for w in widths)+' TL. Seri uyuşmazlıklar ve özel hükümler için resmî belgeyi inceleyin.'
# Ek-1: beş motorlu araç grubu, üç yargı bölgesi.
vehicles=['Motosiklet / motorlu bisiklet','Otomobil / diğer yük vasıtası','Kamyonet / minibüs / midibüs / arazi taşıtı','Kamyon / otobüs / çekici','İş makinesi / römork / çekici+römork']
vh={2024:[[32,25.6,19.2],[64,57.6,38.4],[70.4,64,44.8],[96,76.8,57.6],[115.2,96,83.2]],2025:[[47,37.6,28.2],[94,84.7,56.5],[103.5,94,65.9],[141.1,112.9,84.7],[169.3,141.1,122.3]],2026:[[61.1,49,36.7],[122.2,110.1,73.5],[134.6,122.2,85.7],[183.5,146.8,110.1],[220.1,183.5,159]]}
service={2024:[[325,285,275],[38.4,32,25.6],[425,385,365],[64,51.2,38.4],[425,385,365],[51.2,38.4,32],[525,485,425],[64,51.2,38.4],[768,640,640]],2025:[[475,430,405],[56.5,47,37.5],[625,565,540],[94,75.3,56.4],[625,565,540],[75.3,56.5,47],[770,715,625],[94,75.3,56.4],[1130,940,940]],2026:[[620,550,530],[73.5,61.1,49],[815,735,705],[122.2,98,73.4],[815,735,705],[98,73.4,61.1],[1000,930,815],[122.2,98,73.4],[1470,1230,1230]]}
for r in by['lisansli-yediemin']['kayitlar']:
 y=int(r['baslangic'][:4]);rows=[]
 for ad,vs in zip(vehicles,vh[y]):
  rows += [row(ad+' · '+b+' · günlük',v) for b,v in zip(['1. bölge','2. bölge','3–5. bölge'],vs)]
 for ad,vs in zip(['Çekici küçük araç · kalkış (0–1 km)','Çekici küçük araç · ek km','Çekici büyük araç · kalkış (0–1 km)','Çekici büyük araç · ek km','Nakliye pikap / kamyonet / panelvan · kalkış','Nakliye pikap / kamyonet / panelvan · ek km','Nakliye kamyon / tır · kalkış','Nakliye kamyon / tır · ek km','Hamaliye · günlük'],service[y]):
  rows += [row(ad+' · '+b,v) for b,v in zip(['1. bölge','2. bölge','3–5. bölge'],vs)]
 rows += [row('Diğer mahcuz taşınır · 2 m²ye kadar muhammen bedel oranı',1,'‰'),row('Diğer mahcuz taşınır · 2 m² üstü muhammen bedel oranı',2,'‰'),row('Hacizli olmayan taşınır · m² fiyatı',{2024:5,2025:8.8,2026:11.45}[y])]
 locks={2024:[320,640,512,1920,576,1920],2025:[470,940,750,2820,850,2820],2026:[610,1230,975,3670,1105,3670]}[y]
 for a,(lo,hi) in zip(['Ev / işyeri / eşya kilidi','Otomobil kapısı','Çelik kasa'],zip(locks[::2],locks[1::2])):rows.extend([row('Çilingir · '+a+' · alt sınır',lo),row('Çilingir · '+a+' · üst sınır',hi)])
 r['kalemler']=rows
 r['notu']='Ek-1 cetveli. Lisanslı depo faaliyete geçinceye kadar muhafaza ücretinin %80’i uygulanır; diğer hizmet ücretleri bu kapsama uygulanmaz. Altı aydan sonraki süre yarım ücretlidir. Muhafazanın sona erdiği gün sayılmaz. Çekici/nakliye en çok 50 km. Muhammen bedel üst sınırı, asgari avans ve özel durumlar için tebliğ m.3–5 esas alınır.'
for r in by['hmk-hakem']['kayitlar']:
 r['kalemler']=[row(f'Dilim {i+1} · '+ad,v,'%') for i,vs in enumerate(zip([5,4,3,2,1,.1],[8,7,6,4,2,.2])) for ad,v in zip(['tek hakem','3+ hakem'],vs)]
 r['notu']='Dilim genişlikleri: ilk 500.000, sonra 500.000, 1.000.000, 3.000.000, 5.000.000 TL; 10.000.000 TL üstü son oran. Kademeli uygulanır; başkanın payı ve kısmi hak ediş hükümleri resmî metindedir.'
for t in T:
 t['kayitlar'].sort(key=lambda r:r['baslangic'])
 for a,b in zip(t['kayitlar'],t['kayitlar'][1:]):
  if a['bitis'] is None:
   from datetime import date,timedelta
   a['bitis']=(date.fromisoformat(b['baslangic'])-timedelta(days=1)).isoformat()
(D/'tarife-arsivi.json').write_text(json.dumps(T,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(len(T),'tarife hazır')
