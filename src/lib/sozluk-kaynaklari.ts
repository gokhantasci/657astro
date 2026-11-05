import {createHash} from 'node:crypto';
import raw from '../data/sozluk-kaynaklari.json' with {type:'json'};

export interface SozlukKaynagi {ad:string;url:string;eslestirmeTarihi:string;metinSha256:string}
const kaynaklar=raw as Record<string,SozlukKaynagi>;
const norm=(s:string)=>s.normalize('NFKC').toLocaleLowerCase('tr-TR').replace(/[’‘`]/g,"'").replace(/\s+/g,' ').trim().replace(/[.\s]+$/,'');

// Tanım değiştiğinde eski eşleştirme artık kaynak doğrulaması sayılmaz.
export function sozlukKaynagi(slug:string,anlam:string):SozlukKaynagi|undefined{
 const k=kaynaklar[slug];
 return k&&createHash('sha256').update(norm(anlam)).digest('hex')===k.metinSha256?k:undefined;
}
