import type { APIRoute } from 'astro';
import { GYS_KOK } from '../../lib/gys-yayin';

// gys.657.com.tr/robots.txt; sunucu kuralı bu dosyayı alt alan adının köküne bağlar.
export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /_657-servis/\n\nSitemap: ${GYS_KOK}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
