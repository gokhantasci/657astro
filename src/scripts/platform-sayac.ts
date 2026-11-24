type Donem = {
  bugun: number;
  buHafta: number;
  buAy: number;
  buYil: number;
  toplam: number;
};

type PlatformSayacYaniti = {
  gys: Donem;
  onparmak: Donem;
  saatDilimi?: string;
};

const API = '/_657-servis/api/platform-sayac';
const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString('tr-TR') : '0');

function uygula(veri: PlatformSayacYaniti) {
  for (const tur of ['gys', 'onparmak'] as const) {
    const d = veri[tur];
    if (!d) continue;
    document.querySelectorAll<HTMLElement>(`[data-platform-sayac="${tur}"]`).forEach((kok) => {
      const esles: Array<[keyof Donem, string]> = [
        ['bugun', 'bugun'],
        ['buHafta', 'hafta'],
        ['buAy', 'ay'],
        ['buYil', 'yil'],
        ['toplam', 'toplam'],
      ];
      for (const [alan, attr] of esles) {
        kok.querySelectorAll<HTMLElement>(`[data-ps-${attr}]`).forEach((el) => {
          el.textContent = fmt(d[alan]);
        });
      }
    });
  }
}

export async function platformSayacYenile(): Promise<void> {
  if (typeof document === 'undefined' || !document.querySelector('[data-platform-sayac]')) return;
  try {
    const r = await fetch(API, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!r.ok) return;
    const veri = (await r.json()) as PlatformSayacYaniti;
    uygula(veri);
  } catch {
    /* Ağ erişilemezse mevcut değerler korunur. */
  }
}

if (typeof window !== 'undefined' && document.querySelector('[data-platform-sayac]')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void platformSayacYenile(), { once: true });
  } else {
    void platformSayacYenile();
  }
  setInterval(() => {
    if (!document.hidden) void platformSayacYenile();
  }, 60000);
}
