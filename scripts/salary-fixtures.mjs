// Salt okunur eski hesap fonksiyonundan karşılaştırma örnekleri üretir.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
const root = process.argv[2];
if (!root) throw new Error('Kullanım: node scripts/salary-fixtures.mjs <salt-okunur-tema-kopyası>');
const source = readFileSync(`${root}/assets/js/memur-maas-2025.js`, 'utf8');
const start = source.indexOf('function yenimaashesapla()');
const body = source.slice(start, source.indexOf('var fark_maas =', start)) + 'return {gelir:artilartoplam, kesinti:Number(eksilertoplam), net:net_maas}; }';
const settings = JSON.parse(readFileSync('src/data/ayarlar.json', 'utf8'));
const p = {...settings.maas_parametreleri, seyyanen_zam_gosterge:settings.sabitler.seyyanen_zam_gosterge};
const katsayilar = JSON.parse(readFileSync(`${root}/katsayilar.json`, 'utf8'));
const grades = JSON.parse(readFileSync('src/data/dereceler.json','utf8'));
const titles = [...new Set(JSON.parse(readFileSync('src/data/memur-maas-secenekler.json','utf8')).unvanlar.map(x=>x.kod))];
const fixtures = [];
for (const unvan of titles) for (const derece of ['13/3','6/1','3/1','1/4']) for (const kanun of [5510,5434]) for (const kip of ['maas','fark14']) {
  const g = {unvan,derece,kanun,kip,hizmetYili:30,mezuniyet:1,esCalismiyor:true,cocuk:{kucuk:1,buyuk:1,engelliKucuk:1,engelliBuyuk:1},sendika:true,polsan:true,ilksan:true,tasinirYetkili:true,bes:true,gorevYeri:'istanbul',yabanciDil:'A',haciz:1500.5,ogretmen:{kariyer:3,belletici:true,altGorev:46,alan:5}};
  const values = {'#hesaplama':kip==='maas'?0:1,'#unvan':unvan,'#kadroderece':derece,'input[name="hizmetyili"]':30,'#mezuniyet':1,'#cocuk72aydankucuk':1,'#cocuk72aydanbuyuk':1,'#engellicocuk72aydankucuk':1,'#engellicocuk72aydanbuyuk':1,'#slcGorevUnvaniSecimi2':3,'#slcAltGorevUnvani':46,'#slcAlan':5,'#tabikanun':kanun===5510?1:2,'#beskesintisi':1,'#haciz':1500.5,'#polsanuye':1,'#ilksanuye':1};
  const context = vm.createContext({window:{katsayilar},jQuery:s=>({val:()=>String(values[s]),is:()=>true}),teftisGetMaasParametreleri:()=>p,teftisResolveEsYardimiGosterge:()=>p.es_yardimi_gosterge,teftisResolveSendikaUyeGosterge:()=>p.sendika_uye_gosterge,teftisResolveTasinirYetkiliGosterge:()=>p.tasinir_yetkili_gosterge,teftisResolveGorevYeriKey:()=>'istanbul',teftisResolveGorevYeriOrani:()=>p.gorev_yeri_istanbul_oran,teftisResolveYabanciDilGosterge:()=>p.yabanci_dil_a_gosterge,getGosterge:()=>grades.find(d=>d.derece===derece)});
  const r = vm.runInContext(body+';yenimaashesapla()', context);
  fixtures.push({girdi:g,sonuc:Number.isFinite(r.net)?r:null});
}
mkdirSync('tests/fixtures',{recursive:true});
writeFileSync('tests/fixtures/memur-maas.json',JSON.stringify(fixtures));
console.log(`${fixtures.length} eski hesap örneği üretildi.`);
