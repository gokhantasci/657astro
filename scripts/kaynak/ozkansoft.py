"""OzkanSoft programlarını (MAHEP, EMIHEP, 4B/4C/4D MAHEP, EDUHEP ...) sağlama amacıyla sorgulayan istemci.

Programlar hesabı sunucuda yapar; form normal bir kullanıcı gibi gönderilir ve sonuç sayfasındaki
devre dışı alanlar (txt*) ile seçim listeleri okunur. Yalnızca sağlama verisi toplamak içindir; istekler
arasında bekleme yapılır, aynı sonuç önbellekten okunur (artifacts/kaynak-onbellek/).
"""
import hashlib, html, json, re, time, urllib.parse, urllib.request, http.cookiejar
from pathlib import Path

KOK = Path(__file__).resolve().parents[2]
ONBELLEK = KOK / 'artifacts' / 'kaynak-onbellek' / 'ozkansoft'
ONBELLEK.mkdir(parents=True, exist_ok=True)
H = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 (657.com.tr saglama)'}


def sayi(s):
    s = s.strip().replace('.', '').replace(',', '.')
    try: return float(s)
    except ValueError: return None


class Program:
    def __init__(self, ad, bekleme=1.0):
        self.ad, self.url, self.bekleme = ad, f'https://www.ozkansoft.com/{ad}.php', bekleme
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        self.son = 0.0
        self.sayfa = None

    def _istek(self, veri=None):
        bekle = self.bekleme - (time.time() - self.son)
        if bekle > 0: time.sleep(bekle)
        for deneme in range(5):
            try:
                req = urllib.request.Request(self.url, data=veri, headers={**H, 'Referer': self.url,
                    **({'Content-Type': 'application/x-www-form-urlencoded'} if veri else {})})
                t = self.op.open(req, timeout=90).read().decode('utf-8', 'replace')
                self.son = time.time()
                return t
            except Exception:
                time.sleep(3 * (deneme + 1))
        raise RuntimeError(f'{self.url} yanıt vermedi')

    @staticmethod
    def alanlar(t):
        """Formdaki bütün alanların gönderilecek değerleri (seçili seçenek, işaretli kutu, gizli alan)."""
        f = {}
        for m in re.finditer(r'<select[^>]*name="([^"]+)"[^>]*>(.*?)</select>', t, re.S):
            n, govde = m.groups()
            ops = re.findall(r'<option([^>]*)value="([^"]*)"([^>]*)>', govde)
            sec = [v for a, v, b in ops if 'selected' in a + b]
            f[n] = sec[0] if sec else (ops[0][1] if ops else '')
        for m in re.finditer(r'<input[^>]*>', t):
            tag = m.group(0); n = re.search(r'name="([^"]+)"', tag)
            if not n or 'disabled' in tag: continue
            ty = (re.search(r'type="([^"]+)"', tag) or [None, 'text'])[1]
            v = (re.search(r'value="([^"]*)"', tag) or [None, ''])[1]
            if ty in ('checkbox', 'radio'):
                if 'checked' in tag: f[n.group(1)] = v or 'on'
            elif ty not in ('submit', 'button'):
                f[n.group(1)] = v
        return f

    @staticmethod
    def secenekler(t, ad):
        m = re.search(r'<select[^>]*name="%s"[^>]*>(.*?)</select>' % re.escape(ad), t, re.S)
        return [(v, re.sub(r'\s+', ' ', html.unescape(x).replace('\xa0', ' ')).strip())
                for v, x in re.findall(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', m.group(1), re.S)] if m else []

    @staticmethod
    def sonuclar(t):
        d = {}
        for i, v in re.findall(r'<input[^>]*id="(txt[A-Za-z0-9]+)"[^>]*value="([^"]*)"[^>]*disabled', t):
            d[i[3:]] = v
        for i, v in re.findall(r'<input[^>]*value="([^"]*)"[^>]*id="(txt[A-Za-z0-9]+)"[^>]*disabled', t):
            d.setdefault(v[3:], i)
        return d

    def ac(self):
        if self.sayfa is None: self.sayfa = self._istek()
        return self.sayfa

    def gonder(self, degisen, hesapla=True, temel=None):
        """temel sayfanın formunu (yoksa açılış sayfası) değişen alanlarla gönderir; sayfa HTML'i döner."""
        anahtar = hashlib.sha1(json.dumps([self.ad, sorted(degisen.items()), hesapla, temel is not None and hashlib.sha1(temel.encode()).hexdigest()], ensure_ascii=False).encode()).hexdigest()
        dosya = ONBELLEK / f'{anahtar}.html'
        if dosya.exists(): return dosya.read_text(encoding='utf-8')
        f = self.alanlar(temel or self.ac())
        f.update({k: str(v) for k, v in degisen.items()})
        if hesapla: f['hesapla'] = ''
        t = self._istek(urllib.parse.urlencode(f).encode())
        self.sayfa = t  # sonraki istek güncel belirteçle gitsin
        dosya.write_text(t, encoding='utf-8')
        return t
