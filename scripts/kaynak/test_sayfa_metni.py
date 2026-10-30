import unittest
from sayfa_metni import sayfa_metni

class KaynakMetniTest(unittest.TestCase):
    def test_turkce_unvan_iki_kodlama(self):
        unvan = 'Öğretmen, Yazı İşleri Müdürü, Şef'
        for kodlama in ('utf-8', 'utf-8-sig', 'cp1254'):
            self.assertEqual(sayfa_metni(unvan.encode(kodlama)), unvan)

    def test_kayip_karakter_kabul_edilmez(self):
        with self.assertRaises(ValueError):
            sayfa_metni('Müd\ufffdr'.encode('utf-8'))

if __name__ == '__main__':
    unittest.main()
