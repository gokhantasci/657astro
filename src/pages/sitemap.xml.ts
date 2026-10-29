import type { APIRoute } from 'astro';
import { dizinYaniti } from '../lib/site-haritasi';

// Site haritası dizini; gruplar /sitemap-<grup>.xml adreslerindedir.
export const GET: APIRoute = ({ site }) => dizinYaniti(site!);
