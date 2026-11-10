import raw from '../data/adalet-genelgeleri.json' with {type:'json'};
const seen=new Set<string>();
export const genelgeKayitlari=raw;
export const genelgeler=raw.filter(r=>{if(seen.has(r.sha256))return false;seen.add(r.sha256);return true;});
export const genelgeYol=(g:{sha256:string})=>`/adalet-bakanligi-genelgeleri/${genelgeler.find(r=>r.sha256===g.sha256)!.id}/`;
export const genelgePdf=(g:{sha256:string})=>`/_657-servis/belgeler/${g.sha256}.pdf`;
