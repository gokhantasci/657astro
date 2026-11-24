// Adalet Bakanlığı (PGM / CTE) Zabıt Kâtipliği Uygulamalı Sınav Değerlendirme Motoru
// Resmî kaynak: 2026 PGM "Zabıt Katibi Uygulamalı Sınav Değerlendirme Kriterleri"

export type YazimModu = 'imlasiz' | 'imlasiz-ozel' | 'imlali';

export type HataTuru =
  | 'dogru'
  | 'fazla-vurus'
  | 'eksik-vurus'
  | 'harf-yer-degistirme'
  | 'karakter'
  | 'kelime-bolme'
  | 'kelime-birlestirme'
  | 'karisik'
  | 'atlanan';

export interface KelimeKarsilastirma {
  hedef: string;
  yazilan: string;
  durum: HataTuru;
  hataSayisi: number;
}

export interface DegerlendirmeSonucu {
  toplamYazilan: number;
  dogruKelime: number;
  hataliKelime: number;
  netKelime: number;
  atlananKelime: number;
  fazlaBoslukHatasi: number;
  hataOrani: number; // % (0-100)
  anlamButunlugu: boolean; // hataOrani <= 25
  atlamaSiniriAsildi: boolean; // atlananKelime >= 22
  basarili: boolean; // 3dk için net >= 90 && anlamButunlugu && !atlamaSiniriAsildi
  basarisizlikNedeni: string[];
  dks: number; // Dakika başına net kelime
  ucDakikaEsdegeri: number;
  toplamVurus: number;
  dogruVurus: number;
  yanlisVurus: number;
  dogrulukYuzdesi: number;
  hataDagilimi: {
    fazlaVurus: number;
    eksikVurus: number;
    harfYerDegistirme: number;
    karakter: number;
    kelimeBolme: number;
    kelimeBirlestirme: number;
    fazlaBosluk: number;
    karisik: number;
  };
  zayifTuslar: { tus: string; hata: number }[];
  detay: KelimeKarsilastirma[];
}

export function metinHazirla(ham: string, mod: YazimModu): string {
  const duz = ham.replace(/\s+/g, ' ').trim();
  if (mod === 'imlali') return duz;
  if (mod === 'imlasiz-ozel') {
    return duz
      .toLocaleLowerCase('tr-TR')
      .replace(/[.,;:!?"""“”()[\]{}–—…]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  // Resmî Adalet Bakanlığı formatı: tamamı küçük harf, noktalama işaretsiz
  return duz
    .toLocaleLowerCase('tr-TR')
    .replace(/['’‘"“”.,;:!?()[\]{}\-–—/\\…*+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isFazlaVurus(hedef: string, yazilan: string): boolean {
  if (yazilan.length <= hedef.length) return false;
  let i = 0;
  let j = 0;
  while (i < hedef.length && j < yazilan.length) {
    if (hedef[i] === yazilan[j]) {
      i++;
      j++;
    } else if (j > 0 && yazilan[j] === yazilan[j - 1]) {
      j++;
    } else if (i < hedef.length && j + 1 < yazilan.length && yazilan[j] === hedef[i]) {
      j++;
    } else {
      return false;
    }
  }
  while (j < yazilan.length && j > 0 && yazilan[j] === yazilan[j - 1]) j++;
  return i === hedef.length && j === yazilan.length;
}

function isEksikVurus(hedef: string, yazilan: string): boolean {
  if (yazilan.length >= hedef.length || yazilan.length === 0) return false;
  let i = 0;
  let j = 0;
  while (i < hedef.length && j < yazilan.length) {
    if (hedef[i] === yazilan[j]) {
      i++;
      j++;
    } else {
      i++;
    }
  }
  return j === yazilan.length;
}

function isHarfYerDegistirme(hedef: string, yazilan: string): boolean {
  if (hedef.length !== yazilan.length || hedef.length < 2) return false;
  const diffs: number[] = [];
  for (let i = 0; i < hedef.length; i++) {
    if (hedef[i] !== yazilan[i]) diffs.push(i);
  }
  if (diffs.length !== 2) return false;
  const [a, b] = diffs;
  return hedef[a] === yazilan[b] && hedef[b] === yazilan[a];
}

function hasKarakterHatasi(hedef: string, yazilan: string): boolean {
  const noktalama = /[.,;:!?0-9@#$%^&*()_+=[\]{}<>/\\|~`"'–—-]/;
  return !noktalama.test(hedef) && noktalama.test(yazilan);
}

export function hataTuruBelirle(hedef: string, yazilan: string): HataTuru {
  if (hedef === yazilan) return 'dogru';
  if (hasKarakterHatasi(hedef, yazilan)) return 'karakter';
  if (isHarfYerDegistirme(hedef, yazilan)) return 'harf-yer-degistirme';
  if (isFazlaVurus(hedef, yazilan)) return 'fazla-vurus';
  if (isEksikVurus(hedef, yazilan)) return 'eksik-vurus';
  return 'karisik';
}

function zayifTusTopla(hedef: string, yazilan: string, harita: Map<string, number>): void {
  const len = Math.max(hedef.length, yazilan.length);
  for (let i = 0; i < len; i++) {
    const h = hedef[i];
    const y = yazilan[i];
    if (h && h !== y) {
      const k = h.toLocaleLowerCase('tr-TR');
      if (/[a-zçğıöşü]/.test(k)) {
        harita.set(k, (harita.get(k) ?? 0) + 1);
      }
    }
  }
}

export function sinavDegerlendir(
  hedefMetin: string,
  yazilanHam: string,
  gecenSaniye: number,
  sinavSuresiSaniye = 180
): DegerlendirmeSonucu {
  // Fazla boşluk hatası: art arda 2+ boşluk veya satır sonu sayısı (her ardışık boşluk grubu 1 hata)
  const kirpilmis = yazilanHam.trim();
  const fazlaBoslukGruplari = kirpilmis.match(/ {2,}|\n+/g) ?? [];
  const fazlaBoslukHatasi = fazlaBoslukGruplari.length;

  const hedefKelimeler = hedefMetin.trim() ? hedefMetin.trim().split(/\s+/) : [];
  const yazilanKelimeler = kirpilmis ? kirpilmis.split(/\s+/) : [];

  const detay: KelimeKarsilastirma[] = [];
  const zayifHarita = new Map<string, number>();
  const hataDagilimi = {
    fazlaVurus: 0,
    eksikVurus: 0,
    harfYerDegistirme: 0,
    karakter: 0,
    kelimeBolme: 0,
    kelimeBirlestirme: 0,
    fazlaBosluk: fazlaBoslukHatasi,
    karisik: 0,
  };

  let ti = 0; // hedef index
  let ui = 0; // yazılan index
  let dogruKelime = 0;
  let hataliKelime = fazlaBoslukHatasi;
  let atlananKelime = 0;
  let dogruVurus = 0;
  let yanlisVurus = 0;

  while (ui < yazilanKelimeler.length && ti < hedefKelimeler.length) {
    const tWord = hedefKelimeler[ti];
    const uWord = yazilanKelimeler[ui];

    // 1. Tam eşleşme
    if (tWord === uWord) {
      detay.push({ hedef: tWord, yazilan: uWord, durum: 'dogru', hataSayisi: 0 });
      dogruKelime++;
      dogruVurus += tWord.length + 1;
      ti++;
      ui++;
      continue;
    }

    // 2. Kelime birleştirme kontrolü (tWord + tNext ≈ uWord)
    if (ti + 1 < hedefKelimeler.length) {
      const birlesik = tWord + hedefKelimeler[ti + 1];
      if (
        uWord === birlesik ||
        (uWord.length >= birlesik.length - 2 &&
          uWord.length <= birlesik.length + 2 &&
          uWord.startsWith(tWord.slice(0, Math.min(3, tWord.length))) &&
          uWord.endsWith(hedefKelimeler[ti + 1].slice(-Math.min(3, hedefKelimeler[ti + 1].length))))
      ) {
        detay.push({
          hedef: `${tWord} ${hedefKelimeler[ti + 1]}`,
          yazilan: uWord,
          durum: 'kelime-birlestirme',
          hataSayisi: 1,
        });
        hataDagilimi.kelimeBirlestirme++;
        hataliKelime += 1;
        yanlisVurus += uWord.length;
        ti += 2;
        ui += 1;
        continue;
      }
    }

    // 3. Kelime bölme kontrolü (uWord + uNext (+ uNext2) ≈ tWord)
    let bolmeBulundu = false;
    for (let span = 2; span <= 4 && ui + span <= yazilanKelimeler.length; span++) {
      const parcalar = yazilanKelimeler.slice(ui, ui + span);
      const birlestirilmis = parcalar.join('');
      if (birlestirilmis === tWord) {
        // Doğru yazılmak şartıyla bölünmüş -> 1 hata
        detay.push({
          hedef: tWord,
          yazilan: parcalar.join(' '),
          durum: 'kelime-bolme',
          hataSayisi: 1,
        });
        hataDagilimi.kelimeBolme += 1;
        hataliKelime += 1;
        yanlisVurus += parcalar.join(' ').length;
        ti += 1;
        ui += span;
        bolmeBulundu = true;
        break;
      }
      // Yanlış yazılmak şartıyla bölünmüş (ör: adalet => ada al et)
      if (
        tWord.length >= 5 &&
        birlestirilmis.length >= tWord.length - 1 &&
        birlestirilmis.length <= tWord.length + 2 &&
        parcalar[0].length < tWord.length &&
        tWord.startsWith(parcalar[0].slice(0, 2)) &&
        tWord.endsWith(parcalar[parcalar.length - 1].slice(-2)) &&
        ti + 1 < hedefKelimeler.length &&
        ui + span < yazilanKelimeler.length &&
        yazilanKelimeler[ui + span] === hedefKelimeler[ti + 1]
      ) {
        detay.push({
          hedef: tWord,
          yazilan: parcalar.join(' '),
          durum: 'kelime-bolme',
          hataSayisi: span,
        });
        hataDagilimi.kelimeBolme += span;
        hataliKelime += span;
        yanlisVurus += parcalar.join(' ').length;
        ti += 1;
        ui += span;
        bolmeBulundu = true;
        break;
      }
    }
    if (bolmeBulundu) continue;

    // 4. Atlanan kelime kontrolü (ileri bakış: uWord sonraki 1..10 hedef kelimeden biriyle eşleşiyor mu?)
    let atlamaMesafesi = -1;
    for (let look = 1; look <= 10 && ti + look < hedefKelimeler.length; look++) {
      if (hedefKelimeler[ti + look] === uWord) {
        // Sonraki kelime de uyuyorsa veya look <= 3 ise kesin atlama
        const sonrakiUyumlu =
          ui + 1 < yazilanKelimeler.length &&
          ti + look + 1 < hedefKelimeler.length &&
          hedefKelimeler[ti + look + 1] === yazilanKelimeler[ui + 1];
        if (sonrakiUyumlu || look <= 2) {
          atlamaMesafesi = look;
          break;
        }
      }
    }
    if (atlamaMesafesi > 0) {
      for (let k = 0; k < atlamaMesafesi; k++) {
        detay.push({ hedef: hedefKelimeler[ti + k], yazilan: '', durum: 'atlanan', hataSayisi: 0 });
        atlananKelime++;
      }
      ti += atlamaMesafesi;
      continue;
    }

    // 5. Tekil kelime hatası sınıflandırma
    const tur = hataTuruBelirle(tWord, uWord);
    detay.push({ hedef: tWord, yazilan: uWord, durum: tur, hataSayisi: 1 });
    hataliKelime++;
    zayifTusTopla(tWord, uWord, zayifHarita);
    yanlisVurus += uWord.length;

    if (tur === 'fazla-vurus') hataDagilimi.fazlaVurus++;
    else if (tur === 'eksik-vurus') hataDagilimi.eksikVurus++;
    else if (tur === 'harf-yer-degistirme') hataDagilimi.harfYerDegistirme++;
    else if (tur === 'karakter') hataDagilimi.karakter++;
    else hataDagilimi.karisik++;

    ti++;
    ui++;
  }

  // Hedef metin bittiyse fazladan yazılan kelimeler karışık hata sayılır
  while (ui < yazilanKelimeler.length) {
    detay.push({ hedef: '', yazilan: yazilanKelimeler[ui], durum: 'karisik', hataSayisi: 1 });
    hataDagilimi.karisik++;
    hataliKelime++;
    yanlisVurus += yazilanKelimeler[ui].length;
    ui++;
  }

  const toplamYazilan = yazilanKelimeler.length;
  const netKelime = Math.max(0, dogruKelime - fazlaBoslukHatasi);
  const hataOrani = toplamYazilan > 0 ? Number(((hataliKelime / toplamYazilan) * 100).toFixed(2)) : 0;
  const anlamButunlugu = toplamYazilan > 0 ? hataOrani <= 25 : true;
  const atlamaSiniriAsildi = atlananKelime >= 22;

  const sureDakika = Math.max(gecenSaniye, 1) / 60;
  const dks = Math.round(netKelime / sureDakika);
  const ucDakikaEsdegeri = Math.round((netKelime / Math.max(gecenSaniye, 1)) * 180);

  // 3 dakikalık resmî sınav barajı 90 net; diğer sürelerde orantılı baraj (dk başı 30 net)
  const hedefBaraj = Math.round((sinavSuresiSaniye / 180) * 90);
  const basarisizlikNedeni: string[] = [];
  if (netKelime < hedefBaraj) {
    basarisizlikNedeni.push(`Net kelime sayısı (${netKelime}) barajın (${hedefBaraj}) altında kaldı.`);
  }
  if (!anlamButunlugu) {
    basarisizlikNedeni.push(`Hata oranı (%${hataOrani}) resmî %25 anlam bütünlüğü sınırını aştı.`);
  }
  if (atlamaSiniriAsildi) {
    basarisizlikNedeni.push(`Atlanan kelime sayısı (${atlananKelime}) resmî 22 kelime sınırına ulaştı.`);
  }
  const basarili = toplamYazilan > 0 && basarisizlikNedeni.length === 0;

  const toplamVurus = yazilanHam.length;
  const dogrulukYuzdesi =
    toplamYazilan > 0 ? Number(((dogruKelime / Math.max(toplamYazilan, 1)) * 100).toFixed(1)) : 0;

  const zayifTuslar = [...zayifHarita.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tus, hata]) => ({ tus, hata }));

  return {
    toplamYazilan,
    dogruKelime,
    hataliKelime,
    netKelime,
    atlananKelime,
    fazlaBoslukHatasi,
    hataOrani,
    anlamButunlugu,
    atlamaSiniriAsildi,
    basarili,
    basarisizlikNedeni,
    dks,
    ucDakikaEsdegeri,
    toplamVurus,
    dogruVurus,
    yanlisVurus,
    dogrulukYuzdesi,
    hataDagilimi,
    zayifTuslar,
    detay,
  };
}
