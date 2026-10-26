#!/usr/bin/env python3
"""Ergänzt neue Fragen einer Wahl in public/fragen.json, ohne vorhandene Fragen anzufassen (Issue #1, Ausgewogenheit).
Aufruf: npm run ergaenzen -- <wahl-id> [--schreiben] [--nur id1,id2]   (ohne --schreiben nur Bericht)
Arbeitsordner: .cache/landtagswahlen/<wahl> (nicht eingecheckt) mit den Programmen als PDF und Textauszügen
(`pdftotext -layout` als <kurz>.txt, `pdftotext` als <kurz>_lese.txt; bei Spaltensatz zusätzlich _sp.txt oder _raw.txt),
neue-fragen.json ({id: {frage, beschreibung}}) und je Partei neu-<kurz>.json nach scripts/recherche/anleitung.md.
Parteien, IDs und Programm-Adressen kommen aus fragen.json. Jedes Zitat muss wörtlich im Programmtext stehen."""
import json, re, sys, os, difflib
ziel = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'fragen.json'))
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.cache', 'landtagswahlen'))
wahl_id = sys.argv[1]
schreiben = '--schreiben' in sys.argv
nur = set(sys.argv[sys.argv.index('--nur') + 1].split(',')) if '--nur' in sys.argv else None
ORDNER = {'be26': 'berlin26'}.get(wahl_id, wahl_id)
DATEI = {'Union': 'cdu', 'CDU': 'cdu', 'SPD': 'spd', 'Grüne': 'gruene', 'FDP': 'fdp', 'AfD': 'afd', 'Linke': 'linke',
         'BSW': 'bsw', 'Freie Wähler': 'fw', 'Volt': 'volt'}

datei = json.load(open(ziel))
wahl = next(w for w in datei['wahlen'] if w['id'] == wahl_id)
parteien = [(DATEI[p['kurzname']], p['kurzname'], p['id'], p['programm_url']) for p in wahl['parteien']]
FRAGEN = json.load(open(f'{ORDNER}/neue-fragen.json'))

norm = lambda s: re.sub(r'\s+', ' ', s.replace('\xad', '').replace('-\n', '')).strip()
glatt = lambda s: re.sub(r'[‐‑‒–­]', '-', re.sub(r'[„“"»«]', '"', s))
def lesarten(roh): return norm(roh) + ' \n ' + norm(roh.replace('-\n', '-\u0001')).replace('\u0001', '')
EXTRAKTIONEN = ('.txt', '_lese.txt', '_raw.txt', '_ocr.txt', '_sp.txt')
def text(d):
    t = ''
    for e in EXTRAKTIONEN:
        f = f'{ORDNER}/{d}{e}'
        if os.path.exists(f): t += ' \n ' + lesarten(open(f, encoding='utf8', errors='replace').read())
    return glatt(t)
texte = {d: text(d) for d, _, _, _ in parteien}

def reparieren(z, d, seite):
    worte = glatt(norm(z)).split(' '); n = len(worte); best = (0, None)
    for e in EXTRAKTIONEN:
        f = f'{ORDNER}/{d}{e}'
        if not os.path.exists(f): continue
        seiten = open(f, encoding='utf8', errors='replace').read().split('\f')
        if seite - 1 >= len(seiten): continue
        for roh in (seiten[seite - 1], seiten[seite - 1] + ' ' + (seiten[seite] if seite < len(seiten) else '')):
            tw = glatt(norm(roh)).split(' ')
            for i in range(0, max(1, len(tw) - n + 4)):
                for m in (n - 2, n - 1, n, n + 1, n + 2):
                    k = ' '.join(tw[i:i + m])
                    if not k: continue
                    q = difflib.SequenceMatcher(None, k, ' '.join(worte)).ratio()
                    if q > best[0]: best = (q, k)
    if best[0] < 0.88: return None
    def teilfolge(a, b):
        it = iter(b); return all(c in it for c in a)
    a, b = re.sub(r'\s', '', ' '.join(worte)), re.sub(r'\s', '', best[1])
    if teilfolge(b, a) or teilfolge(a, b): return ' '.join(worte)
    return best[1]

def woertlich(z, t):
    z = glatt(z)
    if z in t: return True
    w = z.split(' ')
    if any(' '.join(w[:i]) in t and ' '.join(w[i:]) in t for i in range(3, len(w) - 2)): return True
    if len(w) < 6: return False
    return all(' '.join(w[i:i + 6]) in t for i in range(len(w) - 5))

# Manche Extraktionen verdrehen Umlaute (rp26/fdp: „Ründfünk“). Dann zählt der Abgleich ohne Umlautzeichen; der
# Wortlaut der Recherche (aus dem PDF) bleibt erhalten.
# Ebenso fehlende Ligaturen (mv26/bsw: „Selbstbes mmungsgesetz“, bw26/volt: „Ö nungsfenster“): ff, fi, fl, ti und
# Leerraum fallen beim Abgleich weg.
falten = lambda s: re.sub(r'\s+|ffi|ffl|ff|fi|fl|ft|tt|ti', '', s.translate(str.maketrans('äöüÄÖÜ', 'aouAOU')))
gefaltet = {d: falten(t) for d, t in texte.items()}

recherche = {d: json.load(open(f'{ORDNER}/neu-{d}.json'))['positionen'] for d, _, _, _ in parteien if os.path.exists(f'{ORDNER}/neu-{d}.json')}
fehlend = [k for d, k, _, _ in parteien if d not in recherche]
if fehlend: print('Fehlende Recherche:', fehlend)

vorhandene_ids = {f['id'] for f in datei['fragen']}
neu, bericht, repariert = [], [], []
for fid, ft in FRAGEN.items():
    if nur and fid not in nur: continue
    positionen, probleme = [], []
    for d, k, pid, url in parteien:
        r = (recherche.get(d) or {}).get(fid)
        if not r: probleme.append(f'{k}: keine Recherche'); continue
        pos = r.get('position')
        if pos not in ('ja', 'nein', 'teils', 'keine_aussage'): probleme.append(f'{k}: Position „{pos}“'); continue
        if pos == 'keine_aussage':
            positionen.append({'partei_id': pid, 'position': pos, 'kurzfassung': None, 'zitat': None, 'beleg_url': None,
                               'begruendung': r.get('begruendung') or 'Programm durchsucht, keine Aussage gefunden.'}); continue
        m = re.search(r'#page=(\d+)$', r.get('beleg_url') or '')
        if not m: probleme.append(f'{k}: beleg_url ohne Seite'); continue
        beleg = f'{url}#page={m.group(1)}'
        z = norm(r.get('zitat') or ''); zitat = (r.get('zitat') or '').strip()
        if z and not woertlich(z, texte[d]) and falten(glatt(z)) in gefaltet[d]:
            repariert.append(f'{fid} {k} (Umlaute/Ligaturen)')
        elif not z or not woertlich(z, texte[d]):
            ersatz = reparieren(z, d, int(m.group(1)))
            if not ersatz: probleme.append(f'{k}: Zitat nicht wörtlich gefunden'); continue
            zitat = ersatz; repariert.append(f'{fid} {k}')
        positionen.append({'partei_id': pid, 'position': pos, 'kurzfassung': r.get('kurzfassung'), 'zitat': zitat,
                           'beleg_url': beleg, 'begruendung': None})
    ja = [k for d, k, pid, _ in parteien if any(p['partei_id'] == pid and p['position'] == 'ja' for p in positionen)]
    teils = [k for d, k, pid, _ in parteien if any(p['partei_id'] == pid and p['position'] == 'teils' for p in positionen)]
    ratbar = any(p['position'] in ('nein', 'keine_aussage') for p in positionen)
    if fid in vorhandene_ids: probleme.append('id schon vergeben')
    ok = not probleme and ja and ratbar
    bericht.append(f"{'✓' if ok else '✗'} {fid} {ft['frage']}\n    Ja: {', '.join(ja) or '–'}"
                   f"{'  · teils: ' + ', '.join(teils) if teils else ''}  {'; '.join(probleme)}"
                   f"{'' if ja else ' keine Ja-Partei'}{'' if ratbar else ' nicht ratbar'}")
    if ok:
        neu.append({'id': fid, 'wahl': wahl_id, 'frage': ft['frage'], 'beschreibung': ft['beschreibung'], 'ki_entwurf': True,
                    'positionen': positionen, 'zielkonflikte': []})
print('\n'.join(bericht)); print('repariert:', ', '.join(repariert) or '–')
print(f'{wahl_id}: {len(neu)} von {len(FRAGEN) if not nur else len(nur)} neuen Fragen übernehmbar')
if schreiben and neu:
    # Neue Fragen direkt hinter die letzte Frage ihrer Wahl, damit die Datei nach Wahlen geordnet bleibt.
    letzte = max(i for i, f in enumerate(datei['fragen']) if f['wahl'] == wahl_id)
    datei['fragen'][letzte + 1:letzte + 1] = neu
    open(ziel, 'w').write(json.dumps(datei, ensure_ascii=False, indent=2) + '\n')
    print('geschrieben:', ziel)
