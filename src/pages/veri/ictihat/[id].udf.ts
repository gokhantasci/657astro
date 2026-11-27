import type { APIRoute } from 'astro';
import ictihatlar from '../../../data/zamanasimi-ictihat.json';
import { metindenUdf } from '../../../lib/udf';

export const prerender = true;

export function getStaticPaths() {
  return ictihatlar.map((k) => ({
    params: { id: k.id },
    props: { karar: k },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const k = props.karar as (typeof ictihatlar)[number];
  const metin = [
    k.metin,
    '',
    '—'.repeat(48),
    'Kaynak ve Hesaplama Aracı: https://657.com.tr/dava-zamanasimi-hesaplama/',
  ].join('\n');
  const bytes = metindenUdf(metin);
  return new Response(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `inline; filename="${k.id}.udf"`,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
