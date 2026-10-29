import { normalize } from '../lib/normalize';

// Aranabilir seçim kutusu (select2 benzeri). Yerel <select> formda kalır ve değeri taşır; görünmez olur.
// Üstüne ARIA 1.2 combobox + listbox kurulur. Betik yoksa ya da data-yerel varsa yerel kutu kullanılır.
// Değer kodla değiştirildiğinde (select.value = ..., seçenekler yenilendiğinde) görünen metin kendiliğinden eşitlenir.
const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!;
const protoIndex = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex')!;
let sayac = 0;

function kur(select: HTMLSelectElement) {
  if (select.multiple || select.dataset.yerel !== undefined || select.dataset.secim) return;
  const id = select.id || `secim-${++sayac}`;
  select.id = id;
  select.dataset.secim = '1';
  const listeId = `${id}-liste`;

  const kutu = document.createElement('div');
  kutu.className = 'secim';
  const giris = document.createElement('input');
  giris.type = 'text';
  giris.className = 'secim__giris';
  giris.id = `${id}-ara`;
  giris.autocomplete = 'off';
  giris.spellcheck = false;
  giris.setAttribute('role', 'combobox');
  giris.setAttribute('aria-autocomplete', 'list');
  giris.setAttribute('aria-expanded', 'false');
  giris.setAttribute('aria-controls', listeId);
  const etiket = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`);
  if (etiket) { etiket.id ||= `${id}-etiket`; giris.setAttribute('aria-labelledby', etiket.id); }
  else if (select.getAttribute('aria-label')) giris.setAttribute('aria-label', select.getAttribute('aria-label')!);
  const liste = document.createElement('ul');
  liste.className = 'secim__liste';
  liste.id = listeId;
  liste.setAttribute('role', 'listbox');
  liste.hidden = true;
  if (etiket) liste.setAttribute('aria-labelledby', etiket.id);

  select.classList.add('secim__yerel');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  select.before(kutu);
  kutu.append(select, giris, liste);

  const secenekler = () => [...select.options];
  const eslestir = () => { giris.value = select.selectedOptions[0]?.text ?? ''; giris.disabled = select.disabled; };
  // Kodla yapılan değer atamaları da görünen metni günceller.
  Object.defineProperty(select, 'value', { configurable: true, get() { return proto.get!.call(this); }, set(v) { proto.set!.call(this, v); eslestir(); } });
  Object.defineProperty(select, 'selectedIndex', { configurable: true, get() { return protoIndex.get!.call(this); }, set(v) { protoIndex.set!.call(this, v); eslestir(); } });
  new MutationObserver(eslestir).observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'selected'] });
  select.addEventListener('change', eslestir);
  select.addEventListener('input', eslestir);
  select.form?.addEventListener('reset', () => setTimeout(eslestir));
  select.addEventListener('focus', () => giris.focus());

  let gorunen: HTMLOptionElement[] = [];
  let aktif = -1;
  const isaretle = (i: number) => {
    aktif = i;
    [...liste.querySelectorAll<HTMLElement>('[role="option"]')].forEach((li, j) => li.classList.toggle('is-aktif', j === i));
    const li = liste.querySelectorAll<HTMLElement>('[role="option"]')[i];
    if (li) { giris.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); }
    else giris.removeAttribute('aria-activedescendant');
  };
  const ciz = (q: string) => {
    const terimler = normalize(q.trim()).split(/\s+/).filter(Boolean);
    gorunen = secenekler().filter(o => !o.hidden && terimler.every(t => normalize(o.text).includes(t)));
    liste.replaceChildren();
    let grup: HTMLOptGroupElement | null = null;
    gorunen.forEach((o, i) => {
      const g = o.parentElement instanceof HTMLOptGroupElement ? o.parentElement : null;
      if (g && g !== grup) { const h = document.createElement('li'); h.className = 'secim__grup'; h.setAttribute('role', 'presentation'); h.textContent = g.label; liste.append(h); }
      grup = g;
      const li = document.createElement('li');
      li.id = `${id}-s${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(o.selected));
      if (o.disabled) li.setAttribute('aria-disabled', 'true');
      li.textContent = o.text;
      li.addEventListener('mousedown', e => e.preventDefault());
      li.addEventListener('click', () => sec(o));
      liste.append(li);
    });
    if (!gorunen.length) { const li = document.createElement('li'); li.className = 'secim__bos'; li.setAttribute('role', 'presentation'); li.textContent = 'Sonuç yok'; liste.append(li); }
    isaretle(terimler.length ? (gorunen.length ? 0 : -1) : Math.max(0, gorunen.findIndex(o => o.selected)));
  };
  // Liste panellerin overflow sınırına takılmasın diye ekrana göre (fixed) konumlanır; altta yer yoksa yukarı açılır.
  const konumla = () => {
    if (liste.hidden) return;
    const r = giris.getBoundingClientRect();
    const alt = innerHeight - r.bottom, yukari = alt < 220 && r.top > alt;
    liste.style.left = `${Math.max(8, Math.min(r.left, innerWidth - Math.max(r.width, 224) - 8))}px`;
    liste.style.width = `${Math.max(r.width, 224)}px`;
    liste.style.maxHeight = `${Math.min(320, (yukari ? r.top : alt) - 16)}px`;
    liste.style.top = yukari ? '' : `${r.bottom + 4}px`;
    liste.style.bottom = yukari ? `${innerHeight - r.top + 4}px` : '';
  };
  addEventListener('scroll', konumla, { passive: true, capture: true });
  addEventListener('resize', konumla, { passive: true });
  const goster = () => { liste.hidden = false; giris.setAttribute('aria-expanded', 'true'); kutu.classList.add('is-acik'); konumla(); };
  const ac = () => { if (giris.disabled) return; ciz(''); goster(); };
  const kapat = () => { liste.hidden = true; giris.setAttribute('aria-expanded', 'false'); giris.removeAttribute('aria-activedescendant'); kutu.classList.remove('is-acik'); eslestir(); };
  const sec = (o: HTMLOptionElement) => {
    if (o.disabled) return;
    const degisti = !o.selected;
    proto.set!.call(select, o.value);
    kapat();
    if (degisti) {
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  giris.addEventListener('focus', () => { giris.select(); });
  giris.addEventListener('click', () => { if (liste.hidden) ac(); });
  giris.addEventListener('input', e => {
    e.stopPropagation(); // Arama yazısı formun input dinleyicilerine gitmez; yalnızca seçim gider.
    ciz(giris.value);
    if (liste.hidden) goster();
  });
  giris.addEventListener('keydown', e => {
    const n = gorunen.length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (liste.hidden) { ac(); return; }
      if (n) isaretle(e.key === 'ArrowDown' ? (aktif + 1) % n : (aktif - 1 + n) % n);
    } else if (e.key === 'Home' && !liste.hidden && n) { e.preventDefault(); isaretle(0); }
    else if (e.key === 'End' && !liste.hidden && n) { e.preventDefault(); isaretle(n - 1); }
    else if (e.key === 'Enter') {
      if (!liste.hidden) { e.preventDefault(); if (gorunen[aktif]) sec(gorunen[aktif]); else kapat(); }
    } else if (e.key === 'Escape') { if (!liste.hidden) { e.preventDefault(); kapat(); giris.select(); } }
    else if (e.key === 'Tab') { if (!liste.hidden) kapat(); }
  });
  giris.addEventListener('blur', () => { if (!liste.hidden) kapat(); });
  eslestir();
}

document.querySelectorAll('select').forEach(s => kur(s as HTMLSelectElement));
// Sonradan eklenen seçim kutuları da dönüştürülür.
new MutationObserver(kayitlar => {
  for (const k of kayitlar) k.addedNodes.forEach(n => {
    if (n instanceof HTMLSelectElement) kur(n);
    else if (n instanceof HTMLElement) n.querySelectorAll('select').forEach(s => kur(s));
  });
}).observe(document.body, { childList: true, subtree: true });
