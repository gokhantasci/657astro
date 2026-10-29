import type { APIRoute } from 'astro';
import { dizinYaniti } from '../lib/site-haritasi';

// WordPress (Yoast) site haritasının eski adresi; Search Console'da kayıtlı kalabileceği için aynı dizin burada da yayımlanır.
export const GET: APIRoute = ({ site }) => dizinYaniti(site!);
