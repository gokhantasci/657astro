import {defineMiddleware} from 'astro:middleware';
import {yerelHtml} from './lib/site-yolu';
export const onRequest=defineMiddleware(async(_context,next)=>{
 const response=await next(),base=import.meta.env.BASE_URL;
 if(base==='/'||!response.headers.get('content-type')?.includes('text/html'))return response;
 return new Response(yerelHtml(await response.text(),base),{status:response.status,headers:response.headers});
});
