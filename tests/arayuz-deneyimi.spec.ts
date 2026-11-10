import {test,expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import registry from '../services/oneriler/arac-sayaclari.json' with {type:'json'};
const sample=fileURLToPath(new URL('../test metni.udf',import.meta.url));
async function setup(page:any){await page.addInitScript(()=>localStorage.setItem('657:cerez','ret'));await page.route('**/_657-servis/api/**',r=>r.fulfill({json:{sayi:0,bugun:0,baslangic:'2026-11-05T00:00:00Z',toplam:0,sayaclar:Object.fromEntries(registry.map(t=>[t.anahtar,{bugun:0,buHafta:0,buYil:0,toplam:0}]))}}));}

test('UDF çalışma alanı boş, başarı, hata ve temizleme durumlarını açıkça gösterir',async({page})=>{
 await setup(page);await page.goto('/udf-donusturucu/');
 await expect(page.locator('[data-u-bos]')).toBeVisible();await expect(page.locator('[data-islem-durumu]')).toHaveAttribute('data-state','idle');await expect(page.locator('[data-u-cikti="docx"]')).toBeDisabled();
 await page.locator('#u-dosya').setInputFiles({name:'deneme.txt',mimeType:'text/plain',buffer:Buffer.from('Belge deneyimi denemesi')});
 await expect(page.locator('[data-islem-durumu]')).toHaveAttribute('data-state','success');await expect(page.locator('[data-dosya-secim]')).toContainText('deneme.txt');await expect(page.locator('[data-u-belge-adi]')).toHaveText('deneme.txt');await expect(page.locator('[data-u-bos]')).toBeHidden();
 await page.locator('#u-dosya').setInputFiles({name:'bozuk.udf',mimeType:'application/octet-stream',buffer:Buffer.from('bozuk')});
 await expect(page.locator('[data-islem-durumu]')).toHaveAttribute('data-state','error');await expect(page.getByRole('alert')).toContainText('Belge okunamadı');await expect(page.locator('[data-u-cikti="docx"]')).toBeDisabled();
 await page.locator('[data-u-temizle]').click();await expect(page.locator('[data-islem-durumu]')).toHaveAttribute('data-state','idle');await expect(page.locator('[data-dosya-secim]')).toHaveText('Henüz dosya seçilmedi.');
});

test('UDF yakınlaştırma, sığdırma ve görünüm değişikliği birlikte çalışır',async({page})=>{
 await setup(page);await page.setViewportSize({width:1440,height:1000});await page.goto('/udf-goruntuleyici/');await page.locator('#u-dosya').setInputFiles(sample);await expect(page.locator('.udf-sayfa')).toBeVisible();
 const first=await page.locator('.udf-sayfa').evaluate(el=>Number((el as HTMLElement).style.zoom));
 await page.getByRole('button',{name:'Yakınlaştır',exact:true}).click();expect(await page.locator('.udf-sayfa').evaluate(el=>Number((el as HTMLElement).style.zoom))).toBeGreaterThan(first);
 await page.getByRole('button',{name:'Sığdır',exact:true}).click();
 await page.locator('#u-ara').fill('TEST');await expect(page.locator('[data-u-arama-ozet]')).toHaveText('13 eşleşme');
 await page.locator('[data-u-gorunum="metin"]').click();await expect(page.getByRole('button',{name:'Yakınlaştır',exact:true})).toBeDisabled();
 await page.locator('[data-u-gorunum="belge"]').click();await expect(page.getByRole('button',{name:'Yakınlaştır',exact:true})).toBeEnabled();
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:'output/astryx-udf-masaustu.png',fullPage:true});
});

test('ortak seçim menüsü devre dışı seçenekleri atlar ve yardımcı alanları taşır',async({page})=>{
 await setup(page);await page.goto('/kira-artis-hesaplama/');
 await page.evaluate(()=>{const form=document.querySelector('form')!;const wrap=document.createElement('div');wrap.innerHTML='<label for="ux-secim">Deneme seçimi</label><p id="ux-yardim">Açıklama</p><select id="ux-secim" name="ux-secim" aria-describedby="ux-yardim"><option value="a">Birinci</option><option value="b" disabled>Kapalı seçenek</option><option value="c">Üçüncü</option><optgroup label="Kapalı grup" disabled><option value="d">Grup seçeneği</option></optgroup></select>';form.append(wrap);const select=wrap.querySelector('select')!;for(const type of ['input','change'])select.addEventListener(type,()=>{(window as any)[type+'Count']=((window as any)[type+'Count']||0)+1;});});
 const input=page.locator('#ux-secim-ara');await expect(input).toBeVisible();await expect(input).toHaveAttribute('aria-describedby','ux-yardim');
 await input.click();await input.press('ArrowDown');await input.press('Enter');await expect(page.locator('#ux-secim')).toHaveValue('c');
 expect(await page.evaluate(()=>[(window as any).inputCount,(window as any).changeCount])).toEqual([1,1]);
 await input.click();await input.press('End');await expect(page.locator('#ux-secim-liste .is-aktif')).toHaveText('Üçüncü');await expect(page.locator('#ux-secim-liste [aria-selected="true"]')).toHaveText('Üçüncü');await expect(page.getByRole('option',{name:'Grup seçeneği',exact:true})).toHaveAttribute('aria-disabled','true');
 await page.locator('h1').click();await expect(page.locator('#ux-secim-liste')).toBeHidden();
 await page.locator('#ux-secim').evaluate(el=>el.setAttribute('aria-invalid','true'));await expect(input).toHaveAttribute('aria-invalid','true');
 await page.locator('#ux-secim').evaluate(el=>(el as HTMLSelectElement).disabled=true);await expect(input).toBeDisabled();
});

for(const theme of ['light','dark'])for(const width of [320,375,414,768])test(`belge çalışma alanı ${theme} ${width}`,async({page})=>{
 await setup(page);await page.addInitScript(t=>localStorage.setItem('657:tema',t),theme);await page.setViewportSize({width,height:900});await page.goto('/udf-donusturucu/');
 await expect(page.locator('html')).toHaveAttribute('data-theme',theme);await page.locator('#u-dosya').setInputFiles(sample);await expect(page.locator('.udf-sayfa')).toBeVisible();
 await page.getByRole('button',{name:'Sığdır',exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.locator('[data-u-onizleme]').evaluate(el=>el.scrollWidth<=el.clientWidth+2)).toBe(true);
 for(const b of await page.locator('[data-udf] button:visible').all())expect(await b.evaluate(el=>{const s=getComputedStyle(el);return s.whiteSpace==='nowrap'||el.scrollHeight<=el.clientHeight+1;})).toBe(true);
 await page.evaluate(()=>window.scrollTo(0,0));
 if(theme==='light')await page.screenshot({path:`output/astryx-udf-${width}.png`,fullPage:true});
});
