import type { APIRoute } from 'astro';
import { katsayilarYaniti } from '../../../../../../lib/eski-uclar';

// Eski WordPress adresi; masaüstü uygulamaları okur (bkz. lib/eski-uclar.ts).
export const GET: APIRoute = () => katsayilarYaniti();
