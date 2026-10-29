import {z} from 'zod';
import raw from '../data/mali-kurallar.json' with {type:'json'};
const n=z.number().nonnegative(),d=z.iso.date();
export const maliKurallar=z.object({smm:z.object({stopaj:n.max(100),kdv:n.max(100),kaynak:z.url()}),dava:z.object({baslangic:d,bitis:d,tarafTebligat:n,diger:n,vekaletSuret:n,kaynak:z.url()}),faiz:z.object({baslangic:d,veriSonu:d,yeniKanunBaslangici:d,reeskontCarpani:n,yariyilFarkEsigi:n,kanuniEski:z.array(z.object({baslangic:d,oran:n})),ttk:z.array(z.object({baslangic:d,oran:n,giderim:n})),tcmb:z.array(z.object({baslangic:d,reeskont:n,avans:n})),kaynaklar:z.array(z.url())})}).parse(raw);
for(const satirlar of [maliKurallar.faiz.kanuniEski,maliKurallar.faiz.tcmb,maliKurallar.faiz.ttk])if(satirlar.some((s,i)=>i>0&&s.baslangic<=satirlar[i-1].baslangic))throw new Error('Faiz cetveli tarihleri artan sırada olmalı.');
