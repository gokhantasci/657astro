export {};
type Kayit = { baslik: string; yol: string; taban: number };
type Donem = 'bugun' | 'hafta' | 'ay' | 'yil' | 'toplam';
type Ozet = { donem: string; ilkGun?: string; sonGun?: string; baslangic?: string; okunmalar: { path: string; sayi: number }[] };

const DONEM_BASLIK: Record<Donem, { hukuk: string; mulakat: string }> = {
  bugun: { hukuk: 'Bugün en çok okunan hukuk terimleri', mulakat: 'Bugün en çok okunan sorular' },
  hafta: { hukuk: 'Bu hafta en çok okunan hukuk terimleri', mulakat: 'Bu hafta en çok okunan sorular' },
  ay: { hukuk: 'Bu ay en çok okunan hukuk terimleri', mulakat: 'Bu ay en çok okunan sorular' },
  yil: { hukuk: 'Bu yıl en çok okunan hukuk terimleri', mulakat: 'Bu yıl en çok okunan sorular' },
  toplam: { hukuk: 'En çok okunan hukuk terimleri (Tüm zamanlar)', mulakat: 'En çok okunan sorular (Tüm zamanlar)' },
};

const tarihFmt = (s?: string) => (s ? new Date(`${s}T12:00:00+03:00`).toLocaleDateString('tr-TR') : '');

for (const root of document.querySelectorAll<HTMLElement>('[data-cok-okunan]')) {
  const grup = (root.dataset.cokOkunan === 'mulakat' ? 'mulakat' : 'hukuk') as 'hukuk' | 'mulakat';
  const adet = Number(root.dataset.adet || 12);
  const status = root.querySelector<HTMLElement>('[data-cok-okunan-durum]')!;
  const heading = root.querySelector<HTMLElement>('[data-cok-okunan-baslik]');
  const retry = root.querySelector<HTMLButtonElement>('[data-cok-okunan-tekrar]')!;
  const liste = root.querySelector<HTMLOListElement>('[data-cok-okunan-liste]')!;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-cok-okunan-donem]')];

  let aktifDonem = (root.dataset.varsayilanDonem || 'toplam') as Donem;
  let istekNo = 0;
  let katalogPromise: Promise<Record<string, Kayit[]>> | undefined;

  const json = async <T,>(url: string): Promise<T> => {
    const r = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw Error('Veri alınamadı');
    return r.json();
  };

  async function load(donem: Donem) {
    const no = ++istekNo;
    aktifDonem = donem;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cokOkunanDonem === donem)));
    if (heading) heading.textContent = DONEM_BASLIK[donem][grup];
    retry.hidden = true;
    status.textContent = 'Güncel görüntülenme sıralaması yükleniyor…';
    try {
      katalogPromise ??= json<Record<string, Kayit[]>>('/cok-okunanlar.json').catch((e) => {
        katalogPromise = undefined;
        throw e;
      });
      const [catalog, ozet] = await Promise.all([
        katalogPromise,
        json<Ozet>(`/_657-servis/api/okunma/siralama?donem=${donem}`),
      ]);
      if (no !== istekNo) return;
      const map = new Map<string, number>(ozet.okunmalar.map((r) => [r.path, r.sayi]));
      const kaynak = catalog[grup] ?? [];

      let rows: (Kayit & { sayi: number })[];
      if (donem === 'toplam') {
        rows = kaynak
          .map((r) => ({ ...r, sayi: r.taban + (map.get(r.yol) ?? 0) }))
          .sort((a, b) => b.sayi - a.sayi || a.baslik.localeCompare(b.baslik, 'tr') || a.yol.localeCompare(b.yol))
          .slice(0, adet);
        status.textContent = 'Arşiv tabanı ve canlı görüntülenmelerin toplamına göre sıralanır.';
      } else {
        const tumu = kaynak
          .map((r) => ({ ...r, sayi: map.get(r.yol) ?? 0 }))
          .sort((a, b) => b.sayi - a.sayi || b.taban - a.taban || a.baslik.localeCompare(b.baslik, 'tr'));
        const okunanlar = tumu.filter((r) => r.sayi > 0);
        rows = (okunanlar.length > 0 ? okunanlar : tumu).slice(0, adet);
        const aralik = ozet.ilkGun && ozet.sonGun
          ? (ozet.ilkGun === ozet.sonGun ? tarihFmt(ozet.sonGun) : `${tarihFmt(ozet.ilkGun)} – ${tarihFmt(ozet.sonGun)}`)
          : '';
        status.textContent = okunanlar.length > 0
          ? `${aralik ? aralik + ' · ' : ''}${okunanlar.length.toLocaleString('tr-TR')} içerikte canlı görüntülenme kaydı bulundu.`
          : `${aralik ? aralik + ' · ' : ''}Bu dönemde henüz yeni canlı görüntülenme kaydı yok; en çok arananlar gösteriliyor.`;
      }

      liste.replaceChildren(
        ...rows.map((r) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          const title = document.createElement('strong');
          const count = document.createElement('span');
          a.href = r.yol;
          title.textContent = r.baslik;
          count.textContent =
            donem === 'toplam'
              ? `${r.sayi.toLocaleString('tr-TR')} görüntülenme`
              : `${r.sayi.toLocaleString('tr-TR')} görüntülenme (${donem === 'bugun' ? 'bugün' : donem === 'hafta' ? 'bu hafta' : donem === 'ay' ? 'bu ay' : 'bu yıl'})`;
          a.append(title, count);
          li.append(a);
          return li;
        })
      );
    } catch {
      if (no !== istekNo) return;
      status.textContent = 'Canlı sayaç alınamadı; arşiv sıralaması gösteriliyor.';
      retry.hidden = false;
    }
  }

  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      void load(b.dataset.cokOkunanDonem as Donem);
    })
  );
  retry.addEventListener('click', () => void load(aktifDonem));
  void load(aktifDonem);
}
