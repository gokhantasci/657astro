from pathlib import Path
import json
rows=[]
url='https://hsk.gov.tr/Eklentiler/08092026144403092026-tarihli-ve-1045-sayili-kararpdf.pdf'
for yer,mahkeme,cevre,uygulama in [
 ('Gaziosmanpaşa','Çocuk Ağır Ceza','Gaziosmanpaşa Ağır Ceza Mahkemesi yargı çevresi','03/09/2026'),
 *[(y,'İnfaz Hâkimliği',y+' Ağır Ceza Mahkemesi yargı çevresi','03/09/2026') for y in ['Sandıklı','Serik','Suşehri','Ortaca']],
 ('Çorum','Asliye Ticaret','Çorum ilinin mülki sınırları','03/09/2026'),
 ('Hatay','Asliye Ticaret','Hatay, Altınözü, Samandağ, Yayladağı, Antakya, Defne, Reyhanlı, Kumlu, Kırıkhan ve Hassa ilçeleri','03/09/2026'),
 ('İskenderun','Asliye Ticaret','İskenderun, Arsuz, Belen, Dörtyol, Erzin ve Payas ilçeleri','03/09/2026'),
 *[(y,'Asliye Ticaret',y+' ilinin mülki sınırları','03/09/2026') for y in ['Nevşehir','Van']],
 *[(y,'İş',y+' Asliye Hukuk Mahkemesi yargı çevresi','03/09/2026') for y in ['Çankırı','Çarşamba']],
 *[(y,'İş',y+' Ağır Ceza Mahkemesi yargı çevresi','03/09/2026') for y in ['Gaziosmanpaşa','Kilis']],
 ('Nevşehir','Tüketici','Nevşehir Ağır Ceza Mahkemesi yargı çevresi','03/09/2026'),
 ('Gemlik','İş','Gemlik Ağır Ceza Mahkemesi yargı çevresi','Mahkemenin faaliyete geçtiği tarihten itibaren'),
 ('Kemalpaşa','İş','Kemalpaşa Asliye Hukuk Mahkemesi yargı çevresi','Mahkemenin faaliyete geçtiği tarihten itibaren'),
 ('Torbalı','İş','Torbalı Ağır Ceza Mahkemesi yargı çevresi','Mahkemenin faaliyete geçtiği tarihten itibaren'),
 *[(y,'Tüketici',y+' Ağır Ceza Mahkemesi yargı çevresi','Mahkemenin faaliyete geçtiği tarihten itibaren') for y in ['Gaziosmanpaşa','Menemen','Torbalı']]
]:rows.append(dict(mahal=yer,mahkeme=mahkeme,cevre=cevre,uygulama=uygulama,karar='03/09/2026 tarihli 1045',kaynak=url))
rows.append(dict(il='İstanbul',mahkeme='Asliye Ticaret',cevre='İstanbul ilinin mülki sınırları',uygulama='Bakırköy, İstanbul Anadolu ve Küçükçekmece Asliye Ticaret Mahkemelerinin faaliyetlerinin durdurulması itibarıyla. Karar eki geçiş şartını esas alın; 20/02/2026 duyurusu o aşamada dosya devri yapılmadığını ayrıca belirtir.',karar='18/02/2026 tarihli 282 (duyuru linkinde 283 yazılmıştır; karar PDF’sindeki sayı esas alınır)',kaynak='https://hsk.gov.tr/Eklentiler/20022026095418022026-tarihli-ve-282-sayili-kararpdf.pdf'))
p=Path(__file__).resolve().parents[1]/'src/data/adli-ozel-cevreler.json';p.write_text(json.dumps(rows,ensure_ascii=False,indent=1)+'\n',encoding='utf-8');print(len(rows),'özel mahkeme çevresi kaydı.')
