import {test,expect} from '@playwright/test';
import {hukukTarifeSec} from '../src/lib/hukuk-veri';
import {vekalet} from '../src/lib/hukuk-hesap';
import {ozelGunler,gunHatirlatmalari} from '../src/lib/ozel-gunler';
import {adliKayitlar} from '../src/lib/adlicevre';
import unvanlar from '../src/data/sozlesmeli-unvanlar.json' with {type:'json'};
import kaynak from './fixtures/sozlesmeli-unvanlar-20261103.json' with {type:'json'};
import {tarihMetni as gorunenTarihler} from '../src/lib/tarih-metni';
import {bedelliGostergesi,parasalGostergeler} from '../src/lib/parasal-gostergeler';
import {enflasyonFarki} from '../src/lib/enflasyon';
import {ayarlar} from '../src/lib/settings';
test('görünen tarihler ve 17/04/2026 bedelli sınırı',()=>{
 expect(gorunenTarihler('2026-07-01 – 3.11.2026 ve 03-11-2025')).toBe('01.07.2026 – 03.11.2026 ve 03.11.2025');expect(gorunenTarihler('31.02.2026')).toBe('31.02.2026');
 expect(bedelliGostergesi('2026-04-16')).toBe(240000);expect(bedelliGostergesi('2026-04-17')).toBe(300000);
 const r=enflasyonFarki({bazEndeks:100,topluSozlesmeZam:0,sonrakiZam:0,aylar:[]},ayarlar.donemler[1],parasalGostergeler('2026-07-01','2027-01-01',ayarlar.sabitler));expect(r.mevcut.bedelli).toBeCloseTo(472653.6,2);
});
test('2024 ve 2025 harçları ile AAÜT geçiş günleri',()=>{
 expect(hukukTarifeSec('2024-01-01').h.maktu).toBe(427.6);expect(hukukTarifeSec('2025-01-01').h.maktu).toBe(615.4);
 for(const [tarih,tutar] of [['2024-10-02',17900],['2024-10-03',30000],['2025-11-03',30000],['2025-11-04',45000]] as const)expect(vekalet(100000,'asliye',hukukTarifeSec(tarih).v)).toBe(tutar);
});
test('58 kaynak sözleşmeli unvanın tamamı var',()=>{expect(kaynak.unvanlar).toHaveLength(58);for(const k of kaynak.unvanlar)expect(unvanlar.unvanlar.some(u=>u.kaynakUnvan===k.slug),k.ad).toBe(true);});
test('2026–2031 dini günler, değişken pazarlar ve önceki gün hatırlatması',()=>{
 for(let y=2026;y<=2031;y++){const rows=ozelGunler(y);expect(rows.filter(r=>r.kaynak).length).toBeGreaterThan(10);const anne=rows.find(r=>r.ad==='Anneler Günü')!,baba=rows.find(r=>r.ad==='Babalar Günü')!;for(const g of [anne,baba])expect(new Date(g.tarih+'T12:00:00Z').getUTCDay()).toBe(0);expect(Number(anne.tarih.slice(-2))).toBeGreaterThanOrEqual(8);expect(Number(anne.tarih.slice(-2))).toBeLessThanOrEqual(14);expect(Number(baba.tarih.slice(-2))).toBeGreaterThanOrEqual(15);expect(Number(baba.tarih.slice(-2))).toBeLessThanOrEqual(21);}
 expect(gunHatirlatmalari('2026-10-28').some(g=>g.metin.startsWith('Yarın Cumhuriyet'))).toBe(true);expect(gunHatirlatmalari('2026-10-29').some(g=>g.metin.includes('Bayramımız kutlu'))).toBe(true);
});
test('HSK bağlantıları güncel, Eceabat adliyesi ve ağır cezası ayrıdır',()=>{
 for(const mahal of ['Malkara','Gelibolu','Eceabat'])expect(adliKayitlar.find(k=>k.kaynak?.mahal===mahal)?.kaynak?.bagli_acm).toBe('Keşan');
 expect(adliKayitlar.find(k=>k.kaynak?.mahal==='Eceabat')?.kaynak?.bagli_adliye).toBe('Gelibolu');expect(adliKayitlar.find(k=>k.kaynak?.mahal==='Çerkeş')?.kaynak?.bagli_acm).toBe('Çankırı');
 for(const il of ['Malatya','Adıyaman','Elazığ','Tunceli'])for(const k of adliKayitlar.filter(k=>k.kaynak?.il===il))expect(k.kaynak?.bagli_bam).toBe('Malatya');
});
test('haber araması, Shell ilçe fiyatları ve 14 günlük senaryo',async({page})=>{
 await page.goto('/araclar/?q=sosyal+medya#ara');await expect(page.locator('[data-dir-yazi]:visible').filter({hasText:'Sosyal Medyaların Türkiye Temsilcilikleri'})).toBeVisible();
 await page.goto('/');await expect(page.locator('[data-yakit-sonuc] div').first()).toBeVisible();await expect(page.locator('[data-hava-sonuc]')).toContainText('°C');
 await page.goto('/enflasyon-farki-hesaplama-robotu/');for(const i of [4,5])await page.locator(`#ay-${i}`).fill('2');await page.goto('/memur-maas-hesaplama/');await expect(page.locator('[data-mt-fark14-satir]')).toBeVisible();await expect(page.locator('[data-mt-fark14]')).toContainText('TL');
});
