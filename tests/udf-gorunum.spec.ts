import {test,expect} from '@playwright/test';
import {zipSync,strToU8} from 'fflate';
import {fileURLToPath} from 'node:url';
import {existsSync} from 'node:fs';
const sample=fileURLToPath(new URL('../test metni.udf',import.meta.url));
const karar=fileURLToPath(new URL('../örnek karar.udf',import.meta.url));
async function load(page:any){await page.addInitScript(()=>localStorage.setItem('657:cerez','ret'));await page.goto('/udf-goruntuleyici/');await page.locator('#u-dosya').setInputFiles(sample);await expect(page.locator('.udf-sayfa')).toBeVisible();}

test('karar örneği sayfalara ayrılır ve numaralar her sayfada gösterilir',async({page})=>{
 test.skip(!existsSync(karar),'Kullanıcının yerel karar örneği bu ortamda yok.');
 await page.addInitScript(()=>localStorage.setItem('657:cerez','ret'));
 await page.goto('/udf-goruntuleyici/');await page.locator('#u-dosya').setInputFiles(karar);
 await expect(page.locator('.udf-sayfa')).toHaveCount(3);
 await expect(page.locator('.udf-sayfa-numarasi')).toHaveText(['1/3','2/3','3/3']);
 await expect(page.locator('.udf-sayfa').first().locator('.udf-ust-yazi')).toBeEmpty();
 await expect(page.locator('[data-u-uyarilar]')).not.toContainText('field, space');
 await expect(page.locator('.udf-gorsel img')).toHaveCount(2);
 await expect(page.locator('.udf-filigran')).toHaveCount(3);
 await expect(page.locator('.udf-dogrulama')).toHaveCount(3);
 await expect(page.locator('.udf-dogrulama-qr')).toHaveCount(3);
 await expect(page.locator('[data-u-uyarilar]')).toContainText('resmî doğrulama yapılmaz');
 const overflow=await page.locator('.udf-sayfa').evaluateAll(pages=>pages.map(p=>{const b=p.querySelector<HTMLElement>('.udf-belge-govde')!;return b.scrollHeight-b.clientHeight;}));
 expect(Math.max(...overflow)).toBeLessThanOrEqual(0);
 const layout=await page.locator('.udf-sayfa').evaluateAll(pages=>pages.map(p=>{const paper=p.getBoundingClientRect(),wm=p.querySelector('.udf-filigran')!.getBoundingClientRect(),head=p.querySelector('.udf-ust-yazi')!.getBoundingClientRect(),body=p.querySelector('.udf-belge-govde')!.getBoundingClientRect();return {watermarkInside:wm.left>=paper.left&&wm.right<=paper.right&&wm.top>=paper.top&&wm.bottom<=paper.bottom,headerAboveBody:head.top<body.top,textLength:p.querySelector('.udf-belge-govde')!.textContent!.length};}));
 expect(layout.every(p=>p.watermarkInside&&p.headerAboveBody)).toBe(true);
 expect(layout[0].textLength).toBeGreaterThan(1800);
 expect(layout[1].textLength).toBeGreaterThan(3200);
});

test('tek uzun UDF paragrafı biçimi ve metni koruyarak bölünür',async({page})=>{
 await page.goto('/udf-goruntuleyici/');
 const value='Uzun paragraf '.repeat(600);
 const xml=`<template><content><![CDATA[${value}]]></content><elements><paragraph><content startOffset="0" length="${value.length}" bold="true"/></paragraph></elements></template>`;
 await page.locator('#u-dosya').setInputFiles({name:'uzun.udf',mimeType:'application/octet-stream',buffer:Buffer.from(zipSync({'content.xml':strToU8(xml)}))});
 await expect.poll(()=>page.locator('.udf-sayfa').count()).toBeGreaterThan(1);
 const data=await page.locator('.udf-sayfa').evaluateAll(pages=>({text:pages.map(p=>p.querySelector('.udf-belge-govde')?.textContent??'').join(''),overflow:pages.map(p=>{const b=p.querySelector<HTMLElement>('.udf-belge-govde')!;return b.scrollHeight-b.clientHeight;})}));
 expect(data.text).toBe(value);expect(Math.max(...data.overflow)).toBeLessThanOrEqual(2);
});

test('UYAP sekme durakları ve kenarsız tablolar belgeye göre çizilir',async({page})=>{
 await page.goto('/udf-goruntuleyici/');
 const xml='<template><content><![CDATA[SOL\tSAG]]></content><elements><paragraph TabSet="250:1"><content startOffset="0" length="7"/></paragraph><table border="borderNone" columnSpans="100,100"><row><cell><paragraph><content startOffset="0" length="3"/></paragraph></cell><cell><paragraph><content startOffset="4" length="3"/></paragraph></cell></row></table></elements></template>';
 await page.locator('#u-dosya').setInputFiles({name:'sekme.udf',mimeType:'application/octet-stream',buffer:Buffer.from(zipSync({'content.xml':strToU8(xml)}))});
 await expect(page.locator('.udf-sekme')).toHaveCount(1);
 const width=await page.locator('.udf-sekme').evaluate(el=>parseFloat((el as HTMLElement).style.width));expect(width).toBeGreaterThan(200);
 await expect(page.locator('.udf-belge-tablosu')).toHaveClass(/kenarsiz/);
 await expect(page.locator('.udf-belge-tablosu td').first()).toHaveCSS('border-top-width','0px');
});

test('UDF sayfa boyutu ve yatay yön dosya ayarından okunur',async({page})=>{
 await page.goto('/udf-goruntuleyici/');
 const xml='<template><content><![CDATA[Sayfa]]></content><properties><pageFormat mediaSizeName="2" paperOrientation="2" leftMargin="30" rightMargin="30" topMargin="30" bottomMargin="30"/></properties><elements><paragraph><content startOffset="0" length="5"/></paragraph></elements></template>';
 await page.locator('#u-dosya').setInputFiles({name:'yatay.udf',mimeType:'application/octet-stream',buffer:Buffer.from(zipSync({'content.xml':strToU8(xml)}))});
 await expect(page.locator('.udf-sayfa')).toBeVisible();
 const size=await page.locator('.udf-sayfa').evaluate(el=>[(el as HTMLElement).style.width,(el as HTMLElement).style.height]);
 expect(size.map(parseFloat)).toEqual([595.276,419.528]);
});

test('belge özelliklerindeki yabancı DTD ve varlıklar işlenmez',async({page})=>{
 const requests:string[]=[];page.on('request',request=>{if(request.url().includes('udf-kotu.example'))requests.push(request.url());});
 await page.goto('/udf-goruntuleyici/');
 const xml='<template><content><![CDATA[Güvenli]]></content><elements><paragraph><content startOffset="0" length="7"/></paragraph></elements></template>';
 const props='<!DOCTYPE properties [<!ENTITY remote SYSTEM "https://udf-kotu.example/secret">]><properties><entry key="uyapsicil">&remote;</entry></properties>';
 await page.locator('#u-dosya').setInputFiles({name:'ozellik.udf',mimeType:'application/octet-stream',buffer:Buffer.from(zipSync({'content.xml':strToU8(xml),'documentproperties.xml':strToU8(props)}))});
 await expect(page.locator('.udf-sayfa')).toBeVisible();await expect(page.locator('.udf-filigran')).toHaveCount(0);expect(requests).toEqual([]);
});

test('kullanıcının UDF örneği: yazı, paragraf, liste, barkod, tablo ve üst/alt yazı',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await load(page);
 await expect(page.locator('.udf-ust-yazi')).toContainText('Üst yazı');await expect(page.locator('.udf-alt-yazi')).toContainText('Alt yazı');await expect(page.locator('.udf-sayfa-numarasi')).toHaveText('a1');
 await expect(page.locator('.udf-belge-tablosu tr')).toHaveCount(3);await expect(page.locator('.udf-belge-tablosu td')).toHaveCount(9);
 await expect(page.locator('.udf-liste-isareti')).toHaveText(['•','1.','1)','2)']);
 await expect(page.locator('.udf-barkod')).toHaveAttribute('aria-label','Barkod: 12345678911');await expect(page.locator('.udf-barkod canvas')).toHaveCount(1);
 const styles=await page.locator('.udf-sayfa').evaluate(el=>{
  const runs=[...el.querySelectorAll<HTMLElement>('.udf-paragraf span')].filter(s=>s.textContent?.trim()==='TEST');
  const ps=[...el.querySelectorAll<HTMLElement>('.udf-paragraf')];
  return {red:runs.some(s=>s.style.color==='rgb(253, 0, 0)'),bold:runs.some(s=>s.style.fontWeight==='700'),italic:runs.some(s=>s.style.fontStyle==='italic'),underline:runs.some(s=>s.style.textDecorationLine.includes('underline')),strike:runs.some(s=>s.style.textDecorationLine.includes('line-through')),sub:runs.some(s=>s.style.verticalAlign==='sub'),sup:runs.some(s=>s.style.verticalAlign==='super'),highlight:runs.some(s=>s.style.backgroundColor==='rgb(255, 160, 0)'),alignments:[...new Set(ps.map(p=>p.style.textAlign))],indent:ps.find(p=>p.textContent?.includes('GİRİNTİ ARTTIR'))?.style.marginLeft,font:getComputedStyle(el).fontFamily};
 });
 expect(styles).toMatchObject({red:true,bold:true,italic:true,underline:true,strike:true,sub:true,sup:true,highlight:true,indent:'36pt'});expect(styles.alignments.sort()).toEqual(['center','justify','left','right']);expect(styles.font).toContain('Times New Roman');
 await page.addStyleTag({content:'.bar{visibility:hidden!important}'});
 await page.locator('.udf-sayfa').screenshot({path:'output/udf-test-metni-onizleme.png'});expect(errors).toEqual([]);
});

test('belge görünümünde arama biçimi korur; metin düzenleme yalın görünüme geçer',async({page})=>{
 await load(page);await page.locator('#u-ara').fill('TEST');await expect(page.locator('[data-u-onizleme] mark')).toHaveCount(13);
 await expect(page.locator('.udf-belge-tablosu td')).toHaveCount(9);
 await page.locator('[data-u-gorunum="metin"]').click();await expect(page.locator('[data-u-onizleme]')).toContainText('Üst yazı');
 await page.locator('[data-u-gorunum="belge"]').click();await expect(page.locator('.udf-sayfa')).toBeVisible();
 await page.locator('.udf-metin-duzenle summary').click();await page.locator('#u-metin').fill('Düzenlenmiş metin');
 await expect(page.locator('[data-u-onizleme]')).toHaveText('Düzenlenmiş metin');await expect(page.locator('[data-u-gorunum="belge"]')).toBeDisabled();
 await page.locator('[data-u-temizle]').click();await expect(page.locator('.udf-sayfa')).toHaveCount(0);await expect(page.locator('[data-u-cikti="pdf"]')).toBeDisabled();
});

test('UDF kaynak metni, biçim ve görsel alanlarından kod veya dış istek çalışmaz',async({page})=>{
 await page.goto('/udf-goruntuleyici/');const requests:string[]=[];
 page.on('request',r=>{if(r.url().includes('udf-kotu.example'))requests.push(r.url());});
 const xml='<template><content><![CDATA[<img src=x onerror=alert(1)>]]></content><elements><paragraph><content startOffset="0" length="28" family="Arial; background:url(https://udf-kotu.example/x)" foreground="url(x)"/></paragraph><image imageData="https://udf-kotu.example/x"/><script src="https://udf-kotu.example/y"/></elements></template>';
 await page.locator('#u-dosya').setInputFiles({name:'guvenlik.udf',mimeType:'application/octet-stream',buffer:Buffer.from(zipSync({'content.xml':strToU8(xml)}))});
 await expect(page.locator('.udf-sayfa')).toBeVisible();await expect(page.locator('[data-u-onizleme] script,[data-u-onizleme] img')).toHaveCount(0);expect(requests).toEqual([]);
 await page.locator('#u-dosya').setInputFiles({name:'bozuk.udf',mimeType:'application/octet-stream',buffer:Buffer.from('bozuk')});
 await expect(page.locator('[data-u-durum]')).toContainText('Belge okunamadı');await expect(page.locator('.udf-sayfa')).toHaveCount(0);
});

test('mobilde belge kendi alanında kayar ve koyu temada belge renkleri korunur',async({page})=>{
 await page.setViewportSize({width:375,height:850});await page.emulateMedia({colorScheme:'dark'});await load(page);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.locator('.udf-sayfa')).toHaveCSS('background-color','rgb(255, 255, 255)');
 await page.screenshot({path:'output/udf-test-metni-mobil.png',fullPage:true});
});

test('stil mirası, paragraf aralıkları ve farklı yazı koşularını aşan arama',async({page})=>{
 await page.goto('/udf-goruntuleyici/');
 const xml='<template><content><![CDATA[Aranan metin\n]]></content><elements><paragraph name="ozel" Alignment="3" LeftIndent="18" RightIndent="9" FirstLineIndent="-8" SpaceAbove="6" SpaceBelow="3" LineSpacing="0.5"><content startOffset="0" length="7"/><content startOffset="7" length="6" italic="true"/></paragraph></elements><styles><style name="default" family="Arial" size="11"/><style name="ozel" parent="default" bold="true"/></styles></template>';
 await page.locator('#u-dosya').setInputFiles({name:'stil.udf',mimeType:'application/octet-stream',buffer:Buffer.from(zipSync({'content.xml':strToU8(xml)}))});
 await expect(page.locator('.udf-sayfa')).toBeVisible();
 const style=await page.locator('.udf-paragraf').evaluate(p=>{const s=(p as HTMLElement).style;return [s.marginLeft,s.marginRight,s.textIndent,s.paddingTop,s.paddingBottom,s.lineHeight,s.fontWeight,s.fontFamily];});
 expect(style).toEqual(['18pt','9pt','-8pt','6pt','3pt','1.65','700','Arial']);
 await page.locator('#u-ara').fill('Aranan metin');await expect(page.locator('[data-u-onizleme] mark')).toHaveCount(2);await expect(page.locator('[data-u-sayi]')).toContainText('1 eşleşme');
 await expect(page.locator('.udf-paragraf span').last()).toHaveCSS('font-style','italic');
});

test('sık geçen aramada belgeyi kilitlemeden sonuç sayısı ve sınırlı vurgu gösterilir',async({page})=>{
 await page.goto('/udf-editor/');await page.locator('#u-metin').fill('a '.repeat(6000));await page.locator('#u-ara').fill('a');
 await expect(page.locator('[data-u-sayi]')).toContainText('6000 eşleşme');await expect(page.locator('[data-u-onizleme] mark')).toHaveCount(5000);
});
