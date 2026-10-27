import { renderToStaticMarkup } from 'react-dom/server'
import { Methode } from './Methode.tsx'
import { ADRESSE } from './seiten.ts'
import type { Katalog } from './typen.ts'

// Die Methodenseite (#/methode) als statische Seite /methode/ für Suchmaschinen und KI-Agenten: beim Build mit dem
// Stil der App gerendert (vite.config.ts). <base> lässt die #/…-Links der Seite auf die App zeigen.

const TITEL = 'So prüfen wir die Ausgewogenheit – Wer sagt Ja?'
const BESCHREIBUNG =
  'Wie „Wer sagt Ja?“ die Auswahl der Quizfragen prüft: Parteipositionen auf den zwei Konfliktlinien des deutschen ' +
  'Parteiensystems, Rangkorrelation je Frage, Kriterien und Stand je Wahl – mit Quellen und offenen Punkten.'

export function methodeSeite(katalog: Katalog, stile: string[], base = '/'): string {
  const url = `${ADRESSE}methode/`
  const inhalt = renderToStaticMarkup(<Methode vorab={katalog} />)
  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <base href="${base}" />
    <title>${TITEL}</title>
    <meta name="description" content="${BESCHREIBUNG}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${url}" />
    <meta name="theme-color" content="#eef1f5" />
    <link rel="icon" type="image/svg+xml" href="favicon.svg" />
    <link rel="apple-touch-icon" href="icon-180.png" />
    <meta property="og:type" content="article" />
    <meta property="og:locale" content="de_DE" />
    <meta property="og:site_name" content="Wer sagt Ja?" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${TITEL}" />
    <meta property="og:description" content="${BESCHREIBUNG}" />
    <meta property="og:image" content="${ADRESSE}vorschau.png" />
    <meta name="twitter:card" content="summary_large_image" />
${stile.map((s) => `    <link rel="stylesheet" href="${s}" />`).join('\n')}
  </head>
  <body>
    <div id="root">${inhalt}</div>
  </body>
</html>
`
}
