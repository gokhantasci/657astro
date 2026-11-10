import json
import re
import xml.etree.ElementTree as ET

PLAKA_IL = {
    "01": "Adana", "02": "Adıyaman", "03": "Afyonkarahisar", "04": "Ağrı", "05": "Amasya",
    "06": "Ankara", "07": "Antalya", "08": "Artvin", "09": "Aydın", "10": "Balıkesir",
    "11": "Bilecik", "12": "Bingöl", "13": "Bitlis", "14": "Bolu", "15": "Burdur",
    "16": "Bursa", "17": "Çanakkale", "18": "Çankırı", "19": "Çorum", "20": "Denizli",
    "21": "Diyarbakır", "22": "Edirne", "23": "Elazığ", "24": "Erzincan", "25": "Erzurum",
    "26": "Eskişehir", "27": "Gaziantep", "28": "Giresun", "29": "Gümüşhane", "30": "Hakkâri",
    "31": "Hatay", "32": "Isparta", "33": "Mersin", "34": "İstanbul", "35": "İzmir",
    "36": "Kars", "37": "Kastamonu", "38": "Kayseri", "39": "Kırklareli", "40": "Kırşehir",
    "41": "Kocaeli", "42": "Konya", "43": "Kütahya", "44": "Malatya", "45": "Manisa",
    "46": "Kahramanmaraş", "47": "Mardin", "48": "Muğla", "49": "Muş", "50": "Nevşehir",
    "51": "Niğde", "52": "Ordu", "53": "Rize", "54": "Sakarya", "55": "Samsun",
    "56": "Siirt", "57": "Sinop", "58": "Sivas", "59": "Tekirdağ", "60": "Tokat",
    "61": "Trabzon", "62": "Tunceli", "63": "Şanlıurfa", "64": "Uşak", "65": "Van",
    "66": "Yozgat", "67": "Zonguldak", "68": "Aksaray", "69": "Bayburt", "70": "Karaman",
    "71": "Kırıkkale", "72": "Batman", "73": "Şırnak", "74": "Bartın", "75": "Ardahan",
    "76": "Iğdır", "77": "Yalova", "78": "Karabük", "79": "Kilis", "80": "Osmaniye",
    "81": "Düzce"
}

IDARI_REHBER = {
    "01": {"bim": "Adana BİM", "idare": "Adana İdare Mahkemesi", "vergi": "Adana Vergi Mahkemesi"},
    "02": {"bim": "Gaziantep BİM", "idare": "Adıyaman İdare Mahkemesi", "vergi": "Şanlıurfa Vergi Mahkemesi"},
    "03": {"bim": "Konya BİM", "idare": "Afyonkarahisar İdare Mahkemesi", "vergi": "Konya Vergi Mahkemesi"},
    "04": {"bim": "Erzurum BİM", "idare": "Ağrı İdare Mahkemesi", "vergi": "Erzurum Vergi Mahkemesi"},
    "05": {"bim": "Samsun BİM", "idare": "Samsun İdare Mahkemesi", "vergi": "Samsun Vergi Mahkemesi"},
    "06": {"bim": "Ankara BİM", "idare": "Ankara İdare Mahkemesi", "vergi": "Ankara Vergi Mahkemesi"},
    "07": {"bim": "Antalya BİM", "idare": "Antalya İdare Mahkemesi", "vergi": "Antalya Vergi Mahkemesi"},
    "08": {"bim": "Samsun BİM", "idare": "Rize İdare Mahkemesi", "vergi": "Trabzon Vergi Mahkemesi"},
    "09": {"bim": "İzmir BİM", "idare": "Aydın İdare Mahkemesi", "vergi": "Aydın Vergi Mahkemesi"},
    "10": {"bim": "Bursa BİM", "idare": "Balıkesir İdare Mahkemesi", "vergi": "Balıkesir Vergi Mahkemesi"},
    "11": {"bim": "Bursa BİM", "idare": "Sakarya İdare Mahkemesi", "vergi": "Sakarya Vergi Mahkemesi"},
    "12": {"bim": "Diyarbakır BİM", "idare": "Bingöl İdare Mahkemesi", "vergi": "Erzurum Vergi Mahkemesi"},
    "13": {"bim": "Erzurum BİM", "idare": "Van İdare Mahkemesi", "vergi": "Van Vergi Mahkemesi"},
    "14": {"bim": "Ankara BİM", "idare": "Bolu İdare Mahkemesi", "vergi": "Ankara Vergi Mahkemesi"},
    "15": {"bim": "Antalya BİM", "idare": "Isparta İdare Mahkemesi", "vergi": "Antalya Vergi Mahkemesi"},
    "16": {"bim": "Bursa BİM", "idare": "Bursa İdare Mahkemesi", "vergi": "Bursa Vergi Mahkemesi"},
    "17": {"bim": "Bursa BİM", "idare": "Çanakkale İdare Mahkemesi", "vergi": "Balıkesir Vergi Mahkemesi"},
    "18": {"bim": "Ankara BİM", "idare": "Kastamonu İdare Mahkemesi", "vergi": "Zonguldak Vergi Mahkemesi"},
    "19": {"bim": "Samsun BİM", "idare": "Çorum İdare Mahkemesi", "vergi": "Çorum Vergi Mahkemesi"},
    "20": {"bim": "İzmir BİM", "idare": "Denizli İdare Mahkemesi", "vergi": "Denizli Vergi Mahkemesi"},
    "21": {"bim": "Diyarbakır BİM", "idare": "Diyarbakır İdare Mahkemesi", "vergi": "Diyarbakır Vergi Mahkemesi"},
    "22": {"bim": "İstanbul BİM", "idare": "Edirne İdare Mahkemesi", "vergi": "Edirne Vergi Mahkemesi"},
    "23": {"bim": "Diyarbakır BİM", "idare": "Elazığ İdare Mahkemesi", "vergi": "Malatya Vergi Mahkemesi"},
    "24": {"bim": "Erzurum BİM", "idare": "Erzincan İdare Mahkemesi", "vergi": "Erzurum Vergi Mahkemesi"},
    "25": {"bim": "Erzurum BİM", "idare": "Erzurum İdare Mahkemesi", "vergi": "Erzurum Vergi Mahkemesi"},
    "26": {"bim": "Bursa BİM", "idare": "Eskişehir İdare Mahkemesi", "vergi": "Eskişehir Vergi Mahkemesi"},
    "27": {"bim": "Gaziantep BİM", "idare": "Gaziantep İdare Mahkemesi", "vergi": "Gaziantep Vergi Mahkemesi"},
    "28": {"bim": "Samsun BİM", "idare": "Giresun İdare Mahkemesi", "vergi": "Ordu Vergi Mahkemesi"},
    "29": {"bim": "Erzurum BİM", "idare": "Erzincan İdare Mahkemesi", "vergi": "Erzurum Vergi Mahkemesi"},
    "30": {"bim": "Erzurum BİM", "idare": "Van İdare Mahkemesi", "vergi": "Van Vergi Mahkemesi"},
    "31": {"bim": "Adana BİM", "idare": "Hatay İdare Mahkemesi", "vergi": "Hatay Vergi Mahkemesi"},
    "32": {"bim": "Antalya BİM", "idare": "Isparta İdare Mahkemesi", "vergi": "Antalya Vergi Mahkemesi"},
    "33": {"bim": "Adana BİM", "idare": "Mersin İdare Mahkemesi", "vergi": "Mersin Vergi Mahkemesi"},
    "34": {"bim": "İstanbul BİM", "idare": "İstanbul İdare Mahkemeleri (1-18)", "vergi": "İstanbul Vergi Mahkemeleri (1-15)"},
    "35": {"bim": "İzmir BİM", "idare": "İzmir İdare Mahkemeleri (1-7)", "vergi": "İzmir Vergi Mahkemeleri (1-5)"},
    "36": {"bim": "Erzurum BİM", "idare": "Kars İdare Mahkemesi", "vergi": "Erzurum Vergi Mahkemesi"},
    "37": {"bim": "Ankara BİM", "idare": "Kastamonu İdare Mahkemesi", "vergi": "Zonguldak Vergi Mahkemesi"},
    "38": {"bim": "Kayseri BİM", "idare": "Kayseri İdare Mahkemesi", "vergi": "Kayseri Vergi Mahkemesi"},
    "39": {"bim": "İstanbul BİM", "idare": "Kırklareli İdare Mahkemesi", "vergi": "Edirne Vergi Mahkemesi"},
    "40": {"bim": "Kayseri BİM", "idare": "Yozgat İdare Mahkemesi", "vergi": "Kayseri Vergi Mahkemesi"},
    "41": {"bim": "İstanbul BİM", "idare": "Kocaeli İdare Mahkemesi", "vergi": "Kocaeli Vergi Mahkemesi"},
    "42": {"bim": "Konya BİM", "idare": "Konya İdare Mahkemesi", "vergi": "Konya Vergi Mahkemesi"},
    "43": {"bim": "Bursa BİM", "idare": "Kütahya İdare Mahkemesi", "vergi": "Eskişehir Vergi Mahkemesi"},
    "44": {"bim": "Gaziantep BİM", "idare": "Malatya İdare Mahkemesi", "vergi": "Malatya Vergi Mahkemesi"},
    "45": {"bim": "İzmir BİM", "idare": "Manisa İdare Mahkemesi", "vergi": "Manisa Vergi Mahkemesi"},
    "46": {"bim": "Gaziantep BİM", "idare": "Kahramanmaraş İdare Mahkemesi", "vergi": "Kahramanmaraş Vergi Mahkemesi"},
    "47": {"bim": "Diyarbakır BİM", "idare": "Mardin İdare Mahkemesi", "vergi": "Mardin Vergi Mahkemesi"},
    "48": {"bim": "İzmir BİM", "idare": "Muğla İdare Mahkemesi", "vergi": "Muğla Vergi Mahkemesi"},
    "49": {"bim": "Diyarbakır BİM", "idare": "Van / Bingöl İdare Mahkemesi", "vergi": "Van Vergi Mahkemesi"},
    "50": {"bim": "Kayseri BİM", "idare": "Kayseri İdare Mahkemesi", "vergi": "Kayseri Vergi Mahkemesi"},
    "51": {"bim": "Konya BİM", "idare": "Aksaray İdare Mahkemesi", "vergi": "Konya Vergi Mahkemesi"},
    "52": {"bim": "Samsun BİM", "idare": "Ordu İdare Mahkemesi", "vergi": "Ordu Vergi Mahkemesi"},
    "53": {"bim": "Samsun BİM", "idare": "Rize İdare Mahkemesi", "vergi": "Trabzon Vergi Mahkemesi"},
    "54": {"bim": "Bursa BİM", "idare": "Sakarya İdare Mahkemesi", "vergi": "Sakarya Vergi Mahkemesi"},
    "55": {"bim": "Samsun BİM", "idare": "Samsun İdare Mahkemesi", "vergi": "Samsun Vergi Mahkemesi"},
    "56": {"bim": "Diyarbakır BİM", "idare": "Siirt İdare Mahkemesi", "vergi": "Batman Vergi Mahkemesi"},
    "57": {"bim": "Samsun BİM", "idare": "Samsun İdare Mahkemesi", "vergi": "Samsun Vergi Mahkemesi"},
    "58": {"bim": "Kayseri BİM", "idare": "Sivas İdare Mahkemesi", "vergi": "Sivas Vergi Mahkemesi"},
    "59": {"bim": "İstanbul BİM", "idare": "Tekirdağ İdare Mahkemesi", "vergi": "Tekirdağ Vergi Mahkemesi"},
    "60": {"bim": "Samsun BİM", "idare": "Tokat İdare Mahkemesi", "vergi": "Samsun Vergi Mahkemesi"},
    "61": {"bim": "Samsun BİM", "idare": "Trabzon İdare Mahkemesi", "vergi": "Trabzon Vergi Mahkemesi"},
    "62": {"bim": "Erzurum BİM", "idare": "Erzincan İdare Mahkemesi", "vergi": "Erzurum Vergi Mahkemesi"},
    "63": {"bim": "Gaziantep BİM", "idare": "Şanlıurfa İdare Mahkemesi", "vergi": "Şanlıurfa Vergi Mahkemesi"},
    "64": {"bim": "İzmir BİM", "idare": "Uşak İdare Mahkemesi", "vergi": "Manisa Vergi Mahkemesi"},
    "65": {"bim": "Erzurum BİM", "idare": "Van İdare Mahkemesi", "vergi": "Van Vergi Mahkemesi"},
    "66": {"bim": "Kayseri BİM", "idare": "Yozgat İdare Mahkemesi", "vergi": "Kayseri Vergi Mahkemesi"},
    "67": {"bim": "Ankara BİM", "idare": "Zonguldak İdare Mahkemesi", "vergi": "Zonguldak Vergi Mahkemesi"},
    "68": {"bim": "Konya BİM", "idare": "Aksaray İdare Mahkemesi", "vergi": "Konya Vergi Mahkemesi"},
    "69": {"bim": "Erzurum BİM", "idare": "Erzurum İdare Mahkemesi", "vergi": "Erzurum Vergi Mahkemesi"},
    "70": {"bim": "Konya BİM", "idare": "Konya İdare Mahkemesi", "vergi": "Konya Vergi Mahkemesi"},
    "71": {"bim": "Ankara BİM", "idare": "Kırıkkale İdare Mahkemesi", "vergi": "Kırıkkale Vergi Mahkemesi"},
    "72": {"bim": "Diyarbakır BİM", "idare": "Batman İdare Mahkemesi", "vergi": "Batman Vergi Mahkemesi"},
    "73": {"bim": "Diyarbakır BİM", "idare": "Mardin İdare Mahkemesi", "vergi": "Mardin Vergi Mahkemesi"},
    "74": {"bim": "Ankara BİM", "idare": "Zonguldak İdare Mahkemesi", "vergi": "Zonguldak Vergi Mahkemesi"},
    "75": {"bim": "Erzurum BİM", "idare": "Kars İdare Mahkemesi", "vergi": "Erzurum Vergi Mahkemesi"},
    "76": {"bim": "Erzurum BİM", "idare": "Ağrı İdare Mahkemesi", "vergi": "Erzurum Vergi Mahkemesi"},
    "77": {"bim": "Bursa BİM", "idare": "Bursa İdare Mahkemesi", "vergi": "Bursa Vergi Mahkemesi"},
    "78": {"bim": "Ankara BİM", "idare": "Kastamonu İdare Mahkemesi", "vergi": "Zonguldak Vergi Mahkemesi"},
    "79": {"bim": "Gaziantep BİM", "idare": "Gaziantep İdare Mahkemesi", "vergi": "Gaziantep Vergi Mahkemesi"},
    "80": {"bim": "Adana BİM", "idare": "Osmaniye İdare Mahkemesi", "vergi": "Adana Vergi Mahkemesi"},
    "81": {"bim": "Ankara BİM", "idare": "Bolu İdare Mahkemesi", "vergi": "Zonguldak Vergi Mahkemesi"}
}

BAM_COLORS = {
    "Adana BAM": "#e11d48",
    "Ankara BAM": "#2563eb",
    "Antalya BAM": "#0891b2",
    "Bursa BAM": "#16a34a",
    "Denizli BAM": "#0d9488",
    "Diyarbakır BAM": "#d97706",
    "Erzurum BAM": "#4f46e5",
    "Gaziantep BAM": "#ea580c",
    "İstanbul BAM": "#9333ea",
    "İzmir BAM": "#0284c7",
    "Kayseri BAM": "#b45309",
    "Konya BAM": "#65a30d",
    "Sakarya BAM": "#059669",
    "Samsun BAM": "#475569",
    "Tekirdağ BAM": "#c026d3",
    "Trabzon BAM": "#0d9488",
    "Van BAM": "#7c3aed"
}

BIM_COLORS = {
    "Adana BİM": "#f43f5e",
    "Ankara BİM": "#3b82f6",
    "Antalya BİM": "#06b6d4",
    "Bursa BİM": "#22c55e",
    "Diyarbakır BİM": "#f59e0b",
    "Erzurum BİM": "#6366f1",
    "Gaziantep BİM": "#f97316",
    "İstanbul BİM": "#a855f7",
    "İzmir BİM": "#0ea5e9",
    "Kayseri BİM": "#d97706",
    "Konya BİM": "#84cc16",
    "Samsun BİM": "#64748b"
}

CUSTOM_ALIASES = {
    ('06', 'sincan'): 'Ankara Batı',
    ('55', '19mayıs'): 'Ondokuz Mayıs',
    ('71', 'bahşili'): 'Bahşılı',
    ('06', 'kahramankazan'): 'Kahramankazan',
    ('46', 'dulkadiroğlu'): 'Kahramanmaraş',
    ('46', 'onikişubat'): 'Kahramanmaraş',
    ('27', 'şahinbey'): 'Gaziantep',
    ('27', 'şehitkamil'): 'Gaziantep',
    ('01', 'seyhan'): 'Adana',
    ('01', 'yüreğir'): 'Adana',
    ('01', 'çukurova'): 'Adana',
    ('01', 'sarıçam'): 'Adana',
    ('07', 'muratpaşa'): 'Antalya',
    ('07', 'kepez'): 'Antalya',
    ('07', 'konyaaltı'): 'Antalya',
    ('07', 'aksu'): 'Antalya',
    ('07', 'döşemealtı'): 'Antalya',
    ('16', 'osmangazi'): 'Bursa',
    ('16', 'yıldırım'): 'Bursa',
    ('16', 'nilüfer'): 'Bursa',
    ('21', 'bağlar'): 'Diyarbakır',
    ('21', 'kayapınar'): 'Diyarbakır',
    ('21', 'sur'): 'Diyarbakır',
    ('21', 'yenişehir'): 'Diyarbakır',
    ('25', 'palandöken'): 'Erzurum',
    ('25', 'yakutiye'): 'Erzurum',
    ('25', 'aziziye'): 'Erzurum',
    ('26', 'odunpazarı'): 'Eskişehir',
    ('26', 'tepebaşı'): 'Eskişehir',
    ('31', 'antakya'): 'Hatay',
    ('31', 'defne'): 'Hatay',
    ('33', 'akdeniz'): 'Mersin',
    ('33', 'toroslar'): 'Mersin',
    ('33', 'yenişehir'): 'Mersin',
    ('33', 'mezitli'): 'Mersin',
    ('38', 'melikgazi'): 'Kayseri',
    ('38', 'kocasinan'): 'Kayseri',
    ('38', 'talas'): 'Kayseri',
    ('41', 'izmit'): 'Kocaeli',
    ('42', 'selçuklu'): 'Konya',
    ('42', 'meram'): 'Konya',
    ('42', 'karatay'): 'Konya',
    ('44', 'battalgazi'): 'Malatya',
    ('44', 'yeşilyurt'): 'Malatya',
    ('45', 'yunusemre'): 'Manisa',
    ('45', 'şehzadeler'): 'Manisa',
    ('47', 'artuklu'): 'Mardin',
    ('48', 'menteşe'): 'Muğla',
    ('52', 'altınordu'): 'Ordu',
    ('54', 'adapazarı'): 'Sakarya',
    ('54', 'serdivan'): 'Sakarya',
    ('54', 'erenler'): 'Sakarya',
    ('54', 'arifiye'): 'Sakarya',
    ('55', 'ilkadım'): 'Samsun',
    ('55', 'atakum'): 'Samsun',
    ('55', 'canik'): 'Samsun',
    ('55', 'tekkeköy'): 'Samsun',
    ('63', 'eyyübiye'): 'Şanlıurfa',
    ('63', 'haliliye'): 'Şanlıurfa',
    ('63', 'karaköprü'): 'Şanlıurfa',
    ('59', 'süleymanpaşa'): 'Tekirdağ',
    ('61', 'ortahisar'): 'Trabzon',
    ('65', 'ipekyolu'): 'Van',
    ('65', 'tuşba'): 'Van',
    ('65', 'edremit'): 'Van'
}

def tr_norm(s):
    if not s:
        return ''
    s = s.replace('İ', 'i').replace('I', 'ı').replace('Â', 'a').replace('â', 'a').replace('Î', 'i').replace('î', 'i').replace('Û', 'u').replace('û', 'u')
    return s.lower().strip()

def main():
    with open('src/data/adli-teskilat.json', 'r', encoding='utf-8') as f:
        adli_raw = json.load(f)

    tree = ET.parse('artifacts/tr-adm2.svg')
    root = tree.getroot()
    features = root.find('{http://www.w3.org/2000/svg}g[@id="features"]')
    iller_g = root.find('{http://www.w3.org/2000/svg}g[@id="iller"]')

    bounds_by_slug = {}
    slug_by_plate = {}
    for g in iller_g:
        gid = g.attrib.get('id', '')
        iso2 = g.attrib.get('iso2', '') # e.g. TR-01
        plaka = iso2.replace('TR-', '')
        slug_by_plate[plaka] = gid
        path = g.find('{http://www.w3.org/2000/svg}path')
        if path is not None and 'd' in path.attrib:
            nums = re.findall(r'[-+]?\d*\.?\d+', path.attrib['d'])
            xs = [float(nums[i]) for i in range(0, len(nums), 2)]
            ys = [float(nums[i]) for i in range(1, len(nums), 2)]
            bounds_by_slug[gid] = [round(min(xs), 1), round(min(ys), 1), round(max(xs), 1), round(max(ys), 1)]

    districts_by_plate = {}
    for f_elem in features:
        gid = f_elem.attrib.get('id', '')
        title = f_elem.attrib.get('title', '')
        if '-' in gid:
            plaka, dslug = gid.split('-', 1)
            if plaka not in districts_by_plate:
                districts_by_plate[plaka] = []
            
            path = f_elem.find('{http://www.w3.org/2000/svg}path')
            b = None
            if path is not None and 'd' in path.attrib:
                nums = re.findall(r'[-+]?\d*\.?\d+', path.attrib['d'])
                if nums:
                    xs = [float(nums[i]) for i in range(0, len(nums), 2)]
                    ys = [float(nums[i]) for i in range(1, len(nums), 2)]
                    b = [round(min(xs), 1), round(min(ys), 1), round(max(xs), 1), round(max(ys), 1)]
            districts_by_plate[plaka].append({
                'id': gid,
                'slug': dslug,
                'ad': title,
                'bounds': b
            })

    il_to_plaka = {}
    for p, name in PLAKA_IL.items():
        il_to_plaka[tr_norm(name)] = p
    il_to_plaka['afyon'] = '03'
    il_to_plaka['k.maras'] = '46'
    il_to_plaka['kahramanmaras'] = '46'
    il_to_plaka['icel'] = '33'

    adli_faal_by_plate = {p: [] for p in PLAKA_IL.keys()}
    all_adli_by_plate = {p: [] for p in PLAKA_IL.keys()}

    for row in adli_raw:
        il_str = row['il'].strip()
        pl = il_to_plaka.get(tr_norm(il_str))
        if not pl:
            for k, val in il_to_plaka.items():
                if k in tr_norm(il_str) or tr_norm(il_str) in k:
                    pl = val
                    break
        if pl:
            all_adli_by_plate[pl].append(row)
            if row.get('durum') == 'Faal':
                adli_faal_by_plate[pl].append(row)

    iller_data = {}
    for plaka, il_adi in sorted(PLAKA_IL.items()):
        slug = slug_by_plate.get(plaka, tr_norm(il_adi))
        bounds = bounds_by_slug.get(slug, [0, 0, 1436, 629])
        faal_list = adli_faal_by_plate.get(plaka, [])
        all_candidates = all_adli_by_plate.get(plaka, [])
        
        # Determine BAM
        bam = None
        if plaka in ['74', '67']: # Bartın ve Zonguldak 01/05/2025 sonrası Ankara BAM
            bam = 'Ankara BAM'
        else:
            bam_counts = {}
            for row in faal_list:
                b = row.get('bagli_bam')
                if b:
                    if 'sonrası Ankara' in b:
                        b_clean = 'Ankara'
                    else:
                        b_clean = b.split('(')[0].strip()
                    bam_counts[b_clean] = bam_counts.get(b_clean, 0) + 1
            if bam_counts:
                bam = max(bam_counts.items(), key=lambda x: x[1])[0]
            else:
                bam = 'Ankara'
            if not bam.endswith('BAM'):
                bam = bam + ' BAM'

        acmler = sorted(list(set([row['mahal'] for row in faal_list if row.get('teskilat') == 'ACM'])))
        adliyeler = sorted(list(set([row['mahal'] for row in faal_list])))
        cbs_list = sorted(list(set([row['mahal'] for row in faal_list if str(row.get('cbs_var')) == '1'])))

        districts = districts_by_plate.get(plaka, [])
        ilceler_res = []
        for d in districts:
            d_name_norm = tr_norm(d['ad'])
            found = None

            # 1. Check custom alias
            alias = CUSTOM_ALIASES.get((plaka, d_name_norm))
            if alias:
                for c in all_candidates:
                    if tr_norm(c['mahal']) == tr_norm(alias):
                        found = c
                        break

            # 2. Check exact mahal match
            if not found:
                for c in all_candidates:
                    if tr_norm(c['mahal']) == d_name_norm:
                        found = c
                        break

            # 3. Check substring match
            if not found:
                for c in all_candidates:
                    c_norm = tr_norm(c['mahal'])
                    if c_norm in d_name_norm or d_name_norm in c_norm:
                        found = c
                        break

            if found:
                is_faal = found.get('durum') == 'Faal'
                teskilat = found.get('teskilat') if is_faal else None

                if teskilat == 'ACM':
                    bagli_acm = found['mahal']
                    bagli_adliye = found['mahal']
                elif is_faal and teskilat == 'Mülhakat':
                    bagli_acm = found.get('bagli_acm') or il_adi
                    bagli_adliye = found['mahal']
                else:
                    bagli_acm = found.get('bagli_acm') or il_adi
                    bagli_adliye = found.get('bagli_adliye') or bagli_acm
            else:
                is_faal = False
                teskilat = None
                bagli_acm = il_adi
                bagli_adliye = il_adi

            ilceler_res.append({
                'id': d['id'],
                'slug': d['slug'],
                'ad': d['ad'],
                'bounds': d['bounds'],
                'has_adliye': is_faal,
                'teskilat': teskilat,
                'bagli_acm': bagli_acm,
                'bagli_adliye': bagli_adliye,
                'cbs_var': str(found.get('cbs_var')) == '1' if found else False
            })

        idari = IDARI_REHBER.get(plaka, {
            "bim": "Ankara BİM",
            "idare": f"{il_adi} İdare Mahkemesi",
            "vergi": f"{il_adi} Vergi Mahkemesi"
        })

        iller_data[plaka] = {
            'plaka': plaka,
            'ad': il_adi,
            'slug': slug,
            'bounds': bounds,
            'bam': bam,
            'bamColor': BAM_COLORS.get(bam, '#3b82f6'),
            'bim': idari['bim'],
            'bimColor': BIM_COLORS.get(idari['bim'], '#6366f1'),
            'acm_sayisi': len(acmler),
            'acmler': acmler,
            'adliye_sayisi': len(adliyeler),
            'cbs_sayisi': len(cbs_list),
            'cbsler': cbs_list,
            'adliyeler': [
                {
                    'mahal': r['mahal'],
                    'teskilat': r.get('teskilat'),
                    'bagli_acm': r.get('bagli_acm'),
                    'cbs_var': str(r.get('cbs_var')) == '1'
                } for r in sorted(faal_list, key=lambda x: (x.get('teskilat') != 'ACM', x['mahal']))
            ],
            'idare_mahkemesi': idari['idare'],
            'vergi_mahkemesi': idari['vergi'],
            'ilceler': ilceler_res
        }

    bamlar = {}
    for pl, d in iller_data.items():
        b = d['bam']
        if b not in bamlar:
            bamlar[b] = {
                'ad': b,
                'renk': BAM_COLORS.get(b, '#3b82f6'),
                'iller': []
            }
        bamlar[b]['iller'].append({'plaka': pl, 'ad': d['ad']})

    bimler = {}
    for pl, d in iller_data.items():
        b = d['bim']
        if b not in bimler:
            bimler[b] = {
                'ad': b,
                'renk': BIM_COLORS.get(b, '#6366f1'),
                'iller': []
            }
        bimler[b]['iller'].append({'plaka': pl, 'ad': d['ad']})

    final_data = {
        'viewBox': '1 0 1436 629',
        'iller': iller_data,
        'bamlar': bamlar,
        'bimler': bimler
    }

    with open('src/data/yargi-haritasi.json', 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)

    print(f'Successfully built src/data/yargi-haritasi.json with {len(iller_data)} provinces.')

if __name__ == '__main__':
    main()
