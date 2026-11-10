import {defineMiddleware} from 'astro:middleware';
import {yerelHtml} from './lib/site-yolu';
import {gorunenTarihler} from './lib/gorunen-tarihler';

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  // 1. /feed or /feed/ redirect to /feed.xml
  if (pathname === '/feed' || pathname === '/feed/' ||
      pathname === '/comments/feed' || pathname === '/comments/feed/' ||
      pathname === '/category/haberler/feed' || pathname === '/category/haberler/feed/') {
    return context.redirect('/feed.xml', 301);
  }

  const response = await next();
  const base = import.meta.env.BASE_URL;

  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  const html = gorunenTarihler(await response.text());
  return new Response(base === '/' ? html : yerelHtml(html, base), {
    status: response.status,
    headers: response.headers
  });
});
