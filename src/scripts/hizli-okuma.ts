export {};
// Anlayarak Hızlı Okuma: Okuma Hızı + Anlama Testi, RSVP (ORP Odaklı), Schulte Tablosu, Göz Takip & Takistoskop

interface OkumaTesti {
  baslik: string;
  metin: string;
  sorular: { s: string; secenekler: string[]; dogru: number }[];
}

const TESTLER: OkumaTesti[] = [
  {
    baslik: 'Hukuk Devleti ve Mahkemelerin Bağımsızlığı',
    metin: 'Türkiye Cumhuriyeti Anayasası’nın 2’nci maddesinde devletin nitelikleri arasında yer alan hukuk devleti ilkesi, yönetilenlere hukuk güvenliği sağlayan, temel hak ve özgürlükleri koruyan ve idarenin bütün eylem ve işlemlerini yargı denetimine açık tutan bir yönetim düzenini ifade eder. Bu düzenin ayakta kalabilmesi için yargı yetkisi Türk Milleti adına bağımsız ve tarafsız mahkemelerce kullanılır. Hâkimler görevlerinde bağımsızdırlar; Anayasaya, kanuna ve hukuka uygun olarak vicdani kanaatlerine göre hüküm verirler. Hiçbir organ, makam, merci veya kişi, yargı yetkisinin kullanılmasında mahkemelere ve hâkimlere emir ve talimat veremez, genelge gönderemez, tavsiye ve telkinde bulunamaz. Görülmekte olan bir dava hakkında yasama meclisinde yargı yetkisinin kullanılması ile ilgili soru sorulamaz, görüşme yapılamaz veya herhangi bir beyanda bulunulamaz. Yasama ve yürütme organları ile idare, mahkeme kararlarına uymak zorundadır; bu organlar ve idare, mahkeme kararlarını hiçbir suretle değiştiremez ve bunların yerine getirilmesini geciktiremez. Makul sürede yargılanma hakkı da adil yargılanmanın ayrılmaz bir parçasıdır ve kalem hizmetlerinin düzenli işlemesiyle doğrudan ilişkilidir.',
    sorular: [
      { s: 'Hukuk devleti ilkesi Anayasa’nın kaçıncı maddesinde yer alır?', secenekler: ['1. madde', '2. madde', '9. madde', '138. madde'], dogru: 1 },
      { s: 'Metne göre hâkimler hükümlerini neye göre verirler?', secenekler: ['İdari genelgelere göre', 'Anayasa, kanun ve hukuka uygun vicdani kanaatlerine göre', 'Bakanlık talimatlarına göre', 'Yalnızca teamüllere göre'], dogru: 1 },
      { s: 'Yasama ve yürütme organları mahkeme kararları karşısında nasıl davranmak zorundadır?', secenekler: ['Değiştirebilir ve erteleyebilir', 'Uymak zorundadır, değiştiremez ve geciktiremez', 'Yalnızca idari kararlara uyar', 'Görüşme yaparak yeniden oylar'], dogru: 1 },
      { s: 'Metne göre makul sürede yargılanma hakkı neyle doğrudan ilişkilidir?', secenekler: ['Kalem hizmetlerinin düzenli işlemesiyle', 'Sadece bina sayısıyla', 'Yalnızca ceza davalarıyla', 'Duruşma salonu büyüklüğüyle'], dogru: 0 },
    ],
  },
  {
    baslik: 'Anlayarak Hızlı Okuma ve Göz Hareketleri Bilimi',
    metin: 'Bilimsel okuma araştırmaları, insan gözünün satır üzerinde sürekli ve pürüzsüz biçimde kaymadığını, bunun yerine "sakkad" adı verilen kısa sıçramalar ve "fiksasyon" adı verilen duraklamalarla bilgi topladığını ortaya koymuştur. Ortalama bir yetişkin okuyucu dakikada 180 ile 230 kelime arasında okur ve her kelimede gözünü neredeyse bir kez duraklatır. Okuma hızını düşüren en yaygın alışkanlıklar; kelimeleri içten seslendirme (subvokalizasyon), okunan satıra gereksiz yere geri dönme (regresyon) ve dar görüş alanıdır. Schulte tablosu gibi çevresel görüş egzersizleri, gözün tek bir fiksasyonda birden fazla kelimeyi blok halinde algılamasını destekler. Ancak gerçek başarı yalnızca kelime sayısını artırmak değil, anlama oranını yüksek tutmaktır. Bu nedenle bilişsel psikolojide temel ölçüt "etkin okuma hızı"dır ve ham okuma hızının anlama yüzdesiyle çarpılmasıyla hesaplanır. Düzenli pratikle hem mevzuat metinlerinde hem de uzun dava dosyalarında tarama ve kavrama verimliliği belirgin biçimde artar.',
    sorular: [
      { s: 'Gözün satır üzerindeki kısa sıçramalarına bilimsel olarak ne ad verilir?', secenekler: ['Fiksasyon', 'Sakkad', 'Regresyon', 'Subvokalizasyon'], dogru: 1 },
      { s: 'Ortalama bir yetişkin okuyucunun dakikadaki okuma hızı kaç kelime aralığındadır?', secenekler: ['80–120', '180–230', '400–500', '600–750'], dogru: 1 },
      { s: 'Metne göre okunan satıra gereksiz yere geri dönmeye ne ad verilir?', secenekler: ['Regresyon', 'Fiksasyon', 'Sakkad', 'Bloklama'], dogru: 0 },
      { s: 'Etkin okuma hızı nasıl hesaplanır?', secenekler: ['Toplam kelime / 2', 'Ham okuma hızı × Anlama yüzdesi', 'Yalnızca süre ölçülerek', 'Harf sayısı × 5'], dogru: 1 },
    ],
  },
];

const root = document.querySelector<HTMLElement>('[data-hizli-okuma]');
if (root) {
  // Sekme yönetimi
  const tabBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-ho-tab]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-ho-panel]')];
  tabBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      const target = btn.dataset.hoTab;
      tabBtns.forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
      panels.forEach((p) => (p.hidden = p.dataset.hoPanel !== target));
    })
  );

  // 1. OKUMA HIZI VE ANLAMA TESTİ
  const elTestSec = root.querySelector<HTMLSelectElement>('[data-ho-test-sec]')!;
  const elTestBaslat = root.querySelector<HTMLButtonElement>('[data-ho-test-baslat]')!;
  const elTestBitir = root.querySelector<HTMLButtonElement>('[data-ho-test-bitir]')!;
  const elTestMetin = root.querySelector<HTMLElement>('[data-ho-test-metin]')!;
  const elTestSure = root.querySelector<HTMLElement>('[data-ho-test-sure]')!;
  const elQuiz = root.querySelector<HTMLElement>('[data-ho-quiz]')!;
  const elTestSonuc = root.querySelector<HTMLElement>('[data-ho-test-sonuc]')!;

  let testBaslangic = 0;
  let testTimer: number | null = null;
  let olculenSn = 0;

  function testMetniYukle() {
    const t = TESTLER[Number(elTestSec.value) || 0] ?? TESTLER[0];
    elTestMetin.textContent = t.metin;
    elTestMetin.hidden = true;
    elQuiz.hidden = true;
    elTestSonuc.hidden = true;
    elTestBitir.disabled = true;
    elTestBaslat.disabled = false;
    elTestSure.textContent = '00:00';
    if (testTimer) window.clearInterval(testTimer);
  }
  elTestSec.addEventListener('change', testMetniYukle);
  testMetniYukle();

  elTestBaslat.addEventListener('click', () => {
    const t = TESTLER[Number(elTestSec.value) || 0] ?? TESTLER[0];
    elTestMetin.textContent = t.metin;
    elTestMetin.hidden = false;
    elQuiz.hidden = true;
    elTestSonuc.hidden = true;
    elTestBaslat.disabled = true;
    elTestBitir.disabled = false;
    testBaslangic = performance.now();
    testTimer = window.setInterval(() => {
      const sn = Math.floor((performance.now() - testBaslangic) / 1000);
      elTestSure.textContent = `${String(Math.floor(sn / 60)).padStart(2, '0')}:${String(sn % 60).padStart(2, '0')}`;
    }, 250);
  });

  elTestBitir.addEventListener('click', () => {
    if (testTimer) window.clearInterval(testTimer);
    olculenSn = Math.max(1, (performance.now() - testBaslangic) / 1000);
    elTestBitir.disabled = true;
    elTestMetin.hidden = true;
    const t = TESTLER[Number(elTestSec.value) || 0] ?? TESTLER[0];
    elQuiz.innerHTML = `
      <h3>Anlama Testi (4 Soru)</h3>
      ${t.sorular
        .map(
          (q, qi) => `<fieldset class="ho-q"><legend>${qi + 1}. ${q.s}</legend>${q.secenekler
            .map((sec, si) => `<label><input type="radio" name="ho-q-${qi}" value="${si}"/> ${sec}</label>`)
            .join('')}</fieldset>`
        )
        .join('')}
      <button type="button" class="btn" data-ho-quiz-hesapla>Sonucu hesapla</button>`;
    elQuiz.hidden = false;
    elQuiz.querySelector('[data-ho-quiz-hesapla]')?.addEventListener('click', () => {
      let dogru = 0;
      t.sorular.forEach((q, qi) => {
        const sel = elQuiz.querySelector<HTMLInputElement>(`input[name="ho-q-${qi}"]:checked`);
        if (sel && Number(sel.value) === q.dogru) dogru++;
      });
      const kelime = t.metin.split(/\s+/).length;
      const hamHiz = Math.round((kelime / olculenSn) * 60);
      const anlama = Math.round((dogru / t.sorular.length) * 100);
      const etkin = Math.round((hamHiz * anlama) / 100);
      const duzey = etkin >= 350 ? 'İleri Düzey' : etkin >= 220 ? 'İyi Düzey' : etkin >= 140 ? 'Ortalama' : 'Geliştirilmeli';
      elTestSonuc.innerHTML = `
        <strong>Test Sonucu · ${duzey}</strong>
        <p>Okuma süresi: <strong>${olculenSn.toFixed(1)} sn</strong> (${kelime} kelime) · Ham hız: <strong>${hamHiz} KDD</strong> · Anlama oranı: <strong>%${anlama}</strong> (${dogru}/${t.sorular.length}) · <strong>Etkin Okuma Hızı: ${etkin} KDD</strong></p>`;
      elTestSonuc.hidden = false;
      elTestBaslat.disabled = false;
    });
  });

  // 2. RSVP OKUYUCU (ORP Kırmızı Odak Harfi)
  const elRsvpHiz = root.querySelector<HTMLInputElement>('[data-ho-rsvp-hiz]')!;
  const elRsvpHizVal = root.querySelector<HTMLElement>('[data-ho-rsvp-hiz-val]')!;
  const elRsvpGrup = root.querySelector<HTMLSelectElement>('[data-ho-rsvp-grup]')!;
  const elRsvpMetin = root.querySelector<HTMLTextAreaElement>('[data-ho-rsvp-metin]')!;
  const elRsvpEkran = root.querySelector<HTMLElement>('[data-ho-rsvp-ekran]')!;
  const elRsvpBaslat = root.querySelector<HTMLButtonElement>('[data-ho-rsvp-baslat]')!;
  const elRsvpDur = root.querySelector<HTMLButtonElement>('[data-ho-rsvp-dur]')!;

  let rsvpTimer: number | null = null;
  let rsvpIdx = 0;
  let rsvpWords: string[] = [];

  elRsvpMetin.value = TESTLER[0].metin;
  elRsvpHiz.addEventListener('input', () => {
    elRsvpHizVal.textContent = `${elRsvpHiz.value} KDD`;
  });

  function orpVurgula(parca: string): string {
    if (parca.includes(' ')) return parca;
    const pivot = Math.max(0, Math.floor((parca.length - 1) * 0.35));
    return `${parca.slice(0, pivot)}<span class="ho-orp">${parca[pivot]}</span>${parca.slice(pivot + 1)}`;
  }

  elRsvpBaslat.addEventListener('click', () => {
    if (rsvpTimer) window.clearInterval(rsvpTimer);
    const grup = Number(elRsvpGrup.value) || 1;
    const kdd = Number(elRsvpHiz.value) || 300;
    rsvpWords = elRsvpMetin.value.trim().split(/\s+/).filter(Boolean);
    if (!rsvpWords.length) return;
    rsvpIdx = 0;
    const ms = Math.max(60, Math.round((60000 / kdd) * grup));
    const adim = () => {
      if (rsvpIdx >= rsvpWords.length) {
        if (rsvpTimer) window.clearInterval(rsvpTimer);
        rsvpTimer = null;
        elRsvpEkran.textContent = 'Tamamlandı ✓';
        return;
      }
      const chunk = rsvpWords.slice(rsvpIdx, rsvpIdx + grup).join(' ');
      elRsvpEkran.innerHTML = orpVurgula(chunk);
      rsvpIdx += grup;
    };
    adim();
    rsvpTimer = window.setInterval(adim, ms);
  });

  elRsvpDur.addEventListener('click', () => {
    if (rsvpTimer) window.clearInterval(rsvpTimer);
    rsvpTimer = null;
  });

  // 3. SCHULTE TABLOSU (3x3, 4x4, 5x5)
  const elSchBoy = root.querySelector<HTMLSelectElement>('[data-ho-sch-boy]')!;
  const elSchYeni = root.querySelector<HTMLButtonElement>('[data-ho-sch-yeni]')!;
  const elSchGrid = root.querySelector<HTMLElement>('[data-ho-sch-grid]')!;
  const elSchDurum = root.querySelector<HTMLElement>('[data-ho-sch-durum]')!;

  let schHedef = 1;
  let schMax = 25;
  let schStart = 0;

  function schulteOlustur() {
    const n = Number(elSchBoy.value) || 5;
    schMax = n * n;
    schHedef = 1;
    schStart = 0;
    const nums = Array.from({ length: schMax }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    elSchGrid.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
    elSchGrid.innerHTML = '';
    elSchDurum.textContent = `Merkeze odaklanın ve 1’den ${schMax}’e sırayla tıklayın.`;
    for (const num of nums) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ho-sch__cell num';
      b.textContent = String(num);
      b.addEventListener('click', () => {
        if (!schStart) schStart = performance.now();
        if (num === schHedef) {
          b.classList.add('is-hit');
          schHedef++;
          if (schHedef > schMax) {
            const sn = ((performance.now() - schStart) / 1000).toFixed(2);
            elSchDurum.textContent = `Tebrikler! ${n}×${n} Schulte Tablosu ${sn} saniyede tamamlandı.`;
          } else {
            elSchDurum.textContent = `Sıradaki sayı: ${schHedef}`;
          }
        }
      });
      elSchGrid.append(b);
    }
  }
  elSchBoy.addEventListener('change', schulteOlustur);
  elSchYeni.addEventListener('click', schulteOlustur);
  schulteOlustur();

  // 4. TAKİSTOSKOP (GÖZ AÇMA EGZERSİZİ)
  const elTakBtn = root.querySelector<HTMLButtonElement>('[data-ho-tak-baslat]')!;
  const elTakSure = root.querySelector<HTMLSelectElement>('[data-ho-tak-sure]')!;
  const elTakEkran = root.querySelector<HTMLElement>('[data-ho-tak-ekran]')!;
  const elTakCevap = root.querySelector<HTMLInputElement>('[data-ho-tak-cevap]')!;
  const elTakKontrol = root.querySelector<HTMLButtonElement>('[data-ho-tak-kontrol]')!;
  const elTakSonuc = root.querySelector<HTMLElement>('[data-ho-tak-sonuc]')!;
  const TAK_KELIMELER = [
    'anayasa mahkemesi', 'kesinleşme şerhi', 'yargılama gideri', 'mahkeme bağımsızlığı',
    'tebligat mazbatası', 'istinaf başvurusu', 'bilirkişi raporu', 'duruşma tutanağı',
    'hukuk devleti', 'idari yargılama', 'icra takibi', 'temyiz incelemesi',
  ];
  let aktifTak = '';

  elTakBtn.addEventListener('click', () => {
    aktifTak = TAK_KELIMELER[Math.floor(Math.random() * TAK_KELIMELER.length)];
    elTakCevap.value = '';
    elTakSonuc.textContent = '';
    elTakEkran.textContent = aktifTak;
    const ms = Number(elTakSure.value) || 250;
    window.setTimeout(() => {
      elTakEkran.textContent = '• • •';
      elTakCevap.focus();
    }, ms);
  });

  elTakKontrol.addEventListener('click', () => {
    if (!aktifTak) return;
    const ok = elTakCevap.value.trim().toLocaleLowerCase('tr-TR') === aktifTak;
    elTakSonuc.textContent = ok ? `Doğru! ("${aktifTak}")` : `Doğrusu: "${aktifTak}"`;
  });
}
