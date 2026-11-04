import {defineMiddleware} from 'astro:middleware';
import {yerelHtml} from './lib/site-yolu';
import {gorunenTarihler} from './lib/gorunen-tarihler';
export const onRequest=defineMiddleware(async(_context,next)=>{
 const response=await next(),base=import.meta.env.BASE_URL;
 if(!response.headers.get('content-type')?.includes('text/html'))return response;
 const html=gorunenTarihler(await response.text());
 return new Response(base==='/'?html:yerelHtml(html,base),{status:response.status,headers:response.headers});
});
