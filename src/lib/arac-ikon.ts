import type { Arac } from './tools';

export type AracTon = 'maas' | 'yargi' | 'teftis' | 'hukuk' | 'kaynak' | 'uygulama';

export interface AracIkonBilgi {
  ikon: string;
  ton: AracTon;
}

const KATEGORI_IKON: Record<string, AracIkonBilgi> = {
  maas: { ikon: 'wallet', ton: 'maas' },
  yargi: { ikon: 'scale', ton: 'yargi' },
  teftis: { ikon: 'clipboard', ton: 'teftis' },
  hukuk: { ikon: 'gavel', ton: 'hukuk' },
  kaynak: { ikon: 'book', ton: 'kaynak' },
  uygulama: { ikon: 'sparkles', ton: 'uygulama' },
};

const ARAC_IKON: Record<string, string> = {
  // Maaş ve yolluk
  'enflasyon-farki': 'trending',
  'memur-maas': 'wallet',
  'sozlesmeli-maas': 'briefcase',
  'emekli-maas': 'award',
  'asker-emekli': 'shield',
  'gecici-gorev': 'route',
  'surekli-gorev': 'route',
  'asgari-ucret': 'percent',
  'ek-ders': 'graduation',
  'ek-ders-saat': 'clock',
  'akademik-ek-ders': 'graduation',
  'ucretli-ogretmen': 'graduation',
  'ilksan': 'award',
  'enflasyon-orani': 'trending',
  'muhtar': 'users',
  'belediye-baskani': 'users',
  'hizmet-68b': 'calendar',
  'lojman': 'home',
  'isci-4d': 'briefcase',
  'yillik-izin': 'calendar',
  'aile-cocuk-yardimi': 'users',
  'tazminat-farki-5510': 'receipt',
  'tazminat-farki-primsiz': 'receipt',
  'tazminat-farki-5434': 'receipt',
  'engellilik-vergi-iadesi': 'percent',
  'gelistirme-odenegi': 'graduation',
  'emekli-yollugu': 'award',
  'geriye-donuk-faiz': 'trending',

  // Harç ve yargılama gideri
  'yargilama-gideri': 'receipt',
  'hmk-yargilama': 'receipt',
  'gider-paylasim': 'percent',
  'dava-acma': 'gavel',
  'nispi-vekalet': 'scale',
  'istinaf-temyiz-harci': 'gavel',
  'islah-harci': 'trending',
  'tapu-harci': 'home',
  'kesinlesme': 'calendar',
  'hukuki-sure': 'clock',
  'thh-bilirkisi': 'calculator',
  'iflas-idare-ucreti': 'briefcase',
  'hukuk-kasa': 'wallet',
  'hukuk-paylasim': 'users',
  'smm': 'receipt',
  'faiz': 'trending',
  'aaut-tarife': 'scale',
  'cmk-tarife': 'scale',
  'yargi-haritasi': 'map',
  'icra-masrafi': 'gavel',
  'garameten-paylastirma': 'percent',

  // Teftiş kontrolleri
  'terfi-cetveli': 'award',
  'karar-defteri': 'clipboard',
  'istinaf-defteri': 'clipboard',
  'iddianame': 'clock',
  'tensip': 'clock',
  'durusma-kacagi': 'clock',
  'byu': 'clock',
  'byu-dosyalar': 'folder',
  'gerekceli-karar': 'clock',
  'kanun-yolu': 'route',
  'kesinlestirme': 'shield',
  'gider-kontrolu': 'receipt',
  'hedef-sure': 'clock',
  'kalem-denetimi': 'check',
  'harc-tahsil': 'receipt',
  'kesinlesme-zamani': 'calendar',
  'json-robot': 'code',

  // Hukuk mahkemeleri
  'hukuk-mahkemeleri': 'gavel',
  'bosanma-karari': 'users',
  'konsolosluk': 'globe',
  'almanya-posta': 'globe',
  'udf': 'document',
  'udf-goruntuleyici': 'eye',
  'udf-editor': 'document',
  'udf-birlestirme': 'layers',
  'derdest': 'table',
  'hukuk-tam-kabul': 'check',
  'hukuk-kismen-kabul': 'percent',
  'hukuk-red': 'scale',
  'hukuk-husumet': 'scale',
  'hukuk-acilmamis': 'document',
  'hukuk-feragat': 'document',
  'hukuk-sulh': 'users',
  'hukuk-davayi-kabul': 'check',
  'hukuk-nafaka-tam': 'scale',
  'hukuk-nafaka-kismen': 'scale',
  'hukuk-maddi-tazminat': 'calculator',
  'hukuk-manevi-tazminat': 'scale',
  'hukuki-hesaplamalar': 'calculator',
  'iscilik-alacagi': 'briefcase',
  'brut-net': 'percent',
  'arabuluculuk-ucreti': 'users',
  'infaz-yatar': 'shield',
  'dava-zamanasimi': 'clock',
  'dilekce-sablonlari': 'document',
  'kidem-ihbar': 'briefcase',
  'kira-artis': 'home',
  'miras-payi': 'users',
  'aidat-gecikme': 'home',

  // Sınav ve kaynak
  'mulakat': 'message',
  'hukuk-sozlugu': 'book',
  'adli-cevre': 'map',
  'on-parmak': 'keyboard',
  'on-parmak-dersler': 'keyboard',
  'hizli-okuma': 'eye',
  'gunluk-hesaplamalar': 'calculator',
  'qr-kod-olusturma': 'qr',
  'bulmaca': 'puzzle',
  'tarihte-bugun': 'calendar',
  'tekerlemeler': 'mic',
  'kamu-misafirhaneleri': 'home',
  'gys-sinav': 'award',

  // Uygulamalar
  'dikte': 'mic',
  'barkod': 'barcode',
  'ikm-boy-kilo': 'shield',
};

const YOL_IKON: Record<string, AracIkonBilgi> = {
  '/enflasyon-farki-hesaplama-robotu/': { ikon: 'trending', ton: 'maas' },
  '/memur-maas-hesaplama/': { ikon: 'wallet', ton: 'maas' },
  '/kesinlesme/': { ikon: 'calendar', ton: 'yargi' },
  '/yargilamagideri/': { ikon: 'receipt', ton: 'yargi' },
  '/adliye-dosya-takip-programi-mudurun-dolabi-mini/': { ikon: 'folder', ton: 'teftis' },
  'https://dikte.657.com.tr/': { ikon: 'mic', ton: 'uygulama' },
};

export function kategoriIkonu(kategoriId: string): AracIkonBilgi {
  return KATEGORI_IKON[kategoriId] ?? { ikon: 'calculator', ton: 'hukuk' };
}

export function aracIkonu(arac: Pick<Arac, 'id' | 'category'>): AracIkonBilgi {
  const kat = kategoriIkonu(arac.category);
  return {
    ikon: ARAC_IKON[arac.id] ?? kat.ikon,
    ton: kat.ton,
  };
}

export function yolIkonu(yol: string): AracIkonBilgi {
  return YOL_IKON[yol] ?? { ikon: 'calculator', ton: 'hukuk' };
}
