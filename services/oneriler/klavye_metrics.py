"""On Parmak klavye sınav metinleri için günlük/haftalık/aylık/yıllık yazım sayacı ve zorluk sıralaması."""
import re
import time
import uuid
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from flask import request, jsonify, abort

METIN_ID_RE = re.compile(r'^[a-z0-9][a-z0-9_-]{1,32}:[0-9]{1,4}$')


def register_klavye_metrics(app, db, limited):
    with db() as conn:
        conn.executescript(
            """CREATE TABLE IF NOT EXISTS klavye_daily(
                day TEXT NOT NULL,
                metin_id TEXT NOT NULL,
                yazim INTEGER NOT NULL DEFAULT 0,
                basarili INTEGER NOT NULL DEFAULT 0,
                hata_orani_toplam REAL NOT NULL DEFAULT 0,
                net_toplam INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY(day, metin_id)
            );
            CREATE TABLE IF NOT EXISTS klavye_events(id TEXT PRIMARY KEY, created REAL NOT NULL);"""
        )

    def period_bounds():
        today = datetime.now(ZoneInfo('Europe/Istanbul')).date()
        week_start = (today - timedelta(days=today.weekday())).isoformat()
        month_start = today.replace(day=1).isoformat()
        year_start = today.replace(month=1, day=1).isoformat()
        return today.isoformat(), week_start, month_start, year_start

    @app.route('/api/klavye-istatistik', methods=['GET', 'POST', 'OPTIONS'])
    def klavye_stats():
        if request.method != 'GET' and request.headers.get('Origin') not in app.config['ORIGINS']:
            abort(403)
        if request.method == 'OPTIONS':
            return '', 204
        today, week_start, month_start, year_start = period_bounds()
        if request.method == 'POST':
            if not request.is_json:
                abort(415)
            data = request.get_json()
            if not isinstance(data, dict) or not set(data).issubset({'istekId', 'metinId', 'hataOrani', 'net', 'basarili'}):
                abort(400)
            if 'istekId' not in data or 'metinId' not in data:
                abort(400)
            try:
                event_id = str(uuid.UUID(data['istekId']))
            except (ValueError, TypeError, AttributeError):
                abort(400)
            metin_id = data.get('metinId', '')
            if not isinstance(metin_id, str) or not METIN_ID_RE.match(metin_id):
                abort(400)
            hata_orani = data.get('hataOrani', 0)
            net = data.get('net', 0)
            basarili = bool(data.get('basarili', False))
            if not isinstance(hata_orani, (int, float)) or isinstance(hata_orani, bool) or not 0 <= hata_orani <= 100:
                abort(400)
            if type(net) is not int or not 0 <= net <= 2000:
                abort(400)
            limited('klavye-metrics', 120, 60)
            with db() as conn:
                conn.execute('BEGIN IMMEDIATE')
                conn.execute('DELETE FROM klavye_events WHERE created < ?', (time.time() - 172800,))
                added = conn.execute('INSERT OR IGNORE INTO klavye_events VALUES (?, ?)', (event_id, time.time())).rowcount
                if added:
                    conn.execute(
                        """INSERT INTO klavye_daily VALUES (?, ?, 1, ?, ?, ?)
                           ON CONFLICT(day, metin_id) DO UPDATE SET
                             yazim = yazim + 1,
                             basarili = basarili + excluded.basarili,
                             hata_orani_toplam = hata_orani_toplam + excluded.hata_orani_toplam,
                             net_toplam = net_toplam + excluded.net_toplam""",
                        (today, metin_id, 1 if basarili else 0, float(hata_orani), net),
                    )

        req_metin = request.args.get('metinId', '')
        with db() as conn:
            rows = conn.execute(
                """SELECT metin_id,
                          SUM(CASE WHEN day = ? THEN yazim ELSE 0 END) AS bugun,
                          SUM(CASE WHEN day >= ? THEN yazim ELSE 0 END) AS bu_hafta,
                          SUM(CASE WHEN day >= ? THEN yazim ELSE 0 END) AS bu_ay,
                          SUM(CASE WHEN day >= ? THEN yazim ELSE 0 END) AS bu_yil,
                          SUM(yazim) AS toplam,
                          SUM(basarili) AS basarili_toplam,
                          SUM(hata_orani_toplam) AS hata_toplam,
                          SUM(net_toplam) AS net_toplam
                   FROM klavye_daily
                   GROUP BY metin_id""",
                (today, week_start, month_start, year_start),
            ).fetchall()

        metinler = {}
        en_zor = []
        for r in rows:
            t = r['toplam'] or 1
            ort_hata = round(r['hata_toplam'] / t, 2)
            ort_net = round(r['net_toplam'] / t, 1)
            basari_orani = round((r['basarili_toplam'] / t) * 100, 1)
            rec = {
                'metinId': r['metin_id'],
                'bugun': r['bugun'],
                'buHafta': r['bu_hafta'],
                'buAy': r['bu_ay'],
                'buYil': r['bu_yil'],
                'toplam': r['toplam'],
                'ortalamaHataOrani': ort_hata,
                'ortalamaNet': ort_net,
                'basariOrani': basari_orani,
            }
            metinler[r['metin_id']] = rec
            en_zor.append(rec)

        en_zor.sort(key=lambda x: (-x['ortalamaHataOrani'], x['basariOrani'], -x['toplam']))
        secili = metinler.get(
            req_metin,
            {'metinId': req_metin, 'bugun': 0, 'buHafta': 0, 'buAy': 0, 'buYil': 0, 'toplam': 0, 'ortalamaHataOrani': 0, 'ortalamaNet': 0, 'basariOrani': 0},
        ) if req_metin else None

        return jsonify(
            secili=secili,
            enZorMetinler=en_zor[:15],
            toplamYazim=sum(x['toplam'] for x in en_zor),
            saatDilimi='Europe/Istanbul',
        )
