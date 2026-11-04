import {test,expect} from '@playwright/test';
const cases=[
 {path:'tam-kabul',dava:100000,old:45000,current:62000},
 {path:'kismen-kabul',dava:100000,kabul:60000,old:45000,current:60000},
 {path:'davanin-reddi',dava:100000,old:45000,current:62000,davali:true},
 {path:'husumet-dava-sarti',dava:100000,old:16000,current:16000,davali:true},
 {path:'acilmamis-sayilma',dava:100000,old:22500,current:31000,davali:true,once:true},
 {path:'feragat',dava:100000,old:22500,current:31000,davali:true,once:true},
 {path:'sulh',dava:100000,old:22500,current:31000},
 {path:'davayi-kabul',dava:100000,old:45000,current:62000},
 {path:'nafaka-tam-kabul',dava:500,old:6000,current:6000},
 {path:'nafaka-kismen-kabul',dava:10000,kabul:6000,old:45000,current:62000},
 {path:'maddi-tazminat-vekalet',dava:1000000,kabul:50000,old:45000,current:50000},
 {path:'manevi-tazminat-vekalet',dava:1000000,kabul:50000,old:148500,current:150500,davali:true}
];
const money=(n:number)=>n.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' TL';
for(const c of cases)test(`${c.path}: girilen tutarlar ve yeni tarifenin yürürlük sınırı`,async({page})=>{
 await page.goto('/'+c.path+'-hesaplama/');
 await page.locator('#dava').fill(String(c.dava));if(c.kabul!==undefined)await page.locator('#kabul').fill(String(c.kabul));
 if(c.once)await page.locator('#onIncelemeOnce').selectOption('1');
 const label=c.davali?'Davalı lehine vekâlet ücreti':'Davacı lehine vekâlet ücreti',line=page.locator('[data-h-ozet] > div').filter({has:page.locator('dt',{hasText:label})});
 for(const [date,expected]of [['2026-11-02',c.old],['2026-11-03',c.current]] as const){
  await page.locator('#tarih').fill(date);await page.getByRole('button',{name:'Hesapla',exact:true}).click();
  await expect(page.locator('[data-h-hata]')).toBeHidden();await expect(line.locator('dd')).toHaveText(money(expected));
  await expect(page.locator('[data-h-metin]')).toContainText('Hüküm : Yukarıda açıklanan nedenlerle;');
 }
});
