// İflas idaresi ücreti (İİK 223/3-4, Adalet Bakanlığı tarife tebliği). Bağımlılıksız; sayfa derlemesinde ve tarayıcıda aynı fonksiyon çalışır.
// Canlıdaki eski araç 1-3-6 milyon TL'lik %5/%4/%3 dilimleri kullanıyordu; bu dilimler 2026 tebliğiyle uyuşmadığı için
// yeni sürüm Resmî Gazete'deki 9 dilimi esas alır (bilinçli sapma).
export interface IflasDilim { miktar: number | null; oran: number }
export interface IflasTarifesi { baslangic: string; dilimler: IflasDilim[]; rehinliEkUcretAzamiYuzde: number; mahkemeTakdirAzamiKat: number }

const kurus = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function kademeli(tutar: number, t: IflasTarifesi) {
  let kalan = tutar, alt = 0;
  const satirlar: { alt: number; ust: number | null; oran: number; matrah: number; ucret: number }[] = [];
  for (const d of t.dilimler) {
    if (kalan <= 0) break;
    const matrah = d.miktar === null ? kalan : Math.min(kalan, d.miktar);
    satirlar.push({ alt, ust: d.miktar === null ? null : alt + d.miktar, oran: d.oran, matrah: kurus(matrah), ucret: kurus(matrah * d.oran / 100) });
    kalan -= matrah; alt += d.miktar ?? 0;
  }
  return { satirlar, toplam: kurus(satirlar.reduce((a, s) => a + s.ucret, 0)) };
}

/** Pay cetvelinin düzenlendiği tarihte yürürlükte olan tarife. */
export function iflasTarifesiSec<T extends IflasTarifesi>(tarifeler: T[], tarih: string): T {
  const t = [...tarifeler].sort((a, b) => b.baslangic.localeCompare(a.baslangic)).find(x => x.baslangic <= tarih);
  if (!t) throw new Error('Bu tarih için kayıtlı tarife yok; pay cetveli tarihini kontrol edin.');
  return t;
}

export function iflasIdareUcreti(adiAlacak: number, t: IflasTarifesi, rehinliAlacak = 0) {
  if (!Number.isFinite(adiAlacak) || adiAlacak <= 0 || adiAlacak > 1e13) throw new Error('Adi alacaklılara ödenecek toplam tutarı sıfırdan büyük girin.');
  if (!Number.isFinite(rehinliAlacak) || rehinliAlacak < 0 || rehinliAlacak > 1e13) throw new Error('Rehinli alacak tutarı sıfır ya da pozitif olmalıdır.');
  const adi = kademeli(adiAlacak, t);
  // Rehinli alacak için ek ücret: aynı nispetlerle bulunan tutarın en çok %25'i (Tebliğ m.6/2). Ödenmesi takdire bağlıdır.
  const rehinliEkAzami = rehinliAlacak > 0 ? kurus(kademeli(rehinliAlacak, t).toplam * t.rehinliEkUcretAzamiYuzde / 100) : 0;
  return {
    dilimler: adi.satirlar, ucret: adi.toplam, rehinliEkAzami,
    // İcra mahkemesi tarifedeki miktarın bir katı fazlasına kadar takdir edebilir (Tebliğ m.7/1).
    mahkemeAzami: kurus(adi.toplam * t.mahkemeTakdirAzamiKat),
    efektifOran: kurus(adi.toplam / adiAlacak * 100 * 100) / 100,
  };
}
