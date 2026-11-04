"""657 arşivinin konsolosluk JSON'unu normalleştirir; ağ bağlantısı veya sunucu yazımı yoktur."""
import argparse,datetime,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('dosya',type=Path);p.add_argument('--tarih',default=datetime.date.today().isoformat());args=p.parse_args();datetime.date.fromisoformat(args.tarih)
root=Path(__file__).resolve().parents[1];raw=args.dosya.read_bytes();data=json.loads(raw.decode('utf-8-sig'))
fields=[('ulke','Ülke'),('temsilcilik','Temsilcilik'),('bolge','Görev bölgesindeki Eyalet/Kanton'),('sehir','Görev bölgesindeki Şehir/Semt'),('posta','PostaKodu')]
if not isinstance(data,list) or not data or any(not isinstance(r,dict) or not r.get('Temsilcilik') for r in data):raise SystemExit('Temsilcilik içeren kaynak kayıtları gerekli.')
rows=[{k:str(r.get(f) or '') for k,f in fields} for r in data]
(root/'public/veriler/konsolosluklar.json').write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
meta={'kaynak':'https://657.com.tr/konsolosluk-sorgulama-2/','kopyaTarihi':args.tarih,'kayit':len(rows),'ulke':len({r['ulke'] for r in rows if r['ulke']}),'ulkesizKayit':sum(not r['ulke'] for r in rows),'sha256':hashlib.sha256(raw).hexdigest()}
(root/'src/data/konsolosluk-kaynak.json').write_text(json.dumps(meta,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
print(len(rows),'kayıt aktarıldı.')
