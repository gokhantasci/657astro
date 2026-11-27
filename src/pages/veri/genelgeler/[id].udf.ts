import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { genelgeler } from '../../../lib/genelgeler';
import { metindenUdf } from '../../../lib/udf';

export const prerender = true;

export function getStaticPaths() {
  return genelgeler.map((g) => ({
    params: { id: g.id },
    props: { genelge: g },
  }));
}

function markdownDuzMetin(md: string): string {
  return md
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*\|[-:\s|]+\|\s*$/gm, '')
    .replace(/^\s*\|\s*/gm, '')
    .replace(/\s*\|\s*$/gm, '')
    .replace(/\s*\|\s*/g, '  |  ')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const GET: APIRoute = async ({ props }) => {
  const g = props.genelge as (typeof genelgeler)[number];
  const belge = await getEntry('belgeler', `genelge/${g.id}`);
  const govde = markdownDuzMetin(belge?.body ?? g.baslik);
  const ust = [
    'T.C. ADALET BAKANLIĞI',
    g.grup,
    g.baslik,
    '—'.repeat(48),
    '',
  ].join('\n');
  const metin = `${ust}${govde}\n\nKaynak: https://657.com.tr/adalet-bakanligi-genelgeleri/${g.id}/`;
  const bytes = metindenUdf(metin);
  return new Response(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `inline; filename="${g.id}.udf"`,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
