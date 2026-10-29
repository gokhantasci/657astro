// Tarih alanları her tarayıcı dilinde gg.aa.yyyy görünür. Yerel <input type="date"> değeri (ISO) tutmaya ve
// takvim seçicisini açmaya devam eder, görünmez olur; üstüne metin alanı ve takvim düğmesi kurulur.
// Değer kodla değiştirildiğinde (input.value = 'YYYY-AA-GG') görünen metin kendiliğinden eşitlenir.
const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!;
const isoGun = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split('-').reverse().join('.') : '');
function isoOku(metin: string) {
  const m = metin.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!m) return null;
  const [, g, a, y] = m.map(Number);
  const d = new Date(Date.UTC(y, a - 1, g));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== a - 1 || d.getUTCDate() !== g) return null;
  return `${y}-${String(a).padStart(2, '0')}-${String(g).padStart(2, '0')}`;
}
// Yazarken yalnızca rakam girilirse noktalar eklenir: 26102026 → 26.10.2026.
const maskele = (s: string) => {
  // Kullanıcı / ya da - ile yazıyorsa ya da "1.9.2026" gibi kısa gün/ay giriyorsa dokunulmaz.
  if (/[/-]/.test(s) || /^\d{1,2}\.\d{1}(\.|$)|^\d{1}\./.test(s)) return s;
  const r = s.replace(/\D/g, '').slice(0, 8);
  return [r.slice(0, 2), r.slice(2, 4), r.slice(4)].filter(Boolean).join('.');
};

function kur(yerel: HTMLInputElement) {
  if (yerel.dataset.yerel !== undefined || yerel.dataset.tarih) return;
  yerel.dataset.tarih = '1';
  const kutu = document.createElement('div');
  kutu.className = 'tarih';
  const giris = document.createElement('input');
  giris.type = 'text';
  giris.className = 'tarih__giris';
  giris.inputMode = 'numeric';
  giris.autocomplete = 'off';
  giris.placeholder = 'gg.aa.yyyy';
  giris.maxLength = 10;
  giris.required = yerel.required;
  giris.id = `${yerel.id || 'tarih'}-gun`;
  const etiket = yerel.id ? document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(yerel.id)}"]`) : null;
  if (etiket) { etiket.id ||= `${yerel.id}-etiket`; giris.setAttribute('aria-labelledby', etiket.id); }
  giris.setAttribute('aria-describedby', `${giris.id}-bicim`);
  const bicim = document.createElement('span');
  bicim.id = `${giris.id}-bicim`;
  bicim.className = 'visually-hidden';
  bicim.textContent = 'Biçim: gün.ay.yıl';
  const dugme = document.createElement('button');
  dugme.type = 'button';
  dugme.className = 'tarih__takvim';
  dugme.setAttribute('aria-label', 'Takvimden seç');
  dugme.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>';

  yerel.classList.add('tarih__yerel');
  yerel.tabIndex = -1;
  yerel.setAttribute('aria-hidden', 'true');
  yerel.before(kutu);
  kutu.append(yerel, giris, dugme, bicim);

  const eslestir = () => { if (document.activeElement !== giris || isoOku(giris.value) !== proto.get!.call(yerel)) giris.value = isoGun(proto.get!.call(yerel)); };
  Object.defineProperty(yerel, 'value', { configurable: true, get() { return proto.get!.call(this); }, set(v) { proto.set!.call(this, v); eslestir(); } });
  yerel.addEventListener('input', eslestir);
  yerel.addEventListener('change', eslestir);
  yerel.addEventListener('focus', () => giris.focus());
  yerel.form?.addEventListener('reset', () => setTimeout(eslestir));

  giris.addEventListener('input', e => {
    e.stopPropagation();
    const once = giris.value;
    giris.value = maskele(once);
    const iso = isoOku(giris.value);
    giris.setCustomValidity(giris.value && !iso ? 'Tarihi gün.ay.yıl biçiminde girin (ör. 26.10.2026).' : '');
    if (iso && iso !== proto.get!.call(yerel)) {
      proto.set!.call(yerel, iso);
      yerel.dispatchEvent(new Event('input', { bubbles: true }));
      yerel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  giris.addEventListener('blur', () => { if (isoOku(giris.value)) giris.value = isoGun(proto.get!.call(yerel)); });
  dugme.addEventListener('click', () => {
    try { yerel.showPicker(); } catch { giris.focus(); }
  });
  eslestir();
}

document.querySelectorAll<HTMLInputElement>('input[type="date"]').forEach(kur);
