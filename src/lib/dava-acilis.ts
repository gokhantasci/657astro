import {kurus,type HarcTarifesi} from './hukuk-hesap';
export interface DavaAcilisGirdi {deger:number;parasal:boolean;cismani:boolean;sulh:boolean;harcMuaf:boolean;vekil:boolean;kesif:boolean;taraf:number;diger:number;bilirkisi:number;tanik:number;arac:number;}
export interface DavaAcilisTarife {tarafTebligat:number;vekaletSuret:number;posta:number;kesif:number;}
export function davaAcilis(g:DavaAcilisGirdi,h:HarcTarifesi,t:DavaAcilisTarife){
 if([g.deger,g.diger,g.bilirkisi,g.tanik,g.arac,t.posta,t.kesif].some(n=>!Number.isFinite(n)||n<0||n>1e12)||!Number.isInteger(g.taraf)||g.taraf<1||g.taraf>1000)throw new Error('Tutarları ve taraf sayısını kontrol edin.');
 const karar=g.parasal?Math.max(h.maktu,g.deger*h.nisbiBinde/1000):h.maktu;
 const pesin=g.harcMuaf?0:kurus(g.parasal?karar/(g.cismani?h.cismaniPesinPayda:h.pesinPayda):karar);
 const basvuru=g.harcMuaf?0:g.sulh?h.basvuruSulh:h.basvuruAsliye,vekalet=g.harcMuaf||!g.vekil?0:t.vekaletSuret,kesif=g.harcMuaf||!g.kesif?0:t.kesif;
 const posta=kurus(g.taraf*t.tarafTebligat*t.posta),gider=kurus(posta+g.diger+g.bilirkisi+g.tanik+g.arac),harc=kurus(pesin+basvuru+vekalet+kesif),toplam=kurus(harc+gider);
 const satirlar=[{ad:'Başvurma harcı',tutar:basvuru},{ad:'Peşin karar / ilam harcı',tutar:pesin},{ad:'Vekâletname suret harcı',tutar:vekalet},{ad:'Keşif harcı',tutar:kesif},{ad:`Tebligat avansı (${g.taraf} taraf × ${t.tarafTebligat} × ${t.posta} TL)`,tutar:posta},{ad:'Diğer iş ve işlem avansı',tutar:g.diger},{ad:'Bilirkişi delil avansı',tutar:g.bilirkisi},{ad:'Tanık delil avansı',tutar:g.tanik},{ad:'Araç / diğer delil avansı',tutar:g.arac}];
 return {toplam,harc,gider,pesin,posta,satirlar};
}
