"""Zamanlı canlı sınav ve anlık sıralama (leaderboard) servisi (GYS ve On Parmak)."""
import json
import os
import re
import time
import uuid
from datetime import datetime, timezone, timedelta
from flask import request, jsonify, abort

RUMUZ_RE = re.compile(r'^[\wçğıöşüÇĞİÖŞÜ .-]{2,32}$')
SINAV_ID_RE = re.compile(r'^[a-z0-9][a-z0-9_-]{2,48}$')


def _admin_key():
    return os.getenv('LIVE_EXAM_ADMIN_KEY') or os.getenv('ONERI_ADMIN_PASS') or '657-admin-2026'


def _iso_to_ts(val: str) -> float:
    s = val.strip().replace('Z', '+00:00')
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone(timedelta(hours=3)))
    return dt.timestamp()


def _seed_defaults(conn):
    count = conn.execute('SELECT COUNT(*) FROM canli_sinavlar').fetchone()[0]
    if count > 0:
        return
    now = datetime.now(timezone(timedelta(hours=3)))
    start = (now - timedelta(hours=1)).isoformat(timespec='minutes')
    end = (now + timedelta(days=14)).isoformat(timespec='minutes')
    seeds = [
        (
            'gys-haftalik-2026',
            'gys',
            'Adalet Bakanlığı GYS Haftalık Canlı Deneme (20 Soru)',
            'Yazı İşleri Müdürlüğü, İdari İşler, Şef ve CTE ortak mevzuat karma canlı denemesi. Belirlenen zaman aralığında katılın ve canlı sıralamada yerinizi görün.',
            start,
            end,
            json.dumps({'dugumId': 'adalet-bakanligi', 'soruSayisi': 20, 'sureDk': 25}),
            time.time(),
        ),
        (
            'klavye-haftalik-2026',
            'klavye',
            'Zabıt Kâtipliği 3 Dakika Canlı Klavye Sınavı (2026 PGM)',
            '3 dakika / 90 net kelime resmî barajlı canlı uygulama sınavı. Sonucunuzu gönderip Türkiye geneli sıralamada yerinizi alın.',
            start,
            end,
            json.dumps({'grupId': 'pgm-2026', 'sureSn': 180, 'baraj': 90}),
            time.time(),
        ),
    ]
    conn.executemany(
        'INSERT OR IGNORE INTO canli_sinavlar VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        seeds,
    )


def register_live_exams(app, db, limited):
    with db() as conn:
        conn.executescript(
            """CREATE TABLE IF NOT EXISTS canli_sinavlar(
                id TEXT PRIMARY KEY,
                tur TEXT NOT NULL,
                baslik TEXT NOT NULL,
                aciklama TEXT NOT NULL,
                baslangic TEXT NOT NULL,
                bitis TEXT NOT NULL,
                kriterler_json TEXT NOT NULL,
                created REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS canli_sinav_sonuclar(
                id TEXT PRIMARY KEY,
                sinav_id TEXT NOT NULL,
                rumuz TEXT NOT NULL,
                skor REAL NOT NULL,
                dogru INTEGER NOT NULL DEFAULT 0,
                yanlis INTEGER NOT NULL DEFAULT 0,
                sure_sn INTEGER NOT NULL DEFAULT 0,
                detay TEXT NOT NULL DEFAULT '',
                created REAL NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_canli_sonuc_sinav ON canli_sinav_sonuclar(sinav_id, skor DESC, sure_sn ASC);"""
        )
        _seed_defaults(conn)

    def _serialize_exam(conn, row):
        now_ts = time.time()
        try:
            st = _iso_to_ts(row['baslangic'])
            en = _iso_to_ts(row['bitis'])
        except Exception:
            st, en = 0, 0
        durum = 'yaklasan' if now_ts < st else ('aktif' if now_ts <= en else 'bitti')
        board = conn.execute(
            """SELECT rumuz, skor, dogru, yanlis, sure_sn, detay, created
               FROM canli_sinav_sonuclar
               WHERE sinav_id = ?
               ORDER BY skor DESC, dogru DESC, sure_sn ASC, created ASC
               LIMIT 50""",
            (row['id'],),
        ).fetchall()
        katilimci = conn.execute(
            'SELECT COUNT(*) FROM canli_sinav_sonuclar WHERE sinav_id = ?',
            (row['id'],),
        ).fetchone()[0]
        return {
            'id': row['id'],
            'tur': row['tur'],
            'baslik': row['baslik'],
            'aciklama': row['aciklama'],
            'baslangic': row['baslangic'],
            'bitis': row['bitis'],
            'durum': durum,
            'kriterler': json.loads(row['kriterler_json'] or '{}'),
            'katilimci': katilimci,
            'liderlik': [
                {
                    'sira': i + 1,
                    'rumuz': b['rumuz'],
                    'skor': b['skor'],
                    'dogru': b['dogru'],
                    'yanlis': b['yanlis'],
                    'sureSn': b['sure_sn'],
                    'detay': b['detay'],
                }
                for i, b in enumerate(board)
            ],
        }

    @app.route('/api/canli-sinav', methods=['GET', 'OPTIONS'])
    def canli_sinav_listesi():
        if request.method == 'OPTIONS':
            return '', 204
        tur = request.args.get('tur', '').strip().lower()
        with db() as conn:
            if tur in ('gys', 'klavye'):
                rows = conn.execute(
                    'SELECT * FROM canli_sinavlar WHERE tur = ? ORDER BY created DESC LIMIT 12',
                    (tur,),
                ).fetchall()
            else:
                rows = conn.execute('SELECT * FROM canli_sinavlar ORDER BY created DESC LIMIT 20').fetchall()
            sinavlar = [_serialize_exam(conn, r) for r in rows]
        return jsonify(sinavlar=sinavlar, sunucuZamani=datetime.now(timezone(timedelta(hours=3))).isoformat(timespec='seconds'))

    @app.route('/api/canli-sinav/olustur', methods=['POST', 'OPTIONS'])
    def canli_sinav_olustur():
        if request.method != 'GET' and request.headers.get('Origin') not in app.config['ORIGINS']:
            abort(403)
        if request.method == 'OPTIONS':
            return '', 204
        if not request.is_json:
            abort(415)
        token = (request.headers.get('X-Admin-Key') or '').strip()
        if not token or token != _admin_key():
            return jsonify(error='Yönetici anahtarı geçersiz.'), 401
        d = request.get_json()
        if not isinstance(d, dict):
            abort(400)
        tur = str(d.get('tur', '')).strip().lower()
        baslik = str(d.get('baslik', '')).strip()
        aciklama = str(d.get('aciklama', '')).strip()[:400]
        baslangic = str(d.get('baslangic', '')).strip()
        bitis = str(d.get('bitis', '')).strip()
        kriterler = d.get('kriterler') if isinstance(d.get('kriterler'), dict) else {}
        if tur not in ('gys', 'klavye') or len(baslik) < 5 or len(baslik) > 140:
            return jsonify(error='Tür (gys/klavye) ve başlık (5–140 karakter) zorunludur.'), 400
        try:
            st = _iso_to_ts(baslangic)
            en = _iso_to_ts(bitis)
            if en <= st:
                return jsonify(error='Bitiş zamanı başlangıçtan sonra olmalıdır.'), 400
        except Exception:
            return jsonify(error='Geçerli ISO tarih/saat girin.'), 400
        sinav_id = f'{tur}-{uuid.uuid4().hex[:8]}'
        with db() as conn:
            conn.execute(
                'INSERT INTO canli_sinavlar VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                (sinav_id, tur, baslik, aciklama, baslangic, bitis, json.dumps(kriterler, ensure_ascii=False), time.time()),
            )
            row = conn.execute('SELECT * FROM canli_sinavlar WHERE id = ?', (sinav_id,)).fetchone()
            out = _serialize_exam(conn, row)
        return jsonify(sinav=out), 201

    @app.route('/api/canli-sinav/sonuc', methods=['POST', 'OPTIONS'])
    def canli_sinav_sonuc():
        if request.method != 'GET' and request.headers.get('Origin') not in app.config['ORIGINS']:
            abort(403)
        if request.method == 'OPTIONS':
            return '', 204
        if not request.is_json:
            abort(415)
        d = request.get_json()
        if not isinstance(d, dict):
            abort(400)
        sinav_id = str(d.get('sinavId', '')).strip()
        rumuz = str(d.get('rumuz', '')).strip()
        if not SINAV_ID_RE.match(sinav_id) or not RUMUZ_RE.match(rumuz):
            return jsonify(error='Geçerli sınav kimliği ve rumuz (2–32 karakter) girin.'), 400
        try:
            skor = round(float(d.get('skor', 0)), 2)
            dogru = max(0, int(d.get('dogru', 0)))
            yanlis = max(0, int(d.get('yanlis', 0)))
            sure_sn = max(0, int(d.get('sureSn', 0)))
        except (TypeError, ValueError):
            return jsonify(error='Sayısal skor değerleri geçersiz.'), 400
        detay = str(d.get('detay', '')).strip()[:120]
        limited('canli-sinav-sonuc', 30, 60)
        with db() as conn:
            row = conn.execute('SELECT * FROM canli_sinavlar WHERE id = ?', (sinav_id,)).fetchone()
            if not row:
                return jsonify(error='Sınav bulunamadı.'), 404
            now_ts = time.time()
            if not (_iso_to_ts(row['baslangic']) <= now_ts <= _iso_to_ts(row['bitis'])):
                return jsonify(error='Bu sınav şu anda aktif zaman aralığında değil.'), 403
            kayit_id = str(uuid.uuid4())
            conn.execute(
                'INSERT INTO canli_sinav_sonuclar VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                (kayit_id, sinav_id, rumuz, skor, dogru, yanlis, sure_sn, detay, now_ts),
            )
            out = _serialize_exam(conn, row)
        return jsonify(sinav=out), 201
