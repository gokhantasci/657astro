import type { APIRoute } from 'astro';
import { terimler, terimHref, kisa } from '../../lib/sozluk';
import { sorular, soruHref, kisaCevap } from '../../lib/mulakat';
import { adliKayitlar, adliHref } from '../../lib/adlicevre';
import { dpbGorusleri, dpbYol } from '../../lib/dpb';
import { buyukHarfDuzelt } from '../../lib/bicim';
import {genelgeler,genelgeYol} from '../../lib/genelgeler';
import {getCollection} from 'astro:content';
import {markdownSayfalari} from '../../lib/belge-markdown';

// Araç dizini araması için içerik dizini: [tür, başlık, adres, kısa açıklama, aranacak ek metin].
// Yalnız kullanıcı arama yaptığında tembel yüklenir (scripts/site-arama.ts).
const duz = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
export const GET: APIRoute = async () => {
  const belgeMetinleri=new Map((await getCollection('belgeler')).map(b=>[b.data.sha256,markdownSayfalari(b.body??'').map(p=>p.metin).join(' ')]));
  const satirlar: [string, string, string, string, string][] = [
    ...genelgeler.map(g=>['Genelge',g.baslik,genelgeYol(g),g.grup,(belgeMetinleri.get(g.sha256)??'').slice(0,600)] as [string,string,string,string,string]),
    ...adliKayitlar.map(k => ['Adli çevre', k.baslik, adliHref(k), kisa(duz(k.ozet), 140), duz(k.icerik).slice(0, 600)] as [string, string, string, string, string]),
    ...terimler.map(t => ['Sözlük', buyukHarfDuzelt(t.terim), terimHref(t), kisa(duz(t.anlam), 120), ''] as [string, string, string, string, string]),
    ...sorular.map(s => ['Mülakat', buyukHarfDuzelt(s.soru), soruHref(s), kisaCevap(duz(s.cevap), 120), ''] as [string, string, string, string, string]),
    ...dpbGorusleri.filter(g => g.id !== 'dpb_mutalaa_ozel').map(g => ['DPB görüşü', g.baslik, dpbYol(g.id), '', duz(belgeMetinleri.get(g.sha256)??'').slice(0,300)] as [string, string, string, string, string]),
  ];
  return new Response(JSON.stringify(satirlar), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
