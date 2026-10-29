import { z } from 'zod';
import kaynak from '../data/adli-teskilat.json' with { type: 'json' };
import eski from '../data/adlicevre-eski.json' with { type: 'json' };

// Adli çevre sayfaları src/data/adli-teskilat.json'dan derlemede üretilir. Dosya, WordPress'te All Import'a verilen
// teskilat_guncel.json ile aynı biçimdedir; yeni sürümü bu dosyanın yerine koymak sayfaları günceller.
// Metin, All Import şablonunun karşılığıdır (bkz. metin()). Bilinçli düzeltmeler:
//  - "Ağır Ceza Merkezli adliyelerdedir" → "adliyelerdendir", "Adliyesi'nin" → "Adliyesinin", "yada" → "ya da", "bir çok" → "birçok".
//  - "Teşkilat Kurulmadı" kaydında "X Adliyesi adında bu zamana kadar..." anlatımı, yer adıyla kurulan düz cümleye çevrildi.
//  - "Faal Değil" kayıtlarına diğer durumlardaki yetkili adliye cümlesi eklendi.
//  - İl, eski JS şablonundaki gibi metne ve bilgi tablosuna eklendi.
const DURUMLAR = ['Faal', 'Birleştirildi', 'Teşkilat Kurulmadı', 'Faal Değil'] as const;
const kayitSchema = z.object({
  il: z.string().min(1), mahal: z.string().min(1), bolge: z.string(), teskilat: z.enum(['ACM', 'Mülhakat', '']),
  durum: z.enum(DURUMLAR), bagli_adliye: z.string(), bagli_acm: z.string(), bagli_bam: z.string(),
  cbs_var: z.enum(['0', '1']), en_yakin_acm: z.string(),
}).superRefine((k, ctx) => {
  if (k.durum !== 'Faal' && !k.bagli_adliye) ctx.addIssue({ code: 'custom', message: `${k.mahal}: ${k.durum} kayıtta bagli_adliye boş olamaz.` });
});
export type AdliKaynak = z.infer<typeof kayitSchema>;
const kayitlar = z.array(kayitSchema).min(1).parse(kaynak);
const eskiSchema = z.object({
  aciklama: z.string(),
  yonlendir: z.record(z.string().regex(/^[a-z0-9-]+$/), z.string().regex(/^[a-z0-9-]+$/)),
  arsiv: z.array(z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), baslik: z.string().min(1), icerik: z.string(), ozet: z.string(), tarih: z.iso.date() })),
});
const eskiVeri = eskiSchema.parse(eski);

// WordPress sanitize_title karşılığı; aynı başlık ikinci kez gelirse "-2" eklenir (WordPress'teki gibi).
const TR: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };
export const adliSlug = (t: string) => t.toLocaleLowerCase('tr-TR').replace(/[çğıöşüâîû]/g, c => TR[c])
  .normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const b = (s: string) => `<strong>${esc(s)}</strong>`;
// Bulunma eki: Adana'da, Tarsus'ta, Kadıköy'de, Ürgüp'te.
const unluler = 'aıoueiöü';
export function bulunma(ad: string) {
  const k = ad.toLocaleLowerCase('tr-TR');
  const son = [...k].reverse().find(c => unluler.includes(c)) ?? 'a';
  const sert = 'fstkçşhp'.includes(k.at(-1)!);
  return `${ad}'${sert ? 't' : 'd'}${'aıou'.includes(son) ? 'a' : 'e'}`;
}

function metin(k: AdliKaynak) {
  const m = k.mahal, yetkili = k.durum === 'Faal' ? m : k.bagli_adliye;
  // İl merkezinde "(Adana)" gibi tekrar yazılmaz.
  const il = m === k.il ? '' : ` (${esc(k.il)})`;
  const p: string[] = [];
  if (k.durum === 'Faal') {
    p.push(`${esc(m)} Adliyesi ${b('Faal durumda')} hizmet vermektedir.${il ? ` ${esc(m)}, ${esc(k.il)} iline bağlıdır.` : ''}`);
    p.push(k.cbs_var === '1'
      ? `${b(`${m} Cumhuriyet Başsavcılığı`)} <em>müstakil</em> ${b('Cumhuriyet Başsavcılığıdır.')}`
      : `${esc(m)} Cumhuriyet Başsavcılığı müstakil Cumhuriyet Başsavcılığı değildir.`);
  } else if (k.durum === 'Teşkilat Kurulmadı') {
    p.push(`${esc(bulunma(m))}${il} bu zamana kadar ${b('adli teşkilat kurulmamıştır')}; ${esc(m)} halen ${b(`${k.bagli_adliye} Adliyesi`)} yargı çevresindedir.`);
  } else if (k.durum === 'Birleştirildi') {
    p.push(`${esc(m)}${il} Adliyesi evvelce kapatılarak ${esc(k.bagli_adliye)} Adliyesi ile ${b('birleştirilmiştir')} ve halen ${b(`${k.bagli_adliye} Adliyesi`)} yargı çevresindedir.`);
  } else {
    p.push(`${esc(m)}${il} Adliyesi şu an ${b('faal değildir')} ve halen ${b(`${k.bagli_adliye} Adliyesi`)} yargı çevresindedir.`);
  }
  p.push(`${esc(m)} adli bölgesinde işlenen suçlar ya da bu yer sebebiyle açılacak davalar açısından ${b(`${yetkili} Adliyesi`)} yetkilidir.`);
  if (k.bolge) p.push(`${esc(m)} Adliyesi ${b(`${k.bolge}. bölge`)} adliyelerdendir.`);
  const acm = k.teskilat === 'Mülhakat' ? `${esc(m)} Adliyesi ${b(k.bagli_acm)} Adliyesinin mülhakat (bağlı) adliyesidir.`
    : k.teskilat === 'ACM' ? `${esc(m)} Adliyesi Ağır Ceza Merkezli adliyelerdendir.`
    : `${esc(m)}, Ağır Ceza Merkezi olarak ${b(k.bagli_acm)} Ağır Ceza Mahkemesi yargı çevresindedir.`;
  p.push(k.en_yakin_acm ? `${acm}<br>\n${esc(k.bagli_acm)} Ağır Ceza Mahkemesine en yakın Ağır Ceza Mahkemesi ${b(k.en_yakin_acm)} Ağır Ceza Mahkemesidir.` : acm);
  p.push(`${b(m)} istinaf çevresi olarak ${b(`${k.bagli_bam} Bölge Adliye Mahkemesine`)} bağlıdır. İstinaf incelemesi burada yapılmaktadır.`);
  p.push(`İnternette birçok kullanıcı ${b(m)} Adliyesi var mı, ${b(m)} Adli Çevresi ve ${b(m)} Adliyesi iletişim numarası, ${b(m)} Adliyesi nereye bağlı, ${b(m)} Adliyesi hangi adliyeye bağlı diye ararken bir yığın faydasız bilgi arasında boğulmaktadır.`);
  return p.map(x => `<p>${x}</p>`).join('\n');
}
const duz = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

export interface AdliKayit { slug: string; baslik: string; icerik: string; ozet: string; kaynak?: AdliKaynak; tarih?: string }
const kullanilan = new Set<string>();
const uretilen: AdliKayit[] = kayitlar.map(k => {
  const baslik = `${k.mahal} Adliyesi Yargı Çevresi`;
  const temel = adliSlug(baslik);
  let slug = temel;
  for (let n = 2; kullanilan.has(slug); n++) slug = `${temel}-${n}`;
  kullanilan.add(slug);
  const icerik = metin(k);
  return { slug, baslik, icerik, ozet: duz(icerik).slice(0, 160), kaynak: k };
});
for (const a of eskiVeri.arsiv) if (kullanilan.has(a.slug)) throw new Error(`Arşiv adli çevre kaydı yeni kayıtla çakışıyor: ${a.slug}`);
for (const [eskiSlug, yeni] of Object.entries(eskiVeri.yonlendir)) {
  if (kullanilan.has(eskiSlug)) throw new Error(`Yönlendirilen eski adres yeni kayıtla çakışıyor: ${eskiSlug}`);
  if (!kullanilan.has(yeni)) throw new Error(`Adli çevre yönlendirmesinin hedefi yok: ${eskiSlug} → ${yeni}`);
}
export const adliKayitlar: AdliKayit[] = [...uretilen, ...eskiVeri.arsiv].sort((a, b) => a.baslik.localeCompare(b.baslik, 'tr'));
export const adliYonlendirmeler = Object.entries(eskiVeri.yonlendir).map(([eskiSlug, yeni]) => ({ eski: eskiSlug, yeni }));
export const adliHref = (k: { slug: string }) => `/adlicevre/${k.slug}/`;
