# Wer sagt Ja?

![Wer sagt Ja? – Das Quiz zu den Wahlprogrammen](public/vorschau.gif)

Ein Quiz zu den Bundeswahlprogrammen 2025 für bis zu acht Personen. Eine Frage, acht Parteien: Wer sagt im Programm
Ja? Wer richtig liegt, bekommt Punkte – wer schneller ist, mehr. Nach jeder Frage zeigt das Spiel für alle
Parteien die Stelle im Programm mit Wortlaut, Seite und Link.

Punkte gibt es fürs Wissen über Programme, nie für eine eigene Meinung. Keine Konten, keine Datenbank, keine KI im
Spiel: Das Spiel läuft zwischen den Browsern der Mitspielenden.

## Spielen

- **Alleine** üben, **mit Freunden** in einem Raum mit merkbarem Namen (Einladung per Link oder QR-Code) oder
  **mit Fremden** in einem öffentlichen Raum.
- Bis zu acht Fragen je Spiel, Einzel- oder Mehrfachauswahl, Zeit je Frage einstellbar (20 s, 40 s, ohne Limit).
- Zwei Moderatoren (KI-Stimmen, vorab aufgenommen) begleiten die Show; der Ton ist abschaltbar, alle Ansagen stehen
  auch als Text auf der Seite.

## Fragen pflegen

Alle Fragen stehen in `public/fragen.json` und werden hier gepflegt. Je Frage:

| Feld | Inhalt |
| --- | --- |
| `id` | Stabile Kennung, nie ändern – die Aufnahmen heißen danach (`frage-<id>.mp3`, `loesung-<id>.mp3`) |
| `frage`, `beschreibung` | Neutral formulierte Ja/Nein-Frage mit Fragezeichen und eine Erläuterung |
| `status_quo` | Was heute gilt (`"ja"`, `"nein"` oder `null`); „keine Aussage“ im Programm zählt wie diese Antwort |
| `positionen` | Genau eine je Partei: `ja`, `nein`, `teils` oder `keine_aussage`. Ja, Nein und teils immer mit wörtlichem `zitat` und `beleg_url` (Seite im Programm), keine Aussage mit `begruendung`, was durchsucht wurde |
| `zielkonflikte` | Argumente beider Seiten mit Quelle (optional, leere Liste) |
| `ki_entwurf` | `true`, solange die Positionen nicht von Menschen geprüft sind – das Spiel sagt das dann an |

Was richtig ist, leitet das Spiel ab (`src/katalog.ts`): Gefragt wird **immer, wer Ja sagt**. Eine Frage, zu der
keine Partei Ja sagt oder alle, ist nicht spielbar. `npm run fragen` zeigt je Frage, wer Ja sagt, und meldet
Fehler; `npm test` prüft die Datei ebenso. Neue oder geänderte Fragen brauchen danach neue Aufnahmen
(`npm run stimmen`, kostet ElevenLabs-Credits).

Zurzeit sind alle Fragen **KI-Entwürfe, noch nicht von Menschen geprüft** – das Spiel sagt das auf der Startseite und
in jeder Auflösung.

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
- Adressen: `#/` Start, `#/<raumname>` Einladung, `#/impressum`, `#/datenschutz`.
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
veröffentlicht auf GitHub Pages unter `/<repository>/`. Vor dem öffentlichen Start die Angaben in
`src/betreiber.ts` ausfüllen.

## Struktur

```
src/            App: Quiz.tsx (Start, Räume), Ansicht.tsx (Frage, Auflösung, Ergebnis), spielleitung.ts (Regeln),
                verbindung.ts (WebRTC + Firebase), show/ (Moderation, Ton), Rechtliches.tsx
public/         fragen.json (Fragen und Positionen), audio/ (Stimmen und Geräusche), Vorschaubilder, llms.txt
scripts/        fragen.ts (Übersicht und Prüfung), stimmen.ts (ElevenLabs), vorschau.ts, aufraeumen.ts (Firebase)
firebase/       Regeln der Realtime Database
```

## Lizenz

AGPL-3.0-or-later. Der ursprüngliche Code entstand als Quiz-Modus eines anderen AGPL-Projekts; die Urheberrechte
der damaligen Mitwirkenden bleiben bestehen.
