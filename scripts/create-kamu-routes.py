from pathlib import Path
routes={'ek-ders':'ogretmen-ek-ders-hesaplama','ek-ders-saat':'ek-ders-ucretinden-saat-hesaplama','ilksan':'ilksan-emekli-yardimi-hesaplama','enflasyon-orani':'enflasyon-orani-hesaplama','muhtar':'muhtar-maasi-hesaplama','hizmet-68b':'68-b-hizmet-hesaplama','lojman':'lojman-puani-hesaplama','surekli-yolluk':'surekli-gorev-yollugu','gecici-yolluk':'gecici-gorev-yollugu-hesaplama','belediye-baskani':'belediye-baskani-maasi-hesaplama'}
for id,slug in routes.items():
 p=Path('src/pages')/slug/'index.astro'
 if p.exists():raise ValueError('Mevcut sayfa korunmalı: '+str(p))
 p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text("---\nimport Sayfa from '../../components/KamuHesapSayfasi.astro';\nimport {kamuAraclari} from '../../lib/kamu-katalog';\nconst arac=kamuAraclari.find(a=>a.id==='"+id+"')!;\n---\n<Sayfa arac={arac}/>\n",encoding='utf-8')
