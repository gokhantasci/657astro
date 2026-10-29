"""Memurlar.net maaş robotlarını sağlama amacıyla sorgulayan istemci (sunucu tarafında hesaplanan GET formu).

Sonuç tablosundaki satırlar [kalem, gösterge/oran, tutar] olarak okunur. Önbellek: artifacts/kaynak-onbellek/memurlar/.
"""
import hashlib, html, json, re, time, urllib.parse, urllib.request
from pathlib import Path

KOK = Path(__file__).resolve().parents[2]
ONBELLEK = KOK / 'artifacts' / 'kaynak-onbellek' / 'memurlar'
ONBELLEK.mkdir(parents=True, exist_ok=True)
H = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 (657.com.tr saglama)'}
TEMEL = {'action': 'salary', 'advanced': 'true', 'Salary_Condition': '', 'Salary_Degree': '1', 'Salary_Grade': '1',
         'Salary_Day': '29', 'Salary_Month': '10', 'Salary_Year': '2026', 'Salary_TotalYears': '0', 'Salary_MaritalStatus': '0',
         'Salary_PartnerStatus': 'working', 'Salary_Toddlers': '0', 'Salary_Children': '0', 'Salary_Toddlers_Disabled': '0',
         'Salary_Children_Disabled': '0', 'Salary_UnionMember': '0', 'Salary_Location_City': '6', 'Salary_Location_County': '128',
         'Salary_Bes': 'false', 'Salary_BesIndicator': '3', 'Salary_LanguageA1': '0', 'Salary_LanguageA2': '0', 'Salary_LanguageB': '0',
         'Salary_LanguageC': '0', 'Salary_DisabledLevel': '0', 'Salary_Ilksan': 'false', 'Salary_Polsan': 'false', 'Salary_Bail': 'false',
         'Salary_DaysWithReport': '', 'Salary_R_Degree': '', 'Salary_R_Grade': '', 'Salary_P_Date': '2026-01-15', 'Salary_P_Degree': '',
         'Salary_P_Grade': '', 'Salary_Tax': '1', 'Salary_Sdt': '', 'Salary_Arazi': '', 'Salary_MaktuGun': '', 'Salary_MaktuNufus': '',
         'Salary_Date': '2026-10-15'}
_son = [0.0]


def getir(yol, params, bekleme=1.2):
    url = f'https://www.memurlar.net{yol}?{urllib.parse.urlencode(params)}'
    dosya = ONBELLEK / (hashlib.sha1(url.encode()).hexdigest() + '.html')
    if dosya.exists(): return dosya.read_text(encoding='utf-8')
    bekle = bekleme - (time.time() - _son[0])
    if bekle > 0: time.sleep(bekle)
    for deneme in range(5):
        try:
            ham = urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=90).read()
            # Sayfa beyanına rağmen bazen Windows-1254 gelir: önce katı UTF-8, olmazsa cp1254.
            try: t = ham.decode('utf-8')
            except UnicodeDecodeError: t = ham.decode('cp1254', 'replace')
            _son[0] = time.time()
            dosya.write_text(t, encoding='utf-8')
            return t
        except Exception as e:
            if getattr(e, 'code', None) == 404: return ''
            time.sleep(3 * (deneme + 1))
    raise RuntimeError(url)


def satirlar(t):
    out = []
    for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', t, re.S):
        hucre = [re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', c))).strip() for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', tr, re.S)]
        if hucre: out.append(hucre)
    return out


def secenekler(t, ad):
    m = re.search(r'<select[^>]*(?:name|id)="%s"[^>]*>(.*?)</select>' % re.escape(ad), t, re.S)
    return [(v, re.sub(r'\s+', ' ', html.unescape(x)).strip()) for v, x in re.findall(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', m.group(1), re.S)] if m else []


def maas(pozisyon, kosul='', derece='1', kademe='1', **ek):
    return getir(f'/maas/{pozisyon}/', {**TEMEL, 'Salary_Condition': kosul, 'Salary_Degree': str(derece), 'Salary_Grade': str(kademe), **ek})


def sayi(s):
    s = s.replace('₺', '').replace(',', '').replace('%', '').replace('‰', '').strip()
    try: return float(s)
    except ValueError: return None
