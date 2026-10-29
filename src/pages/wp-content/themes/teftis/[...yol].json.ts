import {eskiJsonYollari,eskiJson} from '../../../../lib/eski-json';
export function getStaticPaths(){return eskiJsonYollari.map(yol=>({params:{yol:yol.replace(/\.json$/,'')},props:{yol}}));}
export function GET({props}:{props:{yol:string}}){return new Response(JSON.stringify(eskiJson(props.yol)),{headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'}});}
