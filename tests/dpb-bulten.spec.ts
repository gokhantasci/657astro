import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {bultenGorusleri,bultenGorusYolu,bultenMetni} from '../src/lib/dpb-bulten';
import {belgeSorulari} from '../src/lib/belge-sorulari';
const body=(id:string)=>readFileSync(`src/content/dpb-bulten/${id}.md`,'utf8').replace(/\r\n/g,'\n').replace(/^---\n[\s\S]*?\n---\n/,'').trim();
const norm=(s:string)=>s.replace(/\s+/g,' ').trim();
test('336 özetin sıralı sözcükleri kaynakla aynıdır; görüşler arasında kayıp veya taşıma yoktur',()=>{
 const original=readFileSync('src/content/belgeler/dpb/dpb_mutalaa_ozel.md','utf8').replace(/\r\n/g,'\n');
 const source=[...original.matchAll(/<section class="kaynak-sayfa"[^>]*data-kaynak-sayfa="(\d+)"[^>]*>([\s\S]*?)<\/section>/g)].filter(m=>+m[1]>=25&&+m[1]<=524).map(m=>m[2].replace(/<div class="kaynak-sayfa-no"[^>]*>[\s\S]*?<\/div>/g,'').replace(/^\*\*Devlet Personel Başkanlığı Tarafından.*$/gm,'').replace(/^## .+$/gm,'').replace(/^(?:###\s+|\*\*)Özet\s*[:;]\s*/gm,'')).join('\n');
 const actual=bultenGorusleri.map(g=>g.title+'\n\n'+body(g.id)).join('\n');
 const words=(s:string)=>s.normalize('NFKC').match(/[\p{L}\p{N}_]+/gu);
 expect(words(actual)).toEqual(words(source));expect(new Set(bultenGorusleri.map(g=>g.id)).size).toBe(336);
 expect(body(bultenGorusleri.at(-1)!.id)).not.toContain('Baskı:');
 for(const g of bultenGorusleri){const md=body(g.id);expect(md).not.toMatch(/kaynak-sayfa|belge-sayfa|^### Özet:/m);const metin=bultenMetni(md);for(const q of belgeSorulari(g.title,[{no:1,metin}],'dpb'))expect(norm(metin).includes(norm(q.cevap))).toBe(true);}
});
test('çok sayfalı bir görüş tek metin olarak açılır ve soru-cevaplar altında kalır',async({page})=>{
 const g=bultenGorusleri.find(g=>g.pdfBitis>g.pdfBaslangic)!;await page.goto(bultenGorusYolu(g.id));
 await expect(page.locator('h1')).toHaveText(g.title);
 expect(norm(await page.locator('[data-ozgun-metin]').innerText())).toBe(norm(bultenMetni(body(g.id))));
 expect(await page.locator('#ozgun-metin').evaluate(e=>!!(e.compareDocumentPosition(document.querySelector('#belge-sorulari')!)&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 await expect(page.locator('.kaynak-sayfa,.kaynak-sayfa-no,iframe')).toHaveCount(0);
});
test('ayrı görüş adresleri site haritasında, aramada ve asistan dizininde bulunur',async({request})=>{
 const g=bultenGorusleri[0],path=bultenGorusYolu(g.id);
 expect(await (await request.get('/sitemap-sayfalar.xml')).text()).toContain(path);
 const search=await (await request.get('/araclar/arama.json')).json();expect(search.some((r:string[])=>r[2]===path&&r[1]===g.title)).toBe(true);
 const assistant=await (await request.get('/asistan/indeks.json')).json();expect(assistant.some((r:{yol:string;baslik:string})=>r.yol===path&&r.baslik===g.title)).toBe(true);
});
