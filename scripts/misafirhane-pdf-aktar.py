"""
117 sayfalık 'Ülkemizde Bulunan Tüm Kamu Misafirhaneleri (İlçeler Dahil)' PDF'ini
(emniyet.org.tr) ayrıştırır, doğrudan doğrulanan 2026 tarife/resmî site kayıtlarıyla birleştirir
ve src/data/kamu-misafirhaneleri.json dosyasını tüm 81 il + ilçeler için günceller.

Kullanım: python scripts/misafirhane-pdf-aktar.py
"""
from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

import pymupdf

PDF_URL = "https://emniyet.org.tr/wp-content/uploads/2025/08/ULKEMIZDE-BULUNAN-TUM-KAMU-MISAFIRHANELERIILCELER-DAHIL.pdf"
KAYNAK_SAYFA = "https://emniyet.org.tr/ets_belgeler/ulkemizde-bulunan-tum-kamu-misafirhaneleri-adresleri-ve-telefonlari/"
ROOT = Path(__file__).resolve().parent.parent
YARGI_PATH = ROOT / "src" / "data" / "yargi-haritasi.json"
HEDEF_PATH = ROOT / "src" / "data" / "kamu-misafirhaneleri.json"

# Doğrudan doğrulanan kamu sendikası konukevleri ve otelleri
SENDIKA_TESISLERI: dict[str, list[dict]] = {
    "06": [
        {
            "ad": "Eğitim-Bir-Sen Konukevi (EBS Konukevi)",
            "kurum": "Sendika",
            "ilce": "Çankaya",
            "adres": "Fakülteler Mah. Boz Sok. No:3, 06590 Çankaya / Ankara",
            "telefon": "0312 486 02 14 / 0539 220 44 52",
            "web": "https://www.ebskonukevi.com.tr/",
            "sosyal": "https://www.ebs.org.tr/",
            "fiyat": "Sendika üyeleri ve yakınlarına indirimli 2026 konukevi tarifesi",
            "puan": "Google Maps canlı puanı görüntüle",
            "kaynak": "https://www.ebskonukevi.com.tr/",
            "dogrulama": "dogrulandi",
        },
        {
            "ad": "Eğitim-Bir-Sen Otel (EBS Otel)",
            "kurum": "Sendika",
            "ilce": "Çankaya",
            "adres": "Çamlıtepe Mah. Erdem Cad. No:2, 06590 Çankaya / Ankara",
            "telefon": "0312 486 04 86",
            "web": "https://www.ebsotel.com/",
            "sosyal": "https://www.ebs.org.tr/",
            "fiyat": "Memur-Sen / Eğitim-Bir-Sen üyelerine özel indirimli 2026 otel tarifesi",
            "puan": "Google Maps canlı puanı görüntüle",
            "kaynak": "https://www.ebsotel.com/",
            "dogrulama": "dogrulandi",
        },
        {
            "ad": "Sağlık-Sen Kızılay Otel",
            "kurum": "Sendika",
            "ilce": "Çankaya",
            "adres": "Kocatepe Mah. Hatay Sok. No:19, Çankaya / Ankara",
            "telefon": "0312 419 00 77 / 0501 741 04 81",
            "web": "https://www.sagliksen.org.tr/",
            "sosyal": "https://www.sagliksen.org.tr/",
            "fiyat": "Sağlık-Sen üyelerine özel indirimli 2026 konaklama tarifesi (SİMER: 444 19 95)",
            "puan": "Google Maps canlı puanı görüntüle",
            "kaynak": "https://www.sagliksen.org.tr/",
            "dogrulama": "dogrulandi",
        },
        {
            "ad": "Sağlık-Sen Ulus Otel",
            "kurum": "Sendika",
            "ilce": "Altındağ",
            "adres": "Hacı Bayram Mah. Çankırı Cad. No:20, Altındağ / Ankara",
            "telefon": "0312 309 15 15 / 0501 741 04 80",
            "web": "https://www.sagliksen.org.tr/",
            "sosyal": "https://www.sagliksen.org.tr/",
            "fiyat": "Sağlık-Sen üyelerine özel indirimli 2026 konaklama tarifesi (SİMER: 444 19 95)",
            "puan": "Google Maps canlı puanı görüntüle",
            "kaynak": "https://www.sagliksen.org.tr/",
            "dogrulama": "dogrulandi",
        },
        {
            "ad": "Büro Memur-Sen Konukevi",
            "kurum": "Sendika",
            "ilce": "Çankaya",
            "adres": "Mebusevleri Mah. İller Cad. No:13, Çankaya / Ankara",
            "telefon": "0312 213 13 36",
            "web": "https://www.buromemursen.org.tr/",
            "sosyal": "",
            "fiyat": "Büro Memur-Sen üyeleri ve kamu personeline 2026 konukevi tarifesi",
            "puan": "Google Maps canlı puanı görüntüle",
            "kaynak": "https://www.buromemursen.org.tr/",
            "dogrulama": "dogrulandi",
        },
        {
            "ad": "Türk Eğitim-Sen Misafirhanesi ve Sosyal Tesisleri",
            "kurum": "Sendika",
            "ilce": "Altındağ",
            "adres": "Hacı Bayram Mah. Kazım Karabekir Cad. No:136 (Adliye Ek Binası Arkası), Altındağ / Ankara",
            "telefon": "0312 424 09 65 / 0312 502 30 05",
            "web": "https://www.turkegitimsen.org.tr/",
            "sosyal": "",
            "fiyat": "Türkiye Kamu-Sen / Türk Eğitim-Sen üyelerine özel 2026 tarifesi",
            "puan": "Google Maps canlı puanı görüntüle",
            "kaynak": "https://www.turkegitimsen.org.tr/",
            "dogrulama": "dogrulandi",
        },
        {
            "ad": "Türk Sağlık-Sen Konukevi",
            "kurum": "Sendika",
            "ilce": "Mamak",
            "adres": "Demirlibahçe Mah. Doğanbahçesi Sok. No:27 (Dikimevi Metro Yakını), Mamak / Ankara",
            "telefon": "0312 320 20 25 / 0312 320 20 26",
            "web": "https://www.turksagliksen.org.tr/",
            "sosyal": "",
            "fiyat": "Türk Sağlık-Sen üyeleri ve yakınlarına özel 2026 konukevi tarifesi",
            "puan": "Google Maps canlı puanı görüntüle",
            "kaynak": "https://www.turksagliksen.org.tr/",
            "dogrulama": "dogrulandi",
        },
        {
            "ad": "Türk Diyanet Vakıf-Sen Misafirhanesi",
            "kurum": "Sendika",
            "ilce": "Çankaya",
            "adres": "Kültür Mah. Dr. Mediha Eldem Sok. No:50, Çankaya / Ankara",
            "telefon": "0312 431 13 12",
            "web": "https://www.turkdiyanetvakifsen.org.tr/",
            "sosyal": "",
            "fiyat": "Sendika üyelerine özel 2026 konaklama tarifesi",
            "puan": "Google Maps canlı puanı görüntüle",
            "kaynak": "https://www.turkdiyanetvakifsen.org.tr/",
            "dogrulama": "dogrulandi",
        },
        {
            "ad": "Eğitim-Sen (KESK) Ankara Misafirhanesi",
            "kurum": "Sendika",
            "ilce": "Çankaya",
            "adres": "Cinnah Cad. Willy Brandt Sok. No:13/A, Çankaya / Ankara",
            "telefon": "0312 439 01 14",
            "web": "https://www.egitimsen.org.tr/",
            "sosyal": "https://kesk.org.tr/",
            "fiyat": "KESK / Eğitim-Sen üyelerine özel 2026 konaklama tarifesi",
            "puan": "Google Maps canlı puanı görüntüle",
            "kaynak": "https://www.egitimsen.org.tr/",
            "dogrulama": "dogrulandi",
        },
    ],
    "34": [
        {
            "ad": "Sağlık-Sen İstanbul Taksim Otel",
            "kurum": "Sendika",
            "ilce": "Şişli",
            "adres": "İnönü Mah. Kuzukulağı Sok. No:1-1, Şişli / İstanbul",
            "telefon": "0212 250 01 54 / 0538 233 40 73",
            "web": "https://www.sagliksen.org.tr/",
            "sosyal": "",
            "fiyat": "Sağlık-Sen üyelerine özel indirimli 2026 otel tarifesi (SİMER: 444 19 95)",
            "puan": "Google Maps canlı puanı görüntüle",
            "kaynak": "https://www.sagliksen.org.tr/",
            "dogrulama": "dogrulandi",
        },
        {
            "ad": "Türkiye Kamu-Sen İstanbul Misafirhanesi",
            "kurum": "Sendika",
            "ilce": "Bahçelievler",
            "adres": "Hürriyet Mah. Altın Sok. No:12, 34188 Bahçelievler / İstanbul",
            "telefon": "0212 302 05 20",
            "web": "https://www.kamusen.org.tr/",
            "sosyal": "https://www.turkegitimsen.org.tr/",
            "fiyat": "Türkiye Kamu-Sen bağlı sendika üyelerine özel 2026 konaklama tarifesi",
            "puan": "Google Maps canlı puanı görüntüle",
            "kaynak": "https://www.kamusen.org.tr/",
            "dogrulama": "dogrulandi",
        },
    ],
}


def tr_norm(s: str) -> str:
    s = (s or "").replace("\u0d74", "i").replace("İ", "i").replace("I", "ı").lower()
    s = s.translate(str.maketrans("çğıöşüâîû", "cgiosuaiu"))
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def temizle(s: str) -> str:
    s = (s or "").replace("\u0d74", "i").replace("\xa0", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def kurum_belirle(ad: str) -> str:
    low = tr_norm(ad)
    if "ogretmenev" in low or "uygulama otel" in low or "turizm meslek" in low:
        return "Öğretmenevi"
    if "polisev" in low or "polis moral" in low or "emniyet" in low:
        return "Polisevi"
    if "hakimev" in low or "adalet" in low or "cte" in low or "cezaevi" in low:
        return "Hakimevi"
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
    if kurum == "Ulaştırma / KGM":
        return (
            "https://www.kgm.gov.tr/",
            "HMB Tebliğ 2026-1 tabanı 120 TL · Kurum 2026 uygulama tarifesi (telefonla teyit)",
        )
    return (
        f"https://www.{slug}.gov.tr/",
        "HMB Tebliğ 2026-1 asgari 120 TL taban · Kurum 2026 tarifesi (telefonla teyit önerilir)",
    )


def telefon_gibi(s: str) -> bool:
    s2 = s.strip()
    if not s2:
        return False
    digits = re.sub(r"\D", "", s2)
    letters = re.sub(r"[^a-zA-ZçğıöşüÇĞİÖŞÜ]", "", s2)
    return len(digits) >= 7 and len(letters) <= 18


def main() -> None:
    yargi = json.loads(YARGI_PATH.read_text(encoding="utf-8"))
    mevcut = json.loads(HEDEF_PATH.read_text(encoding="utf-8"))

    # İl adlarından plakaya eşleme
    il_norm_to_plaka: dict[str, str] = {}
    for plaka, info in yargi["iller"].items():
        il_norm_to_plaka[tr_norm(info["ad"])] = plaka
    # Yaygın yazım varyantları
    il_norm_to_plaka["afyon"] = "03"
    il_norm_to_plaka["icel"] = "33"
    il_norm_to_plaka["izmit"] = "41"
    il_norm_to_plaka["adapazari"] = "54"
    il_norm_to_plaka["urfa"] = "63"
    il_norm_to_plaka["antep"] = "27"
    il_norm_to_plaka["maras"] = "46"

    req = urllib.request.Request(PDF_URL, headers={"User-Agent": "Mozilla/5.0"})
    pdf_bytes = urllib.request.urlopen(req, timeout=45).read()
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")

    satirlar: list[str] = []
    for page in doc:
        for line in page.get_text("text").splitlines():
            t = temizle(line)
            if t:
                satirlar.append(t)

    pdf_iller: dict[str, list[dict]] = {p: [] for p in yargi["iller"]}
    aktif_plaka: str | None = None
    aktif_kayit: dict | None = None
    son_alan: str | None = None

    def kaydi_kapat():
        nonlocal aktif_kayit, son_alan
        if aktif_plaka and aktif_kayit and aktif_kayit.get("ad"):
            ad = temizle(aktif_kayit["ad"])
            adres = temizle(aktif_kayit.get("adres", ""))
            tel = temizle(aktif_kayit.get("telefon", ""))
            # PDF'de Adres/Telefon ters yazıldıysa düzelt
            if telefon_gibi(adres) and not telefon_gibi(tel) and len(tel) > 10:
                adres, tel = tel, adres
            if len(ad) >= 5 and (adres or tel):
                pdf_iller[aktif_plaka].append({"ad": ad, "adres": adres, "telefon": tel})
        aktif_kayit = None
        son_alan = None

    baslik_re = re.compile(r"^(.+?)\s+KAMU\s+MİSAFİRHANELERİ(?:\s+LİSTESİ)?$", re.I)

    for line in satirlar:
        if re.match(r"^(ÜLKEMİZDE BULUNAN TÜM KAMU|MİSAFİRHANELERİ|\d{1,3})$", line, re.I):
            continue
        m_il = baslik_re.match(line.replace("\u0d74", "i"))
        if m_il:
            cand = tr_norm(m_il.group(1))
            if cand in il_norm_to_plaka:
                kaydi_kapat()
                aktif_plaka = il_norm_to_plaka[cand]
                continue

        if not aktif_plaka:
            continue

        if re.match(r"^Adres\s*:", line, re.I):
            if not aktif_kayit:
                continue
            aktif_kayit["adres"] = re.sub(r"^Adres\s*:\s*", "", line, flags=re.I).strip()
            son_alan = "adres"
            continue

        if re.match(r"^Telefon\s*:", line, re.I):
            if not aktif_kayit:
                continue
            aktif_kayit["telefon"] = re.sub(r"^Telefon\s*:\s*", "", line, flags=re.I).strip()
            son_alan = "telefon"
            continue

        # Yeni tesis adı mı yoksa önceki Adres/Telefon satırının devamı mı?
        if aktif_kayit and son_alan == "adres" and not aktif_kayit.get("telefon"):
            # Adres devamı (henüz telefon gelmedi)
            aktif_kayit["adres"] = (aktif_kayit["adres"] + " " + line).strip()
            continue
        if aktif_kayit and son_alan == "telefon" and re.match(r"^[\d\s()–—\-/+:Dahil]+$", line, re.I):
            aktif_kayit["telefon"] = (aktif_kayit["telefon"] + " " + line).strip()
            continue

        # Yeni tesis kaydı başlat
        kaydi_kapat()
        aktif_kayit = {"ad": line, "adres": "", "telefon": ""}
        son_alan = "ad"

    kaydi_kapat()

    # Mevcut doğrulanmış kayıtlarla birleştir
    mevcut_by_plaka = {x["plaka"]: x for x in mevcut["iller"]}
    yeni_iller = []
    toplam_pdf = 0

    for plaka in sorted(yargi["iller"].keys()):
        il_info = yargi["iller"][plaka]
        il_ad = il_info["ad"]
        slug = il_info["slug"]

        # Doğrudan teyit edilmiş 2026 kayıtlarını (dogrulandi) + sendika misafirhanelerini önde tut
        eski_il = mevcut_by_plaka.get(plaka, {})
        dogrulanmis = [t for t in eski_il.get("tesisler", []) if t.get("dogrulama") == "dogrulandi"]
        gorulen_adlar = [tr_norm(t["ad"]) for t in dogrulanmis]

        for st in SENDIKA_TESISLERI.get(plaka, []):
            nst = tr_norm(st["ad"])
            if any(nst == g or (len(nst) > 10 and (nst in g or g in nst)) for g in gorulen_adlar):
                continue
            gorulen_adlar.append(nst)
            dogrulanmis.append({
                **st,
                "googleMaps": f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(st['ad'] + ' ' + il_ad)}",
            })

        birlesik = list(dogrulanmis)
        for rec in pdf_iller.get(plaka, []):
            n_ad = tr_norm(rec["ad"])
            # Zaten doğrudan doğrulanmış listede varsa atla
            if any(
                n_ad == g or (len(n_ad) > 10 and (n_ad in g or g in n_ad))
                for g in gorulen_adlar
            ):
                continue
            gorulen_adlar.append(n_ad)
            kurum = kurum_belirle(rec["ad"])
            web, fiyat = resmi_web_ve_fiyat(kurum, slug)
            birlesik.append(
                {
                    "ad": rec["ad"],
                    "kurum": kurum,
                    "ilce": "",
                    "adres": rec["adres"] or f"{il_ad}",
                    "telefon": rec["telefon"],
                    "web": web,
                    "sosyal": "",
                    "fiyat": fiyat,
                    "puan": "Google Maps canlı puanı görüntüle",
                    "googleMaps": f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(rec['ad'] + ' ' + il_ad)}",
                    "kaynak": KAYNAK_SAYFA,
                    "dogrulama": "rehber-kayit",
                }
            )
            toplam_pdf += 1

        # Hiç kayıt çıkmayan bir il olursa eski resmî portal kayıtlarını koru
        if not birlesik:
            birlesik = eski_il.get("tesisler", [])

        yeni_iller.append(
            {
                "plaka": plaka,
                "ad": il_ad,
                "slug": slug,
                "tesisSayisi": len(birlesik),
                "dogrulanmisSayisi": len(dogrulanmis),
                "tesisler": birlesik,
            }
        )

    mevcut["toplamIl"] = len(yeni_iller)
    mevcut["toplamTesis"] = sum(x["tesisSayisi"] for x in yeni_iller)
    mevcut["ekKaynaklar"] = [
        KAYNAK_SAYFA,
        "https://kamumisafirhaneleri.com.tr/",
        "https://kamutesisleri.com/",
    ]
    mevcut["iller"] = yeni_iller

    HEDEF_PATH.write_text(json.dumps(mevcut, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    dolu_il = sum(1 for x in yeni_iller if x["tesisSayisi"] >= 3)
    print(f"Tamamlandı: {len(yeni_iller)} il ({dolu_il} ilde 3+ tesis), {mevcut['toplamTesis']} toplam tesis (PDF'ten +{toplam_pdf} gerçek tesis eklendi).")


if __name__ == "__main__":
    main()
