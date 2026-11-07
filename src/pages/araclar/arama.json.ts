import type { APIRoute } from 'astro';
import { terimler, terimHref, kisa } from '../../lib/sozluk';
import { sorular, soruHref, kisaCevap } from '../../lib/mulakat';
import { adliKayitlar, adliHref } from '../../lib/adlicevre';
import { dpbGorusleri, dpbYol } from '../../lib/dpb';
import { buyukHarfDuzelt } from '../../lib/bicim';
import {genelgeler,genelgeYol} from '../../lib/genelgeler';

// Araç dizini araması için içerik dizini: [tür, başlık, adres, kısa açıklama, aranacak ek metin].
// Yalnız kullanıcı arama yaptığında tembel yüklenir (scripts/site-arama.ts).
const duz = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
export const GET: APIRoute = () => {
  const satirlar: [string, string, string, string, string][] = [
    ...genelgeler.map(g=>['Genelge',g.baslik,genelgeYol(g),g.grup,g.sayfalar.filter(p=>p.yontem==='pdf').map(p=>p.metin).join(' ').slice(0,600)] as [string,string,string,string,string]),
    ...adliKayitlar.map(k => ['Adli çevre', k.baslik, adliHref(k), kisa(duz(k.ozet), 140), duz(k.icerik).slice(0, 600)] as [string, string, string, string, string]),
    ...terimler.map(t => ['Sözlük', buyukHarfDuzelt(t.terim), terimHref(t), kisa(duz(t.anlam), 120), ''] as [string, string, string, string, string]),
    ...sorular.map(s => ['Mülakat', buyukHarfDuzelt(s.soru), soruHref(s), kisaCevap(duz(s.cevap), 120), ''] as [string, string, string, string, string]),
    ...dpbGorusleri.filter(g => g.id !== 'dpb_mutalaa_ozel').map(g => ['DPB görüşü', g.baslik, dpbYol(g.id), '', duz(g.metin ?? '').slice(0, 300)] as [string, string, string, string, string]),
  ];
  return new Response(JSON.stringify(satirlar), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
