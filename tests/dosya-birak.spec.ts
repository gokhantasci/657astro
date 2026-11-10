import {test,expect} from '@playwright/test';
import mods from '../src/data/teftis-modulleri.json' with {type:'json'};

for(const slug of ['derdest-dosya-listesi','yargilamagideri','gerekcelikarar','udf-birlestirme',...mods.map(m=>m.slug)]){
 test(`${slug}: dosya alanları ortak görünümü kullanır`,async({page})=>{
  await page.goto('/'+slug+'/');
  const root=mods.some(m=>m.slug===slug)?page.frameLocator('[data-teftis-modul]'):page;
  const inputs=root.locator('input[type="file"]');
  if(slug==='kalem-denetimi'){await expect(inputs).toHaveCount(0);return;}
  await expect(inputs.first()).toHaveAttribute('data-birak','1');
  const issues=await inputs.evaluateAll(nodes=>nodes.flatMap(input=>{
   const el=input as HTMLInputElement;
   const zone=el.closest('.dosya-birak')||el.previousElementSibling;
   if(!zone?.matches('.dosya-birak'))return [el.id+': alan bulunamadı'];
   if(zone.querySelectorAll('.dosya-birak').length)return [el.id+': iç içe alan'];
   if(zone.querySelectorAll('.dosya-birak__mesaj').length!==1)return [el.id+': açıklama sayısı'];
   if(getComputedStyle(zone).borderTopStyle!=='dashed')return [el.id+': kenarlık'];
   return [];
  }));
  expect(issues).toEqual([]);
  for(const width of [360,1280]){
   await page.setViewportSize({width,height:900});
   expect(await root.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
 });
}

test('ortak alan tıklaması dosya seçiciyi açar; sürükleme tek change olayı üretir',async({page})=>{
 await page.goto('/udf-goruntuleyici/');
 const picker=page.waitForEvent('filechooser');await page.locator('.dosya-birak__mesaj').click();await picker;
 await page.locator('#u-dosya').evaluate(input=>{input.addEventListener('change',()=>{(window as any).__uploadChanges=((window as any).__uploadChanges||0)+1;});});
 const files=await page.evaluateHandle(()=>{const dt=new DataTransfer();dt.items.add(new File(['Deneme metni'],'ornek.txt',{type:'text/plain'}));return dt;});
 await page.locator('.dosya-birak').dispatchEvent('drop',{dataTransfer:files});
 await expect(page.locator('#u-metin')).toHaveValue('Deneme metni');
 expect(await page.evaluate(()=>(window as any).__uploadChanges)).toBe(1);
});

for(const slug of ['harctahsilkontrol','kesinlesmek'])test(`${slug}: sonradan açılan Excel alanı da butonsuzdur`,async({page})=>{
 await page.goto('/'+slug+'/');const f=page.frameLocator('[data-teftis-modul]');
 let content='',offset=0;
 const rows=[['Esas No','Karar No','Statü'],['2026/1','2026/5','Kapalı']].map(row=>'<row>'+row.map(value=>{const cell=`<cell><content startOffset="${offset}" length="${value.length}"/></cell>`;content+=value+'\n';offset+=value.length+1;return cell;}).join('')+'</row>').join('');
 const udf='<udf><content><![CDATA['+content+']]></content><elements><table>'+rows+'</table></elements></udf>';
 await f.locator('#udfInput').setInputFiles({name:'ornek.udf',mimeType:'application/octet-stream',buffer:Buffer.from(udf)});
 await expect(f.locator('#excelInput')).toHaveAttribute('data-birak','1');
 await expect(f.locator('#excelDrop')).toHaveClass(/dosya-birak/);
 await expect(f.locator('#excelDrop .dosya-birak__mesaj')).toBeVisible();
 await expect(f.locator('[data-teftis-action="excel-pick"]')).toBeHidden();
});

test('UDF dönüştürücü yükleme alanı betik çalışmadan da yerel düğmeyi gizler',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto('/udf-donusturucu/');
 await expect(page.locator('[data-dosya-birak]')).toHaveCount(1);await expect(page.locator('.dosya-birak .dosya-birak')).toHaveCount(0);
 await expect(page.locator('.dosya-birak__mesaj')).toBeVisible();
 expect(await page.locator('#u-dosya').evaluate(el=>({width:el.getBoundingClientRect().width,clip:getComputedStyle(el).clipPath}))).toEqual({width:1,clip:'inset(50%)'});
 await context.close();
});
