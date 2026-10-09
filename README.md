# Wer sagt Ja?

Ein Quiz zu den Bundeswahlprogrammen 2025 für bis zu acht Personen. Eine Frage, acht Parteien: Wer sagt im Programm
Ja (oder Nein)? Wer richtig liegt, bekommt Punkte – wer schneller ist, mehr. Nach jeder Frage zeigt das Spiel für alle
Parteien die Stelle im Programm mit Wortlaut, Seite und Link.

Punkte gibt es fürs Wissen über Programme, nie für eine eigene Meinung. Keine Konten, keine Datenbank, keine KI im
Spiel: Das Spiel läuft zwischen den Browsern der Mitspielenden.

## Spielen

- **Alleine** üben, **mit Freunden** in einem Raum mit merkbarem Namen (Einladung per Link oder QR-Code) oder
  **mit Fremden** in einem öffentlichen Raum.
- Bis zu acht Fragen je Spiel, Einzel- oder Mehrfachauswahl, Zeit je Frage einstellbar (20 s, 40 s, ohne Limit).
- Zwei Moderatoren (KI-Stimmen, vorab aufgenommen) begleiten die Show; der Ton ist abschaltbar, alle Ansagen stehen
  auch als Text auf der Seite.

## Woher die Fragen kommen

`public/fragen.json` entsteht im [Politik-Duell](https://github.com/ma3u/politik-duell) aus dessen *Haltungen*: je
Wertfrage die Position aller acht Bundesprogramme (Ja, Nein, teils, keine Aussage) mit Zitat und Seitenanker,
erfasst nach einem Verfahren ohne Parteinamen. Dort `npm run quiz:erzeugen -- --entwuerfe` ausführen und die Datei
`public/quiz/fragen-entwurf.json` hierher als `public/fragen.json` kopieren. Die Positionen werden hier nie von Hand
geändert.

Zurzeit sind alle Fragen **KI-Entwürfe, noch nicht von Menschen geprüft** – das Spiel sagt das auf der Startseite und
in jeder Auflösung. „Keine Aussage im Programm“ zählt wie die heutige Lage (Feld `status_quo` je Frage).

## Technik

- React + Vite + TypeScript, Tests mit Vitest, Lint mit oxlint.
- Verbindung Browser zu Browser per WebRTC. Zum Finden der Geräte dient die Firebase Realtime Database (REST, ohne
  SDK, jede Nachricht wird nach dem Lesen gelöscht – [firebase/README.md](firebase/README.md)); sie leitet auch weiter,
  wenn keine Direktverbindung zustande kommt. Ohne `VITE_FIREBASE_DATABASE_URL` funktionieren Räume nur zwischen
  Tabs desselben Browsers.
- Optional `VITE_STUN_URLS` für Direktverbindungen übers Internet; die Datenschutzerklärung nennt den Server dann.
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
public/         fragen.json, audio/ (Stimmen und Geräusche), favicon.svg
scripts/        stimmen.ts (ElevenLabs), aufraeumen.ts (Firebase)
firebase/       Regeln der Realtime Database
```

## Lizenz

AGPL-3.0-or-later. Der Code stammt aus dem Quiz-Modus des [Politik-Duells](https://github.com/politik-duell/politik-duell).
