"""Bütün tarife dönemleri: tek dikey A4, solda tebligat, sağda dört tablo."""
import json
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT=Path(__file__).resolve().parent.parent
data=json.loads((ROOT/'src/data/tebligat-ucretleri.json').read_text(encoding='utf-8'))['tablolar']
pdfmetrics.registerFont(TTFont('Noto',str(ROOT/'public/fonts/noto/NotoSans-Regular.ttf')))
output=ROOT/'public/dosyalar/yargilama-gideri-tum-tarifeler.pdf'
output.parent.mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(output),pagesize=A4,invariant=1)
c.setTitle('Yargılama gideri - bütün tarife dönemleri | 657.com.tr')
c.setAuthor('657.com.tr')
W,H=A4; margin=24; gap=14; col=(W-2*margin-gap)/2
top,bottom=H-87,47
title_h,labels_h,table_gap=26,18,10
header_h=title_h+labels_h
right=[('etebligat','E-TEBLİGAT'),('kep','KEP'),('eyazisma','E-YAZIŞMA'),('kesifharci','KEŞİF HARCI')]
available=top-bottom
row_h=min((available-header_h)/len(data['posta']),
          (available-len(right)*header_h-(len(right)-1)*table_gap)/sum(len(data[key]) for key,_ in right))
table_gap=(available-len(right)*header_h-sum(len(data[key]) for key,_ in right)*row_h)/(len(right)-1)
font_size=min(8.3,row_h-4)
if font_size<7.5:raise ValueError('Tarifeler tek A4 üzerinde okunabilir boyutta yerleşmiyor.')
NAVY=(.075,.125,.21); INK=(.1,.15,.22); MUTED=(.36,.40,.46)
RULE=(.80,.83,.87); PALE=(.95,.96,.975); CURRENT=(.985,.94,.945)
ACCENT=(.69,.05,.15); WHITE=(1,1,1)

c.setFillColorRGB(*NAVY); c.setFont('Noto',17)
c.drawString(margin,H-34,'Yargılama gideri')
c.setFont('Noto',9); c.drawString(margin,H-51,'Bütün dönemler için tarife cetveli')
c.setFont('Noto',11); c.drawRightString(W-margin,H-34,'657.com.tr')
c.setFillColorRGB(*MUTED); c.setFont('Noto',7.4)
c.drawRightString(W-margin,H-51,'Tek sayfa / Dikey A4')
c.setStrokeColorRGB(*RULE); c.line(margin,H-64,W-margin,H-64)
c.drawString(margin,H-77,'Tarih aralığına uygun birim ücret seçilir; ilgili adet ile çarpılır.')

def date(value):return '.'.join(value.split('-')[::-1]) if value else 'Halen'
def price(row):
 number=f"{row['tutar']:,.2f}".replace(',','X').replace('.',',').replace('X','.')
 unit=row.get('para','TRY')
 if unit not in ('TRL','YTL','TRY'):raise ValueError('Bilinmeyen para birimi')
 return number+' '+{'TRL':'eski TL','YTL':'YTL','TRY':'TL'}[unit]

def table(key,title,x,table_top):
 rows=data[key]; base=table_top-header_h-len(rows)*row_h
 if base<bottom-.01:raise ValueError(f'{title}: tablo sayfa alanının dışına taşıyor.')
 c.setFillColorRGB(*NAVY); c.rect(x,table_top-title_h,col,title_h,fill=1,stroke=0)
 c.setFillColorRGB(*WHITE); c.setFont('Noto',10); c.drawString(x+9,table_top-17,title)
 c.setFont('Noto',7); c.drawRightString(x+col-9,table_top-16,f'{len(rows)} dönem')
 label_bottom=table_top-header_h
 c.setFillColorRGB(*PALE); c.rect(x,label_bottom,col,labels_h,fill=1,stroke=0)
 c.setFillColorRGB(*MUTED); c.setFont('Noto',7.2)
 offsets=(9,94)
 c.drawString(x+offsets[0],label_bottom+6,'Başlangıç')
 c.drawString(x+offsets[1],label_bottom+6,'Bitiş')
 c.drawRightString(x+col-9,label_bottom+6,'Birim ücret')
 for index,row in enumerate(rows):
  y=label_bottom-(index+1)*row_h; current=row['bitis'] is None
  c.setFillColorRGB(*(CURRENT if current else PALE if index%2==0 else WHITE))
  c.rect(x,y,col,row_h,fill=1,stroke=0)
  c.setFillColorRGB(*(ACCENT if current else INK)); c.setFont('Noto',font_size)
  baseline=y+(row_h-font_size)/2+1.6
  start,end,amount=date(row['baslangic']),date(row['bitis']),price(row)
  if (pdfmetrics.stringWidth(start,'Noto',font_size)>offsets[1]-offsets[0]-8
      or pdfmetrics.stringWidth(end,'Noto',font_size)+pdfmetrics.stringWidth(amount,'Noto',font_size)>col-offsets[1]-17):
   raise ValueError(f'{title}: tarih veya tutar sütununa sığmıyor.')
  c.drawString(x+offsets[0],baseline,start); c.drawString(x+offsets[1],baseline,end)
  c.drawRightString(x+col-9,baseline,amount)
  c.setStrokeColorRGB(*RULE); c.setLineWidth(.25); c.line(x,y,x+col,y)
 c.setStrokeColorRGB(*RULE); c.setLineWidth(.5)
 c.rect(x,base,col,table_top-base,fill=0,stroke=1)
 return base

table('posta','TEBLİGAT',margin,top)
right_top=top
for key,title in right:right_top=table(key,title,margin+col+gap,right_top)-table_gap
c.setFillColorRGB(*MUTED); c.setFont('Noto',6.8)
c.drawString(margin,32,'1 YTL = 1.000.000 eski TL; 2009 sonrası 1 TL = 1 YTL. Toplamlar TL birimine dönüştürülür.')
c.drawString(margin,20,'Güncel hesaplama ve kaynak bilgileri: 657.com.tr/yargilamagideri/')
c.drawRightString(W-margin,20,'1 / 1')
c.linkURL('https://657.com.tr/yargilamagideri/',(margin,17,W-margin,29),relative=0)
c.showPage();c.save()
print(f'[tarife PDF] {sum(map(len,data.values()))} dönem, 1 dikey A4 sayfa')

