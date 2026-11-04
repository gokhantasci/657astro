// Piper sesli okuma dosyalarını (Türkçe Fahrettin sesi, ONNX Runtime ve fonem WASM'ı) aynı origin altına indirir.
// Çalışma anında src/scripts/piper.worker.ts önce /modeller/piper/ altını dener; dosya yoksa asıl kaynağa döner.
// Kullanım: node scripts/piper-dosyalarini-indir.mjs  (hedef: public/modeller/piper, ya da PIPER_KLASORU)
import {mkdir, stat, rename, writeFile} from 'node:fs/promises';
import {createReadStream, createWriteStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {resolve, join, dirname} from 'node:path';

export const PIPER_KAYNAKLARI = [
  ['voices/tr/tr_TR/fahrettin/medium/tr_TR-fahrettin-medium.onnx.json', 'https://huggingface.co/diffusionstudio/piper-voices/resolve/main/tr/tr_TR/fahrettin/medium/tr_TR-fahrettin-medium.onnx.json'],
  ['voices/tr/tr_TR/fahrettin/medium/tr_TR-fahrettin-medium.onnx', 'https://huggingface.co/diffusionstudio/piper-voices/resolve/main/tr/tr_TR/fahrettin/medium/tr_TR-fahrettin-medium.onnx'],
  ['ort/ort-wasm-simd.wasm', 'https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/ort-wasm-simd.wasm'],
  ['ort/ort-wasm.wasm', 'https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/ort-wasm.wasm'],
  ['phonemize/piper_phonemize.wasm', 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm'],
  ['phonemize/piper_phonemize.data', 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.data'],
];

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/').replace(/^\/?/, '/')}` || process.argv[1]?.endsWith('piper-dosyalarini-indir.mjs')) {
  const kok = resolve(process.env.PIPER_KLASORU || 'public/modeller/piper');
  const ozet = async f => { const h = createHash('sha256'); for await (const b of createReadStream(f)) h.update(b); return h.digest('hex'); };
  const dosyalar = {};
  for (const [ad, url] of PIPER_KAYNAKLARI) {
    const hedef = join(kok, ad);
    await mkdir(dirname(hedef), {recursive: true});
    const yanit = await fetch(url, {signal: AbortSignal.timeout(300000)});
    if (!yanit.ok) throw Error(`${ad}: HTTP ${yanit.status}`);
    await pipeline(Readable.fromWeb(yanit.body), createWriteStream(hedef + '.tmp'));
    await rename(hedef + '.tmp', hedef);
    const s = await stat(hedef);
    dosyalar[ad] = {bayt: s.size, sha256: await ozet(hedef), kaynak: url};
    console.log(`${ad}: ${s.size} bayt`);
  }
  await writeFile(join(kok, 'hazir.json'), JSON.stringify({ses: 'tr_TR-fahrettin-medium', lisans: 'Ses: Piper (MIT) / Fahrettin sesi kendi lisansıyla; ONNX Runtime MIT', dosyalar}, null, 1) + '\n');
}
