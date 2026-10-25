"""Bias-Analyse für fragen.json von „Wer sagt Ja?“.

Aufruf: python3 scripts/ausgewogenheit.py <pfad/zu/fragen.json> <ausgabe.json>
"""
import json
import sys
from collections import Counter, defaultdict

src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src, encoding="utf-8"))

# Partei-ID -> (Wahl, Kurzname); Union/CDU zusammenführen
pname = {}
for w in d["wahlen"]:
    for p in w["parteien"]:
        k = p["kurzname"]
        if k == "Union":
            k = "CDU/CSU"
        if k == "CDU":
            k = "CDU/CSU"
        pname[p["id"]] = (w["id"], k)

LINKS = {"SPD", "Grüne", "Linke"}
RECHTS = {"CDU/CSU", "FDP", "AfD"}

# 1) Verteilung je Partei (über alle Wahlen)
agg = defaultdict(Counter)
agg_w = defaultdict(lambda: defaultdict(Counter))
for f in d["fragen"]:
    for p in f["positionen"]:
        wahl, k = pname[p["partei_id"]]
        agg[k][p["position"]] += 1
        agg_w[wahl][k][p["position"]] += 1

def quoten(c):
    n = sum(c.values())
    aussage = n - c["keine_aussage"]
    return {
        "n": n,
        "ja": c["ja"],
        "nein": c["nein"],
        "teils": c["teils"],
        "keine_aussage": c["keine_aussage"],
        "ja_quote_alle": round(c["ja"] / n, 3) if n else None,
        "ja_quote_mit_aussage": round(c["ja"] / aussage, 3) if aussage else None,
        "keine_aussage_quote": round(c["keine_aussage"] / n, 3) if n else None,
    }

parteien = {k: quoten(c) for k, c in agg.items()}

# 2) Richtung je Frage: Ja-Anteil links minus Ja-Anteil rechts
#    (nur Parteien mit Aussage; teils = 0,5)
WERT = {"ja": 1.0, "teils": 0.5, "nein": 0.0}
fragen = []
for f in d["fragen"]:
    blk = {"links": [], "rechts": []}
    ja_parteien = []
    for p in f["positionen"]:
        _, k = pname[p["partei_id"]]
        if p["position"] == "ja":
            ja_parteien.append(k)
        if p["position"] in WERT:
            if k in LINKS:
                blk["links"].append(WERT[p["position"]])
            elif k in RECHTS:
                blk["rechts"].append(WERT[p["position"]])
    if blk["links"] and blk["rechts"]:
        r = sum(blk["links"]) / len(blk["links"]) - sum(blk["rechts"]) / len(blk["rechts"])
    else:
        r = None
    fragen.append({
        "id": f["id"], "wahl": f["wahl"], "frage": f["frage"],
        "richtung": None if r is None else round(r, 2),
        "ja_parteien": ja_parteien,
    })

def klasse(r):
    if r is None:
        return "nicht bestimmbar"
    if r >= 0.5:
        return "Ja eher links"
    if r <= -0.5:
        return "Ja eher rechts"
    return "gemischt/quer"

verteilung = Counter(klasse(x["richtung"]) for x in fragen)
verteilung_w = defaultdict(Counter)
for x in fragen:
    verteilung_w[x["wahl"]][klasse(x["richtung"])] += 1

# 3) Wie oft sagt eine Partei als Einzige bzw. gemeinsam mit nur einem Block Ja?
allein = Counter()
for x in fragen:
    if len(x["ja_parteien"]) == 1:
        allein[x["ja_parteien"][0]] += 1

json.dump({
    "parteien": parteien,
    "parteien_je_wahl": {w: {k: quoten(c) for k, c in v.items()} for w, v in agg_w.items()},
    "verteilung": verteilung,
    "verteilung_je_wahl": verteilung_w,
    "allein_ja": allein,
    "fragen": sorted(fragen, key=lambda x: (x["richtung"] is None, -(x["richtung"] or 0))),
}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
