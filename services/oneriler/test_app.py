import base64
import json
import re
import tempfile
import unittest
import uuid
import subprocess
from pathlib import Path
from unittest.mock import patch

from app import create_app, github_publish


class OneriTest(unittest.TestCase):
    def test_all_tool_counters_are_isolated_and_durable(self):
        from app import ARAC_SAYACLARI
        endpoint='/api/hesaplama'
        self.assertEqual(set(self.client.get(endpoint).json['sayaclar']),set(ARAC_SAYACLARI))
        for i,tur in enumerate(ARAC_SAYACLARI):
            body={'tur':tur,'istekId':str(uuid.uuid4())}
            for _ in range(2):
                r=self.client.post(endpoint,json=body,headers={'Origin':'http://127.0.0.1:4322'},environ_base={'REMOTE_ADDR':f'192.0.2.{i+1}'})
                self.assertEqual(r.status_code,200)
                self.assertEqual(r.json['sayaclar'][tur]['toplam'],1)
        data=self.client.get(endpoint).json
        self.assertEqual(data['toplam'],len(ARAC_SAYACLARI))
        self.assertEqual(create_app(self.config).test_client().get(endpoint).json,data)
        self.assertEqual(set(data['baslangiclar']),set(ARAC_SAYACLARI))
        self.assertEqual(self.client.post(endpoint,json={'tur':'bilinmeyen','istekId':str(uuid.uuid4())},headers={'Origin':'http://127.0.0.1:4322'}).status_code,400)

    def test_usage_registry_matches_published_catalog(self):
        registry=json.loads(Path(__file__).with_name('arac-sayaclari.json').read_text(encoding='utf-8'))
        catalog=json.loads((Path(__file__).resolve().parents[2]/'src/data/araclar.json').read_text(encoding='utf-8'))
        self.assertEqual({r['id'] for r in registry},{t['id'] for t in catalog['araclar'] if t.get('tasindi') and t.get('path')})

    def test_homepage_view_counter(self):
        endpoint='/api/okunma'
        event={'path':'/','istekId':str(uuid.uuid4())}
        self.assertEqual(self.client.get(endpoint,query_string={'path':'/'}).json['sayi'],0)
        for _ in range(2):
            r=self.client.post(endpoint,json=event,headers={'Origin':'http://127.0.0.1:4322'})
            self.assertEqual(r.status_code,200)
            self.assertEqual((r.json['sayi'],r.json['bugun']),(1,1))
        self.assertEqual(self.client.get(endpoint,query_string={'path':'/'}).json['sayi'],1)
        for invalid in ['', '/?secim=1', '/#alan', '/../gizli/', 'https://example.com/']:
            self.assertEqual(self.client.get(endpoint,query_string={'path':invalid}).status_code,400)

    def test_read_counter_preserves_totals_and_deduplicates_retries(self):
        import sqlite3
        from contextlib import closing
        path='/kelime/tuzuk-ne-demek/'
        with closing(sqlite3.connect(self.config['DATABASE'])) as conn:
            conn.execute('INSERT INTO okunma VALUES (?,?)',(path,12));conn.commit()
        endpoint='/api/okunma'
        old=self.client.get(endpoint,query_string={'path':path})
        self.assertEqual((old.json['sayi'],old.json['bugun']),(12,0))
        self.assertEqual(old.headers['Cache-Control'],'no-store')
        event={'path':path,'istekId':str(uuid.uuid4())}
        for _ in range(2):
            r=self.client.post(endpoint,json=event,headers={'Origin':'http://127.0.0.1:4322'})
            self.assertEqual((r.json['sayi'],r.json['bugun']),(13,1))
        self.assertEqual(self.client.post(endpoint,json={**event,'path':'/baska/'},headers={'Origin':'http://127.0.0.1:4322'}).status_code,409)
        restarted=create_app(self.config).test_client().get(endpoint,query_string={'path':path}).json
        self.assertEqual(restarted,r.json)
        self.assertEqual(restarted['baslangic'],old.json['baslangic'])
        self.assertEqual(self.client.get(endpoint,query_string={'path':'/../yanlis/'}).status_code,400)
        self.assertEqual(self.client.get(endpoint,query_string={'path':'/yeni/'}).json['bugun'],0)

    def test_read_counter_istanbul_midnight(self):
        from datetime import datetime, timezone
        endpoint='/api/okunma'
        path='/soru/'
        class Before(datetime):
            @classmethod
            def now(cls,tz=None):return datetime(2026,11,5,20,59,tzinfo=timezone.utc).astimezone(tz)
        class After(datetime):
            @classmethod
            def now(cls,tz=None):return datetime(2026,11,5,21,1,tzinfo=timezone.utc).astimezone(tz)
        with patch('app.datetime',Before):
            r=self.client.post(endpoint,json={'path':path},headers={'Origin':'http://127.0.0.1:4322'})
            self.assertEqual(r.json['gun'],'2026-11-05')
        with patch('app.datetime',After):
            r=self.client.get(endpoint,query_string={'path':path})
            self.assertEqual((r.json['sayi'],r.json['bugun'],r.json['gun']),(1,0,'2026-11-06'))
            r=self.client.post(endpoint,json={'path':path},headers={'Origin':'http://127.0.0.1:4322'})
            self.assertEqual((r.json['sayi'],r.json['bugun']),(2,1))

    def test_calculation_counter_persistence_and_idempotency(self):
        endpoint='/api/hesaplama'
        self.assertEqual(self.client.get(endpoint).json['toplam'],0)
        event={'tur':'enflasyon','istekId':str(uuid.uuid4())}
        headers={'Origin':'http://127.0.0.1:4322'}
        for _ in range(2):
            r=self.client.post(endpoint,json=event,headers=headers)
            self.assertEqual(r.status_code,200)
            self.assertEqual(r.json['sayaclar']['enflasyon'],dict(bugun=1,buHafta=1,buYil=1,toplam=1))
        restarted=create_app(self.config).test_client()
        self.assertEqual(restarted.get(endpoint).json['toplam'],1)
        self.assertEqual(self.client.post(endpoint,json={**event,'tur':'maas'},headers=headers).status_code,409)
        self.assertEqual(self.client.post(endpoint,json=event,headers={'Origin':'https://other.invalid'}).status_code,403)
        self.assertEqual(self.client.post(endpoint,json={'tur':'maas'},headers=headers).status_code,400)

    def test_calculation_counter_istanbul_periods(self):
        import sqlite3
        from contextlib import closing
        from datetime import datetime, timezone
        class Frozen(datetime):
            @classmethod
            def now(cls,tz=None):
                return datetime(2027,1,3,22,0,tzinfo=timezone.utc).astimezone(tz)
        with closing(sqlite3.connect(self.config['DATABASE'])) as conn:
            conn.executemany('INSERT INTO hesaplama_gunluk VALUES (?,?,?)',
                             [('maas','2026-12-31',4),('maas','2027-01-01',3),('maas','2027-01-03',2),('maas','2027-01-04',1)])
            conn.commit()
        with patch('app.datetime',Frozen):
            data=self.client.get('/api/hesaplama').json
        self.assertEqual(data['sayaclar']['maas'],dict(bugun=1,buHafta=1,buYil=6,toplam=10))
        self.assertEqual(data['saatDilimi'],'Europe/Istanbul')

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.published = []
        def publish(record, config):
            self.published.append(record)
            return 'https://github.com/gokhantasci/657astro/blob/main/test.json'
        self.config = dict(TESTING=True, SECRET_KEY='test-secret', LOCAL=True, SESSION_COOKIE_SECURE=False, TURNSTILE_REQUIRED=False,
                           DATABASE=str(Path(self.tmp.name)/'db.sqlite3'), PUBLISHER=publish, GITHUB_TOKEN='test-only')
        self.app = create_app(self.config)
        self.client = self.app.test_client()
        self.data = dict(tur='mulakat', baslik='Örnek soru?', aciklama='Örnek cevap.', kaynak='2026 sınavı', ad='Özel isim', requestKey=str(uuid.uuid4()))

    def tearDown(self):
        self.tmp.cleanup()

    def test_download_counter(self):
        key='kesinlesme-hesaplama'
        self.assertEqual(self.client.get('/api/indirme?id='+key).json['sayi'],0)
        public=self.client.get('/api/indirme?id='+key,headers={'Origin':'http://127.0.0.1:4322'})
        self.assertEqual(public.headers['Access-Control-Allow-Origin'],'*')
        for n in [1,2]:
            r=self.client.post('/api/indirme',json={'id':key},headers={'Origin':'http://127.0.0.1:4322'})
            self.assertEqual(r.status_code,200);self.assertEqual(r.json['sayi'],n)
        self.assertEqual(self.client.get('/api/indirme?id='+key).json['sayi'],2)
        self.assertEqual(self.client.post('/api/indirme',json={'id':key},headers={'Origin':'https://other.invalid'}).status_code,403)
        self.assertEqual(self.client.get('/api/indirme?id=unknown').status_code,404)
        self.assertEqual(self.client.get('/api/indirme?id=dosya-'+'a'*32).status_code,200)

    def submit(self, data=None):
        return self.client.post('/api/oneriler', json=data or self.data, headers={'Origin':'http://127.0.0.1:4322'})

    def csrf(self):
        self.client.get('/')
        with self.client.session_transaction() as s:
            return s['csrf']

    def test_queue_edit_approve_private_and_idempotent(self):
        first = self.submit()
        self.assertEqual(first.status_code, 201)
        ident = first.json['id']
        self.assertEqual(self.submit().json['id'], ident)
        self.assertEqual(self.published, [])
        result = self.client.post(f'/oneri/{ident}/onayla', data=dict(csrf=self.csrf(), tur='mulakat', baslik='Düzeltilmiş soru?', aciklama='Doğrulanan cevap', kaynak='Kaynak'))
        self.assertEqual(result.status_code, 302)
        self.assertEqual(len(self.published), 1)
        record = self.published[0]
        self.assertEqual(record['baslik'], 'Düzeltilmiş soru?')
        self.assertNotIn('ad', record)
        self.assertNotIn('Özel isim', json.dumps(record))
        self.client.post(f'/oneri/{ident}/onayla', data=dict(csrf=self.csrf()))
        self.assertEqual(len(self.published), 1)
        self.assertNotIn('Özel isim', self.client.get('/').text)

    def test_csrf_origin_validation_and_no_public_list(self):
        ident = self.submit().json['id']
        self.assertEqual(self.client.post(f'/oneri/{ident}/reddet').status_code, 403)
        self.assertEqual(self.client.post('/api/oneriler',json=self.data,headers={'Origin':'https://evil.example'}).status_code,403)
        self.assertEqual(self.submit(dict(self.data, baslik='')).status_code,400)
        self.assertEqual(self.client.get('/api/oneriler').status_code,405)
        self.assertEqual(self.client.get('/',headers={'Host':'evil.example'}).status_code,403)
        self.assertEqual(self.client.post(f'/oneri/{ident}/reddet',data=dict(csrf=self.csrf())).status_code,302)
        self.assertEqual(self.published,[])

    def test_turnstile_fails_closed_and_checks_hostname_action(self):
        import io
        self.app.config.update(TURNSTILE_REQUIRED=True, TURNSTILE_SECRET='test-secret')
        self.assertEqual(self.submit().status_code,400)
        for result, status in [({'success':False},400),
                ({'success':True,'hostname':'evil.example','action':'proposal'},400),
                ({'success':True,'hostname':'657.com.tr','action':'login'},400),
                ({'success':True,'hostname':'657.com.tr','action':'proposal'},201)]:
            with patch('urllib.request.urlopen',return_value=io.BytesIO(json.dumps(result).encode())):
                self.assertEqual(self.submit(dict(self.data,turnstileToken='test-token')).status_code,status)

    def test_global_views_increment_and_reject_invalid_origin_or_path(self):
        headers={'Origin':'http://127.0.0.1:4322'}
        for n in [1,2,3]:
            r=self.client.post('/api/okunma',json={'path':'/kelime/tuzuk-ne-demek/'},headers=headers)
            self.assertEqual(r.status_code,200)
            self.assertEqual(r.json['sayi'],n)
        self.assertEqual(self.client.post('/api/okunma',json={'path':'/../private/'},headers=headers).status_code,400)
        self.assertEqual(self.client.post('/api/okunma',json={'path':'/ornek/'},headers={'Origin':'https://evil.example'}).status_code,403)

    def test_rate_limit_and_xss_escape(self):
        self.data['baslik'] = '<script>alert(1)</script>'
        for i in range(5):
            self.assertEqual(self.submit(dict(self.data,requestKey=str(uuid.uuid4()))).status_code,201)
        self.assertEqual(self.submit(dict(self.data,requestKey=str(uuid.uuid4()))).status_code,429)
        page = self.client.get('/').text
        self.assertNotIn('<script>alert',page)
        self.assertIn('&lt;script&gt;',page)

    def test_failed_publish_preserves_and_retries_same_payload(self):
        ident=self.submit().json['id']
        self.app.config['PUBLISHER']=lambda *_: (_ for _ in ()).throw(RuntimeError('Geçici hata'))
        form=dict(csrf=self.csrf(),**{k:v for k,v in self.data.items() if k!='requestKey'})
        self.client.post(f'/oneri/{ident}/onayla',data=form)
        self.assertIn('yayin_hatasi',self.client.get('/').text)
        self.app.config['PUBLISHER']=self.config['PUBLISHER']
        self.client.post(f'/oneri/{ident}/onayla',data=dict(form,baslik='Sonradan değişti'))
        self.assertEqual(self.published[0]['baslik'],self.data['baslik'])

    def test_production_requires_login(self):
        from werkzeug.security import generate_password_hash
        app=create_app(dict(self.config,LOCAL=False,ADMIN_PASSWORD_HASH=generate_password_hash('long-test-password')))
        client=app.test_client()
        self.assertEqual(client.get('/').status_code,302)
        client.get('/giris')
        with client.session_transaction() as s: token=s['csrf']
        client.post('/giris',data=dict(csrf=token,parola='long-test-password'))
        self.assertEqual(client.get('/').status_code,200)

    def test_github_only_writes_one_approved_file_and_retries(self):
        record={'id':str(uuid.uuid4()),'tur':'mulakat','baslik':'Soru','aciklama':'Cevap','kaynak':'','tarih':'2026-10-29','slug':'soru-oneri-abcd1234'}
        class Response:
            def __init__(self,value): self.value=value
            def __enter__(self):return self
            def __exit__(self,*_):pass
            def read(self):return json.dumps(self.value).encode()
        from urllib.error import HTTPError
        calls=[]
        def network(req,**kwargs):
            calls.append(req)
            if req.method=='GET':raise HTTPError(req.full_url,404,'missing',{},None)
            body=json.loads(req.data)
            self.assertEqual(json.loads(base64.b64decode(body['content'])),record)
            self.assertEqual(body['branch'],'main')
            return Response({'content':{'html_url':'https://github.com/test/file'}})
        with patch('app.urllib.request.urlopen',network):
            self.assertEqual(github_publish(record,self.app.config),'https://github.com/test/file')
        self.assertIn('/contents/src/data/onayli-oneriler/',calls[1].full_url)
        existing={'content':base64.b64encode(json.dumps(record).encode()).decode(),'html_url':'https://github.com/test/file'}
        with patch('app.urllib.request.urlopen',return_value=Response(existing)) as mocked:
            github_publish(record,self.app.config)
            self.assertEqual(mocked.call_count,1)

    def test_panel_links_and_redirects_support_proxy_prefix(self):
        app=create_app(dict(self.config,LOCAL=False,ADMIN_PASSWORD_HASH='not-a-password'))
        client=app.test_client()
        env={'SCRIPT_NAME':'/_657-servis'}
        self.assertEqual(client.get('/',environ_overrides=env).headers['Location'],'/_657-servis/giris')
        html=client.get('/giris',environ_overrides=env).text
        self.assertIn('/_657-servis/static/panel.css',html)

    def test_git_publisher_scoped_file_idempotence_and_conflict(self):
        from git_yayin import git_publish
        root=Path(self.tmp.name)
        remote=root/'remote.git';seed=root/'seed';cache=root/'publish.git'
        def git(cwd,*args):
            return subprocess.run(['git',*args],cwd=cwd,check=True,capture_output=True,text=True,encoding='utf-8').stdout.strip()
        git(root,'init','--bare',str(remote));git(root,'init','-b','main',str(seed))
        (seed/'base.txt').write_text('korunacak',encoding='utf-8')
        git(seed,'add','.');git(seed,'-c','user.name=Test','-c','user.email=test@example.invalid','-c','commit.gpgsign=false','commit','-m','Initial')
        git(seed,'remote','add','origin',str(remote));git(seed,'push','origin','main')
        config=dict(self.app.config,GIT_DATABASE=str(cache),GIT_REMOTE=str(remote),GIT_KEY=None)
        record={'id':str(uuid.uuid4()),'tur':'mulakat','baslik':'Sentetik soru','aciklama':'Sentetik cevap','kaynak':'','tarih':'2026-10-30','slug':'sentetik'}
        before=git(remote,'rev-parse','refs/heads/main')
        link=git_publish(record,config);after=git(remote,'rev-parse','refs/heads/main')
        path='src/data/onayli-oneriler/'+record['id']+'.json'
        self.assertEqual(git(remote,'diff-tree','--no-commit-id','--name-only','-r',after),path)
        self.assertNotEqual(before,after);self.assertEqual(json.loads(git(remote,'show','main:'+path)),record)
        self.assertTrue(link.endswith(path));git_publish(dict(record,tarih='2026-10-31'),config)
        self.assertEqual(git(remote,'rev-parse','refs/heads/main'),after)
        with self.assertRaises(RuntimeError):git_publish(dict(record,baslik='Farklı içerik'),config)
        self.assertEqual(git(remote,'rev-parse','refs/heads/main'),after)


if __name__=='__main__':unittest.main()
