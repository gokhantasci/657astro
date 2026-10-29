import {test,expect} from '@playwright/test';
import {yerelYol,yerelHtml} from '../src/lib/site-yolu';
test('GitHub proje yolu: bağlantı, görsel, yönlendirme ve dış kaynak',()=>{
 expect(yerelYol('/araclar/?q=maaş#maas','/657astro/')).toBe('/657astro/araclar/?q=maaş#maas');
 for(const path of ['https://example.com','//cdn.example.com/a','mailto:gokhan@657.com.tr','#main','/657astro/a/'])expect(yerelYol(path,'/657astro/')).toBe(path);
 const html='<a href="/araclar/">Araçlar</a><img src="/bayrak.png" srcset="/_astro/a.webp 320w, /_astro/b.webp 640w"><meta http-equiv="refresh" content="0;url=/kelime/abluka-ne-demek/"><a href="https://657.com.tr/x">Kaynak</a>';
 const r=yerelHtml(html,'/657astro/');expect(r).toContain('href="/657astro/araclar/"');expect(r).toContain('srcset="/657astro/_astro/a.webp 320w, /657astro/_astro/b.webp 640w"');expect(r).toContain('0;url=/657astro/kelime/abluka-ne-demek/');expect(r).toContain('href="https://657.com.tr/x"');
 expect(yerelHtml(r,'/657astro/')).toBe(r);
});
