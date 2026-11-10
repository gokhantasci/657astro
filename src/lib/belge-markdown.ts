import type {BelgeSayfasi} from './belge-sorulari';
// Soru-cevap alıntısının kaynağı, ekranda gösterilen aynı Markdown gövdesidir.
export function markdownSayfalari(body:string):BelgeSayfasi[]{
 return [...body.matchAll(/<section class="kaynak-sayfa"[^>]*data-kaynak-sayfa="(\d+)"[^>]*>([\s\S]*?)<\/section>/g)].map(m=>({no:Number(m[1]),yontem:'markdown',metin:m[2]
  .replace(/<(?:span|div) class="kaynak-sayfa-no"[^>]*>[\s\S]*?<\/(?:span|div)>/g,'')
  .replace(/!\[[^\]]*\]\([^)]+\)/g,'')
  .replace(/<\/(?:td|th)>/g,' ').replace(/<br\s*\/?>/g,'\n').replace(/<\/tr>/g,'\n\n')
  .replace(/<[^>]+>/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1')
  .replace(/^#{1,6}\s+/gm,'').replace(/\*\*/g,'').replace(/\\([\\`*\[\]_|.()+-])/g,'$1')
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&amp;/g,'&').trim()}));
}
