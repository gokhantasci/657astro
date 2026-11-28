import type { Page, Request } from '@playwright/test';

// Kullanım ve okunma sayaçları yalnız {istekId, tur, path} gönderir; belge içeriği taşımaz.
const SAYAC_YOLU = /\/_657-servis\/api\/(hesaplama|okunma|indirme)$/;
const SAYAC_ALANLARI = new Set(['istekId', 'tur', 'path']);

/**
 * Sayfadan çıkan POST isteklerini izler. Yalnız sayaç alanları taşıyan sayaç istekleri sayılmaz;
 * geri kalan her istek (kişisel veri taşıyabilecek her şey) listeye eklenir.
 */
export function disIstekleriIzle(page: Page): string[] {
  const liste: string[] = [];
  page.on('request', (r: Request) => {
    if (r.method() !== 'POST') return;
    if (SAYAC_YOLU.test(new URL(r.url()).pathname)) {
      let govde: unknown = null;
      try {
        govde = r.postDataJSON();
      } catch {
        govde = null;
      }
      if (govde && typeof govde === 'object' && Object.keys(govde).every((k) => SAYAC_ALANLARI.has(k))) return;
    }
    liste.push(`${r.url()} ${(r.postData() ?? '').slice(0, 80)}`);
  });
  return liste;
}
