import ana from '../data/dilekce-sablonlari.json';
import ek from '../data/dilekce-sablonlari-ek.json';

export interface DilekceSablonu {
  id: string;
  baslik: string;
  kisaAd: string;
  alan: string;
  mahkeme: string;
  dayanak: string[];
  yaziSlug?: string;
  ozet?: string;
  dikkat?: string[];
  ictihat?: string;
  metin: string;
}

export const dilekceSablonlari: DilekceSablonu[] = [...ana, ...ek];

export const dilekceAlanlari = [...new Set(dilekceSablonlari.map((s) => s.alan))];

export const udfEditordeAc = (id: string) =>
  `https://udf.657.com.tr/linkac=https://657.com.tr/veri/sablonlar/${id}.udf`;

export const sablonDetayYolu = (s: DilekceSablonu) =>
  s.yaziSlug ? `/${s.yaziSlug}/` : `/dilekce-sablonlari/${s.id}/`;
