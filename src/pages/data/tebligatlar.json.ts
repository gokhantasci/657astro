import type { APIRoute } from 'astro';
import { tebligatlarYaniti } from '../../lib/eski-uclar';

// Eski WordPress adresi; masaüstü uygulamaları okur (bkz. lib/eski-uclar.ts).
export const GET: APIRoute = () => tebligatlarYaniti();
