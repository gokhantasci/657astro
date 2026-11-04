import {gunHatirlatmalari} from '../lib/ozel-gunler';
import {yerelYol} from '../lib/site-yolu';
const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul'}).format(new Date());
const items=gunHatirlatmalari(today);
if(items.length){const aside=document.createElement('aside');aside.className='ozel-gunler';aside.setAttribute('aria-label','Günün hatırlatmaları');for(const g of items){const p=document.createElement('p'),a=document.createElement('a');p.textContent=g.metin+' ';a.href=yerelYol('/ozel-gunler/');a.textContent='Takvimi incele';p.append(a);aside.append(p);}document.querySelector('main')?.prepend(aside);}
