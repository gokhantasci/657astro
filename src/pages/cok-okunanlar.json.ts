import {terimler,terimHref} from '../lib/sozluk';
import {sorular,soruHref} from '../lib/mulakat';
import {okunma} from '../lib/okunma';
export function GET(){
 const row=(baslik:string,yol:string)=>({baslik,yol:new URL(yol,'https://657.com.tr').pathname,taban:okunma(yol)});
 return new Response(JSON.stringify({hukuk:terimler.map(t=>row(t.terim,terimHref(t))),mulakat:sorular.map(s=>row(s.soru,soruHref(s)))}),{headers:{'Content-Type':'application/json; charset=utf-8'}});
}
