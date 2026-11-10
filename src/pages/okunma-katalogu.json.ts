import {getCollection} from 'astro:content';
import {terimler} from '../lib/sozluk';
import {adliKayitlar,adliHref} from '../lib/adlicevre';
import {sorular,soruHref} from '../lib/mulakat';

export async function GET() {
 const entries = [
  ...terimler.map(k=>({grup:'hukuk',baslik:k.terim,yol:`/kelime/${k.slug}/`})),
  ...adliKayitlar.map(k=>({grup:'adli',baslik:k.baslik,yol:adliHref(k)})),
  ...sorular.filter(k=>k.mulakat).map(k=>({grup:'mulakat',baslik:k.soru,yol:soruHref(k)})),
  ...(await getCollection('yazilar',k=>!k.data.taslak)).map(k=>({grup:'yazi',baslik:k.data.title,yol:`/${k.id}/`})),
 ];
 const seen=new Set<string>();
 const katalog=entries.map(k=>({...k,yol:new URL(k.yol,'https://657.com.tr').pathname})).filter(k=>{
  if(seen.has(k.yol))return false;
  seen.add(k.yol);return true;
 });
 return new Response(JSON.stringify(katalog),{headers:{'Content-Type':'application/json; charset=utf-8'}});
}
