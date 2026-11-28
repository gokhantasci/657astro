"""Dilekçe kataloğundaki metinlerden Word örnekleri ve düzenleyici verisi üretir."""

import json
from pathlib import Path
import re

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public' / 'veri' / 'sablonlar'
OUTPUT.mkdir(parents=True, exist_ok=True)

for filename in ('dilekce-sablonlari.json', 'dilekce-sablonlari-ek.json'):
    catalog = json.loads((ROOT / 'src' / 'data' / filename).read_text(encoding='utf8'))
    for item in catalog:
        slug, title, text = item['id'], item['kisaAd'], item['metin']
        if not re.fullmatch(r'[a-z0-9-]+', slug):
            raise ValueError(slug)

        (OUTPUT / f'{slug}.json').write_text(
            json.dumps({'baslik': title, 'metin': text}, ensure_ascii=False) + '\n', encoding='utf8', newline='\n')

        doc = Document()
        doc.core_properties.title = title
        doc.core_properties.author = '657.com.tr'
        doc.core_properties.subject = 'Düzenlenebilir dilekçe örneği'
        section = doc.sections[0]
        section.page_width, section.page_height = Cm(21), Cm(29.7)
        section.top_margin = section.bottom_margin = Cm(2.0)
        section.left_margin = section.right_margin = Cm(2.5)
        normal = doc.styles['Normal']
        normal.font.name = 'Times New Roman'
        normal.font.size = Pt(12)
        normal.font.color.rgb = RGBColor(0, 0, 0)
        normal.paragraph_format.space_after = Pt(3)
        normal.paragraph_format.line_spacing = 1.12

        first = True
        for paragraph in text.strip().splitlines():
            line = re.sub(r'[ \t]{2,}', ' ', paragraph.strip())
            if not line:
                continue
            p = doc.add_paragraph()
            if first:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.keep_with_next = True
                p.paragraph_format.space_after = Pt(13)
            heading = bool(re.fullmatch(r'(?:\d+\.\s+)?[A-ZÇĞİÖŞÜ\s/()]+:?', line)) and len(line) < 100
            if heading and not first:
                p.paragraph_format.space_before = Pt(8)
                p.paragraph_format.keep_with_next = True
            match = re.match(r'^([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ /().-]{2,60}:)(.*)$', line)
            if match:
                p.add_run(match[1]).bold = True
                p.add_run(match[2])
            else:
                p.add_run(line).bold = first or heading
            first = False
        doc.save(OUTPUT / f'{slug}.docx')
