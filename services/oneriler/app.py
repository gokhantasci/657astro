"""Özel SQLite kuyruğu → yönetici incelemesi → yalnızca onaylı içerik için GitHub commit."""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
import unicodedata
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from functools import wraps
from contextlib import contextmanager
from pathlib import Path

from flask import Flask, abort, jsonify, redirect, render_template, request, session
from werkzeug.security import check_password_hash
from werkzeug.middleware.proxy_fix import ProxyFix


def validate(data):
    if not isinstance(data, dict) or data.get('tur') not in ('sozluk', 'mulakat'):
        raise ValueError('Öneri türünü seçin.')
    result = {'tur': data['tur']}
    for key, minimum, maximum in [('baslik', 2, 200), ('aciklama', 2, 3000), ('kaynak', 0, 300), ('ad', 0, 100)]:
        value = data.get(key, '')
        if not isinstance(value, str) or not minimum <= len(value.strip()) <= maximum:
            raise ValueError('Başlık, açıklama ve kaynak uzunluklarını kontrol edin.')
        result[key] = value.strip()
    return result


def public_record(row):
    # Gönderen adı, IP özeti, yönetici oturumu ve özel notlar asla depoya gitmez.
    slug = unicodedata.normalize('NFKD', row['baslik'].lower().replace('ı', 'i')).encode('ascii', 'ignore').decode()
    slug = re.sub('[^a-z0-9]+', '-', slug).strip('-')[:100] or 'icerik'
    return dict(id=row['id'], tur=row['tur'], slug=f"{slug}-oneri-{row['id'][:8]}",
                baslik=row['baslik'], aciklama=row['aciklama'], kaynak=row['kaynak'],
                tarih=datetime.now(timezone.utc).date().isoformat())


def github_publish(record, config):
    token = config.get('GITHUB_TOKEN')
    if not token:
        raise RuntimeError('GitHub yayın anahtarı tanımlanmamış. Öneri kayıtlı; ayar tamamlanınca yeniden onaylayabilirsiniz.')
    repo, branch = config['GITHUB_REPOSITORY'], config['GITHUB_BRANCH']
    path = f"src/data/onayli-oneriler/{record['id']}.json"
    url = f'https://api.github.com/repos/{repo}/contents/{path}'
    headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/vnd.github+json',
               'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': '657-oneri', 'Content-Type': 'application/json'}
    def call(method, address, data=None):
        req = urllib.request.Request(address, data=json.dumps(data).encode() if data else None, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=25) as response:
            return json.load(response)
    try:
        existing = call('GET', url + '?ref=' + branch)
    except urllib.error.HTTPError as error:
        if error.code != 404:
            raise RuntimeError('GitHub bağlantısı doğrulanamadı; öneri silinmedi.') from error
    else:
        previous = json.loads(base64.b64decode(existing['content']))
        # Yanıt kaybolursa aynı dosya tekrar yayımlanmaz. Tarih önceki istekte kalabilir.
        if {k: v for k, v in previous.items() if k != 'tarih'} != {k: v for k, v in record.items() if k != 'tarih'}:
            raise RuntimeError('Bu kayıt GitHub’da farklı içerikle var. Yeniden yayınlanmadı.')
        return existing['html_url']
    payload = {'message': f"Onaylanan {record['tur']} önerisi: {record['id'][:8]}", 'branch': branch,
               'content': base64.b64encode((json.dumps(record, ensure_ascii=False, indent=2) + '\n').encode()).decode()}
    try:
        result = call('PUT', url, payload)
    except (urllib.error.URLError, TimeoutError) as error:
        raise RuntimeError('GitHub yanıtı alınamadı; öneri kayıtlı. Yeniden denendiğinde aynı dosya kontrol edilir.') from error
    return result['content']['html_url']


def create_app(overrides=None):
    app = Flask(__name__)
    local = os.getenv('ONERI_LOCAL') == '1'
    app.config.update(SECRET_KEY=os.getenv('ONERI_SECRET'), LOCAL=local,
                      DATABASE=os.getenv('ONERI_DATABASE', 'var/oneriler.sqlite3'),
                      ADMIN_PASSWORD_HASH=os.getenv('ONERI_ADMIN_PASSWORD_HASH'),
                      GITHUB_TOKEN=os.getenv('GITHUB_TOKEN'), GITHUB_REPOSITORY='gokhantasci/657astro', GITHUB_BRANCH='main',
                      ORIGINS=os.getenv('ONERI_ORIGINS', 'http://127.0.0.1:4321,http://127.0.0.1:4322').split(','),
                      MAX_CONTENT_LENGTH=16384, SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE='Strict',
                      SESSION_COOKIE_SECURE=not local, PERMANENT_SESSION_LIFETIME=1800,
                      PUBLISHER=github_publish)
    if overrides:
        app.config.update(overrides)
    if os.getenv('ONERI_TRUST_PROXY') == '1':
        # Yalnızca dış erişimi kapalı servisin önündeki tek güvenilir ters proxy.
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
    if not app.config['SECRET_KEY'] or (not app.config['LOCAL'] and not app.config['ADMIN_PASSWORD_HASH']):
        raise RuntimeError('ONERI_SECRET ve canlı kullanımda ONERI_ADMIN_PASSWORD_HASH zorunludur.')
    folder = Path(app.config['DATABASE']).resolve().parent
    folder.mkdir(mode=0o700, parents=True, exist_ok=True)
    @contextmanager
    def db():
        conn = sqlite3.connect(app.config['DATABASE'], timeout=10)
        conn.row_factory = sqlite3.Row
        try:
            with conn:
                yield conn
        finally:
            conn.close()
    with db() as conn:
        conn.executescript('''CREATE TABLE IF NOT EXISTS oneriler (
            id TEXT PRIMARY KEY, request_key TEXT UNIQUE, payload_hash TEXT NOT NULL,
            tur TEXT NOT NULL, baslik TEXT NOT NULL, aciklama TEXT NOT NULL, kaynak TEXT NOT NULL, ad TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'bekliyor', created REAL NOT NULL, updated REAL NOT NULL,
            public_json TEXT, github_url TEXT, error TEXT);
            CREATE TABLE IF NOT EXISTS limits (fingerprint TEXT, created REAL);
            CREATE INDEX IF NOT EXISTS limit_time ON limits(created);''')

    def csrf():
        if not hmac.compare_digest(str(session.get('csrf', '')), request.form.get('csrf', '')) or not session.get('csrf'):
            abort(403)

    def admin(fn):
        @wraps(fn)
        def wrapped(*args, **kwargs):
            if app.config['LOCAL']:
                if request.remote_addr not in ('127.0.0.1', '::1') or request.host.split(':')[0] not in ('127.0.0.1', 'localhost'):
                    abort(403)
            elif not session.get('admin'):
                return redirect('/giris')
            session.setdefault('csrf', secrets.token_urlsafe(32))
            if request.method == 'POST':
                csrf()
            return fn(*args, **kwargs)
        return wrapped

    def limited(key, maximum, seconds):
        now = time.time()
        digest = hmac.new(app.secret_key.encode(), f'{key}:{request.remote_addr}'.encode(), hashlib.sha256).hexdigest()
        with db() as conn:
            conn.execute('BEGIN IMMEDIATE')
            conn.execute('DELETE FROM limits WHERE created < ?', (now - 3600,))
            count = conn.execute('SELECT COUNT(*) FROM limits WHERE fingerprint=? AND created>?', (digest, now-seconds)).fetchone()[0]
            if count >= maximum:
                abort(429)
            conn.execute('INSERT INTO limits VALUES (?,?)', (digest, now))

    @app.after_request
    def headers(response):
        if request.path.startswith('/api/') and request.headers.get('Origin') in app.config['ORIGINS']:
            response.headers['Access-Control-Allow-Origin'] = request.headers['Origin']
            response.headers['Vary'] = 'Origin'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers.update({'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
                                 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
                                 'Content-Security-Policy': "default-src 'self'; style-src 'self'; form-action 'self'; frame-ancestors 'none'"})
        return response

    @app.before_request
    def retention():
        with db() as conn:
            conn.execute("DELETE FROM oneriler WHERE status IN ('bekliyor','reddedildi') AND created < ?", (time.time()-90*86400,))

    @app.errorhandler(429)
    def rate_error(_):
        return jsonify(error='Çok sık gönderim yaptınız. Bir süre sonra yeniden deneyin.'), 429

    @app.route('/api/oneriler', methods=['POST', 'OPTIONS'])
    def submit():
        if request.headers.get('Origin') not in app.config['ORIGINS']:
            abort(403)
        if request.method == 'OPTIONS':
            return '', 204
        if not request.is_json:
            abort(415)
        data = request.get_json()
        try:
            values = validate(data)
            key = str(uuid.UUID(data.get('requestKey', '')))
            if data.get('website'):
                raise ValueError('Gönderim doğrulanamadı.')
        except (ValueError, TypeError, AttributeError):
            return jsonify(error='Alanları kontrol edip yeniden deneyin.'), 400
        payload_hash = hashlib.sha256(json.dumps(values, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
        with db() as conn:
            previous = conn.execute('SELECT id,payload_hash FROM oneriler WHERE request_key=?', (key,)).fetchone()
        if previous:
            if previous['payload_hash'] != payload_hash:
                return jsonify(error='Bu gönderim numarası farklı içerik için kullanılmış.'), 409
            return jsonify(id=previous['id'], durum='kaydedildi'), 200
        limited('submit', 5, 3600)
        ident, now = str(uuid.uuid4()), time.time()
        try:
            with db() as conn:
                conn.execute('INSERT INTO oneriler(id,request_key,payload_hash,tur,baslik,aciklama,kaynak,ad,created,updated) VALUES (?,?,?,?,?,?,?,?,?,?)',
                             (ident, key, payload_hash, *[values[k] for k in ('tur','baslik','aciklama','kaynak','ad')], now, now))
        except sqlite3.IntegrityError:
            return jsonify(error='Gönderim eşzamanlı işlendi. Aynı öneriyi yeniden deneyebilirsiniz.'), 409
        return jsonify(id=ident, durum='kaydedildi'), 201

    @app.route('/giris', methods=['GET', 'POST'])
    def login():
        session.setdefault('csrf', secrets.token_urlsafe(32))
        error = None
        if request.method == 'POST':
            csrf()
            limited('login', 10, 900)
            if check_password_hash(app.config['ADMIN_PASSWORD_HASH'] or '', request.form.get('parola', '')):
                session.clear()
                session.update(admin=True, csrf=secrets.token_urlsafe(32))
                session.permanent = True
                return redirect('/')
            error = 'Parola doğrulanamadı.'
        return render_template('giris.html', error=error)

    @app.get('/')
    @admin
    def index():
        with db() as conn:
            rows = [dict(r) for r in conn.execute('SELECT * FROM oneriler ORDER BY created DESC LIMIT 100').fetchall()]
        for row in rows:
            if row['public_json']:
                row.update(json.loads(row['public_json']))
        return render_template('index.html', rows=rows, local=app.config['LOCAL'], yayin=bool(app.config.get('GITHUB_TOKEN')))

    @app.post('/cikis')
    @admin
    def logout():
        session.clear()
        return redirect('/giris')

    @app.post('/oneri/<ident>/<action>')
    @admin
    def review(ident, action):
        if action not in ('onayla', 'reddet'):
            abort(404)
        with db() as conn:
            conn.execute('BEGIN IMMEDIATE')
            row = conn.execute('SELECT * FROM oneriler WHERE id=?', (ident,)).fetchone()
            if not row:
                abort(404)
            if row['status'] == 'onaylandi':
                return redirect('/')
            if row['status'] == 'yayinlaniyor' and row['updated'] > time.time()-90:
                abort(409)
            if action == 'reddet':
                if row['public_json']:
                    abort(409)  # GitHub yanıtı kaybolmuş olabilir; tekrar yayın kontrolü gerekir.
                conn.execute("UPDATE oneriler SET status='reddedildi',updated=? WHERE id=?", (time.time(), ident))
                return redirect('/')
            if row['public_json']:
                record = json.loads(row['public_json'])
            else:
                try:
                    edited = validate(dict(request.form))
                except ValueError:
                    abort(400)
                record = public_record(dict(edited, id=ident))
            conn.execute("UPDATE oneriler SET status='yayinlaniyor',public_json=?,updated=?,error=NULL WHERE id=?", (json.dumps(record), time.time(), ident))
        try:
            url = app.config['PUBLISHER'](record, app.config)
        except Exception as error:
            # Hata metinlerine token veya üçüncü taraf yanıt gövdeleri yazılmaz.
            message = str(error) if isinstance(error, RuntimeError) else 'Yayın tamamlanamadı. Kayıt korundu; yeniden deneyebilirsiniz.'
            with db() as conn:
                conn.execute("UPDATE oneriler SET status='yayin_hatasi',error=?,updated=? WHERE id=?", (message, time.time(), ident))
        else:
            with db() as conn:
                conn.execute("UPDATE oneriler SET status='onaylandi',github_url=?,updated=?,ad='' WHERE id=?", (url, time.time(), ident))
        return redirect('/')

    return app


if __name__ == '__main__':
    from waitress import serve
    # Yerel kurulumda dahi dış arayüze açılmaz; canlıda ters proxy kullanılır.
    serve(create_app(), host='127.0.0.1', port=int(os.getenv('ONERI_PORT', '4326')))
