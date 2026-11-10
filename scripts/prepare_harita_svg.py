import xml.etree.ElementTree as ET
import json

ET.register_namespace('', 'http://www.w3.org/2000/svg')

with open('src/data/yargi-haritasi.json', 'r', encoding='utf-8') as f:
    yargi = json.load(f)

tree = ET.parse('artifacts/tr-adm2.svg')
root = tree.getroot()

root.attrib = {
    'id': 'yargi-svg',
    'class': 'yargi-harita-svg',
    'viewBox': '1 0 1436 629',
    'xmlns': 'http://www.w3.org/2000/svg'
}

iller_g = root.find('{http://www.w3.org/2000/svg}g[@id="iller"]')
features_g = root.find('{http://www.w3.org/2000/svg}g[@id="features"]')

# Update iller
iller_g.attrib = {'id': 'yargi-iller', 'class': 'yargi-iller-grubu'}
for g in list(iller_g):
    iso2 = g.attrib.get('iso2', '')
    plaka = iso2.replace('TR-', '').zfill(2)
    il_info = yargi['iller'].get(plaka)
    if il_info:
        g.attrib = {
            'id': f'il-{plaka}',
            'class': 'yargi-il',
            'style': f'--il-renk: {il_info["bamColor"]};',
            'data-plaka': plaka,
            'data-ad': il_info['ad'],
            'data-bam': il_info['bam'],
            'data-bim': il_info['bim'],
            'data-acm': str(il_info['acm_sayisi']),
            'data-adliye': str(il_info['adliye_sayisi'])
        }
        for child in list(g):
            if child.tag.endswith('title'):
                g.remove(child)

# Update features (ilceler)
features_g.attrib = {'id': 'yargi-ilceler', 'class': 'yargi-ilceler-grubu'}
for g in list(features_g):
    gid = g.attrib.get('id', '')
    title = g.attrib.get('title', '')
    if '-' in gid:
        plaka, dslug = gid.split('-', 1)
        plaka = plaka.zfill(2)
        il_info = yargi['iller'].get(plaka)
        matched_dist = None
        if il_info:
            for d in il_info['ilceler']:
                if d['slug'] == dslug:
                    matched_dist = d
                    break
        has_adliye = '1' if (matched_dist and matched_dist['has_adliye']) else '0'
        teskilat = matched_dist.get('teskilat', '') if matched_dist else ''
        
        g.attrib = {
            'id': f'ilce-{plaka}-{dslug}',
            'class': 'yargi-ilce' + (' yargi-ilce--adliyeli' if has_adliye == '1' else ''),
            'data-plaka': plaka,
            'data-ad': title,
            'data-has-adliye': has_adliye,
            'data-teskilat': teskilat or ''
        }
        for child in list(g):
            if child.tag.endswith('title'):
                g.remove(child)

tree.write('src/data/tr-yargi.svg', encoding='utf-8', xml_declaration=False)
print('Optimized SVG written to src/data/tr-yargi.svg without ns0 prefix')
