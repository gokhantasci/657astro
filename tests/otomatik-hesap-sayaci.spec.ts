import {test,expect} from '@playwright/test';
import registry from '../services/oneriler/arac-sayaclari.json' with {type:'json'};
const paths=[
 '/memur-maas-hesaplama/',
 '/enflasyon-farki-hesaplama-robotu/',
 '/emekli-memur-maas-hesaplama/',
 '/gecici-gorev-yollugu-hesaplama/yolluk-unvan-asci/yolluk-kadro-derece-1/yolluk-ek-gosterge-600/uc-bir-gun-1/',
 '/surekli-gorev-yollugu/yolluk-derece-1/yolluk-kadro-derece-1/yolluk-ek-gosterge-3600/yolluk-yontemi-h-cetveli-grubunu-kendim-seciyorum/gundelik-ek-gosterge-3600-6399-870-tl/',
 '/asgari-ucret-istisna-oranlari/',
 '/tuketici-hakem-heyeti-bilirkisi-ucret-hesaplama/'
];
async function mock(page:any){
 const counts:Record<string,number>={};const bodies:any[]=[];
 await page.addInitScript(()=>localStorage.setItem('657:cerez','ret'));
 await page.route('**/_657-servis/api/hesaplama',async(r:any)=>{
  if(r.request().method()==='POST'){const body=r.request().postDataJSON();bodies.push(body);counts[body.tur]=(counts[body.tur]??0)+1;}
  await r.fulfill({json:{baslangic:'2026-11-05T17:52:21Z',toplam:Object.values(counts).reduce((a,b)=>a+b,0),sayaclar:Object.fromEntries(registry.map(t=>[t.anahtar,{bugun:counts[t.anahtar]??0,buHafta:counts[t.anahtar]??0,buYil:counts[t.anahtar]??0,toplam:counts[t.anahtar]??0}]))}});
 });return bodies;
}
for(const path of paths)test(`${path}: her açılışta tek geçerli hesap sayılır`,async({page})=>{
 const bodies=await mock(page);await page.goto(path);
 await expect(page.locator('[data-sayac-toplam]')).toHaveText('1');
 await page.waitForTimeout(700);expect(bodies).toHaveLength(1);
 await page.reload();await expect(page.locator('[data-sayac-toplam]')).toHaveText('2');expect(bodies).toHaveLength(2);
});
for(const [path,id] of [[paths[2],'derece'],[paths[3],'gundelik'],[paths[4],'gundelik'],[paths[5],'araAy']])test(`${path}: görünen menüyle seçim sayacı artırır`,async({page})=>{
 const bodies=await mock(page);await page.goto(path);await expect(page.locator('[data-sayac-toplam]')).toHaveText('1');
 const eskiSonuc=path===paths[3]||path===paths[4]?await page.locator('[data-kamu-deger]').innerText():null;
 const select=page.locator('#'+id);const option=await select.locator('option').evaluateAll(nodes=>{const el=nodes.find(n=>!(n as HTMLOptionElement).selected&&!(n as HTMLOptionElement).disabled)!;return {text:el.textContent!,value:(el as HTMLOptionElement).value};});
 await page.locator('#'+id+'-ara').click();await page.locator('#'+id+'-liste').getByRole('option',{name:option.text,exact:true}).click();
 await expect(select).toHaveValue(option.value);await expect(page.locator('[data-sayac-toplam]')).toHaveText('2');
 if(eskiSonuc!==null){await expect(page.locator('[data-kamu-hata]')).toBeHidden();await expect(page.locator('[data-kamu-deger]')).not.toHaveText(eskiSonuc);}
 expect(bodies).toHaveLength(2);
});
test('maaşta geçersiz giriş, aynı sonuç ve sıfırlama ek kullanım üretmez',async({page})=>{
 const bodies=await mock(page);await page.goto(paths[0]);await expect(page.locator('[data-sayac-toplam]')).toHaveText('1');
 await page.locator('#maas-form button[type=submit]').click();await page.waitForTimeout(650);expect(bodies).toHaveLength(1);
 await page.locator('#hizmetYili').fill('999');await expect(page.locator('[data-m-hata]')).toBeVisible();await page.waitForTimeout(650);expect(bodies).toHaveLength(1);
 await page.locator('[data-m-sifirla]').click();await page.waitForTimeout(650);expect(bodies).toHaveLength(1);
});

test('maaşta klavyeyle menü seçimi ve enflasyonda yeni tahmin sayılır',async({page})=>{
 await mock(page);await page.goto(paths[0]);await expect(page.locator('[data-sayac-toplam]')).toHaveText('1');
 await page.locator('#derece-ara').click();await page.locator('#derece-ara').press('ArrowDown');await page.locator('#derece-ara').press('Enter');
 await expect(page.locator('[data-sayac-toplam]')).toHaveText('2');
 await page.goto(paths[1]);await expect(page.locator('[data-sayac-toplam]')).toHaveText('1');
 await page.locator('[data-e-ay]:not([readonly])').first().fill('1,2');await expect(page.locator('[data-sayac-toplam]')).toHaveText('2');
});

for(const path of ['/memur-maas-hesaplama/?hizmetYili=999','/kesinlesme/?sure=0'])test(`${path}: geçersiz açılış hesabı sayılmaz`,async({page})=>{
 const bodies=await mock(page);await page.goto(path);await page.waitForTimeout(750);
 await expect(page.locator('[data-sayac-toplam]')).toHaveText('0');expect(bodies).toHaveLength(0);
});

test('dava açma paylaşılan adreste her yeni seçim ve tutar sayılır',async({page})=>{
 const bodies=await mock(page);await page.goto('/dava-acma-masraflari/sulh-sulh-hukuk/parasal-hayir/');
 await expect(page.locator('#sulh')).toHaveValue('1');await expect(page.locator('#parasal')).toHaveValue('0');await expect(page.locator('[data-sayac-toplam]')).toHaveText('1');
 for(const [id,value]of [['parasal','1'],['sulh','0'],['kesif','1']]){
  const onceki=await page.locator('[data-da-toplam]').innerText();
  const text=await page.locator('#'+id+' option[value="'+value+'"]').innerText();
  await page.locator('#'+id+'-ara').click();await page.locator('#'+id+'-liste').getByRole('option',{name:text,exact:true}).click();
  await expect(page.locator('#'+id)).toHaveValue(value);await expect(page.locator('[data-da-hata]')).toBeHidden();
  await expect(page.locator('[data-da-toplam]')).not.toHaveText(onceki);
  await expect(page.locator('[data-sayac-toplam]')).toHaveText(String(id==='parasal'?2:id==='sulh'?3:4));
 }
 await page.locator('#taraf').fill('3');await expect(page.locator('[data-sayac-toplam]')).toHaveText('5');expect(bodies).toHaveLength(5);
});
