import base64
import json
import re
import tempfile
import unittest
import uuid
from pathlib import Path
from unittest.mock import patch

from app import create_app, github_publish


class OneriTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.published = []
        def publish(record, config):
            self.published.append(record)
            return 'https://github.com/gokhantasci/657astro/blob/main/test.json'
        self.config = dict(TESTING=True, SECRET_KEY='test-secret', LOCAL=True, SESSION_COOKIE_SECURE=False,
                           DATABASE=str(Path(self.tmp.name)/'db.sqlite3'), PUBLISHER=publish, GITHUB_TOKEN='test-only')
        self.app = create_app(self.config)
        self.client = self.app.test_client()
        self.data = dict(tur='mulakat', baslik='Örnek soru?', aciklama='Örnek cevap.', kaynak='2026 sınavı', ad='Özel isim', requestKey=str(uuid.uuid4()))

    def tearDown(self):
        self.tmp.cleanup()

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


if __name__=='__main__':unittest.main()
