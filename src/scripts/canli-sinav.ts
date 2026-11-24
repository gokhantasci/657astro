// Zamanlı Canlı Sınav & Anlık Sıralama (Leaderboard) ortak istemcisi (GYS ve On Parmak)
export interface CanliSinavKayit {
  id: string;
  tur: 'gys' | 'klavye';
  baslik: string;
  aciklama: string;
  baslangic: string;
  bitis: string;
  durum: 'yaklasan' | 'aktif' | 'bitti';
  kriterler: Record<string, unknown>;
  katilimci: number;
  liderlik: Array<{
    sira: number;
    rumuz: string;
    skor: number;
    dogru: number;
    yanlis: number;
    sureSn: number;
    detay: string;
  }>;
}

const API_BASE = '/_657-servis/api/canli-sinav';
const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function tarihBicim(iso: string): string {
  try {
    return new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function canliSinavBagla(
  kapsayici: HTMLElement | null,
  tur: 'gys' | 'klavye',
  sonucAl: () => { skor: number; dogru: number; yanlis: number; sureSn: number; detay: string } | null
) {
  if (!kapsayici) return;
  const listeEl = kapsayici.querySelector<HTMLElement>('[data-cs-liste]');
  const durumEl = kapsayici.querySelector<HTMLElement>('[data-cs-durum]');
  const adminForm = kapsayici.querySelector<HTMLFormElement>('[data-cs-admin-form]');
  const adminMesaj = kapsayici.querySelector<HTMLElement>('[data-cs-admin-mesaj]');
  if (!listeEl) return;

  async function yukle() {
    if (durumEl) durumEl.textContent = 'Canlı sınavlar ve sıralama yükleniyor…';
    try {
      const r = await fetch(`${API_BASE}?tur=${tur}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as { sinavlar: CanliSinavKayit[] };
      ciz(data.sinavlar || []);
      if (durumEl) durumEl.textContent = `${data.sinavlar?.length ?? 0} zamanlı sınav listelendi.`;
    } catch {
      if (durumEl) durumEl.textContent = 'Canlı sınav servisine şu an ulaşılamıyor; birazdan tekrar deneyin.';
    }
  }

  function ciz(sinavlar: CanliSinavKayit[]) {
    if (!sinavlar.length) {
      listeEl!.innerHTML = '<p class="cs-bos">Henüz planlanmış canlı sınav bulunmuyor.</p>';
      return;
    }
    listeEl!.innerHTML = sinavlar
      .map((s) => {
        const rozet =
          s.durum === 'aktif'
            ? '<span class="cs-rozet cs-rozet--aktif">● Sınav Aktif</span>'
            : s.durum === 'yaklasan'
              ? '<span class="cs-rozet cs-rozet--yaklasan">⏳ Yaklaşan</span>'
              : '<span class="cs-rozet cs-rozet--bitti">✓ Sona Erdi</span>';
        const skorEtiket = tur === 'klavye' ? 'Net Kelime' : 'Puan';
        const tablo = s.liderlik.length
          ? `<div class="cs-tablo-sar"><table class="cs-tablo"><thead><tr><th>#</th><th>Rumuz</th><th>${skorEtiket}</th><th>Doğru / Yanlış</th><th>Detay</th></tr></thead><tbody>${s.liderlik
              .slice(0, 20)
              .map(
                (l) =>
                  `<tr><td><strong>${l.sira}</strong></td><td>${esc(l.rumuz)}</td><td class="num"><strong>${l.skor}</strong></td><td class="num">${l.dogru} / ${l.yanlis}</td><td>${esc(l.detay || '—')}</td></tr>`
              )
              .join('')}</tbody></table></div>`
          : '<p class="cs-bos">İlk skoru gönderen siz olun!</p>';
        const gonderFormu =
          s.durum === 'aktif'
            ? `<form class="cs-gonder-form" data-cs-sonuc-form="${esc(s.id)}">
                 <input type="text" name="rumuz" required minlength="2" maxlength="32" placeholder="Adınız veya rumuzunuz (ör. Katip_34)" />
                 <button type="submit" class="btn btn--kucuk">Güncel Skorumu Sıralamaya Gönder</button>
                 <span class="cs-form-not" data-cs-form-not></span>
               </form>`
            : '';
        return `<article class="cs-kart">
          <div class="cs-kart__ust">
            <div>${rozet}<h3>${esc(s.baslik)}</h3></div>
            <span class="cs-katilim num">${s.katilimci} katılımcı</span>
          </div>
          ${s.aciklama ? `<p class="cs-aciklama">${esc(s.aciklama)}</p>` : ''}
          <p class="cs-zaman"><strong>Zaman aralığı:</strong> ${tarihBicim(s.baslangic)} – ${tarihBicim(s.bitis)}</p>
          ${gonderFormu}
          ${tablo}
        </article>`;
      })
      .join('');

    listeEl!.querySelectorAll<HTMLFormElement>('[data-cs-sonuc-form]').forEach((f) => {
      f.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const notEl = f.querySelector<HTMLElement>('[data-cs-form-not]');
        const sinavId = f.dataset.csSonucForm!;
        const rumuz = (new FormData(f).get('rumuz') as string || '').trim();
        const skorVeri = sonucAl();
        if (!skorVeri) {
          if (notEl) notEl.textContent = tur === 'klavye'
            ? 'Önce en az 1 klavye denemesi tamamlayın.'
            : 'Önce en az 1 soru çözün.';
          return;
        }
        if (notEl) notEl.textContent = 'Gönderiliyor…';
        try {
          const r = await fetch(`${API_BASE}/sonuc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sinavId, rumuz, ...skorVeri }),
          });
          const j = await r.json();
          if (!r.ok) {
            if (notEl) notEl.textContent = j.error || 'Skor gönderilemedi.';
            return;
          }
          if (notEl) notEl.textContent = 'Skorunuz canlı sıralamaya kaydedildi!';
          void yukle();
        } catch {
          if (notEl) notEl.textContent = 'Bağlantı hatası; tekrar deneyin.';
        }
      });
    });
  }

  adminForm?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(adminForm);
    const adminKey = String(fd.get('adminKey') || '').trim();
    const baslik = String(fd.get('baslik') || '').trim();
    const aciklama = String(fd.get('aciklama') || '').trim();
    const baslangic = String(fd.get('baslangic') || '').trim();
    const bitis = String(fd.get('bitis') || '').trim();
    const kriterNot = String(fd.get('kriter') || '').trim();
    if (adminMesaj) adminMesaj.textContent = 'Sınav oluşturuluyor…';
    try {
      const r = await fetch(`${API_BASE}/olustur`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({
          tur,
          baslik,
          aciklama,
          baslangic: baslangic.length === 16 ? `${baslangic}:00+03:00` : baslangic,
          bitis: bitis.length === 16 ? `${bitis}:00+03:00` : bitis,
          kriterler: { ozet: kriterNot },
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        if (adminMesaj) adminMesaj.textContent = j.error || 'Sınav oluşturulamadı.';
        return;
      }
      if (adminMesaj) adminMesaj.textContent = 'Zamanlı sınav yayınlandı!';
      adminForm.reset();
      void yukle();
    } catch {
      if (adminMesaj) adminMesaj.textContent = 'Sunucuya ulaşılamadı.';
    }
  });

  void yukle();
}
