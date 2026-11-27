import type { GysSoru } from '../lib/gys-motor';

export interface GysKonu {
  no: string;
  id: string;
  grup: 'ortak' | 'alan';
  ad: string;
  kisa: string;
  kanun: string;
  bolumler: string[];
  mevzuatUrl: string;
}

const KONU_KEY = '657:gys-konu-tamam:v1';
const KAYIT_KEY = '657:gys-kayitli:v1';
const BUGUN_KEY = '657:gys-bugun:v1';
const OTO_KEY = '657:gys-otomatik:v1';

function bugunTarih(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function tamamlananKonularOku(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(KONU_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function tamamlananKonularKaydet(set: Set<string>): void {
  try {
    localStorage.setItem(KONU_KEY, JSON.stringify([...set]));
  } catch { /* geç */ }
}

export function kayitliSorularOku(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(KAYIT_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function kayitliSorularKaydet(set: Set<string>): void {
  try {
    localStorage.setItem(KAYIT_KEY, JSON.stringify([...set]));
  } catch { /* geç */ }
}

export function bugunCozulenOku(): number {
  try {
    const raw = JSON.parse(localStorage.getItem(BUGUN_KEY) || '{}') as { tarih?: string; adet?: number };
    return raw.tarih === bugunTarih() && typeof raw.adet === 'number' ? raw.adet : 0;
  } catch {
    return 0;
  }
}

export function bugunCozulenArtir(): number {
  const yeni = bugunCozulenOku() + 1;
  try {
    localStorage.setItem(BUGUN_KEY, JSON.stringify({ tarih: bugunTarih(), adet: yeni }));
  } catch { /* geç */ }
  return yeni;
}

export function otomatikGecisOku(): boolean {
  try {
    return localStorage.getItem(OTO_KEY) === '1';
  } catch {
    return false;
  }
}

export function otomatikGecisKaydet(v: boolean): void {
  try {
    localStorage.setItem(OTO_KEY, v ? '1' : '0');
  } catch { /* geç */ }
}


/** Konu testi havuzu: konunun bölümleri; 5 sorudan azsa aynı dersin bütün soruları. */
export function konuHavuzu(k: GysKonu, tumSorular: GysSoru[]): GysSoru[] {
  const bolumSet = new Set(k.bolumler);
  const tam = tumSorular.filter((s) => bolumSet.has(s.bolum));
  if (tam.length >= 5) return tam;
  const kanunlu = tumSorular.filter((s) => s.kanun === k.kanun);
  return kanunlu.length > tam.length ? kanunlu : tam.length ? tam : tumSorular;
}
