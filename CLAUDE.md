# Wer sagt Ja?

Mehrspieler-Quiz zu den Bundeswahlprogrammen 2025: Bis zu acht Personen raten, welche Parteien zu einer Frage Ja
sagen – nie nach Nein gefragt. React + Vite + TypeScript, ohne Datenbank und ohne KI im Spiel. Alles Wichtige steht in README.md.

- `npm run dev | build | lint | typen | test`
- Eigenständiges Projekt: keine Abhängigkeit zu anderen Repositories. Fragen und Positionen werden hier in
  `public/fragen.json` gepflegt (Format in README.md, Ableitung in `src/katalog.ts`), geprüft mit `npm run fragen`.
  Eine Position nur mit wörtlichem Zitat und Beleg-Link aus dem Programm setzen oder ändern; `id` nie ändern.
- Gefragt wird immer, wer Ja sagt – nie nach Nein (Texte, Ansagen, Stempel).
- Stimmen (`public/audio/`) erzeugt `npm run stimmen` über ElevenLabs – kostet Credits; Schlüssel nur in `.env.local`,
  nie einchecken.
- Vorschaubild und App-Icons (`public/vorschau.*`, `public/icon-*.png`) erzeugt `npm run vorschau` (Chrome, ffmpeg).
  Die öffentliche Adresse steht fest in `index.html`, `public/sitemap.xml` und `public/llms.txt`.
- Nur auf `origin` pushen. Vor jedem Commit den Diff auf Schlüssel (`sk_…`) prüfen.
- Barrierefreiheit WCAG 2.2 AA: neue Ansichten mit `useAnsicht`, Zielflächen ≥ 24 px, Zeitlimit einstellbar.
