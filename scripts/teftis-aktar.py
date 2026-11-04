"""Salt okunur kaynak kopyalarından teftiş ekranlarını bağımsız tarayıcı modüllerine dönüştürür.
Kaynak: artifacts/teftis-port ve artifacts/kaynak-onbellek/teftis. PHP çalıştırılmaz.
"""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'artifacts/teftis-port'
OUT=ROOT/'public/uygulamalar/teftis'
MODULES=[
 ('terficetveli','Terfi cetveli','partials/pages/terficetveli.php',[]),
 ('karar','Karar defteri kontrolü','page-karar.php',['g-global','karar-upload','karar-excel-kpis']),
 ('istinaf','İstinaf defteri','page-istinaf.php',['istinaf','istinaf-kpi','istinaf-hakim-filter']),
 ('byu','Basit yargılama usulü zaman kontrolü','page-byu.php',['byu']),
 ('byu-uygulanan-dosyalar','BYU uygulanan dosyalar','page-byu-applied.php',['byu-applied']),
 ('kesinlestirme','Kesinleştirme ve infaza verme kontrolü','partials/pages/kesinlestirme.php',['kesinlestirme']),
 ('harctahsilkontrol','Harç tahsil kontrolü','partials/pages/harctahsilkontrol.php',['harc-tahsil']),
 ('kesinlesmek','Kesinleşme zamanı kontrolü','partials/pages/kesinlesmek.php',['kesinlesme-kontrol']),
 ('kalem-denetimi','Yazı işleri müdürlüklerinin denetimi','partials/pages/kalemdenetimi.php',['kalemdenetimi']),
 ('jrobot','JSON istatistikçi robot','partials/pages/jrobot.php',['jrobot']),
 ('nufus-analiz-sistemi-bosanma-karari-hazirla','Nüfus kayıt analizi','page-nufus-kayit.php',[])
]
OUT.mkdir(parents=True,exist_ok=True)
INNER=ROOT/'src/legacy/teftis'
INNER.mkdir(parents=True,exist_ok=True)
(OUT/'utils.js').write_text((ROOT/'artifacts/kaynak-onbellek/teftis/utils.js').read_text(encoding='utf-8').replace('localStorage','window.teftisStorage'),encoding='utf-8')
manifest=[]
for slug,title,path,extra in MODULES:
 raw=(SOURCE/path).read_text(encoding='utf-8')
 # Sadece sayfa gövdesi; WordPress üst/alt bölüm ve yorumları yok.
 raw=re.sub(r'<\?php\s*if\s*\(comments_open\(\).*?<\?php\s*endif;\s*\?>','',raw,flags=re.S)
 raw=re.sub(r'<\?php\s*echo get_template_directory_uri\(\);\s*\?>','.',raw)
 raw=re.sub(r'<\?php.*?\?>','',raw,flags=re.S)
 if slug=='karar':
  # Kaynak şablonda footer çağrısından sonra ikinci kez yazılmış ayar kartı.
  # Yinelenen id'ler ilk kartın ayarlarının okunmasını da bozuyordu.
  tail=raw.rfind('<div class="card">')
  if tail>raw.find('</main>'):raw=raw[:tail]
 scripts=[]
 def take(m):
  attrs,body=m.groups();src=re.search(r'src="([^"]+)"',attrs)
  if src:
   name=src[1].split('/')[-1].split('?')[0].removesuffix('.js')
   if name not in ['xlsx.full.min','xlsx-loader','jszip.min'] and name not in scripts:scripts.append(name)
   return ''
  # Eski tarayıcı depolaması yerine yalnız bu açık sayfanın belleği.
  return '<script>'+body.replace('localStorage','window.teftisStorage')+'</script>'
 raw=re.sub(r'<script\b([^>]*)>(.*?)</script>',take,raw,flags=re.S|re.I)
 for name in extra:
  if name not in scripts:scripts.append(name)
 # Metin içindeki site içi gezinmeler üst sayfada açılır; dış bağımlılık yok.
 raw=raw.replace('https://657.com.tr/','/').replace('target="_blank"','target="_top"')
 for name in scripts:
  f=ROOT/'artifacts/kaynak-onbellek/teftis'/(name+'.js')
  text=f.read_text(encoding='utf-8').replace('localStorage','window.teftisStorage')
  if name=='kesinlestirme':
   text=text.replace('#kararDefteriPanel .panel-head strong','#kararDefteriPanel .card-header strong').replace('#kararDefteriPanel .panel-body > p.muted','#kararDefteriPanel .card-body > p.text-muted')
  (OUT/(name+'.js')).write_text(text,encoding='utf-8')
 (INNER/(slug+'.html')).write_text(raw,encoding='utf-8')
 manifest.append({'slug':slug,'baslik':title,'kaynak':'https://657.com.tr/'+slug+'/','sha256':hashlib.sha256((SOURCE/path).read_bytes()).hexdigest(),'betikler':scripts})
(ROOT/'src/data/teftis-modulleri.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
print(len(manifest),'modül hazır.')
subprocess.run(['node','scripts/teftis-hazirla.mjs'],cwd=ROOT,check=True)
