// Tarife ve katsayı arşivleri için schema.org Dataset kaydı (SEO yol haritası P2-8).
// Kayıtlar ortak veriden üretilir; resmî kaynaklar isBasedOn olarak verilir. Lisans uydurulmaz: resmî metinler kamuya açıktır.
const SITE = 'https://657.com.tr';
export interface DatasetGirdi { ad: string; aciklama: string; yol: string; baslangic: string; bitis?: string | null; kaynaklar: string[]; degiskenler: string[]; anahtar: string[]; guncelleme: string }
export function datasetKaydi(d: DatasetGirdi): Record<string, unknown> {
  return {
    '@context': 'https://schema.org', '@type': 'Dataset', name: d.ad, description: d.aciklama, url: `${SITE}${d.yol}`, inLanguage: 'tr-TR',
    isAccessibleForFree: true, keywords: d.anahtar, temporalCoverage: `${d.baslangic}/${d.bitis ?? '..'}`, spatialCoverage: { '@type': 'Place', name: 'Türkiye' },
    variableMeasured: d.degiskenler, isBasedOn: [...new Set(d.kaynaklar)], creator: { '@id': `${SITE}/#kurulus` }, publisher: { '@id': `${SITE}/#kurulus` },
    // Son kaydın yürürlük tarihi; derleme tarihi kullanılmaz.
    dateModified: d.guncelleme,
  };
}
