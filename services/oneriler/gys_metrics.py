"""GYS soru bazlı genel istatistik, topluluk soru önerisi/onay oylaması ve telif/hata bildirim servisi."""
import json
import re
import time
import uuid
from flask import request, jsonify, abort

SORU_ID_RE = re.compile(r'^[a-z0-9][a-z0-9_-]{2,64}$')
KANUN_RE = re.compile(r'^[a-z0-9-]{2,32}$')
BOLUM_RE = re.compile(r'^[a-z0-9-]{2,32}:[a-z0-9-]{2,48}$')
SEVIYELER = {'kolay', 'orta', 'zor', 'akademik', 'dip'}


def register_gys_metrics(app, db, limited):
    with db() as conn:
        conn.executescript(
            """CREATE TABLE IF NOT EXISTS gys_soru_stats(
                soru_id TEXT PRIMARY KEY,
                cozum INTEGER NOT NULL DEFAULT 0,
                dogru INTEGER NOT NULL DEFAULT 0,
                yanlis INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS gys_soru_events(id TEXT PRIMARY KEY, created REAL NOT NULL);
            CREATE TABLE IF NOT EXISTS gys_community_questions(
                id TEXT PRIMARY KEY,
                kanun TEXT NOT NULL,
                bolum TEXT NOT NULL,
                seviye TEXT NOT NULL,
                soru TEXT NOT NULL,
                dogru_json TEXT NOT NULL,
                yanlis_json TEXT NOT NULL,
                kaynak TEXT NOT NULL,
                aciklama TEXT NOT NULL,
                durum TEXT NOT NULL DEFAULT 'bekliyor',
                onay_oy INTEGER NOT NULL DEFAULT 0,
                red_oy INTEGER NOT NULL DEFAULT 0,
                created REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS gys_vote_events(id TEXT PRIMARY KEY, created REAL NOT NULL);
            CREATE TABLE IF NOT EXISTS gys_reports(
                id TEXT PRIMARY KEY,
                soru_id TEXT NOT NULL,
                tur TEXT NOT NULL,
                aciklama TEXT NOT NULL,
                created REAL NOT NULL
            );"""
        )

    @app.route('/api/gys/soru', methods=['GET', 'POST', 'OPTIONS'])
    def gys_soru_stats():
        if request.method != 'GET' and request.headers.get('Origin') not in app.config['ORIGINS']:
            abort(403)
        if request.method == 'OPTIONS':
            return '', 204
        if request.method == 'POST':
            if not request.is_json:
                abort(415)
            data = request.get_json()
            if not isinstance(data, dict) or not set(data).issubset({'istekId', 'soruId', 'dogru'}):
                abort(400)
            if 'istekId' not in data or 'soruId' not in data or 'dogru' not in data:
                abort(400)
            try:
                event_id = str(uuid.UUID(data['istekId']))
            except (ValueError, TypeError, AttributeError):
                abort(400)
            soru_id = data.get('soruId', '')
            if not isinstance(soru_id, str) or not SORU_ID_RE.match(soru_id):
                abort(400)
            dogru = bool(data.get('dogru'))
            limited('gys-soru', 240, 60)
            with db() as conn:
                conn.execute('BEGIN IMMEDIATE')
                conn.execute('DELETE FROM gys_soru_events WHERE created < ?', (time.time() - 172800,))
                added = conn.execute('INSERT OR IGNORE INTO gys_soru_events VALUES (?, ?)', (event_id, time.time())).rowcount
                if added:
                    conn.execute(
                        """INSERT INTO gys_soru_stats VALUES (?, 1, ?, ?)
                           ON CONFLICT(soru_id) DO UPDATE SET
                             cozum = cozum + 1,
                             dogru = dogru + excluded.dogru,
                             yanlis = yanlis + excluded.yanlis""",
                        (soru_id, 1 if dogru else 0, 0 if dogru else 1),
                    )

        req_id = request.args.get('soruId', '')
        with db() as conn:
            if req_id and SORU_ID_RE.match(req_id):
                row = conn.execute('SELECT soru_id, cozum, dogru, yanlis FROM gys_soru_stats WHERE soru_id = ?', (req_id,)).fetchone()
                if not row:
                    return jsonify(soruId=req_id, cozum=0, dogru=0, yanlis=0, oran=None)
                oran = round(row['dogru'] * 100.0 / row['cozum'], 1) if row['cozum'] else None
                return jsonify(soruId=row['soru_id'], cozum=row['cozum'], dogru=row['dogru'], yanlis=row['yanlis'], oran=oran)
            rows = conn.execute('SELECT soru_id, cozum, dogru, yanlis FROM gys_soru_stats').fetchall()
            sorular = {
                r['soru_id']: {
                    'cozum': r['cozum'],
                    'dogru': r['dogru'],
                    'yanlis': r['yanlis'],
                    'oran': round(r['dogru'] * 100.0 / r['cozum'], 1) if r['cozum'] else None,
                }
                for r in rows
            }
            return jsonify(sorular=sorular, toplamCozum=sum(r['cozum'] for r in rows))

    @app.route('/api/gys/onerilen', methods=['GET', 'POST', 'OPTIONS'])
    def gys_onerilen():
        if request.method != 'GET' and request.headers.get('Origin') not in app.config['ORIGINS']:
            abort(403)
        if request.method == 'OPTIONS':
            return '', 204
        if request.method == 'POST':
            if not request.is_json:
                abort(415)
            d = request.get_json()
            if not isinstance(d, dict):
                abort(400)
            kanun = str(d.get('kanun', '')).strip()
            bolum = str(d.get('bolum', '')).strip()
            seviye = str(d.get('seviye', 'orta')).strip()
            soru = str(d.get('soru', '')).strip()
            kaynak = str(d.get('kaynak', '')).strip()
            aciklama = str(d.get('aciklama', '')).strip()
            dogru = [str(x).strip() for x in (d.get('dogru') or []) if str(x).strip()]
            yanlis = [str(x).strip() for x in (d.get('yanlis') or []) if str(x).strip()]
            if not KANUN_RE.match(kanun) or not BOLUM_RE.match(bolum) or seviye not in SEVIYELER:
                abort(400)
            if not (20 <= len(soru) <= 1200) or not (3 <= len(kaynak) <= 240) or not (10 <= len(aciklama) <= 1500):
                abort(400)
            if len(dogru) < 1 or len(dogru) > 10 or len(yanlis) < 4 or len(yanlis) > 15:
                abort(400)
            limited('gys-submit', 20, 3600)
            qid = 'usr-' + uuid.uuid4().hex[:10]
            with db() as conn:
                conn.execute(
                    """INSERT INTO gys_community_questions
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'bekliyor', 0, 0, ?)""",
                    (qid, kanun, bolum, seviye, soru, json.dumps(dogru, ensure_ascii=False), json.dumps(yanlis, ensure_ascii=False), kaynak, aciklama, time.time()),
                )
            return jsonify(ok=True, id=qid, durum='bekliyor'), 201

        durum_filtre = request.args.get('durum', 'bekliyor')
        if durum_filtre not in ('bekliyor', 'onayli', 'tumu'):
            durum_filtre = 'bekliyor'
        with db() as conn:
            if durum_filtre == 'tumu':
                rows = conn.execute("SELECT * FROM gys_community_questions WHERE durum IN ('bekliyor','onayli') ORDER BY created DESC LIMIT 100").fetchall()
            else:
                rows = conn.execute('SELECT * FROM gys_community_questions WHERE durum = ? ORDER BY created DESC LIMIT 100', (durum_filtre,)).fetchall()
        liste = [
            {
                'id': r['id'],
                'kanun': r['kanun'],
                'bolum': r['bolum'],
                'seviye': r['seviye'],
                'soru': r['soru'],
                'dogru': json.loads(r['dogru_json']),
                'yanlis': json.loads(r['yanlis_json']),
                'kaynak': r['kaynak'],
                'aciklama': r['aciklama'],
                'durum': r['durum'],
                'onayOy': r['onay_oy'],
                'redOy': r['red_oy'],
                'kullaniciEkledi': True,
            }
            for r in rows
        ]
        return jsonify(sorular=liste, toplam=len(liste))

    @app.route('/api/gys/oyla', methods=['POST', 'OPTIONS'])
    def gys_oyla():
        if request.headers.get('Origin') not in app.config['ORIGINS']:
            abort(403)
        if request.method == 'OPTIONS':
            return '', 204
        if not request.is_json:
            abort(415)
        d = request.get_json()
        if not isinstance(d, dict):
            abort(400)
        try:
            event_id = str(uuid.UUID(d.get('istekId', '')))
        except (ValueError, TypeError, AttributeError):
            abort(400)
        soru_id = str(d.get('soruId', ''))
        if not SORU_ID_RE.match(soru_id):
            abort(400)
        onay = bool(d.get('onay'))
        limited('gys-vote', 120, 60)
        with db() as conn:
            conn.execute('BEGIN IMMEDIATE')
            conn.execute('DELETE FROM gys_vote_events WHERE created < ?', (time.time() - 172800,))
            added = conn.execute('INSERT OR IGNORE INTO gys_vote_events VALUES (?, ?)', (event_id, time.time())).rowcount
            if added:
                if onay:
                    conn.execute('UPDATE gys_community_questions SET onay_oy = onay_oy + 1 WHERE id = ?', (soru_id,))
                else:
                    conn.execute('UPDATE gys_community_questions SET red_oy = red_oy + 1 WHERE id = ?', (soru_id,))
                row = conn.execute('SELECT onay_oy, red_oy, durum FROM gys_community_questions WHERE id = ?', (soru_id,)).fetchone()
                if row and row['durum'] == 'bekliyor':
                    if row['onay_oy'] - row['red_oy'] >= 5:
                        conn.execute("UPDATE gys_community_questions SET durum = 'onayli' WHERE id = ?", (soru_id,))
                    elif row['red_oy'] - row['onay_oy'] >= 5:
                        conn.execute("UPDATE gys_community_questions SET durum = 'reddedildi' WHERE id = ?", (soru_id,))
            row = conn.execute('SELECT onay_oy, red_oy, durum FROM gys_community_questions WHERE id = ?', (soru_id,)).fetchone()
        if not row:
            abort(404)
        return jsonify(ok=True, soruId=soru_id, onayOy=row['onay_oy'], redOy=row['red_oy'], durum=row['durum'])

    @app.route('/api/gys/bildir', methods=['POST', 'OPTIONS'])
    def gys_bildir():
        if request.headers.get('Origin') not in app.config['ORIGINS']:
            abort(403)
        if request.method == 'OPTIONS':
            return '', 204
        if not request.is_json:
            abort(415)
        d = request.get_json()
        if not isinstance(d, dict):
            abort(400)
        soru_id = str(d.get('soruId', '')).strip()
        tur = str(d.get('tur', '')).strip()
        aciklama = str(d.get('aciklama', '')).strip()
        if not SORU_ID_RE.match(soru_id) or tur not in ('telif', 'hata') or not (10 <= len(aciklama) <= 1000):
            abort(400)
        limited('gys-report', 30, 3600)
        rid = 'rep-' + uuid.uuid4().hex[:10]
        with db() as conn:
            conn.execute('INSERT INTO gys_reports VALUES (?, ?, ?, ?, ?)', (rid, soru_id, tur, aciklama, time.time()))
        return jsonify(ok=True, id=rid), 201
