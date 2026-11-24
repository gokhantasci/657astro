import bwipjs from '@bwip-js/browser';

const root = document.querySelector<HTMLElement>('[data-qr-app]');
if (root) {
  const elTur = root.querySelector<HTMLSelectElement>('[data-qr-tur]')!;
  const elAlanlar = [...root.querySelectorAll<HTMLElement>('[data-qr-alan]')];
  const elEclevel = root.querySelector<HTMLSelectElement>('[data-qr-ec]')!;
  const elScale = root.querySelector<HTMLInputElement>('[data-qr-scale]')!;
  const elRenk = root.querySelector<HTMLInputElement>('[data-qr-renk]')!;
  const elBg = root.querySelector<HTMLInputElement>('[data-qr-bg]')!;
  const elCanvas = root.querySelector<HTMLCanvasElement>('[data-qr-canvas]')!;
  const elDurum = root.querySelector<HTMLElement>('[data-qr-durum]')!;
  const elPng = root.querySelector<HTMLButtonElement>('[data-qr-png]')!;
  const elSvg = root.querySelector<HTMLButtonElement>('[data-qr-svg]')!;

  const val = (sel: string) => root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(sel)?.value.trim() ?? '';

  function icerikOlustur(): string {
    const tur = elTur.value;
    if (tur === 'url') return val('[data-qr-in="url"]') || 'https://657.com.tr/';
    if (tur === 'metin') return val('[data-qr-in="metin"]') || '657.com.tr';
    if (tur === 'wifi') {
      const ssid = val('[data-qr-in="wifi-ssid"]').replace(/([\\;,:"])/g, '\\$1');
      const sifre = val('[data-qr-in="wifi-pass"]').replace(/([\\;,:"])/g, '\\$1');
      const guv = val('[data-qr-in="wifi-enc"]') || 'WPA';
      return `WIFI:T:${guv};S:${ssid || 'AgAdi'};P:${sifre};;`;
    }
    if (tur === 'vcard') {
      const ad = val('[data-qr-in="vc-ad"]') || 'Ad Soyad';
      const tel = val('[data-qr-in="vc-tel"]');
      const eposta = val('[data-qr-in="vc-mail"]');
      const kurum = val('[data-qr-in="vc-org"]');
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${ad}\n${kurum ? `ORG:${kurum}\n` : ''}${tel ? `TEL:${tel}\n` : ''}${eposta ? `EMAIL:${eposta}\n` : ''}END:VCARD`;
    }
    if (tur === 'eposta') {
      const kime = val('[data-qr-in="mail-to"]');
      const konu = val('[data-qr-in="mail-sub"]');
      return `mailto:${kime}?subject=${encodeURIComponent(konu)}`;
    }
    if (tur === 'tel') {
      const no = val('[data-qr-in="tel-no"]').replace(/\s+/g, '');
      return `tel:${no || '+90'}`;
    }
    return 'https://657.com.tr/';
  }

  function ciz() {
    const text = icerikOlustur();
    const scale = Math.max(2, Math.min(12, Number(elScale.value) || 6));
    const fg = elRenk.value.replace('#', '');
    const bg = elBg.value.replace('#', '');
    const ec = elEclevel.value || 'M';
    try {
      bwipjs.toCanvas(elCanvas, {
        bcid: 'qrcode',
        text,
        scale,
        eclevel: ec,
        barcolor: fg,
        backgroundcolor: bg,
        paddingwidth: 4,
        paddingheight: 4,
      } as Parameters<typeof bwipjs.toCanvas>[1]);
      elDurum.textContent = `ISO/IEC 18004 QR Kod hazır · ${text.length} karakter · Hata düzeltme: ${ec}`;
    } catch (e) {
      elDurum.textContent = `QR kod oluşturulamadı: ${(e as Error).message}`;
    }
  }

  function alanGoster() {
    const tur = elTur.value;
    elAlanlar.forEach((a) => (a.hidden = a.dataset.qrAlan !== tur));
    ciz();
  }

  elTur.addEventListener('change', alanGoster);
  root.querySelectorAll('input, textarea, select').forEach((el) => {
    if (el !== elTur) el.addEventListener('input', ciz);
  });

  elPng.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = elCanvas.toDataURL('image/png');
    a.download = '657-qr-kod.png';
    a.click();
  });

  elSvg.addEventListener('click', () => {
    try {
      const svg = bwipjs.toSVG({
        bcid: 'qrcode',
        text: icerikOlustur(),
        scale: Math.max(2, Math.min(12, Number(elScale.value) || 6)),
        eclevel: elEclevel.value || 'M',
        barcolor: elRenk.value.replace('#', ''),
        backgroundcolor: elBg.value.replace('#', ''),
        paddingwidth: 4,
        paddingheight: 4,
      } as Parameters<typeof bwipjs.toSVG>[0]);
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '657-qr-kod.svg';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      /* geç */
    }
  });

  alanGoster();
}
