"""GYS soru bazlı genel doğru/yanlış bilme ihtimali istatistik servisi."""
import re
import time
import uuid
from flask import request, jsonify, abort

SORU_ID_RE = re.compile(r'^[a-z0-9][a-z0-9_-]{2,64}$')


def register_gys_metrics(app, db, limited):
    with db() as conn:
        conn.executescript(
            """CREATE TABLE IF NOT EXISTS gys_soru_stats(
                soru_id TEXT PRIMARY KEY,
                cozum INTEGER NOT NULL DEFAULT 0,
                dogru INTEGER NOT NULL DEFAULT 0,
                yanlis INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS gys_soru_events(id TEXT PRIMARY KEY, created REAL NOT NULL);"""
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
