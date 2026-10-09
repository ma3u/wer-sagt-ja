# Wer sagt Ja?

Mehrspieler-Quiz zu den Bundeswahlprogrammen 2025: Bis zu acht Personen raten, welche Parteien zu einer Frage Ja
(oder Nein) sagen. React + Vite + TypeScript, ohne Datenbank und ohne KI im Spiel. Alles Wichtige steht in README.md.

- `npm run dev | build | lint | typen | test`
- Fragen (`public/fragen.json`) kommen aus dem Politik-Duell (`npm run quiz:erzeugen -- --entwuerfe` dort) und werden
  hier nicht bearbeitet, nur ersetzt. Positionen der Parteien nie von Hand ändern.
- Stimmen (`public/audio/`) erzeugt `npm run stimmen` über ElevenLabs – kostet Credits; Schlüssel nur in `.env.local`,
  nie einchecken.
- Nur auf `origin` pushen. Vor jedem Commit den Diff auf Schlüssel (`sk_…`) prüfen.
- Barrierefreiheit WCAG 2.2 AA: neue Ansichten mit `useAnsicht`, Zielflächen ≥ 24 px, Zeitlimit einstellbar.
