import {createMarkdownProcessor} from '@astrojs/markdown-remark';
let processor:ReturnType<typeof createMarkdownProcessor>|undefined;
/** Kaynak dosyayı değiştirmeden okuma nüshasındaki tarama altlıklarını çıkarır. */
export function belgeOkumaMetni(body:string){
 return body
  .replace(/!\[Kaynak belgenin doğrulama bilgileri\]\([^\n)]+\)\s*/g,'')
  .replace(/<(div|span)\s+class="(?:kaynak-sayfa-no|kaynak-ozgun-numara)"[^>]*>[\s\S]*?<\/\1>/g,'')
  .replace(/<div\s+class="belge-imza"[^>]*>\s*[\d.,]+\s*<\/div>/g,'');
}
export async function belgeOkumaHtml(body:string){
 processor??=createMarkdownProcessor();return (await (await processor).render(belgeOkumaMetni(body))).code;
}
