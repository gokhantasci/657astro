"""Doğrulanan tarife duyurularını yayın günüyle arşivler; eski URL'leri korur."""
from pathlib import Path
import json,re
D=Path('src/content/yazilar');T=json.loads(Path('src/data/tarife-arsivi.json').read_text(encoding='utf-8'));today='2026-11-05'
registry={
 'avukatlik-asgari-ucret':['2023-09-21','2024-10-03','2025-11-04','2026-11-03'],
 'cmk-mudafi':['2024-01-13','2025-02-01','2026-01-08'],
 'uzlastirmaci':['2023-12-31','2024-12-31','2025-12-31'],
 'arabuluculuk':['2023-12-29','2024-12-25','2025-12-26'],
 'bilirkisilik-asgari':['2023-12-29','2024-12-25','2025-12-26'],
 'taniklik':['2023-12-28','2024-12-28','2025-12-26'],
 'iflas-idaresi':['2023-12-26','2025-12-20'],
 'lisansli-yediemin':['2023-12-21','2024-12-21','2025-12-20'],
 'satis-giderleri':['2023-12-21','2024-12-25','2025-12-20'],
 'hmk-gider-avansi':['2023-10-24','2024-10-23','2025-10-28'],
 'hmk-hakem':['2023-10-24','2024-10-23','2025-10-28'],
 'hmk-tanik':['2023-10-24','2024-10-23','2025-10-28'],
}
existing={
 ('cmk-mudafi',2026):'2026-yili-cmk-mudafi-ucret-tarifesi',
 ('arabuluculuk',2024):'arabuluculuk-asgari-ucret-tarifesi',('arabuluculuk',2025):'2025-yili-arabuluculuk-asgari-ucret-tarifesi',('arabuluculuk',2026):'2026-yili-arabuluculuk-asgari-ucret-tarifesi',
 ('bilirkisilik-asgari',2024):'2024-bilirkisi-ucret-tarifesi',('bilirkisilik-asgari',2025):'2025-yili-bilirkisi-asgari-ucret-tarifesi-yayimlandi',('bilirkisilik-asgari',2026):'2026-yili-bilirkisilik-asgari-ucret-tarifesi',
 ('uzlastirmaci',2026):'2026-yili-uzlastirmaci-asgari-ucret-tarifesi-yayimlandi',('taniklik',2026):'2026-yili-taniklik-ucret-tarifesi',
 ('iflas-idaresi',2024):'adalet-bakanligi-iflas-idaresi-ucreti-yazi-ve-teblig-masrafi-tarifesi-hakkinda-teblig-resmi-gazetede-yayimlandi',('iflas-idaresi',2026):'2026-yili-iflas-idaresi-ucreti-yazi-ve-teblig-masrafi-tarifesi-hakkinda-teblig-yayimlandi',
 ('lisansli-yediemin',2026):'2026-yili-lisansli-yediemin-depolari-yonetmeligi-ucret-tarifesi-yayimlandi',('satis-giderleri',2026):'2026-yili-satis-giderleri-tarifesi',
 ('hmk-gider-avansi',2025):'hmk-gider-avansi-tarifesi',('hmk-hakem',2025):'hmk-hakem-ucret-tarifesi',('hmk-tanik',2025):'hmk-tanik-ucret-tarifesi',
}
report=[]
def write_news(slug,title,pub,source,body,old=False):
 p=D/(slug+'.md')
 if old:
  # Doğru mevcut metin korunur; tutarsız cetveller ayrıca yeniden yazılır.
  s=p.read_text(encoding='utf-8');front,content=s.split('---',2)[1:]
  for field,value in [('date',pub),('updated',today),('kaynak',source)]:front=re.sub(rf'^{field}:.*$',field+': '+json.dumps(value,ensure_ascii=False),front,flags=re.M)
  s='---'+front+'---\n\n'+body+'\n\n'+content
 else:
  s='---\n'+''.join(k+': '+json.dumps(v,ensure_ascii=False)+'\n' for k,v in dict(title=title,description=title+'; yürürlük tarihi, resmî kaynak ve dönem cetveli.',date=pub,updated=today,kategori=['Haberler','Tarifeler'],kaynak=source).items())+'---\n\n'+body+'\n'
 p.write_text(s,encoding='utf-8');report.append(dict(dosya=str(p),yayin=pub,kaynak=source))
for t in T:
 if t['slug'] not in registry:continue
 for i,(r,pub) in enumerate(zip(t['kayitlar'],registry[t['slug']])):
  if t['slug'].startswith('hmk') and pub<'2024':continue
  y=int(r['baslangic'][:4]);y=y+1 if t['slug']=='uzlastirmaci' else y
  slug=existing.get((t['slug'],y),f'{y}-{t["slug"]}-tarifesi-yayimlandi')
  title=f'{y} {t["ad"]} yayımlandı'
  body=f'**Resmî yayım: {pub}. Yürürlük başlangıcı: {r["baslangic"]}.**\n\n{t["aciklama"]}\n\n[Resmî tarife belgesi]({r["kaynak"]}). [Bu dönemin ücret cetveli ve geçmiş dönem karşılaştırması](/tarifeler/{t["slug"]}/?yil={y}#donem-{r["baslangic"]}).\n\n{r["notu"]}'
  exists=(D/(slug+'.md')).exists()
  if not exists:body+='\n\n*Arşiv notu: Bu haber 5 Kasım 2026 tarihinde resmî yayım günü esas alınarak geçmiş tarihli tarife arşivine eklenmiştir. Düzenleme tarihi ayrıca gösterilir.*'
  else:body+='\n\n*5 Kasım 2026 kaynak kontrolü: Yayım / yürürlük bilgisi ve tarife arşivi bağlantısı güncellendi.*'
  # Başlığı/yılı karışmış bilirkişi ve HMK metinleri doğru kısa haberle değiştirilir.
  write_news(slug,title,pub,r['kaynak'],body,old=exists and t['slug'] not in ['bilirkisilik-asgari','hmk-hakem','hmk-gider-avansi','hmk-tanik'])
# Eski dizinlerin yanlış tabloları yerine doğrulanan arşiv gösterilir; URL'ler korunur.
for slug,key,title in [('bilirkisi-ucret-tarifesi','bilirkisilik-asgari','Bilirkişilik asgari ücret tarifeleri'),('uzlastirmaci-ucret-tarifesi','uzlastirmaci','Uzlaştırmacı ücret tarifeleri'),('uzlastirmaci-ucret-tarifesi-2025','uzlastirmaci','2025 uzlaştırmacı ücret tarifesi'),('cmk-taniklik-ucret-tarifesi','cmk-taniklik','CMK tanıklık ücret tarifeleri'),('sigorta-tahkim-komisyonu-bilirkisi-ucret-tarifesi','sigorta-tahkim-bilirkisi','Sigorta tahkim bilirkişi ücret tarifeleri')]:
 t=next(t for t in T if t['slug']==key);r=t['kayitlar'][-1]
 # Bu sayfalar sürekli güncellenen rehberdir; eski yayım günü değiştirilmez.
 old=(D/(slug+'.md')).read_text(encoding='utf-8');pub=re.search(r'^date: "(.*?)"',old,re.M)[1]
 write_news(slug,title,pub,r['kaynak'],f'{t["aciklama"]}\n\n[2024 ve sonrası dönem tabloları, resmî belgeler ve değişim grafiği](/tarifeler/{key}/).\n\nEski sayfadaki karışık yıllı cetvel yerine kaynağı belirtilmiş ortak arşiv kullanılır. Her yılın tutarı ilgili dönemden açılmalıdır.')
Path('docs/tarife-haber-denetimi-20261105.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(len(report),'haber kaydı hazır')
