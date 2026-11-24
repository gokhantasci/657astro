"""
kamutesisleri.com sitemap'indeki (page=1 ve page=2) tüm kamu tesisi sayfalarının
JSON-LD (LodgingBusiness) kayıtlarını paralel olarak okuyup src/data/kamu-misafirhaneleri.json
veri setine ekler ve mevcut kayıtların eksik ilçe/telefon/adres/konum bilgilerini zenginleştirir.

Kullanım: python scripts/misafirhane-kamutesisleri-birlestir.py
"""
from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HEDEF_PATH = ROOT / "src" / "data" / "kamu-misafirhaneleri.json"
SITEMAPS = [
    "https://kamutesisleri.com/sitemap-facilities.xml?page=1",
    "https://kamutesisleri.com/sitemap-facilities.xml?page=2",
]
LD_RE = re.compile(r'<script[^>]+application/ld\+json[^>]*>([\s\S]*?)</script>', re.I)


def tr_norm(s: str) -> str:
    s = (s or "").replace("İ", "i").replace("I", "ı").lower()
    s = s.translate(str.maketrans("çğıöşüâîû", "cgiosuaiu"))
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def kurum_belirle(ad: str, url: str) -> str:
    low = tr_norm(ad + " " + url)
    if "ogretmenev" in low or "uygulama otel" in low or "turizm meslek" in low:
        return "Öğretmenevi"
    if "polisev" in low or "polis moral" in low:
        return "Polisevi"
    if "hakimev" in low or "adalet" in low or "cte" in low or "cezaevi" in low:
        return "Hakimevi"
    if "sendika" in low or "memur sen" in low or "kamu sen" in low or "egitim bir sen" in low or "saglik sen" in low:
        return "Sendika"
    if "dsi" in low or "devlet su" in low:
        return "DSİ"
    if "orman" in low or "tarim" in low or "tigem" in low or "tayem" in low or "caykur" in low:
        return "Orman / Tarım"
    if "karayol" in low or "kgm" in low or "tcdd" in low or "demiryol" in low or "ptt" in low:
        return "Ulaştırma / KGM"
    if "universite" in low or "fakulte" in low or "konukevi" in low:
        return "Üniversite"
    if "orduev" in low or "askeri" in low or "jandarma" in low or "subay" in low or "astsubay" in low:
        return "Orduevi / Askerî"
    if "maliye" in low or "defterdarl" in low or "vergi" in low or "sgk" in low or "iller bankas" in low:
        return "Maliye / Kurum"
    if "saglik" in low or "hekimev" in low or "hastane" in low:
        return "Sağlık"
    return "Diğer Kamu"


def resmi_web_ve_fiyat(kurum: str, slug: str) -> tuple[str, str]:
    if kurum == "Öğretmenevi":
        return (
            f"https://{slug}.meb.gov.tr/",
            "HMB Tebliğ 2026-1 tabanı 120 TL · 2026 uygulama bandı: MEB/Kamu ~600–1.200 TL",
        )
    if kurum == "Polisevi":
        return (
            f"https://{slug}.pol.tr/",
            "EGM 2026 genel tarifesi: Kamu tek yatak ~735–850 TL · Onaylı misafir ~1.470+ TL",
        )
    if kurum == "Hakimevi":
        return (
            "https://dhdb.adalet.gov.tr/",
            "Adalet Bakanlığı / ATGV 2026 dönemlik sosyal tesis tarifesi",
        )
    if kurum == "DSİ":
        return (
            "https://www.dsi.gov.tr/",
            "DSİ 2026 genel tarifesi: Kamu ~700–850 TL · Sivil ~1.050–1.317 TL bandı",
        )
    if kurum == "Orman / Tarım":
        return (
            f"https://{slug}.tarimorman.gov.tr/",
            "HMB Tebliğ 2026-1 tabanı 120 TL · Kurum personeli ~600–850 TL bandı",
        )
    if kurum == "Orduevi / Askerî":
        return (
            "https://www.msb.gov.tr/",
            "TSK / MSB 2026 sosyal tesis tarifesi (hak sahibi ve misafir statüsüne göre)",
        )
    if kurum == "Ulaştırma / KGM":
        return (
            "https://www.kgm.gov.tr/",
            "HMB Tebliğ 2026-1 tabanı 120 TL · Kurum 2026 uygulama tarifesi (telefonla teyit)",
        )
    return (
        f"https://www.{slug}.gov.tr/",
        "HMB Tebliğ 2026-1 asgari 120 TL taban · Kurum 2026 tarifesi (telefonla teyit önerilir)",
    )


def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; 657bot/1.0)"})
    with urllib.request.urlopen(req, timeout=18) as resp:
        return resp.read().decode("utf-8", "ignore")


def parse_facility(url: str) -> dict | None:
    try:
        html = fetch_text(url)
    except Exception:
        return None
    for block in LD_RE.findall(html):
        try:
            obj = json.loads(block)
        except Exception:
            continue
        t = obj.get("@type")
        types = t if isinstance(t, list) else [t]
        if "LodgingBusiness" not in types and "LocalBusiness" not in types:
            continue
        name = (obj.get("name") or "").strip()
        addr_obj = obj.get("address") or {}
        if not name:
            continue
        il_ad = (addr_obj.get("addressRegion") or "").strip()
        ilce = (addr_obj.get("addressLocality") or "").strip()
        adres = (addr_obj.get("streetAddress") or "").strip()
        tel = (obj.get("telephone") or "").strip()
        agg = obj.get("aggregateRating") or {}
        puan_val = agg.get("ratingValue")
        yorum_val = agg.get("reviewCount")
        puan_str = ""
        if puan_val:
            puan_str = f"{str(puan_val).replace('.', ',')} / 5" + (f" ({yorum_val} değerlendirme)" if yorum_val else "")
        geo = obj.get("geo") or {}
        lat, lng = geo.get("latitude"), geo.get("longitude")
        return {
            "ad": name,
            "il_ad": il_ad,
            "ilce": ilce,
            "adres": adres,
            "telefon": tel,
            "puan": puan_str,
            "lat": lat,
            "lng": lng,
            "url": url,
        }
    return None


def main() -> None:
    veri = json.loads(HEDEF_PATH.read_text(encoding="utf-8"))
    slug_to_il = {x["slug"]: x for x in veri["iller"]}
    norm_to_il = {tr_norm(x["ad"]): x for x in veri["iller"]}

    urls: list[str] = []
    for sm in SITEMAPS:
        xml = fetch_text(sm)
        urls.extend(re.findall(r"<loc>([^<]+)</loc>", xml))
    urls = sorted(set(urls))
    print(f"Sitemap'ten {len(urls)} tesis adresi bulundu; paralel çekiliyor...")

    sonuclar: list[dict] = []
    with ThreadPoolExecutor(max_workers=20) as ex:
        futs = [ex.submit(parse_facility, u) for u in urls]
        for fut in as_completed(futs):
            res = fut.result()
            if res:
                sonuclar.append(res)

    eklenen = 0
    zenginlesen = 0

    for item in sonuclar:
        # İl eşleştirme: önce URL slug, sonra addressRegion
        path_parts = urllib.parse.urlparse(item["url"]).path.strip("/").split("/")
        il = slug_to_il.get(path_parts[0]) if path_parts else None
        if not il and item["il_ad"]:
            il = norm_to_il.get(tr_norm(item["il_ad"]))
        if not il:
            continue

        n_ad = tr_norm(item["ad"])
        eslesen = None
        for mevcut in il["tesisler"]:
            m_norm = tr_norm(mevcut["ad"])
            if m_norm == n_ad or (len(n_ad) > 10 and (n_ad in m_norm or m_norm in n_ad)):
                eslesen = mevcut
                break

        if eslesen:
            degisti = False
            if not eslesen.get("ilce") and item["ilce"]:
                eslesen["ilce"] = item["ilce"]
                degisti = True
            if not eslesen.get("telefon") and item["telefon"]:
                eslesen["telefon"] = item["telefon"]
                degisti = True
            if (not eslesen.get("adres") or len(eslesen["adres"]) < 10) and item["adres"]:
                eslesen["adres"] = item["adres"]
                degisti = True
            if item["puan"] and "Google Maps canlı" in (eslesen.get("puan") or ""):
                eslesen["puan"] = item["puan"]
                degisti = True
            if degisti:
                zenginlesen += 1
        else:
            kurum = kurum_belirle(item["ad"], item["url"])
            web, fiyat = resmi_web_ve_fiyat(kurum, il["slug"])
            gmaps = (
                f"https://www.google.com/maps/search/?api=1&query={item['lat']},{item['lng']}"
                if item.get("lat") and item.get("lng")
                else f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(item['ad'] + ' ' + il['ad'])}"
            )
            il["tesisler"].append(
                {
                    "ad": item["ad"],
                    "kurum": kurum,
                    "ilce": item["ilce"],
                    "adres": item["adres"] or f"{item['ilce']} / {il['ad']}".strip(" /"),
                    "telefon": item["telefon"],
                    "web": web,
                    "sosyal": "",
                    "fiyat": fiyat,
                    "puan": item["puan"] or "Google Maps canlı puanı görüntüle",
                    "googleMaps": gmaps,
                    "kaynak": item["url"],
                    "dogrulama": "kamutesisleri",
                }
            )
            eklenen += 1

    for il in veri["iller"]:
        il["tesisSayisi"] = len(il["tesisler"])

    veri["toplamTesis"] = sum(x["tesisSayisi"] for x in veri["iller"])
    HEDEF_PATH.write_text(json.dumps(veri, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Bitti: {len(sonuclar)}/{len(urls)} sayfa okundu · +{eklenen} yeni tesis · {zenginlesen} mevcut kayıt zenginleştirildi · TOPLAM: {veri['toplamTesis']} tesis (81 il).")


if __name__ == "__main__":
    main()
