import raw from '../data/dpb-bulten-gorusleri.json' with {type:'json'};
import {markdownSayfalari} from './belge-markdown';
export const bultenGorusleri=raw.gorusler;
export const bultenGorusYolu=(id:string)=>`/dpb-gorusleri/dpb_mutalaa_ozel/${id}/`;
export const bultenMetni=(md:string)=>markdownSayfalari(`<section class="kaynak-sayfa" data-kaynak-sayfa="1">${md}</section>`)[0].metin;
