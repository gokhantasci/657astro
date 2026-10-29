"""Diyanet Vakit Hesaplama "Yılı Resmi Tatiller" listelerinden src/data/tatiller.json üretir.

Kaynak: https://vakithesaplama.diyanet.gov.tr (2429 sayılı Kanun'a göre hazırlanan yıllık listeler).
Aynı güne denk gelen iki tatil (ör. 19 Mayıs 2027: Kurban Bayramı 4. gün ve Atatürk'ü Anma, Gençlik ve Spor Bayramı)
Diyanet'teki gibi ayrı satır olarak yazılır; hesap tarafı (lib/tatil-veri.ts) bunları tek güne birleştirir.

Kullanım: python scripts/import-tatiller.py [klasör]
  klasör verilirse r<icerik>.html dosyaları oradan okunur, verilmezse siteden indirilir.
"""
import html, json, re, sys, time
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
HEDEF = ROOT / 'src/data/tatiller.json'
# Diyanet menüsündeki "<yıl> Yılı Resmi Tatiller" bağlantıları.
SAYFALAR = {2024: 156, 2025: 157, 2026: 158, 2027: 159, 2028: 193, 2029: 194, 2030: 195,
            2031: 196, 2032: 197, 2033: 198, 2034: 199, 2035: 200}
URL = 'https://vakithesaplama.diyanet.gov.tr/icerik.php?icerik={}'
AYLAR = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK']
SURE = re.compile(r'^(?:(\d+)\.?|1/2|1,5) GÜN$')
TARIH = re.compile(r'^(\d{1,2}) (' + '|'.join(AYLAR) + r')$')
GUNLER = {'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ', 'PAZAR'}


def getir(icerik, klasor):
    if klasor:
        return (Path(klasor) / f'r{icerik}.html').read_text(encoding='utf-8', errors='replace')
    for deneme in range(5):
        try:
            with urlopen(Request(URL.format(icerik), headers={'User-Agent': 'Mozilla/5.0 (657.com.tr tatil aktarımı)'}), timeout=90) as r:
                return r.read().decode('utf-8', errors='replace')
        except Exception:
            time.sleep(3 * (deneme + 1))
    raise SystemExit(f'İndirilemedi: {URL.format(icerik)}')


def parcalar(sayfa):
    t = re.sub(r'<(script|style).*?</\1>', '', sayfa, flags=re.S)
    t = html.unescape(re.sub(r'<[^>]+>', '\x00', t))
    return [re.sub(r'\s+', ' ', p).strip() for p in t.split('\x00') if p.strip()]


def ad(ham, sure):
    """Diyanet'in büyük harfli adlarını sitedeki adlara çevirir."""
    h = ham.replace('*', '').strip()
    if h.startswith('YILBAŞI'): return 'Yılbaşı Tatili'
    if 'ULUSAL EGEMENLİK' in h: return 'Ulusal Egemenlik ve Çocuk Bayramı'
    if 'EMEK VE DAYANIŞMA' in h: return 'Emek ve Dayanışma Günü'
    if 'ATATÜRK' in h: return "Atatürk'ü Anma, Gençlik ve Spor Bayramı"
    if 'DEMOKRASİ' in h: return 'Demokrasi ve Milli Birlik Günü'
    if 'ZAFER' in h: return 'Zafer Bayramı'
    if 'CUMHURİYET' in h: return 'Cumhuriyet Bayramı'
    for bayram in ('RAMAZAN', 'KURBAN'):
        if h.startswith(bayram):
            b = 'Ramazan Bayramı' if bayram == 'RAMAZAN' else 'Kurban Bayramı'
            if 'AREFE' in h: return f'{b} Arefesi'
            m = re.match(r'(\d+)', sure)
            return f'{b} {m.group(1)}. Gün'
    raise ValueError(f'Bilinmeyen tatil adı: {ham}')


def yil_listesi(yil, sayfa):
    p = parcalar(sayfa)
    bas = next(i for i, x in enumerate(p) if x.startswith(f'{yil} YILI RESM'))
    son = next(i for i in range(bas, len(p)) if p[i].startswith('NOT'))
    p = p[bas + 1:son]
    # Başlık satırı: TATİL GÜNÜNÜN İSMİ | SÜRE | AY | GÜN
    p = p[p.index('GÜN') + 1:] if 'GÜN' in p[:6] else p
    out, i, isim = [], 0, []
    while i < len(p):
        x = p[i]
        if not SURE.match(x):
            isim.append(x); i += 1; continue
        sure = x; i += 1
        tarihler = []
        while i < len(p) and TARIH.match(p[i]):
            g, a = TARIH.match(p[i]).groups(); tarihler.append(f'{yil}-{AYLAR.index(a) + 1:02d}-{int(g):02d}'); i += 1
        while i < len(p) and p[i] in GUNLER: i += 1
        ham = ''.join(isim) if len(isim) > 1 and len(isim[-1]) <= 2 else ' '.join(isim)
        isim = []
        if not tarihler: raise ValueError(f'{yil}: {ham} için tarih yok')
        adi = ad(ham, sure)
        if sure == '1,5 GÜN':
            # Cumhuriyet Bayramı: 28 Ekim öğleden sonra ve 29 Ekim.
            out.append({'tarih': tarihler[0], 'yarim': True, 'ad': f'{adi} (Yarım Gün)'})
            out.append({'tarih': tarihler[1], 'yarim': False, 'ad': adi})
        else:
            for t in tarihler: out.append({'tarih': t, 'yarim': sure == '1/2 GÜN', 'ad': adi})
    return out


def main():
    klasor = sys.argv[1] if len(sys.argv) > 1 else None
    tatiller = []
    for yil, icerik in SAYFALAR.items():
        liste = yil_listesi(yil, getir(icerik, klasor))
        print(yil, len(liste), 'kayıt')
        tatiller += liste
    tatiller.sort(key=lambda t: (t['tarih'], t['yarim'] is False, t['ad']))
    veri = {'kaynak': 'Diyanet İşleri Başkanlığı Vakit Hesaplama, yıllık resmî tatil listeleri (2429 sayılı Kanun): '
                      'https://vakithesaplama.diyanet.gov.tr/ ; scripts/import-tatiller.py ile aktarıldı',
            'tatiller': tatiller}
    HEDEF.write_text(json.dumps(veri, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(len(tatiller), 'tatil yazıldı:', HEDEF)


if __name__ == '__main__':
    main()
