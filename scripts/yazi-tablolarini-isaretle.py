"""Yazı gövdelerindeki tabloların ilk satırını sütun başlığı olarak işaretler (SEO yol haritası P2-6). İdempotent.

İlk satırda <th> varsa scope="col" eklenir; ilk satır yalnız <td> ise ve tabloda en az iki satır varsa ilk satır <th scope="col"> olur.
İçerik değişmez, yalnız anlam işaretlemesi eklenir. Kullanım: python scripts/yazi-tablolarini-isaretle.py
"""
import re
from pathlib import Path

TABLO = re.compile(r'<table\b[^>]*>.*?</table>', re.S | re.I)
SATIR = re.compile(r'<tr\b[^>]*>.*?</tr>', re.S | re.I)

def isaretle(tablo: str) -> str:
    satirlar = SATIR.findall(tablo)
    if len(satirlar) < 2:
        return tablo
    ilk = satirlar[0]
    if re.search(r'<th\b', ilk, re.I):
        yeni = re.sub(r'<th(?![^>]*\bscope=)([^>]*)>', r'<th scope="col"\1>', ilk, flags=re.I)
    else:
        yeni = re.sub(r'<td\b([^>]*)>', r'<th scope="col"\1>', ilk, flags=re.I)
        yeni = re.sub(r'</td>', '</th>', yeni, flags=re.I)
    return tablo.replace(ilk, yeni, 1)

if __name__ == '__main__':
    sayi = 0
    for p in Path('src/content/yazilar').glob('*.md'):
        eski = p.read_text(encoding='utf-8')
        yeni = TABLO.sub(lambda m: isaretle(m.group(0)), eski)
        if yeni != eski:
            p.write_text(yeni, encoding='utf-8'); sayi += 1
    print(f'{sayi} yazıda tablo başlığı işaretlendi.')
