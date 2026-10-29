"""Yerel önizleme; sır ve özel veritabanı git dışındaki artifacts altında kalır."""
import os
import secrets
from pathlib import Path

root = Path(__file__).resolve().parents[2]
folder = root / 'artifacts' / 'oneri-servisi'
folder.mkdir(parents=True, exist_ok=True)
key = folder / 'session.key'
if not key.exists():
    key.write_text(secrets.token_urlsafe(48))
os.environ['ONERI_LOCAL'] = '1'
os.environ['ONERI_SECRET'] = key.read_text().strip()
os.environ['ONERI_DATABASE'] = str(folder / 'oneriler.sqlite3')
from app import create_app
from waitress import serve
serve(create_app(), host='127.0.0.1', port=4326)
