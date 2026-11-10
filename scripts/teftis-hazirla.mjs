import {readFile,writeFile} from 'node:fs/promises';
import ts from 'typescript';
import {teftisSayfalama} from './teftis-sayfalama.mjs';
import {gorunenTarihler} from '../src/lib/gorunen-tarihler.ts';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const mods=JSON.parse(await read('src/data/teftis-modulleri.json'));
const settings=JSON.parse(await read('src/data/ayarlar.json'));
const size=settings.site.tablo_sayfa_boyu;
const base=(process.env.BASE_PATH||'/').replace(/\/+$/,'');
const normalize=(await read('src/lib/normalize.ts')).replace('export const','const');
const selection=ts.transpileModule(normalize+'\n'+(await read('src/scripts/secim.ts')).replace(/^import .*?;\s*/m,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const script=text=>'<script>'+text.replace(/<\/script/gi,'<\\/script')+'</script>';
const assets='public/uygulamalar/teftis/';
const dateRuntime=ts.transpileModule((await read('src/lib/tarih-metni.ts')).replace('export function tarihMetni','function tarihMetni'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const deps=script('window.teftisBasePath='+JSON.stringify(base)+';')+script('(()=>{'+dateRuntime+';window.teftisTarihMetni=tarihMetni;})();')+script(await read('node_modules/dompurify/dist/purify.min.js'))+(await Promise.all(['bridge.js','jquery.min.js','bootstrap.min.js','xlsx.full.min.js','jszip.min.js','utils.js'].map(n=>read(assets+n)))).map(s=>script(teftisSayfalama(s,size))).join('')+script('jQuery.getJSON=()=>({fail:()=>{}});jQuery.ajax=()=>({fail:()=>{}});');
const selectCSS=(await read('src/styles/global.css')).split('\n').filter(l=>l.startsWith('.secim')).join('\n');
const uploadScript=script(ts.transpileModule(await read('src/scripts/dosya-birak.ts'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText);
// Yazı tipleri de aynı belgeye gömülür: iframe dış ağ veya alan adı gerektirmez.
let fonts='';
for(const [family,pkg,weight]of [['Red Hat Text','red-hat-text',400],['Red Hat Text','red-hat-text',500],['Red Hat Display','red-hat-display',600]])for(const subset of ['latin','latin-ext']){
 const file=await readFile(new URL(`../node_modules/@fontsource/${pkg}/files/${pkg}-${subset}-${weight}-normal.woff2`,import.meta.url));
 const range=subset==='latin'?'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD':'U+0100-0130,U+0132-0151,U+0154-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-036F,U+1D00-1EFF,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
 fonts+=`@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${file.toString('base64')}) format('woff2');unicode-range:${range};}`;
}
const css=await read(assets+'bootstrap.min.css')+'\n'+await read('src/styles/tokens.css')+'\n'+fonts+'\n'+await read(assets+'tema.css')+'\n'+selectCSS+'\n'+await read('src/styles/dosya-birak.css')+'\n'+await read('src/styles/arayuz.css');
const csp="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'";
for(const m of mods){
 const body=teftisSayfalama(await read('src/legacy/teftis/'+m.slug+'.html'),size);
 const engines=(await Promise.all(m.betikler.map(n=>read(assets+n+'.js')))).map(s=>script(teftisSayfalama(s,size))).join('');
 const html='<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="Content-Security-Policy" content="'+csp+'"><title>'+m.baslik+' | 657.com.tr</title><style>'+css+'</style>'+deps+uploadScript+'</head><body>'+body+engines+script('document.dispatchEvent(new Event("xlsx-ready"));')+script(selection)+'</body></html>';
 await writeFile(new URL('../'+assets+m.slug+'.html',import.meta.url),gorunenTarihler(html));
}
