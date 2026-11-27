import type { APIRoute } from 'astro';
import { dilekceSablonlari, sablonDetayYolu } from '../../../lib/dilekce-sablonlari';
import { metindenUdf } from '../../../lib/udf';

export const prerender = true;

export function getStaticPaths() {
  return dilekceSablonlari.map((s) => ({
    params: { id: s.id },
    props: { sablon: s },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const s = props.sablon as (typeof dilekceSablonlari)[number];
  const metin = [
    s.metin,
    '',
    '—'.repeat(48),
    `Kaynak ve Hukuki Rehber: https://657.com.tr${sablonDetayYolu(s)}`,
    'Not: Bu şablon bilgilendirme amaçlıdır. Somut olayın özelliklerine göre avukatınıza danışarak uyarlayınız.',
  ].join('\n');
  const bytes = metindenUdf(metin);
  return new Response(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `inline; filename="${s.id}.udf"`,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
