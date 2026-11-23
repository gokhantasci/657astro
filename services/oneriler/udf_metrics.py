"""Belge içeriği kabul etmeyen UDF kullanım sayaçları."""
import time
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo
from flask import request, jsonify, abort

FIELDS = ('documents','words','characters','lines','downloads','udf','docx','markdown','prints','signatures','ocr','speech','ai')

def register_udf_metrics(app, db, limited):
    with db() as conn:
        conn.executescript("""CREATE TABLE IF NOT EXISTS udf_metrics(day TEXT, metric TEXT, value INTEGER NOT NULL, PRIMARY KEY(day,metric));
            CREATE TABLE IF NOT EXISTS udf_events(id TEXT PRIMARY KEY, created REAL NOT NULL);""")

    @app.route('/api/udf-kullanim', methods=['GET','POST','OPTIONS'])
    def udf_usage():
        if request.method != 'GET' and request.headers.get('Origin') not in app.config['ORIGINS']:
            abort(403)
        if request.method == 'OPTIONS':
            return '', 204
        if request.method == 'POST':
            if not request.is_json: abort(415)
            data = request.get_json()
            if not isinstance(data,dict) or set(data) != {'istekId','metrics'}: abort(400)
            try: event_id = str(uuid.UUID(data['istekId']))
            except (ValueError,TypeError,AttributeError): abort(400)
            metrics = data['metrics']
            if not isinstance(metrics,dict) or not metrics or any(k not in FIELDS or type(v) is not int or not 0 <= v <= 100000000 for k,v in metrics.items()): abort(400)
            limited('udf-metrics',120,60)
            day = datetime.now(ZoneInfo('Europe/Istanbul')).date().isoformat()
            with db() as conn:
                conn.execute('BEGIN IMMEDIATE')
                conn.execute('DELETE FROM udf_events WHERE created < ?', (time.time()-172800,))
                added = conn.execute('INSERT OR IGNORE INTO udf_events VALUES (?,?)',(event_id,time.time())).rowcount
                if added:
                    for k,v in metrics.items():
                        conn.execute('INSERT INTO udf_metrics VALUES (?,?,?) ON CONFLICT(day,metric) DO UPDATE SET value=value+excluded.value',(day,k,v))
        with db() as conn:
            totals = dict.fromkeys(FIELDS,0)
            totals.update({r['metric']:r['total'] for r in conn.execute('SELECT metric,SUM(value) AS total FROM udf_metrics GROUP BY metric')})
        return jsonify(metrics=totals, timezone='Europe/Istanbul')
