"""Resmî AAÜT 2023/2024 cetvellerinden doğrulanan geçmiş tarifeler."""
from pathlib import Path
import json,copy
p=Path(__file__).resolve().parents[1]/'src/data/hukuk-tarifeleri.json';d=json.loads(p.read_text(encoding='utf-8'))
ids=[m['id'] for m in d['vekalet'][0]['mahkemeler']]
assert len(ids)==16
rows=[]
for start,end,year,amounts,brackets in [
 ('2023-09-21','2024-10-02',2023,[17900,17900,10700,9000,25500,3600,4200,6800,7400,29800,10500,20900,16500,10200,20400,17100],[200000,200000,400000,600000,800000,1000000,1200000,1400000,None]),
 ('2024-10-03','2025-11-03',2024,[30000,30000,18000,15000,40000,6000,7000,12000,13500,48000,18000,36000,25000,16000,32000,28000],[400000,400000,800000,1200000,1600000,2000000,2400000,2800000,None])]:
 v=copy.deepcopy(d['vekalet'][0]);v.update(baslangic=start,bitis=end,kaynak=f'https://www.barobirlik.org.tr/dosyalar/belgeler/AvUcretTarifesi/tbb{year}.pdf')
 v['basamaklar']=[dict(miktar=a,oran=r) for a,r in zip(brackets,[16,15,14,11,8,5,3,2,1])]
 for m,a in zip(v['mahkemeler'],amounts):m['maktu']=a
 rows.append(v)
d['vekalet']=rows+[v for v in d['vekalet'] if v['baslangic']>='2025-11-04']
for year,values,url in [
 (2024,[427.6,195.8,1169.4,2102.1,890.6],'https://www.resmigazete.gov.tr/eskiler/2023/12/20231230M2-10.pdf'),
 (2025,[615.4,281.8,1683.1,3033.7,1283.1],'https://cdn.gib.gov.tr/api/gibportal-file/file/getFile?objectKey=MEVZUAT_MADDE%2FUNIVERSAL%2F2025%2Fharclar_06092025.pdf')]:
 h=copy.deepcopy(d['harclar'][-1]);h.update(baslangic=f'{year}-01-01',bitis=f'{year}-12-31',maktu=values[0],basvuruAsliye=values[0],basvuruSulh=values[1],istinafBasvuru=values[2],temyizBasvuru=values[3],temyizMaktu=values[4],kaynak=url)
 d['harclar']=[v for v in d['harclar'] if not v['baslangic'].startswith(str(year))]+[h]
d['harclar'].sort(key=lambda h:h['baslangic'])
p.write_text(json.dumps(d,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
print('2024–2026 harçları ve dört AAÜT dönemi hazır.')
