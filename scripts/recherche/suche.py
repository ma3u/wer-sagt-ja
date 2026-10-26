#!/usr/bin/env python3
"""Sucht in einem Programmtext (pdftotext -layout, Seiten durch \f getrennt) nach einem regulären Ausdruck
und zeigt Treffer mit Seitenzahl und Umgebung. Aufruf: python3 -I suche.py <partei> '<regex>' [zeichen=400]"""
import re, sys
partei, muster = sys.argv[1], sys.argv[2]
rand = int(sys.argv[3]) if len(sys.argv) > 3 else 400
seiten = open(f'{partei}.txt', encoding='utf8').read().split('\f')
n = 0
for nr, text in enumerate(seiten, 1):
    flach = re.sub(r'[ \t]+', ' ', text)
    for m in re.finditer(muster, flach, re.I):
        n += 1
        a, b = max(0, m.start() - rand), min(len(flach), m.end() + rand)
        print(f'=== Seite {nr} ===')
        print(flach[a:b].strip())
        print()
        if n >= 25:
            print('… (mehr als 25 Treffer, Muster eingrenzen)'); sys.exit(0)
print(f'{n} Treffer')
