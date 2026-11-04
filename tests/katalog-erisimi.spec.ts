import {test,expect} from '@playwright/test';
import {araclar,aracHref} from '../src/lib/tools';
test('bütün katalog kayıtlarının bağlantısı var ve yerel araç adresleri açılıyor',async({request})=>{
 for(const a of araclar){expect(aracHref(a),a.id).toBeTruthy();if(!a.path)continue;const r=await request.get(a.path);expect(r.status(),a.path).toBe(200);expect(await r.text(),a.path).toContain('<h1');}
});
