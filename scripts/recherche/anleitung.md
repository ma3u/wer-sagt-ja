Arbeite nur lokal mit Bash im Ordner .cache/landtagswahlen/<wahl>. Schreibe genau eine Datei: `neu-<kurz>.json` in diesem Ordner. Nichts anderes ändern, nichts herunterladen.

Programm: <Partei> (<Wahl>). Programmtext: `<kurz>.txt` (Layout, Seiten durch Seitenvorschub \f getrennt; Seite N im Text = Seite N im PDF) und `<kurz>_lese.txt` (Lesereihenfolge, für mehrspaltige Seiten). Suchhelfer mit Seitenzahl: `python3 -I ../../../scripts/recherche/suche.py <kurz> '<regex>' [zeichen]`, z. B. `python3 -I ../../../scripts/recherche/suche.py <kurz> 'Tempo 30' 300`. Suche je Frage mit mehreren Begriffen und Wortstämmen (Synonyme!) und lies die Treffer im Zusammenhang (grep/sed erlaubt).

Die Fragen stehen in `neue-fragen.md` (die neuen IDs). Bestimme für JEDE dieser Fragen die Position des Programms:
- "ja": Das Programm fordert oder unterstützt das Gefragte klar.
- "nein": Das Programm lehnt es klar ab (oder fordert klar das Gegenteil).
- "teils": nur mit Einschränkung/Bedingung oder in Teilen.
- "keine_aussage": Das Programm sagt dazu nichts – dann in "begruendung" eintragen, welche Begriffe und Kapitel durchsucht wurden.

Regeln:
- Niemals aus allgemeiner Parteilinie oder Vorwissen ableiten – nur aus dem Text dieses Programms.
- Achte genau auf den Wortlaut der Frage. Die Fragen sind so gestellt, dass Ja eine bestimmte Forderung bedeutet; eine Ablehnung dieser Forderung ist "nein", nicht "ja".
- "zitat" muss WÖRTLICH im Text stehen: ein oder zwei zusammenhängende Sätze, höchstens ca. 350 Zeichen; Zeilenumbrüche entfernen, Silbentrennung am Zeilenende zusammenfügen, sonst nichts ändern.
- "beleg_url" = "<kurz>.pdf#page=N" mit der Seite des Zitats (Seite aus der Layout-Datei).
- "kurzfassung": ein neutraler Satz in eigenen Worten, was das Programm will.
- Bei "keine_aussage": zitat, beleg_url, kurzfassung = null.
- Prüfe vor dem Schreiben jedes Zitat mit grep (Teilstring aus mehreren Wörtern), dass es wörtlich im Text steht.

Ergebnis als JSON-Datei `neu-<kurz>.json`:
{"partei":"<Partei>","datei":"<kurz>.txt","positionen":{"<frage-id>":{"position":"ja|nein|teils|keine_aussage","kurzfassung":"…"|null,"zitat":"…"|null,"beleg_url":"<kurz>.pdf#page=N"|null,"begruendung":"…"|null,"anmerkung":"optional, bei unsicheren Fällen"}, …}}

Antworte am Ende nur kurz: je Frage die Position in einer Zeile, plus unsichere Fälle.
