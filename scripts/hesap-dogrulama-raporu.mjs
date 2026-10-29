import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const oku=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const envanter=oku('docs/hesap-dogrulama-envanteri.json'),katalog=oku('src/data/araclar.json').araclar;
const kaynakAd=url=>{const h=new URL(url).hostname;return h.includes('ozkansoft')?'OzkanSoft':h.includes('memurlar')?'Memurlar.net':h.includes('adliyeci.org')?'Adliyeci.org':h.includes('saffetcelik')?'Saffet Çelik':'AdaletPortal';};
const ids=new Set(),ozet=new Map();
for(const a of envanter.araclar){
 if(ids.has(a.id))throw Error('Yinelenen hesap: '+a.id);ids.add(a.id);
 if(a.yerelAracId&&!katalog.some(k=>k.id===a.yerelAracId))throw Error('Yerel araç eksik: '+a.id);
 for(const s of a.kaynaklar){new URL(s.url);for(const k of s.kanit)if(!existsSync(new URL('../'+k,import.meta.url)))throw Error('Kanıt dosyası yok: '+k);const key=kaynakAd(s.url),o=ozet.get(key)??{toplam:0,bekleyen:0,belgeli:0};o.toplam++;if(s.durum==='bekliyor')o.bekleyen++;else o.belgeli++;ozet.set(key,o);}
}
const mevcut=oku('src/data/memur-maas-secenekler.json').unvanlar,ek=oku('src/data/unvan-ek-kurallari.json').unvanlar;
const adlar=new Set([...mevcut,...ek].map(u=>u.ad.trim().toLocaleLowerCase('tr'))),unvanlar=oku('src/data/maas-kaynak-envanteri.json').unvanlar;
const say=unvanlar.filter(u=>adlar.has(u.ad.trim().toLocaleLowerCase('tr'))).length;
const rows=envanter.araclar.map(a=>{const k=katalog.find(k=>k.id===a.yerelAracId);return `| ${a.ad} | ${k?.tasindi?`[Ekran](${k.path})`:'Bekliyor / eksik'} | ${a.kaynaklar.map(s=>`[${kaynakAd(s.url)}](${s.url}): ${s.durum}`).join('; ')} |`;});
const md=`# Hesap doğrulama çalışma raporu\n\nVeri tarihi: ${envanter.tarih}. Üretim: \`node scripts/hesap-dogrulama-raporu.mjs\`.\n\n${envanter.aciklama}\n\n## Kaynak çiftleri\n\nBir hesabın iki sitedeki karşılığı iki kaynak çifti sayılır. Belgeli kayıt kısmi örnek doğrulamasıdır; tüm koşulların geçtiği anlamına gelmez.\n\n| Kaynak | Kayıt | Belgeli kısmi/örnek | Bekleyen |\n| --- | ---: | ---: | ---: |\n${[...ozet].map(([ad,o])=>`| ${ad} | ${o.toplam} | ${o.belgeli} | ${o.bekleyen} |`).join('\n')}\n\n## İşlevler\n\n| İşlev | Yerel ekran | Kaynak başına durum |\n| --- | --- | --- |\n${rows.join('\n')}\n\n## Kadrolu unvan envanteri\n\n${unvanlar.length} kaynak unvanının ${say} adında yerel seçenek eşleşmesi var. Ad eşleşmesi bordro doğrulaması değildir. Derece/kademe, hizmet, öğrenim/kurum koşulu, 5434/5510, ay ve kesintiler ayrıca doğrulanmalıdır. Eski \`memur-maas.json\` regresyon dosyası dış kaynak bordrosu diye sayılmaz.\n\n| Unvan | Yerel ad eşleşmesi | Kaynak unvan kayıtları |\n| --- | --- | --- |\n${unvanlar.map(u=>`| ${u.ad} | ${adlar.has(u.ad.trim().toLocaleLowerCase('tr'))?'Var; koşul testleri ayrıca':'Eksik'} | ${u.kaynaklar.map(s=>s.kaynak+': '+s.kod).join('; ')} |`).join('\n')}\n`;
writeFileSync(new URL('../docs/hesap-dogrulama-durumu.md',import.meta.url),md);
console.log(`${ids.size} işlev, ${unvanlar.length} kaynak unvanı, ${say} yerel ad eşleşmesi. Kanıt dosyaları ve kimlikler geçerli.`);
