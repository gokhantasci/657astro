// Yargılama gideri, vekalet ücreti ve harçların taraflar arasında paylaştırılması.
// Hüküm metni canlıdaki assets/js/yargilama-paylasim.js ile birebir aynıdır (kararlara yapıştırılıyor).

export interface Taraf { ad: string; miktar: number }
const binler = (x: number) => (Number(x) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function pay(toplam: number, taraflar: Taraf[]) {
  const taban = taraflar.reduce((a, t) => a + (t.miktar || 0), 0);
  if (toplam <= 0 || taban <= 0) return [];
  return taraflar.filter(t => t.miktar > 0).map(t => ({ ad: t.ad, tutar: (toplam * t.miktar) / taban }));
}

function bolum(toplam: number, giris: string, son: string, taraflar: Taraf[]) {
  const paylar = pay(toplam, taraflar);
  if (!paylar.length) return '';
  return `${giris} ${paylar.map(p => `${p.tutar.toFixed(2)} TL'sinin ${p.ad}'den`).join(', ')} ${son}`;
}

export function hukumMetni(k: { yargilama: number; vekalet: number; harc: number }, taraflar: Taraf[]) {
  return [
    bolum(k.vekalet, `- Davacı lehine hükmolunan toplam ${binler(k.vekalet)} TL vekalet ücretinin;`, 'alınarak kendisini vekaletnameli vekil ile temsil ettiren davacıya verilmesine,', taraflar),
    bolum(k.harc, `- Harçlar Kanunu uyarınca alınması gereken toplam ${binler(k.harc)} TL'nin;`, 'alınarak hazineye irat kaydına,', taraflar),
    bolum(k.yargilama, `- Davacı tarafından yapılan toplam ${binler(k.yargilama)} TL yargılama giderinin;`, 'alınarak davacıya verilmesine,', taraflar),
  ].filter(Boolean).join('\n\n');
}
