"""Resmî PDF arşivinden yapılandırılmış hüküm bilgisi çıkarır.

Kullanım: python scripts/bilirkisi-hukum-verisi.py PDF_KLASORU
PDF dosya adları arşiv kimliğiyle eşleşir. Çıktı JSON Lines olarak stdout'a yazılır.
"""
import argparse
from bisect import bisect_right
import json
from pathlib import Path
import re

import pymupdf


ROOT = Path(__file__).resolve().parents[1]
HEADING = re.compile(
    r"(?im)(?:^[ \t]*(?:[IVX]+\.[ \t]*)?(?:k\s*a\s*r\s*a\s*r|h\s*ü\s*k\s*ü\s*m|sonuç\s+ve\s+karar)[ \t]*(?:[:;]|$)|\bk a r a r\s*[:;]\s*(?=gerekçesi))"
)
UNHEADED = re.compile(r"(?im)^\s*kararın\b[^\n]{0,180}\btebliğine[,;]")
DISPOSITIONS = {
    "uyarma": r"\b(?:uyarıl(?:masına|malarına)|uyarma\s+(?:disiplin\s+)?(?:yaptırımı(?:nın)?|cezası(?:nın)?)\s+(?:uygulanmasına|verilmesine|ile\s+cezalandırıl(?:masına|malarına)))\b",
    "cikarma": r"\b(?:çıkar(?:ıl|tıl)(?:masına|malarına)|çıkarma\s+(?:idar[iî]\s+)?yaptırımının\s+uygulanmasına|çıkarılma\s+cezası\s+verilmesine|çıkarma\s+cezası\s+ile\s+cezalandırıl(?:masına|malarına))\b",
    "yasak": r"\byasaklan(?:masına|malarına)\b",
    "itiraz-ret": r"\bitiraz(?:ın|ının|larının)(?:\s+(?:kesin olarak|ayrı ayrı))?\s+reddine\b",
    "yaptirim-yok": r"\b(?:yaptırım|ceza)\s+(?:uygulanmasına|verilmesine)\s+yer\s+olmadığına\b",
}
TERM = re.compile(r"(?<!\d)(\d{1,2})\)?\s*(?:\([^)]+\)\s*)?(ay|yıl)\s+(?:geçici\s+)?süre\s*(?:ile|yle|li)?\b")
LAW = re.compile(r"(?<!\d)13\s*[/.-]\s*1\s*[-/–]\s*\(?([abcçdef](?:\s*[,/-]\s*[abcçdef])*)\b")
DEADLINE = re.compile(r"\b(30|otuz|60|altmış)\s+gün\s+iç(?:inde|erisinde)\b")
REVIEW_WORD = re.compile(r"\bitiraz\s+yolu\s+açık\b|\bitirazda\s+bulun(?:ul)?abilecek(?:lerine|lerine|eğine)\b|\bdava\s+yolu\s+açık\b")

# Elle doğrulanan hüküm fıkraları. Açılıştaki KARAR ibaresi ve önceki
# yaptırımların aktarımı, Antalya belgelerinde hüküm başlangıcı değildir.
REVIEWED = {
    "gecici-cikarma-15-01-2020-2020-12": dict(sonuclar=["gecici"], hukumSayfasi=3, sure="1 ay"),
    "sicilden-cikarma-08-07-2020-2020-99": dict(sonuclar=["cikarma"], hukumSayfasi=3, bentler=["b"]),
    "gecici-cikarma-06-06-2018-2018-182": dict(sonuclar=["yasak", "gecici"], hukumSayfasi=3, sure="3 ay", yasakSuresi="3 ay", bentler=["b"], kanunYolu={"tur": "itiraz", "gun": 30}),
    "gecici-cikarma-11-10-2017-2017-271": dict(sonuclar=["cikarma", "gecici", "yaptirim-yok"], hukumSayfasi=3, sure="6 ay"),
}


def normalized(text):
    return " ".join(text.replace("I", "ı").replace("İ", "i").lower().split())


def extract(pdf, known_duration):
    with pymupdf.open(pdf) as doc:
        pages = [page.get_text(sort=True) for page in doc]
    if not pages:
        return None
    offsets = [0]
    for page in pages:
        offsets.append(offsets[-1] + len(page) + 1)
    content = "\n".join(pages)
    headings = list(HEADING.finditer(content))
    result = {"sayfaSayisi": len(pages)}
    notices = list(UNHEADED.finditer(content)) if not headings else []
    if not headings and not notices:
        if known_duration:
            result.update(sonuclar=["gecici"], sure=known_duration)
        return result

    last = headings[-1] if headings else notices[-1]
    start = last.end() if headings else max(0, last.start() - 475)
    text = normalized(content[start:])
    disposition = text if headings else normalized(content[start:last.start()])
    outcomes = {}
    durations = set()
    for kind, pattern in DISPOSITIONS.items():
        for match in re.finditer(pattern, disposition):
            # Bağlamı önceki sonuç maddesine taşımadan yalnız ilgili ifadeye bak.
            prefix = re.split(r"[,;]|\b\d{1,2}\s*[-)]", disposition[max(0, match.start() - 155):match.start()])[-1]
            # Alıntılanan kural ve önceki kararlardaki sonuçlar yeni hüküm sayılmaz.
            suffix = disposition[match.end():match.end() + 70]
            if re.match(r"\s*(?:ilişkin|yönelik|yerine|dair verilen|karşı)", suffix):
                continue
            if kind == "yasak" and not re.search(r"bilirkişilik\s+yapmaktan|bilirkişilikten", prefix):
                continue
            if kind == "cikarma" and not re.search(r"liste|sicil", prefix):
                continue
            result_kind = kind
            duration = TERM.search(prefix)
            if kind == "cikarma" and ("geçici" in prefix or duration):
                result_kind = "gecici"
            outcomes.setdefault(result_kind, match.start())
            if result_kind in ("gecici", "yasak") and duration:
                durations.add((result_kind, " ".join(duration.groups())))
    if "itiraz-ret" in outcomes:
        # İtiraz reddi çıkmışsa ilk kararın anılması yeni yaptırım olarak sunulmaz.
        outcomes = {"itiraz-ret": outcomes["itiraz-ret"]}
    if not outcomes and known_duration:
        outcomes["gecici"] = 0
    if outcomes:
        result["sonuclar"] = sorted(outcomes, key=outcomes.get)
        if headings:
            result["hukumSayfasi"] = bisect_right(offsets, last.start())
    if "gecici" in outcomes and known_duration:
        result["sure"] = known_duration
    elif len(outcomes) == 1 and len(durations) == 1:
        kind, duration = next(iter(durations))
        # Parantez içi yazıyla rakamın çelişebildiği yasak sürelerinde elle doğrulama gerekir.
        if kind == "gecici" and kind in outcomes:
            result["sure"] = duration

    if outcomes and "itiraz-ret" not in outcomes:
        legal = sorted({letter for match in LAW.findall(disposition) for letter in re.findall(r"[abcçdef]", match)})
        if legal:
            result["bentler"] = legal
    # İtiraz ve dava sürelerini yalnız hükmün kanun yolu bildiriminden al.
    for match in REVIEW_WORD.finditer(text):
        prefix = text[max(0, match.start() - 480):match.start()]
        deadline = list(DEADLINE.finditer(prefix))
        if deadline:
            days = deadline[-1].group(1)
            result["kanunYolu"] = {
                "tur": "dava" if "dava yolu" in match.group() else "itiraz",
                "gun": 30 if days in ("30", "otuz") else 60,
            }
            break
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf_klasoru", type=Path)
    args = parser.parse_args()
    data = ROOT / "src" / "data"
    cases = json.loads((data / "bilirkisi-kararlari.json").read_text(encoding="utf-8"))
    durations = json.loads((data / "bilirkisi-kararlari-sureler.json").read_text(encoding="utf-8"))
    for case in cases:
        key = case["id"]
        result = extract(args.pdf_klasoru / f"{key}.pdf", durations.get(key))
        if result is not None:
            result.update(REVIEWED.get(key, {}))
            print(json.dumps([key, result], ensure_ascii=False))


if __name__ == "__main__":
    main()
