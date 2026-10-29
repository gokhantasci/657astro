import { aylikVergi, yuvarla, type VergiTarifesi } from './vergi';

// Kıdem ve ihbar tazminatı (1475 s. K. m.14, 4857 s. K. m.17). Saf hesap; tavan ve vergi tarifesi dışarıdan verilir.
// Süre ÇSGB hesabındaki gibi takvim yılı/ay/gün olarak bulunur (çıkış günü dahil); kıdem = ücret × yıl + ücret/12 × ay
// + ücret/365 × gün, ücret tavanla sınırlanır. Saffet Çelik 365/30 günlük bloklar kullanır; artık yıl ve 31 çeken
// aylarda bir günlük fark doğabilir (bkz. tests/kidem-ihbar.spec.ts).
// Bilinçli fark: kaynaklar ihbar gelir vergisini sabit %15 sayar; burada çıkış yılının tarifesiyle, önceki kümülatif
// matrah üzerinden dilimli hesaplanır. Önceki matrah 0 ise ilk dilim (%15) uygulanır.
export interface Tavan { baslangic: string; bitis: string; tutar: number }
export interface KidemGirdi { giris: string; cikis: string; ucret: number; ihbar: boolean; oncekiMatrah?: number }

const tarih = (iso: string) => { const [y, a, g] = iso.split('-').map(Number); return new Date(Date.UTC(y, a - 1, g)); };
export function sure(girisIso: string, cikisIso: string) {
  const g = tarih(girisIso), c = tarih(cikisIso);
  c.setUTCDate(c.getUTCDate() + 1); // çıkış günü çalışılmış sayılır
  let yil = c.getUTCFullYear() - g.getUTCFullYear(), ay = c.getUTCMonth() - g.getUTCMonth(), gun = c.getUTCDate() - g.getUTCDate();
  if (gun < 0) { ay--; gun += new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth(), 0)).getUTCDate(); }
  if (ay < 0) { yil--; ay += 12; }
  const toplamGun = Math.round((c.getTime() - g.getTime()) / 864e5);
  return { yil, ay, gun, toplamGun };
}
// İş Kanunu m.17: 6 aydan az 2, 6 ay–1,5 yıl 4, 1,5–3 yıl 6, 3 yıldan fazla 8 hafta.
export const ihbarHaftasi = (s: { yil: number; ay: number; gun: number }) => {
  const ayToplam = s.yil * 12 + s.ay + (s.gun > 0 ? 0.01 : 0);
  return ayToplam < 6 ? 2 : ayToplam < 18 ? 4 : ayToplam <= 36 ? 6 : 8;
};

export function kidemIhbar(g: KidemGirdi, tavanlar: Tavan[], vergi: VergiTarifesi) {
  if (!g.giris || !g.cikis) throw new Error('İşe giriş ve çıkış tarihlerini girin.');
  if (g.cikis <= g.giris) throw new Error('Çıkış tarihi giriş tarihinden sonra olmalıdır.');
  if (!(g.ucret > 0)) throw new Error('Giydirilmiş brüt aylık ücreti girin.');
  const tavan = tavanlar.find(t => g.cikis >= t.baslangic && g.cikis <= t.bitis);
  if (!tavan) throw new Error('Çıkış tarihine ait kıdem tazminatı tavanı kayıtlı değil.');
  const s = sure(g.giris, g.cikis);
  const esas = Math.min(g.ucret, tavan.tutar);
  const kidemHakki = s.yil >= 1;
  const brutKidem = kidemHakki ? yuvarla(esas * s.yil + esas / 12 * s.ay + esas / 365 * s.gun) : 0;
  const damgaKidem = yuvarla(brutKidem * vergi.damgaOrani / 1000);
  const hafta = g.ihbar ? ihbarHaftasi(s) : 0;
  const brutIhbar = yuvarla(g.ucret / 30 * hafta * 7);
  const gvIhbar = brutIhbar ? aylikVergi(brutIhbar, g.oncekiMatrah ?? 0, vergi) : 0;
  const damgaIhbar = yuvarla(brutIhbar * vergi.damgaOrani / 1000);
  const netKidem = yuvarla(brutKidem - damgaKidem), netIhbar = yuvarla(brutIhbar - gvIhbar - damgaIhbar);
  return { sure: s, tavan: tavan.tutar, tavanUygulandi: g.ucret > tavan.tutar, kidemHakki, brutKidem, damgaKidem, netKidem,
    ihbarHafta: hafta, brutIhbar, gvIhbar, damgaIhbar, netIhbar, toplamNet: yuvarla(netKidem + netIhbar) };
}
