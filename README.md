# Wer sagt Ja?

![Wer sagt Ja? – Das Quiz zu den Wahlprogrammen](public/vorschau.gif)

Ein Quiz zu Wahlprogrammen für bis zu acht Personen – zur Bundestagswahl 2025, weitere Wahlen (Landtagswahlen)
kommen als eigene Kataloge dazu. Eine Frage, alle Parteien: Wer sagt im Programm Ja? Wer richtig liegt, bekommt
Punkte – wer schneller ist, mehr. Nach jeder Frage zeigt das Spiel für alle Parteien die Stelle im Programm mit
Wortlaut, Seite und Link.

Punkte gibt es fürs Wissen über Programme, nie für eine eigene Meinung. Keine Konten, keine Datenbank, keine KI im
Spiel: Das Spiel läuft zwischen den Browsern der Mitspielenden.

## Spielen

- **Alleine** üben, **mit Freunden** in einem Raum mit merkbarem Namen (Einladung per Link oder QR-Code) oder
  **mit Fremden** in einem öffentlichen Raum.
- Bis zu acht Fragen je Spiel, Einzel- oder Mehrfachauswahl, Zeit je Frage einstellbar (20 s, 40 s, ohne Limit).
- Zwei Moderatoren (KI-Stimmen, vorab aufgenommen) begleiten die Show; der Ton ist abschaltbar, alle Ansagen stehen
  auch als Text auf der Seite.

## Fragen pflegen

Alle Fragen stehen in `public/fragen.json` und werden hier gepflegt. Die Datei hat zwei Listen: `wahlen` und
`fragen`. Je Wahl:

| Feld | Inhalt |
| --- | --- |
| `id` | Stabile Kennung aus Kleinbuchstaben und Ziffern, etwa `btw25` oder `be26` – steht in Adressen (`#/be26/fragen`) |
| `name`, `kurz`, `datum` | Voller Name („Bundestagswahl 2025“), Kurzform für Knöpfe („Bund 2025“), Wahltag als ISO-Datum |
| `parteien` | Die Parteien dieser Wahl mit `id`, `name`, `kurzname`, `farbe` und `programm_url` – jede Wahl hat ihre eigene Liste. Leer für einen Platzhalter (vergangene Wahl ohne erfasste Programme oder kommende Wahl): steht in der Auswahl, ist aber nicht spielbar |

Die erste Wahl der Datei ist die Standardwahl: Sie gilt für Adressen ohne Wahl (`#/fragen`), alte Links bleiben so
gültig. Mit mehr als einer Wahl zeigt die Startseite eine Auswahl; ein Raum spielt immer die Wahl der Spielleitung,
Gäste folgen automatisch. Je Frage:

| Feld | Inhalt |
| --- | --- |
| `id` | Stabile Kennung, über alle Wahlen eindeutig, nie ändern – die Aufnahmen heißen danach (`frage-<id>.mp3`, `loesung-<id>.mp3`); neue Wahlen bekommen ein Präfix (`be-1`) |
| `wahl` | Kennung der Wahl, zu der die Frage gehört |
| `frage`, `beschreibung` | Klare Ja/Nein-Frage mit Fragezeichen – zuspitzen ist erwünscht (siehe „Ausgewogenheit“) – und eine Erläuterung, die den heutigen Stand nennt |
| `positionen` | Genau eine je Partei der Wahl: `ja`, `nein`, `teils` oder `keine_aussage`. Ja, Nein und teils immer mit wörtlichem `zitat` und `beleg_url` (Seite im Programm), keine Aussage mit `begruendung`, was durchsucht wurde |
| `zielkonflikte` | Argumente beider Seiten mit Quelle (optional, leere Liste) |
| `ki_entwurf` | `true`, solange die Positionen nicht von Menschen geprüft sind – das Spiel sagt das dann an |
| `geprueft` | Je Position optional: `{ "von": "Volt Deutschland", "issue_url": "https://github.com/…/issues/12" }`, wenn jemand die Position bestätigt hat – das Issue ist der Nachweis |

Was richtig ist, leitet das Spiel ab (`src/katalog.ts`): Gefragt wird **immer, wer Ja sagt**. Richtig sind nur
Parteien mit `ja`; „keine Aussage“ wird nie als Ja oder Nein gewertet und so angezeigt – ein Kreuz dort ist kein
Treffer, weil die Partei nicht Ja sagt. Eine Frage, zu der keine Partei Ja sagt oder alle, ist nicht spielbar. `npm run fragen` zeigt je Wahl und Frage, wer Ja sagt, und meldet
Fehler; `npm test` prüft die Datei ebenso. Neue oder geänderte Fragen brauchen danach neue Aufnahmen
(`npm run stimmen`, kostet ElevenLabs-Credits) – ebenso jede neue Wahl die Ansage ihrer Antwortmöglichkeiten.

Zurzeit sind alle Fragen **KI-Entwürfe, noch nicht von Menschen geprüft** – das Spiel sagt das auf der Startseite und
in jeder Auflösung.

Zum Prüfen zeigt `#/fragen` alle Fragen mit Position, Wortlaut und Beleg jeder Partei, nach Partei filterbar
(`#/fragen/volt`); andere Wahlen stehen davor (`#/be26/fragen/volt`). Je Position öffnen „Position bestätigen“ und „Fehler melden“ ein vorausgefülltes GitHub-Issue mit
Frage, Partei, eingetragener Position, Zitat und Beleg (`src/uebersicht.ts`). Bestätigt jemand eine Position, kommt
das Issue als `geprueft` an die Position; Übersicht und Auflösung zeigen sie dann als geprüft.

## Ausgewogenheit

**Das Spielprinzip bleibt:** Gefragt wird immer, wer Ja sagt, nie nach Nein. Die Fragen dürfen und sollen zuspitzen –
gerade Themen, die in der Bevölkerung heiß diskutiert werden. Weicher formuliert wären sie kaum greifbar.

**Ausgewogen sein muss die Auswahl der Fragen, nicht ihr Ton.** Jede Partei soll ihre zentralen Forderungen als
Ja-Frage wiederfinden, egal wo sie steht. Diskussion und erste Analyse:
[Issue #1](https://github.com/ma3u/wer-sagt-ja/issues/1).

Leitlinie für neue Fragen:

1. **Kontrovers und klar:** eine Forderung, die im Wahlkampf umstritten ist, als Ja/Nein-Frage. Begriffe aus der
   öffentlichen Debatte sind erlaubt, auch zugespitzte.
2. **Gleich scharf für alle Seiten:** Übernimmt eine Frage die Begriffe einer Seite, bekommt die Gegenseite eine ebenso
   zugespitzte Frage in ihren Begriffen.
3. **Profilfragen für jede Partei:** Je Katalog hat jede Partei mindestens zwei Fragen, bei denen sie mit höchstens
   einer anderen Partei Ja sagt. An solchen Fragen erkennt man eine Partei im Spiel.
4. **Keine Schlagseite:** Von den Fragen, deren Ja klar von einer der beiden Parteigruppen kommt, sollen höchstens
   60 % von derselben Gruppe kommen. Fehlt eine Seite, werden Fragen ergänzt – nicht bestehende abgeschwächt.
5. **Keine erfundenen Positionen:** Ausgewogenheit entsteht nie dadurch, dass einer Partei ein Ja zugeschrieben wird,
   das nicht im Programm steht. Ergänzt werden Fragen, nicht Positionen.
6. **„Keine Aussage“ belegen:** Sagt eine ganze Parteigruppe nichts, ist das oft eine Lücke der Erfassung – erst das Programm
   erneut durchsuchen, dann `begruendung` genau angeben.

`npm run fragen` zeigt je Frage die Richtung und je Wahl die Verteilung, die Profilfragen je Partei und Warnungen (⚠)
zu diesen Punkten; die Warnungen sind ein Arbeitsauftrag und lassen die Prüfung nicht scheitern. Die Übersicht
(`#/fragen`) zeigt dieselben Zahlen unter „Ausgewogenheit dieses Katalogs“. Berechnet werden sie in
`src/ausgewogenheit.ts`: Der Richtungswert ist der Ja-Anteil von SPD, Grünen und Linken minus dem von CDU/CSU, FDP und
AfD (je nur Parteien mit Aussage, „teils“ halb), ab ±0,5 gilt eine Frage als gerichtet. Diese beiden Gruppen sind eine bewusste
Vereinfachung und **keine Einordnung nach links und rechts**: Das Parteiensystem lässt sich nicht auf einer Achse
ordnen, die Forschung arbeitet mit mindestens zwei Dimensionen (wirtschaftlich und gesellschaftlich, „GAL-TAN“).
Andere Parteien zählen bei der Richtung nicht mit, bei den Profilfragen aber schon. Eine Messung auf zwei Dimensionen
ist in [Issue #1](https://github.com/ma3u/wer-sagt-ja/issues/1) geplant.

## Technik

- React + Vite + TypeScript, Tests mit Vitest, Lint mit oxlint.
- Verbindung Browser zu Browser per WebRTC. Zum Finden der Geräte dient die Firebase Realtime Database (REST, ohne
  SDK, jede Nachricht wird nach dem Lesen gelöscht – [firebase/README.md](firebase/README.md)); sie leitet auch weiter,
  wenn keine Direktverbindung zustande kommt. Ohne `VITE_FIREBASE_DATABASE_URL` funktionieren Räume nur zwischen
  Tabs desselben Browsers.
- Optional `VITE_STUN_URLS` für Direktverbindungen übers Internet; die Datenschutzerklärung nennt den Server dann.
- Vorschau beim Teilen und Suche: Open-Graph-Bild und -Video, strukturierte Daten (schema.org), `sitemap.xml`,
  `llms.txt` für KI-Agenten und ein Textblock in `index.html` für Crawler ohne JavaScript. Die Bilder
  (`public/vorschau.*`, `public/icon-*.png`) erzeugt `npm run vorschau` mit Chrome und ffmpeg. Die öffentliche Adresse
  steht fest in `index.html`, `public/sitemap.xml` und `public/llms.txt` – bei einer eigenen Domain dort ändern.
- Adressen: `#/` Start, `#/<raumname>` Einladung, `#/fragen` alle Fragen mit Belegen (`#/fragen/<partei>` nur eine
  Partei, `#/fragen/<partei>/<frage-id>` springt zur Frage, `#/<wahl>/fragen/…` für andere Wahlen als die
  Standardwahl), `#/impressum`, `#/datenschutz`.
- Öffentliche Räume tragen die gespielte Wahl als Feld `w` in die Realtime Database ein; erlauben die veröffentlichten
  Regeln das Feld noch nicht, schreibt die App den Eintrag ohne (`firebase/database.rules.json` neu veröffentlichen).
- Barrierefreiheit nach WCAG 2.2 AA: Fokusführung bei Ansichtswechsel, Zielflächen ≥ 24 px, „Bewegung anhalten“,
  Zeitlimit einstellbar.

```bash
cp .env.example .env
npm install
npm run dev          # Entwicklung
npm run build        # dist/
npm run lint && npm run typen && npm test
npm run stimmen -- --nur-zeigen   # zählt fehlende Aufnahmen (ElevenLabs, Schlüssel in .env.local)
```

Veröffentlichung: Der Workflow [`pages.yml`](.github/workflows/pages.yml) baut bei jedem Push auf `main` und
veröffentlicht auf GitHub Pages unter https://wersagtja.de/ (eigene Domain in den Pages-Einstellungen; die alte
Adresse `ma3u.github.io/wer-sagt-ja/` leitet dorthin weiter). Vor dem öffentlichen Start die Angaben in
`src/betreiber.ts` ausfüllen.

## Struktur

```
src/            App: Quiz.tsx (Start, Räume), Ansicht.tsx (Frage, Auflösung, Ergebnis), spielleitung.ts (Regeln),
                verbindung.ts (WebRTC + Firebase), show/ (Moderation, Ton), Uebersicht.tsx (alle Fragen), Rechtliches.tsx,
                ausgewogenheit.ts (Richtung und Profilfragen je Katalog)
public/         fragen.json (Fragen und Positionen), audio/ (Stimmen und Geräusche), Vorschaubilder, llms.txt
scripts/        fragen.ts (Übersicht, Prüfung und Ausgewogenheit), stimmen.ts (ElevenLabs), vorschau.ts, aufraeumen.ts (Firebase)
firebase/       Regeln der Realtime Database
```

## Lizenz

AGPL-3.0-or-later. Der ursprüngliche Code entstand als Quiz-Modus eines anderen AGPL-Projekts; die Urheberrechte
der damaligen Mitwirkenden bleiben bestehen.
