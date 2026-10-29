import type { APIRoute } from 'astro';
import { HARITA_GRUPLARI, haritaKayitlari, haritaYaniti, type HaritaGrubu } from '../lib/site-haritasi';

export const getStaticPaths = () => HARITA_GRUPLARI.map(grup => ({ params: { grup } }));
export const GET: APIRoute = async ({ params, site }) => haritaYaniti(await haritaKayitlari(params.grup as HaritaGrubu), site!);
