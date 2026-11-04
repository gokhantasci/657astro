"""Hesaplama aracının bütün tarife satırları: tek A4 yatay, derlemede yenilenir."""
import json
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT=Path(__file__).resolve().parent.parent
data=json.loads((ROOT/'src/data/tebligat-ucretleri.json').read_text(encoding='utf-8'))['tablolar']
pdfmetrics.registerFont(TTFont('Noto',str(ROOT/'public/fonts/noto/NotoSans-Regular.ttf')))
output=ROOT/'public/dosyalar/yargilama-gideri-tum-tarifeler.pdf'
output.parent.mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(output),pagesize=landscape(A4),invariant=1)
c.setTitle('Yargılama gideri — bütün tarife dönemleri | 657.com.tr')
c.setAuthor('657.com.tr')
W,H=landscape(A4);margin=21;gap=7;col=(W-2*margin-4*gap)/5
c.setFillColorRGB(.09,.14,.21);c.setFont('Noto',15)
c.drawString(margin,H-31,'Yargılama gideri • Tarife cetveli')
c.setFont('Noto',8);c.drawRightString(W-margin,H-29,'657.com.tr/yargilamagideri/')
c.setFillColorRGB(.3,.3,.3);c.setFont('Noto',7)
c.drawString(margin,H-47,'Bütün dönemler • Tarih aralığı ve birim ücret • Adet ile çarpılarak hesaplanır.')
names={'posta':'TEBLİGAT','etebligat':'E-TEBLİGAT','eyazisma':'E-YAZIŞMA','kep':'KEP','kesifharci':'KEŞİF HARCI'}
row_h=min(11,(H-140)/max(map(len,data.values())))
def date(s):return '/'.join(s.split('-')[::-1]) if s else 'Halen'
for i,(key,title) in enumerate(names.items()):
 x=margin+i*(col+gap);top=H-60
 c.setFillColorRGB(.09,.14,.21);c.rect(x,top-22,col,22,fill=1,stroke=0)
 c.setFillColorRGB(1,1,1);c.setFont('Noto',8);c.drawCentredString(x+col/2,top-15,title)
 c.setFont('Noto',6.3)
 for j,row in enumerate(data[key]):
  y=top-22-(j+1)*row_h
  c.setFillColorRGB(*((.94,.95,.97) if j%2==0 else (1,1,1)));c.rect(x,y,col,row_h,fill=1,stroke=0)
  c.setFillColorRGB(.1,.1,.1)
  text=f"{date(row['baslangic'])} – {date(row['bitis'])}"
  price=f"{row['tutar']:,.2f}".replace(',','X').replace('.',',').replace('X','.')+' '+row.get('para','TRY').replace('TRY','TL')
  if pdfmetrics.stringWidth(text,'Noto',6.3)+pdfmetrics.stringWidth(price,'Noto',6.3)>col-10:raise ValueError('Tarife sütununa sığmayan satır')
  c.drawString(x+3,y+(row_h-6.3)/2+1,text);c.drawRightString(x+col-3,y+(row_h-6.3)/2+1,price)
 c.setStrokeColorRGB(.78,.8,.83);c.rect(x,top-22-len(data[key])*row_h,col,22+len(data[key])*row_h,fill=0,stroke=1)
c.setFont('Noto',7);c.setFillColorRGB(.3,.3,.3)
c.drawString(margin,22,'Kaynak: 657.com.tr ortak tarife verileri. Güncel hesaplama, kaynak bilgisi ve diğer giderler: 657.com.tr/yargilamagideri/')
c.showPage();c.save()
print(f'[tarife PDF] {sum(map(len,data.values()))} dönem, 1 A4 sayfa')
