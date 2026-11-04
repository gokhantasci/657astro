// ÜRETİLMİŞ DOSYA — elle düzenlemeyin: node scripts/cloudflare-worker.mjs
// 657.com.tr/* rotasına bağlanır. Statik varlıklar (/_astro/*, /og/*, /fonts/*) Worker'sız rotalarla dışarıda tutulur.
// Eski sunucuda kalan yollar kaynak.657.com.tr kaydına gider; Host başlığı 657.com.tr kalır (ücretsiz planda Origin Rule bunu yapamaz).
const KAYNAK = /^\/(?:_657-servis\/|modeller\/|dosyalar\/uygulamalar\/|denetimtutanagi\.docx$|wp-admin|wp-login\.php$|wp-json\/|wp-content\/|wp-includes\/)/;
const GONE = new Set(["/02-12-2025-tarihinde-kura-ceken-adli-ve-idari-yargi-hakim-ve-cumhuriyet-savcilarina-yonelik-mazeret-ve-mustemir-yetki-kararnamesi/","/06-02-2025-tarihli-hakim-ve-savci-mazeret-kararnamesi/","/10-farkli-mahalde-ilk-defa-agir-ceza-mahkemeleri-kuruldu/","/20-05-2024-tarihli-kura-kararnamesi-ile-atanan-hakim-savcilar/","/2024-yili-adli-ve-idari-yargi-guz-kararnamesi/","/2024-yili-icra-muduru-icra-mudur-yardimcilari-kararnamesi/","/2025-yazi-isleri-mudurlerinin-il-ici-atamalari/","/2025-yili-adli-ve-idari-yargi-ana-kararnamesi-birlestirilmis-liste/","/2025-yili-adli-ve-idari-yargi-kura-kararnamesi/","/2025-yili-birlestirilmis-hakim-savci-mustemir-yetki-karari/","/2025-yili-cte-tayin-sonuclari-birlestirilmis-liste/","/2025-yili-icra-muduru-icra-mudur-yardimcilari-kararnamesi/","/2025-yili-uzlastirmaci-ucret-tarifesi-yayimlandi/","/2026-adli-ve-idari-yargi-ana-kararnamesi-birlestirilmis/","/2026-yili-icin-yurt-disi-tebligat-ve-istinabe-taleplerinde-uyulmasi-gereken-usul-ve-esaslara-dair-teblig-yayimlandi/","/2026-yilinda-yillik-ara-vermeden-yararlanacaklara-iliskin-liste/","/28-02-2025-tarihli-adli-yargi-mustemir-yetki-kararnamesi/","/30-01-2025-tarihli-adli-ve-idari-yargi-hakim-savci-kura-kararnamesi/","/adalet-bakanligi-2024-yili-havuz-tayin-sonuclari-birlestirilmis-liste/","/adalet-bakanligi-900-sozlesmeli-icra-katibi-alim-ilani/","/adalet-bakanligi-havuz-tayinleri-yayimlandi/","/adalet-bakanligi-kadrolu-personelin-istege-bagli-nakil-sonuclari-yayimlandi/","/adalet-bakanligi-memur-sinav-atama-ve-nakil-yonetmeliginde-degisiklik-neler-getirdi/","/adalet-bakanligi-memur-sinav-atama-ve-nakil-yonetmeliginde-degisiklik-yapilmasina-dair-yonetmelik-yayimlandi/","/adalet-bakanligi-yargi-reformu-stratejisi-eylem-planini-yayinladi/","/adalet-bakanliginda-ust-duzey-gorev-degisimi-10-isim-gorevden-alindi-11-yeni-atama-yapildi/","/adli-ve-idari-yargi-2025-yili-mazeret-ve-mustemir-yetki-kararnameleri/","/adli-ve-idari-yargi-yazi-isleri-mudurleri-istege-bagli-nakil-calismasi-sonuclari/","/agri-nigde-sirnak-tunceli-ve-yalova-illerinde-yeni-mahkemeler-kuruluyor/","/aym-iptal-karari-arabuluculuk-faaliyetine-katilmayan-taraf/","/aym-karari-isim-adin-degisikliginde-ilan-yapilmasinin-iptaline/","/bilirkisilik-basvurulari-24-aralik-2025te-basliyor-basvurular-26-ocak-2026ya-kadar-alinacak/","/bitlis-hakkari-kirsehir-nevsehir-ve-sinop-agri-nigde-sirnak-tunceli-ve-yalova-illerinde-yeni-mahkemeler-kuruluyor/","/bosanma-karari-hazirlayici-nufus-analiz-sistemi-2/","/cte-bakanlik-ve-komisyon-atamali-personelin-2026-yili-istege-bagli-atama-sonuclari-yayimlandi/","/cte-gorevde-yukselme-ve-unvan-degisikligi-yazili-sinav-sonuclarina-iliskin-duyuru-yayimlandi/","/egitici-hakim-ve-savcilik-nedir/","/gys-tercih-sistemi-acildi/","/hakimler-ve-savcilar-kurulu-2024-yili-sozlesmeli-personel-alim-ilani/","/hakimler-ve-savcilar-kurulunun-20-12-2024-tarihli-yetki-kararnamesi-yayinlanmistir/","/hsk-01-04-2026-tarihli-kararname-ve-mustemir-yetki-kararnamesi-acikladi/","/hsk-21-05-2026-tarih-ve-1137-sayili-adli-yargi-kararnamesi-yayimlandi/","/hsk-kararnamesi-12-hakim-savcinin-gorev-yeri-degisti/","/hsk-suresi-icerisinde-yazilmayan-kararlar-terfi-cetvelinde-gosterilmeyecek/","/hsk-tarafindan-mufettisliklere-atananlara-iliskin-liste-yayimlandi/","/icisleri-bakanligi-sozlesmeli-bilisim-personeli-sinavi-duyurusu-2024/","/icra-mudur-ve-icra-mudur-yardimcilarinin-2026-yili-kararnamesi-yayimlandi/","/infaz-koruma-basmemurlari-ceza-infaz-kurumu-muduru-olabilecek/","/konkordato-gider-avansi-tarifesi/","/kura-kararnamesi-resmi-gazetede/","/nukleer-duzenleme-kurumu-6-personel-alacak/","/polis-akademisi-baskanligi-ic-guvenlik-fakultesi-giris-yonetmeligi/","/resmi-gazetede-atama-kararlari-bakanliklar-kamu-kurumlari-ve-5-universitede-yeni-isimler/","/sozlesmeli-personelin-sozlesmesinin-tek-tarafli-feshi-icin-gecerli-uc-neden-sayiniz-2/","/uyap-mobil-ile-evrak-tarama/","/yargi-reformu-stratejisi-2025-2029/","/yargitay-ve-danistay-uyeliklerine-secme-kararlari-resmi-gazetede/","/yeni-kurulan-ihtisas-mahkemeleri/"]);
const PAYLASIM = ["/tuketici-hakem-heyeti-bilirkisi-ucret-hesaplama/","/nufus-analiz-sistemi-bosanma-karari-hazirla/","/infaz-ve-koruma-memuru-boy-kilo-hesaplama/","/cmk-avukatlik-asgari-ucret-tarifesi/","/ek-ders-ucretinden-saat-hesaplama/","/manevi-tazminat-vekalet-hesaplama/","/enflasyon-farki-hesaplama-robotu/","/yargilama-gideri-paylasim-hesabi/","/belediye-baskani-maasi-hesaplama/","/maddi-tazminat-vekalet-hesaplama/","/serbest-meslek-makbuzu-hesaplama/","/sozlesmeli-memur-maas-hesaplama/","/ilksan-emekli-yardimi-hesaplama/","/ucretli-ogretmen-maas-hesaplama/","/kidem-ihbar-tazminati-hesaplama/","/avukatlik-asgari-ucret-tarifesi/","/gecici-gorev-yollugu-hesaplama/","/nispi-vekalet-ucreti-hesaplama/","/istinaf-temyiz-harci-hesaplama/","/almanya-posta-kodu-konsolosluk/","/asgari-ucret-istisna-oranlari/","/nafaka-kismen-kabul-hesaplama/","/davalilara-paylasim-hesaplama/","/husumet-dava-sarti-hesaplama/","/iflas-idare-ucreti-hesaplama/","/asker-emekli-maasi-hesaplama/","/emekli-memur-maas-hesaplama/","/acilmamis-sayilma-hesaplama/","/ogretmen-ek-ders-hesaplama/","/akademik-ek-ders-hesaplama/","/nafaka-tam-kabul-hesaplama/","/enflasyon-orani-hesaplama/","/konsolosluk-sorgulama-2/","/davanin-reddi-hesaplama/","/tapu-harci-hesaplama-2/","/muhtar-maasi-hesaplama/","/lojman-puani-hesaplama/","/4d-isci-maas-hesaplama/","/kismen-kabul-hesaplama/","/davayi-kabul-hesaplama/","/surekli-gorev-yollugu/","/islah-harci-hesaplama/","/68-b-hizmet-hesaplama/","/derdest-dosya-listesi/","/yillik-izin-hesaplama/","/memur-maas-hesaplama/","/dava-acma-masraflari/","/kira-artis-hesaplama/","/miras-payi-hesaplama/","/tam-kabul-hesaplama/","/adliye-kasa-hesabi/","/hukuk-mahkemeleri/","/feragat-hesaplama/","/udf-goruntuleyici/","/yargilamagideri/","/udf-donusturucu/","/udf-birlestirme/","/sulh-hesaplama/","/faiz-hesaplama/","/hmk-yargilama/","/kesinlesme/","/udf-editor/"];
const YOAST = new Set(["/post-sitemap.xml","/post-sitemap2.xml","/post-sitemap3.xml","/page-sitemap.xml","/kelimeler-sitemap.xml","/kelimeler-sitemap2.xml","/kelimeler-sitemap3.xml","/adlicevre-sitemap.xml","/adlicevre-sitemap2.xml","/category-sitemap.xml","/post_tag-sitemap.xml","/post_tag-sitemap2.xml","/post_tag-sitemap3.xml","/author-sitemap.xml","/teftis-pages-sitemap.xml","/wp-sitemap.xml"]);
const FEED = /^\/(?:feed|rss|comments\/feed|feed\/atom|feed\/rss2|(?:category|tag)\/[^/]+\/feed)\/?$/;
const ETIKET = /^\/tag\/([^/]+)\/?(?:page\/\d+\/?)?$/;
const YENILE = /<meta http-equiv="refresh" content="0;url=([^"]+)"/i;

const yonlendir = (url, yol) => Response.redirect(new URL(yol, url.origin).href, 301);

async function donustur(yanit, url) {
  // Derlemedeki meta-refresh yönlendirme sayfaları (eski sözlük, WordPress kuralları) gerçek 301 olur.
  // Yalnız ilk parça okunur; gerisi akış olarak iletilir (büyük sayfalar belleğe alınmaz).
  if (yanit.status === 200 && yanit.body && (yanit.headers.get('content-type') || '').includes('text/html')) {
    const okuyucu = yanit.body.getReader();
    const ilk = await okuyucu.read();
    if (ilk.done) return new Response(null, yanit);
    const m = new TextDecoder().decode(ilk.value.slice(0, 2048)).match(YENILE);
    if (m) { okuyucu.cancel(); return yonlendir(url, m[1].replace(/&amp;/g, '&')); }
    const akis = new ReadableStream({
      start(c) { c.enqueue(ilk.value); },
      async pull(c) { const p = await okuyucu.read(); if (p.done) c.close(); else c.enqueue(p.value); },
      cancel(r) { okuyucu.cancel(r); },
    });
    return new Response(akis, { status: yanit.status, statusText: yanit.statusText, headers: yanit.headers });
  }
  return yanit;
}

export default {
  async fetch(req) {
    const url = new URL(req.url);
    let yol;
    try { yol = decodeURIComponent(url.pathname); } catch { yol = url.pathname; }
    if (KAYNAK.test(yol)) return fetch(req, { cf: { resolveOverride: 'kaynak.657.com.tr' } });
    if (GONE.has(yol)) return new Response('Bu içerik kişisel veri içerdiği için yayından kaldırıldı.', { status: 410, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400' } });
    if (FEED.test(yol)) return yonlendir(url, '/feed.xml');
    if (YOAST.has(yol)) return yonlendir(url, '/sitemap.xml');
    const etiket = yol.match(ETIKET);
    if (etiket) return yonlendir(url, '/yazilar/?q=' + encodeURIComponent(etiket[1].replace(/-/g, ' ')));
    // Paylaşılabilir hesap adresi: aracın kök sayfası 200 ile döner; seçimleri tarayıcı betiği okur.
    const kok = !/\.[a-z0-9]{1,8}$/i.test(yol) && PAYLASIM.find(p => yol.startsWith(p) && yol.length > p.length);
    if (kok) {
      // Adresin kendi sayfası varsa (ör. /hukuk-mahkemeleri/tam-kabul/ yönlendirmesi) o kullanılır; yoksa paylaşım adresidir.
      const kendi = await fetch(req);
      if (kendi.status !== 404) return donustur(kendi, url);
      const hedef = new URL(url); hedef.pathname = kok;
      const y = await fetch(hedef.href, { headers: req.headers, cf: { cacheEverything: true } });
      return new Response(y.body, { status: y.ok ? 200 : y.status, headers: y.headers });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return fetch(req);
    return donustur(await fetch(req), url);
  },
};
