import {getCollection} from 'astro:content';
import {ayarlar} from '../lib/settings';
const esc=(s:string)=>s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
export async function GET(){
 const site=ayarlar.site.url,rows=(await getCollection('yazilar',y=>!y.data.taslak)).sort((a,b)=>+b.data.date-+a.data.date).slice(0,50);
 const xml=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>657.com.tr yazıları</title><link>${site}/</link><description>Kamu personeli ve adliye çalışanları için yazılar ve hesaplama kaynakları</description><language>tr-TR</language><atom:link href="${site}/feed.xml" rel="self" type="application/rss+xml"/>${rows.map(y=>`<item><title>${esc(y.data.title)}</title><link>${site}/${y.id}/</link><guid isPermaLink="true">${site}/${y.id}/</guid><description>${esc(y.data.description)}</description><pubDate>${y.data.date.toUTCString()}</pubDate>${y.data.kategori.map(k=>`<category>${esc(k)}</category>`).join('')}</item>`).join('')}</channel></rss>`;
 return new Response(xml,{headers:{'Content-Type':'application/rss+xml; charset=utf-8'}});
}
