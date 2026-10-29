import {test,expect} from '@playwright/test';
import raw from '../src/data/sozlesmeli-unvanlar.json' with {type:'json'};
import fixtures from './fixtures/sozlesmeli-maas.json' with {type:'json'};
import {sozlesmeliTarife} from '../src/lib/sozlesmeli-tarife';
import {sozlesmeliMaas,sozlesmeliOncekiMatrah} from '../src/lib/diger-maas';
import {donem,maasKatsayilari,parametreler} from '../src/lib/maas-veri';
const k=maasKatsayilari(donem,'maas');
const bos={esCalismiyor:false,sendika:false,kucuk:0,buyuk:0,engelliKucuk:0,engelliBuyuk:0,ay:10};
for(const f of fixtures.ornekler)test(`Memurlar.net 4/B: ${f.unvan}, ${f.hizmetYili} yıl`,()=>{
 const u=raw.unvanlar.find(u=>u.kaynakUnvan===f.unvan)!;
 const t=sozlesmeliTarife(u,f.varyant,f.hizmetYili,k.aylik,raw.aylikKatsayi);
 expect(t.ucret).toBe(f.ucret);expect(t.ekOdemeOran).toBe(f.ekOdemeOran);
 const r=sozlesmeliMaas({...bos,...t,istisnaBaslangicAyi:f.istisnaBaslangicAyi,oncekiMatrah:f.oncekiMatrah},k,parametreler);
 expect(Math.abs(r.vergiMatrahi-f.matrah)).toBeLessThanOrEqual(.011);
 expect(Math.abs(r.gelir-f.gelir)).toBeLessThanOrEqual(.011);
 // Kaynaktaki GV/DV istisnası yerine ortak resmî 2026 istisnasıyla hesaplanan net.
 expect(Math.abs(r.net-f.resmiNet)).toBeLessThanOrEqual(.021);
});
test('bütün sözleşmeli unvan ve alt koşullarının başlangıç cetveli var; bilinmeyen yıl tahmin edilmez',()=>{
 expect(raw.unvanlar).toHaveLength(60);
 expect(new Set(raw.unvanlar.map(u=>u.kaynakUnvan)).size).toBe(58);
 for(const u of raw.unvanlar)for(const v of u.varyantlar){
  expect(v.yillar).toHaveLength(26);
  expect(sozlesmeliTarife(u,v.id,0,k.aylik,raw.aylikKatsayi).ucret).toBeGreaterThan(0);
 }
 const u=raw.unvanlar.find(u=>u.id==='2')!;
 expect(()=>sozlesmeliTarife(u,u.varyantlar[0].id,10,k.aylik,raw.aylikKatsayi)).toThrow('kaynakta ücret bulunamadı');
 expect(()=>sozlesmeliTarife(u,u.varyantlar[0].id,1.5,k.aylik,raw.aylikKatsayi)).toThrow('tam sayı');
 const v=raw.unvanlar.find(u=>u.id==='4')!;
 const eski=sozlesmeliTarife(v,'0',0,k.aylik,raw.aylikKatsayi);
 const yeni=sozlesmeliTarife(v,'0',0,k.aylik*1.1,raw.aylikKatsayi);
 expect(yeni.ucret).toBe(Number((eski.ucret*1.1).toFixed(2)));expect(yeni.ekOdemeOran).toBe(eski.ekOdemeOran);
});
test('önceki matrah ortak ay katsayılarıyla birikir; eksik dönemi ve ters sözleşme ayını reddeder',()=>{
 const g={...bos,ucret:50000,ekOdemeOran:65,ay:3};
 const ayliklar=[{ay:1,k:{...k,aylik:k.aylik/2}},{ay:2,k}];
 expect(sozlesmeliOncekiMatrah(g,1,k,ayliklar,parametreler)).toBe(64500);
 expect(sozlesmeliOncekiMatrah(g,3,k,ayliklar,parametreler)).toBe(0);
 expect(()=>sozlesmeliOncekiMatrah(g,4,k,ayliklar,parametreler)).toThrow('sonra olamaz');
 expect(()=>sozlesmeliOncekiMatrah(g,1,k,[],parametreler)).toThrow('katsayıları eksik');
});
test('unvan, öğrenim, hizmet yılı, elle ücret ve sıfırlama',async({page})=>{
 await page.goto('/sozlesmeli-memur-maas-hesaplama/');
 await expect(page.locator('#unvan')).toHaveValue('58');
 await expect(page.locator('#ucret')).toHaveValue('27155,2');
 await page.locator('#varyant').selectOption('1');await expect(page.locator('#ucret')).toHaveValue('30697,9');
 await page.locator('#unvan').selectOption('4');const ilk=await page.locator('#ucret').inputValue();
 await page.locator('#hizmetYili').fill('15');await expect(page.locator('#ucret')).not.toHaveValue(ilk);
 await expect(page.locator('#ekOdemeOran')).toHaveValue('140');
 await page.locator('#ucretYontemi').selectOption('elle');await page.locator('#ucret').fill('50.000,50');await page.locator('#ekOdemeOran').fill('65');
 await page.locator('#matrahYontemi').selectOption('elle');await page.locator('#oncekiMatrah').fill('0');
 await expect(page.locator('[data-d-hata]')).toBeHidden();
 await page.locator('#kucuk').selectOption('1');await expect(page.locator('#ucret')).toHaveValue('50.000,50');
 await page.locator('#ucret').fill('');await expect(page.locator('[data-d-net]')).toHaveText('—');
 await page.locator('#ucretYontemi').selectOption('otomatik');await expect(page.locator('[data-d-hata]')).toBeHidden();
 await page.getByRole('button',{name:'Sıfırla',exact:true}).click();
 await expect(page.locator('#unvan')).toHaveValue('58');await expect(page.locator('#varyant')).toHaveValue('0');await expect(page.locator('#ucret')).toHaveValue('27155,2');
 for(const u of raw.unvanlar){await page.locator('#unvan').selectOption(u.id);await expect(page.locator('[data-d-hata]')).toBeHidden();}
 await page.locator('#unvan').selectOption('2');await page.locator('#hizmetYili').fill('10');await expect(page.locator('[data-d-net]')).toHaveText('—');
 await expect(page.locator('#ucret')).toHaveValue('');
 await page.locator('#ucretYontemi').selectOption('elle');await page.locator('#ucret').fill('50000');await page.locator('#ekOdemeOran').fill('20');await expect(page.locator('[data-d-hata]')).toBeHidden();
});
