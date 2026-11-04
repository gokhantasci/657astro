import type {MaasGirdi} from './memur-maas';

/** Maaşı etkileyen seçimlerin kısa özeti: derece, hizmet, aile, çocuk, sendika ve varsa ek kesintiler. */
export function maasOzeti(g:MaasGirdi,kosul?:string):string[]{
 const c=g.cocuk,cocuk=c.kucuk+c.buyuk+c.engelliKucuk+c.engelliBuyuk,alti=c.kucuk+c.engelliKucuk,engelli=c.engelliKucuk+c.engelliBuyuk;
 const parca=[g.derece,`${g.hizmetYili} hizmet yılı`,g.esCalismiyor?'evli, eşi çalışmıyor':'eş yardımı yok'];
 // Sayıya ek getirmemek için ayrıntı "72 ay altı 1, engelli 1" biçiminde yazılır.
 if(cocuk)parca.push(`${cocuk} çocuk${alti||engelli?` (${[alti?`72 ay altı ${alti}`:'',engelli?`engelli ${engelli}`:''].filter(Boolean).join(', ')})`:''}`);
 parca.push(g.sendika?'sendika üyesi':'sendikasız');
 if(g.bes)parca.push(`BES %${String(g.besOran??3).replace('.',',')}`);
 if(g.yabanciDil)parca.push('yabancı dil tazminatı');
 if(g.haciz>0)parca.push('haciz/nafaka kesintili');
 if(kosul)parca.push(kosul);
 return parca;
}
