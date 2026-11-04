/// <reference lib="webworker" />
import {TtsSession} from '@mintplex-labs/piper-tts-web';

// Kurum ağlarında Hugging Face, jsDelivr ve cdnjs engellenebildiği için Piper dosyaları önce kendi alan adımızdan
// (/modeller/piper/, bkz. scripts/piper-dosyalarini-indir.mjs) istenir; orada yoksa kütüphanenin asıl kaynağına dönülür.
const YEREL = new URL('/modeller/piper/', self.location.origin).href;
const ESLEME: [string, string][] = [
  ['https://huggingface.co/diffusionstudio/piper-voices/resolve/main/', 'voices/'],
  ['https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/', 'ort/'],
  ['https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/', 'phonemize/'],
];
const asilFetch = self.fetch.bind(self);
self.fetch = async (girdi: RequestInfo | URL, ayar?: RequestInit) => {
  const adres = typeof girdi === 'string' ? girdi : girdi instanceof URL ? girdi.href : girdi.url;
  const eslesen = ESLEME.find(([kaynak]) => adres.startsWith(kaynak));
  if (eslesen) {
    try {
      const yanit = await asilFetch(YEREL + eslesen[1] + adres.slice(eslesen[0].length), ayar);
      if (yanit.ok) return yanit;
    } catch { /* yerel kopya yoksa asıl kaynağa geçilir */ }
  }
  return asilFetch(girdi, ayar);
};

// Fonem verisi XMLHttpRequest ile yüklendiğinden fetch yönlendirmesine girmez; yerel kopya varsa WASM yolları doğrudan verilir.
const yerelWasm = (async () => {
  try { if ((await asilFetch(YEREL + 'hazir.json', {cache: 'no-cache'})).ok) return {onnxWasm: YEREL + 'ort/', piperData: YEREL + 'phonemize/piper_phonemize.data', piperWasm: YEREL + 'phonemize/piper_phonemize.wasm'}; } catch { /* asıl kaynak */ }
  return undefined;
})();

let session: Promise<TtsSession> | undefined;
self.onmessage = async (e: MessageEvent<{text: string}>) => {
  try {
    session ??= TtsSession.create({voiceId: 'tr_TR-fahrettin-medium', wasmPaths: await yerelWasm, progress: (p: {loaded: number; total: number}) => self.postMessage({type: 'progress', value: p.total ? Math.min(100, Math.round(p.loaded / p.total * 100)) : 0})});
    const wav = await (await session).predict(e.data.text);
    self.postMessage({type: 'audio', wav});
  } catch (err) { session = undefined; self.postMessage({type: 'error', message: (err as Error).message}); }
};
