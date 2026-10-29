import type {KararTuru} from './hukuk-hesap';
export const kararAraclari:{tur:KararTuru;ad:string;path:string;aciklama:string}[]=[
 {tur:'tam-kabul',ad:'Tam kabul: harç ve vekâlet hesabı',path:'/tam-kabul-hesaplama/',aciklama:'Tam kabulde karar harcı, vekâlet ücreti ve yargılama gideri.'},
 {tur:'kismen-kabul',ad:'Kısmen kabul ve kısmen red hesabı',path:'/kismen-kabul-hesaplama/',aciklama:'Kabul ve ret tutarlarından ayrı vekâlet hesabı ve gider dağılımı.'},
 {tur:'red',ad:'Davanın esastan reddinde hesap',path:'/davanin-reddi-hesaplama/',aciklama:'Esastan ret, maktu karar harcı ve davalı lehine vekâlet ücreti.'},
 {tur:'husumet',ad:'Husumet ve dava şartı nedeniyle ret',path:'/husumet-dava-sarti-hesaplama/',aciklama:'AAÜT 7/2 kapsamında maktu üst sınırla vekâlet ücreti.'},
 {tur:'acilmamis',ad:'Davanın açılmamış sayılmasında hesap',path:'/acilmamis-sayilma-hesaplama/',aciklama:'Ön inceleme aşamasına göre ücret ve harç mahsubu.'},
 {tur:'feragat',ad:'Feragat: harç ve vekâlet hesabı',path:'/feragat-hesaplama/',aciklama:'İlk celse ve ön inceleme aşamalarını ayrı değerlendiren hesap.'},
 {tur:'sulh',ad:'Sulh: harç ve gider hesabı',path:'/sulh-hesaplama/',aciklama:'Sulhte indirimli harç ve anlaşmaya göre gider dağılımı.'},
 {tur:'davayi-kabul',ad:'Davayı kabul: harç ve vekâlet hesabı',path:'/davayi-kabul-hesaplama/',aciklama:'Davalının kabulünde Harçlar Kanunu 22 ve AAÜT 6 hesabı.'},
 {tur:'nafaka-tam',ad:'Nafaka davasında tam kabul hesabı',path:'/nafaka-tam-kabul-hesaplama/',aciklama:'Hükmedilen aylık nafakanın yıllık karşılığından harç ve ücret.'},
 {tur:'nafaka-kismen',ad:'Nafaka davasında kısmen kabul hesabı',path:'/nafaka-kismen-kabul-hesaplama/',aciklama:'Kabul edilen nafaka için ücret; reddedilen kısımda ücret yok.'},
 {tur:'maddi-tazminat',ad:'Maddi tazminat vekâlet hesabı',path:'/maddi-tazminat-vekalet-hesaplama/',aciklama:'Kısmi ret üst sınırı ve tam ret maktu ücret kuralı.'},
 {tur:'manevi-tazminat',ad:'Manevi tazminat vekâlet hesabı',path:'/manevi-tazminat-vekalet-hesaplama/',aciklama:'08-01-2026 değişikliğiyle manevi tazminat kabul/ret hesabı.'}
];
export const yardimciAraclar=[
 {tur:'nispi-vekalet',ad:'Nispi vekâlet ücreti',path:'/nispi-vekalet-ucreti-hesaplama/',aciklama:'AAÜT basamakları, mahkeme alt/üst sınırları ve alacak sınırı.'},
 {tur:'islah-harci',ad:'Islah harcı',path:'/islah-harci-hesaplama/',aciklama:'Artırılan dava değerine göre peşin ıslah harcı.'},
 {tur:'istinaf-harci',ad:'İstinaf ve temyiz harcı',path:'/istinaf-temyiz-harci-hesaplama/',aciklama:'İstinaf/temyiz başvuru harcı ve maktu/nispi karar harcını ayrı gösterir.'},
 {tur:'kasa',ad:'Adliye kasa hesabı',path:'/adliye-kasa-hesabi/',aciklama:'Banka ve fiziki kasayı, yükümlülüklerle karşılaştırır.'},
 {tur:'paylasim',ad:'Davalılara tutar paylaşımı',path:'/davalilara-paylasim-hesaplama/',aciklama:'Vekâlet, harç ve giderleri yüzde veya tutara göre kuruşu korunarak dağıtır.'}
];
