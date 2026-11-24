import { yerelYol } from '../lib/site-yolu';

interface Ders {
  id: string;
  duzen: 'f' | 'q';
  baslik: string;
  aciklama: string;
  tuslar: string;
  metin: string;
}

const F_DERSLER: Ders[] = [
  {
    id: 'f-1', duzen: 'f', baslik: '1. Temel Sıra – İşaret Parmakları (a, k, ü, t)',
    aciklama: 'Sol işaret parmağı A ve Ü, sağ işaret parmağı K ve T tuşlarına basar.',
    tuslar: 'a k ü t',
    metin: 'ak ka at ta ak ka at ta aka kata taka ata kaka tat kat tak akat katak takat ataka ütü kütük tütük ütü akü kütük ataka taka kata ak ka at ta ütü akü katak takat',
  },
  {
    id: 'f-2', duzen: 'f', baslik: '2. Temel Sıra – Orta Parmaklar (e, m)',
    aciklama: 'Sol orta parmak E, sağ orta parmak M tuşunu kontrol eder.',
    tuslar: 'a k ü t e m',
    metin: 'em me ek ke et te ama eke emek etek kema kete meke tema teke metek yemek temek akem makam matema tekme ekmek kemek emekli metek etek kete tema ameka',
  },
  {
    id: 'f-3', duzen: 'f', baslik: '3. Temel Sıra – Yüzük Parmakları (i, l)',
    aciklama: 'Sol yüzük parmağı İ, sağ yüzük parmağı L tuşlarına basar.',
    tuslar: 'a k ü t e m i l',
    metin: 'il li el le al la ali ela ile kalem kale kilim kule liman malik melik millet mimik teklif temlik ilke ilmek kemal kemik kilim kule leke liman makale malik melek',
  },
  {
    id: 'f-4', duzen: 'f', baslik: '4. Temel Sıra – Serçe Parmakları (u, y, ş)',
    aciklama: 'Sol serçe U, sağ serçe Y ve Ş tuşlarını kullanır.',
    tuslar: 'u i e a ü t k m l y ş',
    metin: 'ul lu uy yu uş şu yaka yala yama yata yele yemek yetim yetki yıkım yulaf yumak şaka şale şema şule şükür müşkül müştak yaşlı yeşil yokuş uşak uyku uymak uyumak şaşkın',
  },
  {
    id: 'f-5', duzen: 'f', baslik: '5. Temel Sıra – Tam Birleşim ve Hız',
    aciklama: 'TS 2117 F klavye temel sırasının tamamıyla akıcı Türkçe kelimeler.',
    tuslar: 'u i e a ü t k m l y ş',
    metin: 'akıl alem amel ekmek elma emek emlak ilke ilmek kale kalem kemal kilim kule kulak kumlu leylek liman makale makam makul malik melek memleket millet mühim şema şule taklit talim temel temsil tüketti uyumlu yakıt yalım yelek yemek yemin yetim yetki yulaf yumak',
  },
  {
    id: 'f-6', duzen: 'f', baslik: '6. Üst Sıra – Sol El (f, g, ğ, ı, o)',
    aciklama: 'Sol el parmakları temel sıradan üst sıraya uzanır ve geri döner.',
    tuslar: 'f g ğ ı o',
    metin: 'foya gala gıda ığdır ışık ılık odak ofis okul olgu olay olgun onay oyun faul fil filo fıkıh gafil gamze gönül gözlem ığdır ışık ıslak kılavuz kıyamet oluklu omlet ortak otlak oyuk',
  },
  {
    id: 'f-7', duzen: 'f', baslik: '7. Üst Sıra – Sağ El (d, r, n, h, p)',
    aciklama: 'Sağ el üst sıra: d, r, n, h, p harfleriyle adli terimler.',
    tuslar: 'd r n h p',
    metin: 'dava delil duruşma dilekçe hakim harç hukuk hüküm karar kanun katip mahkeme memur noter nüsha onay oran parlamento personel rapor resmi rica tanık tebligat tutanak yargı yetki',
  },
  {
    id: 'f-8', duzen: 'f', baslik: '8. Alt Sıra – Sol El (j, ö, v, c, ç)',
    aciklama: 'Sol el alt sıra: j, ö, v, c, ç tuşları.',
    tuslar: 'j ö v c ç',
    metin: 'jale jüri ödev ödül öğle önlem örnek özet özür vade vakıf vekil vergi vicdan cadde caiz cevap ceza cihaz cuma cümle çaba çağrı çalışma çevre çizelge çözüm',
  },
  {
    id: 'f-9', duzen: 'f', baslik: '9. Alt Sıra – Sağ El (z, s, b)',
    aciklama: 'Sağ el alt sıra: z, s, b tuşlarıyla tam klavye hakimiyeti.',
    tuslar: 'z s b',
    metin: 'zabıt zaman zarf cezaevi savcı savunma senet sicil sistem sözleşme suç sübut bakanlık başvuru belge bilirkişi bordro büro bütçe zabıt katibi serbest savunma',
  },
  {
    id: 'f-10', duzen: 'f', baslik: '10. Büyük Harfler (Shift) ve Noktalama',
    aciklama: 'Sağ ve sol Shift tuşlarını karşı el ile kullanarak resmî yazışma pratiği.',
    tuslar: 'Shift . , :',
    metin: 'T.C. Adalet Bakanlığı, 657 sayılı Devlet Memurları Kanunu uyarınca tüm yargı birimlerinde resmî yazışma kurallarına uyulmasını esas alır. Zabıt kâtibi, duruşma tutanaklarını eksiksiz ve hatasız yazar.',
  },
  {
    id: 'f-11', duzen: 'f', baslik: '11. Sayılar, Tarihler ve Mevzuat Maddeleri',
    aciklama: 'Üst sayı sırası ve hukuki madde numaralarıyla çalışma.',
    tuslar: '1 2 3 4 5 6 7 8 9 0',
    metin: '657 sayılı Kanunun 48, 54, 74 ve 154 üncü maddeleri ile 6100 sayılı HMK 200, 341 ve 362 nci maddeleri uygulamada sık kullanılır. 2026 yılında 3 dakikada en az 90 net kelime yazılması gerekir.',
  },
  {
    id: 'f-12', duzen: 'f', baslik: '12. Daktilografi Hız ve Ritm Finali',
    aciklama: 'Tüm harfleri kapsayan adalet ve hukuk devleti hız çalışması.',
    tuslar: 'Tüm Tuşlar',
    metin: 'adalet devletin temelidir hukuk devleti insan haklarına saygılı bu hak ve özgürlükleri koruyup güçlendiren her eylem ve işlemi hukuka uygun olan devlettir mahkemelerin bağımsızlığı ve hakimlik teminatı hukuk devletinin vazgeçilmez unsurlarıdır yargı yetkisi türk milleti adına bağımsız ve tarafsız mahkemelerce kullanılır',
  },
];

const Q_DERSLER: Ders[] = [
  {
    id: 'q-1', duzen: 'q', baslik: '1. Temel Sıra – İşaret Parmakları (f, j, g, h)',
    aciklama: 'Sol işaret parmağı F ve G, sağ işaret parmağı J ve H tuşlarını kontrol eder.',
    tuslar: 'f j g h',
    metin: 'ff jj gg hh fj jf gh hg fg hj jf gf hf gj fh jg ff jj gg hh fj gh jf hg fg hj gf jh',
  },
  {
    id: 'q-2', duzen: 'q', baslik: '2. Temel Sıra – Orta Parmaklar (d, k)',
    aciklama: 'Sol orta parmak D, sağ orta parmak K tuşuna basar.',
    tuslar: 'd k f j g h',
    metin: 'dk kd df kj dg kh fd jk gd hk dkf jkd fdk kdf gdk hkd dfg hjk kfd jgd hdk fjk',
  },
  {
    id: 'q-3', duzen: 'q', baslik: '3. Temel Sıra – Yüzük Parmakları (s, l)',
    aciklama: 'Sol yüzük S, sağ yüzük L tuşlarına basar.',
    tuslar: 's l d k f j g h',
    metin: 'sl ls sd kl sf jl sg hl dsl kls fsl jls gsl hls sdl kld fls jls sld kds',
  },
  {
    id: 'q-4', duzen: 'q', baslik: '4. Temel Sıra – Serçe Parmakları (a, ş, i)',
    aciklama: 'Sol serçe A, sağ serçe Ş ve İ tuşlarıyla temel sıra tamamlanır.',
    tuslar: 'a s d f g h j k l ş i',
    metin: 'ada adaş adil afiş akıl akış alan alay asıl asil aşık dada dadı dahil dakika dala dalga defa delik dil dikiş fasıl fidan gafil galip hacı hadis hakim hala halk hamle hasıl hata hayal hilal his hisse',
  },
  {
    id: 'q-5', duzen: 'q', baslik: '5. Temel Sıra – Tam Birleşim',
    aciklama: 'Q klavye temel sırasındaki tüm harflerle akıcı Türkçe kelimeler.',
    tuslar: 'a s d f g h j k l ş i',
    metin: 'iade idare iddia ifade iflas ihale ihmal ihsan ikaz ikbal ilah ilave ilga ilgi ilik ilke imza inanç inat infaz inşa isabet iskan israf istifa istila işgal işlem itaat ithal itibar itiraf itiraz izah izin',
  },
  {
    id: 'q-6', duzen: 'q', baslik: '6. Üst Sıra – Sol El (q, w, e, r, t)',
    aciklama: 'Sol el üst sıra: e, r, t harfleriyle yoğun Türkçe kelime pratiği.',
    tuslar: 'e r t',
    metin: 'dere ders devlet dilekçe direk eser etek evrak ifade karar katip keder kredi kural lider memur merak merkeze metre noter resmi sefer sergi seri taraf tarife tebligat terim terfi tertip tetkik',
  },
  {
    id: 'q-7', duzen: 'q', baslik: '7. Üst Sıra – Sağ El (y, u, ı, o, p, ğ, ü)',
    aciklama: 'Sağ el üst sıra harfleriyle tam üst sıra hakimiyeti.',
    tuslar: 'y u ı o p ğ ü',
    metin: 'yargı yazı yol yolluk yıl yıllık uyap uyum uygula uygulama usul kural kurul kurulu kamu kanun kayıt kayıp okul olay onay ortak otel özel öğle öğrenim ödül ölçü rapor pınar proje puan',
  },
  {
    id: 'q-8', duzen: 'q', baslik: '8. Alt Sıra – Tamamı (z, x, c, v, b, n, m, ö, ç)',
    aciklama: 'Alt sıradaki tüm harflerle dengeli parmak hareketleri.',
    tuslar: 'z c v b n m ö ç',
    metin: 'zabıt zaman zarf ceza cevap cümle vade vekil vergi vicdan bakanlık başvuru belge bilirkişi bordro büro bütçe memur mahkeme mübaşir mülakat neden noter nüsha ödev örnek özet çaba çağrı çalışma çözüm',
  },
  {
    id: 'q-9', duzen: 'q', baslik: '9. Büyük Harfler, Sayılar ve İmla',
    aciklama: 'Resmî yazışma ve kanun maddeleriyle büyük/küçük harf pratiği.',
    tuslar: 'Shift 0-9 . ,',
    metin: 'T.C. Adalet Bakanlığı Personel Genel Müdürlüğü, 2026 yılı uygulamalı sınavında 3 dakikada en az 90 net kelime şartı aramaktadır. 657 sayılı Kanun m. 48 genel şartları düzenler.',
  },
  {
    id: 'q-10', duzen: 'q', baslik: '10. Q Klavye Hız ve Ritm Finali',
    aciklama: 'Tüm harfleri kapsayan duruşma ve kalem hizmetleri metni.',
    tuslar: 'Tüm Tuşlar',
    metin: 'zabıt katibi adliye teşkilatının en önemli görevlilerinden biridir duruşmalarda hakim veya mahkeme başkanı ile birlikte hazır bulunur ifade ve beyanları tutanağa geçirir kararların yazılmasını tebligatların çıkarılmasını dosyaların düzenli bir şekilde muhafaza edilmesini ve arşivlenmesini sağlar',
  },
];

interface TusTanim { ch: string; label?: string; parmak: number; genis?: boolean }
const KB_F: TusTanim[][] = [
  [{ ch: '1', parmak: 1 }, { ch: '2', parmak: 1 }, { ch: '3', parmak: 2 }, { ch: '4', parmak: 3 }, { ch: '5', parmak: 4 }, { ch: '6', parmak: 4 }, { ch: '7', parmak: 6 }, { ch: '8', parmak: 6 }, { ch: '9', parmak: 7 }, { ch: '0', parmak: 8 }],
  [{ ch: 'f', parmak: 1 }, { ch: 'g', parmak: 2 }, { ch: 'ğ', parmak: 3 }, { ch: 'ı', parmak: 4 }, { ch: 'o', parmak: 4 }, { ch: 'd', parmak: 6 }, { ch: 'r', parmak: 6 }, { ch: 'n', parmak: 7 }, { ch: 'h', parmak: 8 }, { ch: 'p', parmak: 9 }],
  [{ ch: 'u', parmak: 1 }, { ch: 'i', parmak: 2 }, { ch: 'e', parmak: 3 }, { ch: 'a', parmak: 4 }, { ch: 'ü', parmak: 4 }, { ch: 't', parmak: 6 }, { ch: 'k', parmak: 6 }, { ch: 'm', parmak: 7 }, { ch: 'l', parmak: 8 }, { ch: 'y', parmak: 9 }, { ch: 'ş', parmak: 9 }],
  [{ ch: 'j', parmak: 1 }, { ch: 'ö', parmak: 2 }, { ch: 'v', parmak: 3 }, { ch: 'c', parmak: 4 }, { ch: 'ç', parmak: 4 }, { ch: 'z', parmak: 6 }, { ch: 's', parmak: 6 }, { ch: 'b', parmak: 7 }, { ch: '.', parmak: 8 }, { ch: ',', parmak: 9 }],
  [{ ch: ' ', label: 'Boşluk (Başparmak)', parmak: 5, genis: true }],
];
const KB_Q: TusTanim[][] = [
  [{ ch: '1', parmak: 1 }, { ch: '2', parmak: 1 }, { ch: '3', parmak: 2 }, { ch: '4', parmak: 3 }, { ch: '5', parmak: 4 }, { ch: '6', parmak: 4 }, { ch: '7', parmak: 6 }, { ch: '8', parmak: 6 }, { ch: '9', parmak: 7 }, { ch: '0', parmak: 8 }],
  [{ ch: 'q', parmak: 1 }, { ch: 'w', parmak: 2 }, { ch: 'e', parmak: 3 }, { ch: 'r', parmak: 4 }, { ch: 't', parmak: 4 }, { ch: 'y', parmak: 6 }, { ch: 'u', parmak: 6 }, { ch: 'ı', parmak: 7 }, { ch: 'o', parmak: 8 }, { ch: 'p', parmak: 9 }, { ch: 'ğ', parmak: 9 }, { ch: 'ü', parmak: 9 }],
  [{ ch: 'a', parmak: 1 }, { ch: 's', parmak: 2 }, { ch: 'd', parmak: 3 }, { ch: 'f', parmak: 4 }, { ch: 'g', parmak: 4 }, { ch: 'h', parmak: 6 }, { ch: 'j', parmak: 6 }, { ch: 'k', parmak: 7 }, { ch: 'l', parmak: 8 }, { ch: 'ş', parmak: 9 }, { ch: 'i', parmak: 9 }],
  [{ ch: 'z', parmak: 1 }, { ch: 'x', parmak: 2 }, { ch: 'c', parmak: 3 }, { ch: 'v', parmak: 4 }, { ch: 'b', parmak: 4 }, { ch: 'n', parmak: 6 }, { ch: 'm', parmak: 6 }, { ch: 'ö', parmak: 7 }, { ch: 'ç', parmak: 8 }, { ch: '.', parmak: 9 }],
  [{ ch: ' ', label: 'Boşluk (Başparmak)', parmak: 5, genis: true }],
];
const PARMAK: Record<number, string> = {
  1: 'Sol Serçe', 2: 'Sol Yüzük', 3: 'Sol Orta', 4: 'Sol İşaret', 5: 'Başparmak',
  6: 'Sağ İşaret', 7: 'Sağ Orta', 8: 'Sağ Yüzük', 9: 'Sağ Serçe',
};

const STORE_KEY = '657:onparmak:dersler';
const root = document.querySelector<HTMLElement>('[data-dersler]');
if (root) {
  const elDuzenBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-d-duzen]')];
  const elListe = root.querySelector<HTMLElement>('[data-d-liste]')!;
  const elBaslik = root.querySelector<HTMLElement>('[data-d-baslik]')!;
  const elAciklama = root.querySelector<HTMLElement>('[data-d-aciklama]')!;
  const elHedef = root.querySelector<HTMLElement>('[data-d-hedef]')!;
  const elGiris = root.querySelector<HTMLInputElement>('[data-d-giris]')!;
  const elKb = root.querySelector<HTMLElement>('[data-d-kb]')!;
  const elIpucu = root.querySelector<HTMLElement>('[data-d-ipucu]')!;
  const elDks = root.querySelector<HTMLElement>('[data-d-dks]')!;
  const elDogruluk = root.querySelector<HTMLElement>('[data-d-dogruluk]')!;
  const elHata = root.querySelector<HTMLElement>('[data-d-hata]')!;
  const elIlerleme = root.querySelector<HTMLElement>('[data-d-ilerleme]')!;
  const elSonuc = root.querySelector<HTMLElement>('[data-d-sonuc]')!;
  const elSifirla = root.querySelector<HTMLButtonElement>('[data-d-sifirla]')!;

  let duzen: 'f' | 'q' = 'f';
  let aktifDers: Ders = F_DERSLER[0];
  let idx = 0;
  let hataSayisi = 0;
  let toplamTus = 0;
  let baslangic = 0;

  const ilerlemeOku = (): Record<string, { yildiz: number; dks: number; dogruluk: number }> => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; }
  };
  const ilerlemeKaydet = (id: string, yildiz: number, dks: number, dogruluk: number) => {
    const m = ilerlemeOku();
    const prev = m[id];
    if (!prev || yildiz > prev.yildiz || dks > prev.dks) {
      m[id] = { yildiz, dks, dogruluk };
      try { localStorage.setItem(STORE_KEY, JSON.stringify(m)); } catch {}
    }
  };

  function kbCiz() {
    const satirlar = duzen === 'f' ? KB_F : KB_Q;
    elKb.innerHTML = '';
    for (const s of satirlar) {
      const r = document.createElement('div');
      r.className = 'op-kb__row';
      for (const t of s) {
        const k = document.createElement('span');
        k.className = `op-kb__key op-kb__p${t.parmak}${t.genis ? ' op-kb__key--space' : ''}`;
        k.dataset.key = t.ch;
        k.textContent = t.label ?? t.ch.toLocaleUpperCase('tr-TR');
        r.append(k);
      }
      elKb.append(r);
    }
    siradakiTus();
  }

  function siradakiTus() {
    elKb.querySelectorAll('.is-next').forEach((e) => e.classList.remove('is-next'));
    const ch = (aktifDers.metin[idx] ?? '').toLocaleLowerCase('tr-TR');
    if (!ch) return;
    const el = elKb.querySelector<HTMLElement>(`.op-kb__key[data-key="${CSS.escape(ch)}"]`);
    if (el) el.classList.add('is-next');
    const tanim = (duzen === 'f' ? KB_F : KB_Q).flat().find((x) => x.ch === ch);
    elIpucu.textContent = tanim
      ? `Sıradaki tuş: "${ch === ' ' ? 'BOŞLUK' : ch.toLocaleUpperCase('tr-TR')}" · Parmak: ${PARMAK[tanim.parmak]}`
      : `Sıradaki tuş: "${ch}"`;
  }

  function hedefCiz() {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < aktifDers.metin.length; i++) {
      const sp = document.createElement('span');
      sp.textContent = aktifDers.metin[i];
      if (i < idx) sp.className = 'dr-ch dr-ch--ok';
      else if (i === idx) sp.className = 'dr-ch dr-ch--cur';
      else sp.className = 'dr-ch';
      frag.append(sp);
    }
    elHedef.replaceChildren(frag);
    const oran = Math.round((idx / Math.max(1, aktifDers.metin.length)) * 100);
    elIlerleme.style.width = `${oran}%`;
  }

  function listeCiz() {
    const dersler = duzen === 'f' ? F_DERSLER : Q_DERSLER;
    const kayit = ilerlemeOku();
    elListe.innerHTML = '';
    for (const d of dersler) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `dr-item${d.id === aktifDers.id ? ' is-active' : ''}`;
      const k = kayit[d.id];
      const yildiz = k ? '★'.repeat(k.yildiz) + '☆'.repeat(3 - k.yildiz) : '☆☆☆';
      btn.innerHTML = `<strong>${d.baslik}</strong><span>${d.tuslar}</span><small>${yildiz}${k ? ` · ${k.dks} DKS` : ''}</small>`;
      btn.addEventListener('click', () => dersSec(d));
      elListe.append(btn);
    }
  }

  function dersSec(d: Ders) {
    aktifDers = d;
    idx = 0;
    hataSayisi = 0;
    toplamTus = 0;
    baslangic = 0;
    elBaslik.textContent = d.baslik;
    elAciklama.textContent = d.aciklama;
    elDks.textContent = '0';
    elDogruluk.textContent = '%100';
    elHata.textContent = '0';
    elSonuc.hidden = true;
    elGiris.value = '';
    elGiris.disabled = false;
    listeCiz();
    hedefCiz();
    siradakiTus();
    elGiris.focus();
  }

  function dersiTamamla() {
    const gecenDk = Math.max((performance.now() - baslangic) / 60000, 0.05);
    const kelimeSayisi = aktifDers.metin.split(/\s+/).length;
    const dks = Math.round(kelimeSayisi / gecenDk);
    const dogruluk = Math.round(((toplamTus - hataSayisi) / Math.max(1, toplamTus)) * 100);
    const yildiz = dogruluk >= 96 && dks >= 25 ? 3 : dogruluk >= 90 ? 2 : 1;
    ilerlemeKaydet(aktifDers.id, yildiz, dks, dogruluk);
    listeCiz();

    const dersler = duzen === 'f' ? F_DERSLER : Q_DERSLER;
    const curPos = dersler.findIndex((x) => x.id === aktifDers.id);
    const sonraki = dersler[curPos + 1];

    elGiris.disabled = true;
    elSonuc.innerHTML = `
      <strong>Ders Tamamlandı! ${'★'.repeat(yildiz)}${'☆'.repeat(3 - yildiz)}</strong>
      <p>Hız: <strong>${dks} DKS</strong> · Doğruluk: <strong>%${dogruluk}</strong> · Hata: <strong>${hataSayisi}</strong></p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
        <button type="button" class="btn btn--quiet btn--kucuk" data-dr-tekrar>Tekrar et</button>
        ${sonraki ? `<button type="button" class="btn btn--kucuk" data-dr-sonraki>Sonraki ders: ${sonraki.baslik} →</button>` : `<a class="btn btn--kucuk" href="${yerelYol('/on-parmak/')}">3 Dakikalık Resmî Sınava Geç →</a>`}
      </div>`;
    elSonuc.hidden = false;
    elSonuc.querySelector('[data-dr-tekrar]')?.addEventListener('click', () => dersSec(aktifDers));
    if (sonraki) elSonuc.querySelector('[data-dr-sonraki]')?.addEventListener('click', () => dersSec(sonraki));
  }

  elGiris.addEventListener('input', () => {
    const val = elGiris.value;
    if (!val) return;
    const ch = val[val.length - 1];
    elGiris.value = '';
    if (!baslangic) baslangic = performance.now();
    toplamTus++;
    const beklenen = aktifDers.metin[idx];
    if (ch === beklenen) {
      idx++;
      if (idx >= aktifDers.metin.length) {
        hedefCiz();
        dersiTamamla();
        return;
      }
    } else {
      hataSayisi++;
      elHedef.classList.add('is-shake');
      window.setTimeout(() => elHedef.classList.remove('is-shake'), 180);
    }
    const gecenDk = Math.max((performance.now() - baslangic) / 60000, 0.02);
    const dks = Math.round((idx / 5) / gecenDk);
    const dogruluk = Math.max(0, Math.round(((toplamTus - hataSayisi) / Math.max(1, toplamTus)) * 100));
    elDks.textContent = String(dks);
    elDogruluk.textContent = `%${dogruluk}`;
    elHata.textContent = String(hataSayisi);
    hedefCiz();
    siradakiTus();
  });

  elDuzenBtns.forEach((b) =>
    b.addEventListener('click', () => {
      elDuzenBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      duzen = (b.dataset.dDuzen as 'f' | 'q') || 'f';
      kbCiz();
      dersSec(duzen === 'f' ? F_DERSLER[0] : Q_DERSLER[0]);
    })
  );
  elSifirla.addEventListener('click', () => dersSec(aktifDers));

  kbCiz();
  dersSec(F_DERSLER[0]);
}
