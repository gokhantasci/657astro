// Yalnız herkese açık hesaplama verileri; yönetim, e-posta ve not dosyaları kapsam dışıdır.
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const yollar=['data/tatiller.json','data/tebligatlar.json','data/konsolosluk_verileri.json','data/nispivekalet.json','657/tatiller.json','657/tebligatlar.json','657/assets/katsayilar.json','657/assets/sozlesmeliunvanlar.json','657/assets/tr.json','657/assets/byu.json','657/assets/thhbilirkisi.json','657/assets/sozluk.json','657/assets/hatirlatma.json','657/assets/yargilamagid.json','657/assets/datalar.json','657/assets/veriler.json'];
for(const yol of yollar){
 const url='https://657.com.tr/wp-content/themes/teftis/'+yol;
 const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error(`${yol}: HTTP ${response.status}`);
 const body=await response.text();JSON.parse(body);
 const hedef=new URL('../src/data/eski-json/'+yol,import.meta.url);await mkdir(dirname(fileURLToPath(hedef)),{recursive:true});await writeFile(hedef,body);console.log(yol);
}
await writeFile(new URL('../src/data/eski-json-manifest.json',import.meta.url),JSON.stringify(yollar,null,1)+'\n');
