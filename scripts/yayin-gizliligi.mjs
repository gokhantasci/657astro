import {readFile,writeFile,readdir} from 'node:fs/promises';
import {yayinDisi} from '../src/lib/yayin-filtresi.ts';
const news=new URL('../src/data/haberler.json',import.meta.url);
const rows=JSON.parse(await readFile(news,'utf8')),filtered=rows.filter(h=>!yayinDisi(h.title));
if(rows.length!==filtered.length)await writeFile(news,JSON.stringify(filtered,null,1)+'\n');
// Kaynaklar yenilendiğinde yanlışlıkla kişisel listelerin geri gelmesini derlemede engeller.
for(const name of await readdir(new URL('../src/content/yazilar/',import.meta.url))){
 if(!name.endsWith('.md'))continue;
 const text=await readFile(new URL('../src/content/yazilar/'+encodeURIComponent(name),import.meta.url),'utf8'),title=text.match(/^title:\s*(.*)$/m)?.[1]??name;
 if(yayinDisi(title,text))throw Error('Yayından çıkarılması gereken kişisel içerik: '+name);
}
console.log(`${rows.length-filtered.length} uygun olmayan kurum haberi listeden çıkarıldı.`);
