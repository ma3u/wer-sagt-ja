# Wer sagt Ja?

Mehrspieler-Quiz zu Wahlprogrammen (Bundestagswahl 2025, weitere Wahlen als eigene Kataloge): Bis zu acht Personen
raten, welche Parteien zu einer Frage Ja sagen – nie nach Nein gefragt. React + Vite + TypeScript, ohne Datenbank und
ohne KI im Spiel. Alles Wichtige steht in README.md.

- `npm run dev | build | lint | typen | test`
- Eigenständiges Projekt: keine Abhängigkeit zu anderen Repositories. Fragen und Positionen werden hier in
  `public/fragen.json` gepflegt (Format in README.md, Ableitung in `src/katalog.ts`), geprüft mit `npm run fragen`.
  Je Wahl (`wahlen[]`) eigene Parteien und Fragen (`fragen[].wahl`); die erste Wahl ist die Standardwahl. Eine
  Position nur mit wörtlichem Zitat und Beleg-Link aus dem Programm setzen oder ändern; `id` nie ändern.
- Gefragt wird immer, wer Ja sagt – nie nach Nein (Texte, Ansagen, Stempel).
- Spielprinzip bleibt, Auswahl wird ausgewogen: Fragen dürfen zuspitzen; jede Partei soll ihre Forderungen als
  Ja-Frage wiederfinden (Leitlinie in README.md, „Ausgewogenheit“; Kennzahlen in `src/ausgewogenheit.ts`). Schlagseite
  durch zusätzliche, gleich scharfe Fragen der Gegenseite beheben – nie Fragen abschwächen oder Positionen erfinden.
- Stimmen (`public/audio/`) erzeugt `npm run stimmen` über ElevenLabs – kostet Credits; Schlüssel nur in `.env.local`,
  nie einchecken.
- Vorschaubild und App-Icons (`public/vorschau.*`, `public/icon-*.png`) erzeugt `npm run vorschau` (Chrome, ffmpeg).
  Die öffentliche Adresse steht fest in `index.html`, `src/seiten.ts`, `public/robots.txt` und `src/llms.txt`.
  Für Suchmaschinen und KI-Agenten erzeugt der Build je spielbarer Wahl eine statische Seite (HTML und Markdown),
  je kommender Wahl ohne Programme eine Ankündigung unter derselben Adresse,
  die Methodenseite `/methode/`, `sitemap.xml` und `llms.txt` aus der Vorlage `src/llms.txt` (`src/seiten.ts`,
  `src/methodeSeite.tsx`); `pages.yml` meldet die Adressen danach über IndexNow.
- Nur auf `origin` pushen. Vor jedem Commit den Diff auf Schlüssel (`sk_…`) prüfen.
- Barrierefreiheit WCAG 2.2 AA: neue Ansichten mit `useAnsicht`, Zielflächen ≥ 24 px, Zeitlimit einstellbar.
