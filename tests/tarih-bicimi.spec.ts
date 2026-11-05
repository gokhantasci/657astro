import {test,expect} from '@playwright/test';
import {gun,takvimTarihi,tarihSaat} from '../src/lib/bicim';
import {tarihMetni} from '../src/lib/tarih-metni';
import {gorunenTarihler} from '../src/lib/gorunen-tarihler';
import {tarifeler} from '../src/lib/tarife-arsivi';

test('görünen tarih noktalı ve iki basamaklıdır; takvim ve saat dilimi korunur',()=>{
 expect(gun('2024-02-29')).toBe('29.02.2024');
 expect(takvimTarihi('2026-11-05T21:30:00Z')).toBe('06.11.2026');
 expect(tarihSaat('2026-11-05T21:30:00Z')).toBe('06.11.2026 00:30');
 expect(tarihMetni('2026-01-02, 2/1/2026, 2.1.2026, 2 OCAK 2026, 5 KASIM 2026')).toBe('02.01.2026, 02.01.2026, 02.01.2026, 02.01.2026, 05.11.2026');
 expect(tarihMetni('31.02.2026, Ocak 2026, 2026/123, https://example.com/2026-01-02/')).toBe('31.02.2026, Ocak 2026, 2026/123, https://example.com/2026-01-02/');
 const html='<time datetime="2026-01-02">2 Ocak 2026</time><a href="/2026-01-02/">2026-01-02</a><script>{"date":"2026-01-02"}</script><code>2026-01-02</code>';
 const out=gorunenTarihler(html);expect(out).toContain('datetime="2026-01-02">02.01.2026');expect(out).toContain('href="/2026-01-02/">02.01.2026');expect(out).toContain('<script>{"date":"2026-01-02"}</script><code>2026-01-02</code>');
});

for(const t of tarifeler)test(`tarife tablo ve grafiğinde tarih biçimi: ${t.slug}`,async({page})=>{
 await page.goto(`/tarifeler/${t.slug}/?yil=hepsi`);
 const dates=page.locator('[data-tarife-karsilastirma] th');await expect(dates.first()).toHaveText(/^\d{2}\.\d{2}\.\d{4}$/);
 for(const value of await dates.allTextContents())expect(value).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
 for(const value of await page.locator('.tarife-cubuk>span:first-child').allTextContents())expect(value).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
 await expect(page.locator('[data-tarife-kayit]').first()).toHaveAttribute('data-baslangic',/^\d{4}-\d{2}-\d{2}$/);
});
