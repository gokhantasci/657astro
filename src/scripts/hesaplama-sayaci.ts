// Hesaplama araçlarındaki canlı sayaçları yönetir, sunucu/CF API ile senkronize eder.

export type SayacTuru = 'enflasyon' | 'maas' | 'kesinlesme' | 'yargilama';
import { HESAPLAMA_SAYACLARI_AKTIF } from '../lib/hesaplama-sayaclari';

function sayiBicimlendir(s: number): string {
  return s.toLocaleString('tr-TR');
}

// Sayfadaki metinleri günceller
function domGuncelle(tur: SayacTuru, veri: { bugun?: number; buHafta?: number; buYil?: number; toplam?: number }) {
  const serit = document.querySelector(`[data-hesap-sayaci="${tur}"]`);
  if (serit) {
    if (veri.bugun !== undefined) {
      const el = serit.querySelector('[data-sayac-bugun]');
      if (el) el.textContent = sayiBicimlendir(veri.bugun);
    }
    if (veri.buHafta !== undefined) {
      const el = serit.querySelector('[data-sayac-hafta]');
      if (el) el.textContent = sayiBicimlendir(veri.buHafta);
    }
    if (veri.buYil !== undefined) {
      const el = serit.querySelector('[data-sayac-yil]');
      if (el) el.textContent = sayiBicimlendir(veri.buYil);
    }
    if (veri.toplam !== undefined) {
      const el = serit.querySelector('[data-sayac-toplam]');
      if (el) el.textContent = sayiBicimlendir(veri.toplam);
    }
  }

  // Anasayfadaki sayaç kartları
  const kartSayi = document.querySelector(`[data-hesap-sayi="${tur}"]`);
  if (kartSayi && veri.toplam !== undefined) {
    kartSayi.textContent = sayiBicimlendir(veri.toplam);
  }
}

// Canlı veriyi sunucu veya CF API'sinden çek
async function senkronizeEt() {
  if (!HESAPLAMA_SAYACLARI_AKTIF) return;
  try {
    const urls = ['/api/hesaplama', '/_657-servis/api/hesaplama'];
    let resp: Response | null = null;
    for (const url of urls) {
      try {
        const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (r.ok) { resp = r; break; }
      } catch {
        continue;
      }
    }
    if (!resp) return;
    const res = await resp.json();
    if (res && res.sayaclar) {
      for (const [tur, v] of Object.entries(res.sayaclar)) {
        domGuncelle(tur as SayacTuru, v as any);
      }
      if (res.toplam) {
        const homeToplam = document.querySelector('[data-home-toplam-hesaplama]');
        if (homeToplam) homeToplam.textContent = sayiBicimlendir(res.toplam);
      }
    }
  } catch {
    // Ağ yoksa yerel veride kal
  }
}

const sonArtisZamani: Record<string, number> = {};

export function hesaplamaArtir(tur: SayacTuru) {
  if (!HESAPLAMA_SAYACLARI_AKTIF) return;
  try {
    // 1. DOM'u hemen 1 artırarak kullanıcıya anında hissettir
    const serit = document.querySelector(`[data-hesap-sayaci="${tur}"]`);
    if (serit) {
      const artirEl = (sel: string) => {
        const el = serit.querySelector(sel);
        if (el) {
          const val = parseInt(el.textContent?.replace(/\./g, '') || '0', 10);
          el.textContent = sayiBicimlendir(val + 1);
        }
      };
      artirEl('[data-sayac-bugun]');
      artirEl('[data-sayac-hafta]');
      artirEl('[data-sayac-yil]');
      artirEl('[data-sayac-toplam]');
    }

    const kartSayi = document.querySelector(`[data-hesap-sayi="${tur}"]`);
    if (kartSayi) {
      const val = parseInt(kartSayi.textContent?.replace(/\./g, '') || '0', 10);
      kartSayi.textContent = sayiBicimlendir(val + 1);
    }
    const homeToplam = document.querySelector('[data-home-toplam-hesaplama]');
    if (homeToplam) {
      const val = parseInt(homeToplam.textContent?.replace(/\./g, '') || '0', 10);
      homeToplam.textContent = sayiBicimlendir(val + 1);
    }

    // 2. Çok sık istek atmayı engelle (debounce 2 saniye)
    const simdi = Date.now();
    if (sonArtisZamani[tur] && simdi - sonArtisZamani[tur] < 2000) {
      return;
    }
    sonArtisZamani[tur] = simdi;

    // 3. API'ye gönder
    const postBody = JSON.stringify({ tur });
    const gonder = (u: string) => fetch(u, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: postBody,
      keepalive: true
    });

    gonder('/api/hesaplama')
      .then(r => r.ok ? r.json() : gonder('/_657-servis/api/hesaplama').then(r2 => r2.json()))
      .then(res => {
        if (res && res.sayaclar && res.sayaclar[tur]) {
          domGuncelle(tur, res.sayaclar[tur]);
        }
        if (res && res.toplam && homeToplam) {
          homeToplam.textContent = sayiBicimlendir(res.toplam);
        }
      })
      .catch(() => {});
  } catch {
    // sessizce geç
  }
}

// Global window erişimi
if (typeof window !== 'undefined') {
  (window as any).hesaplamaArtir = hesaplamaArtir;
  // Sayfa yüklendiğinde sunucuyla eşitle
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', senkronizeEt);
  } else {
    senkronizeEt();
  }
}
