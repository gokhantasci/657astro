import {eskiJson} from '../lib/eski-json';
const adresler={'tatiller':'data/tatiller.json','tebligatlar':'data/tebligatlar.json','data/tatiller':'data/tatiller.json','data/tebligatlar':'data/tebligatlar.json','data/konsolosluk_verileri':'data/konsolosluk_verileri.json','data/nispivekalet':'data/nispivekalet.json'};
export function getStaticPaths(){return Object.entries(adresler).map(([uyum,yol])=>({params:{uyum},props:{yol}}));}
export function GET({props}:{props:{yol:string}}){return new Response(JSON.stringify(eskiJson(props.yol)),{headers:{'Content-Type':'application/json; charset=utf-8'}});}
