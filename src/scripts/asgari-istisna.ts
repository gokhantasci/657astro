import { asgariIstisnaCetveli } from '../lib/asgari-istisna';
import { tl, sayiOku } from '../lib/bicim';
import type { VergiTarifesi } from '../lib/vergi';
const form = document.querySelector<HTMLFormElement>('#ai-form');
if (form) {
 const {vergi,aylar} = JSON.parse(document.querySelector('#ai-veri')!.textContent!) as {vergi:VergiTarifesi;aylar:string[]};
 const body = document.querySelector('#ai-rows')!;
 const hata = document.querySelector<HTMLElement>('[data-ai-hata]')!;
 const hesapla = () => {
  try {
   const ay = Number((form.elements.namedItem('araAy') as HTMLSelectElement).value);
   const brut = sayiOku((form.elements.namedItem('araBrut') as HTMLInputElement).value);
   const rows = asgariIstisnaCetveli(vergi,ay,ay?brut:vergi.asgariBrut);
   body.replaceChildren(...rows.map(r=>{
    const tr=document.createElement('tr'), th=document.createElement('th'); th.scope='row'; th.textContent=aylar[r.ay-1]; tr.append(th);
    for (const n of [r.brut,r.prim,r.net,r.kumulatif,r.gelir,r.damga]) {const td=document.createElement('td');td.className='num';td.textContent=tl(n);tr.append(td);}return tr;
   }));hata.hidden=true;
  } catch(e) {hata.textContent=(e as Error).message;hata.hidden=false;body.replaceChildren();}
 };
 form.addEventListener('submit',e=>{e.preventDefault();hesapla();});form.addEventListener('input',hesapla);form.addEventListener('change',hesapla);
}
