"""Resmî kararların metin katmanını ve olay bölümüne ait kaynak alıntısını çıkarır."""

import argparse
import json
from pathlib import Path
import re

import pymupdf


ROOT = Path(__file__).resolve().parents[1]
TOPICS = (
    ('Raporun teslim süresi', r'rapor\w*.{0,110}(?:süresi içinde|süresi içerisinde|süresinde|yasal süre|gecik|ibraz etme|teslim etme)|(?:ek süre|gecik).{0,70}rapor'),
    ('Uzmanlık alanı ve görevlendirme', r'(?:uzmanlık alanı|görevlendirm).{0,120}(?:dışında|dışındaki|yer almayan|kabul etme|çekin)'),
    ('Hukuki değerlendirme ve raporun sınırı', r'hukuki nitelendirme|hukuki değerlendirme|kusur oranı'),
    ('Tarafsızlık ve etik yükümlülükler', r'tarafsızlık|güven sarsıcı|etik ilkelere aykırı|taraflardan biriyle|reklam yasağı'),
    ('Sicil koşulları ve kayıt durumu', r'kabul şartlarını|sicile kayıt şartlarını|sicilden çıkarılmayı talep|yenileme taleb'),
    ('Bilirkişilik görevinin yerine getirilmesi', r'dosyayı (?:teslim|iade)|görevi (?:kabul|yerine getir)|bilirkişilikten çekil'),
)


def extract(pdf):
    pages = []
    with pymupdf.open(pdf) as document:
        for page in document:
            blocks = []
            for block in page.get_text('blocks', sort=True):
                if block[6] != 0:
                    continue
                text = '\n'.join(line.rstrip() for line in block[4].splitlines()).strip()
                if text:
                    blocks.append(text)
            if not blocks:
                raise ValueError(f'Metin katmanı bulunamadı: {pdf.name}, s. {page.number + 1}')
            pages.append(blocks)
    excerpt = None
    fallback = None
    highest = 0
    for number, blocks in enumerate(pages, 1):
        for block in blocks:
            text = ' '.join(block.split())
            if len(text) < 100 or re.match(r'^(?:\*|T\.C\.|KARAR NO)', text, re.IGNORECASE):
                continue
            if not fallback and re.search(r'dosya|inceleme|başvuru|ihbar|bilirkişi', text, re.IGNORECASE):
                fallback = {'konu': 'Başvuru ve inceleme', 'sayfa': number,
                            'alinti': text if len(text) <= 460 else text[:460].rsplit(' ', 1)[0] + '…'}
            matched = [(name, m) for name, pattern in TOPICS if (m := re.search(pattern, text, re.IGNORECASE))]
            if not matched:
                continue
            score = 1 + bool(re.search(r'anlaşıl|tespit|değerlendir|belirle', text, re.IGNORECASE)) * 2
            score += bool(re.search(r'mahkemesi|esas sayılı|dosyasında|görevlendirildi', text, re.IGNORECASE))
            score -= bool(re.search(r'başlıklı.{0,40}maddesi|hükmü düzenlenmiştir', text, re.IGNORECASE)) * 2
            if score > highest:
                topic, match = matched[0]
                pos = max(0, text.rfind('. ', 0, match.start()) + 2) if match.start() > 240 else 0
                clip = text[pos:pos + 460]
                if pos + len(clip) < len(text):
                    clip = clip.rsplit(' ', 1)[0] + '…'
                highest = score
                excerpt = {'konu': topic, 'sayfa': number, 'alinti': ('… ' if pos else '') + clip}
    event = excerpt or fallback
    return {'sayfalar': pages, **({'olay': event} if event else {})}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf_folder', type=Path)
    args = parser.parse_args()
    directory = ROOT / 'src' / 'data'
    catalog = json.loads((directory / 'bilirkisi-kararlari.json').read_text(encoding='utf8'))
    output = {case['id']: extract(args.pdf_folder / f"{case['id']}.pdf") for case in catalog}
    (directory / 'bilirkisi-karar-metinleri.json').write_text(
        '{\n' + ',\n'.join(f'  {json.dumps(key)}: {json.dumps(value, ensure_ascii=False)}' for key, value in output.items()) + '\n}\n',
        encoding='utf8', newline='\n',
    )
    print(f'{len(output)} karar, {sum(len(item["sayfalar"]) for item in output.values())} sayfa; {sum("olay" in item for item in output.values())} konu alıntısı')


if __name__ == '__main__':
    main()
