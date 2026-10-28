import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Methode } from './Methode.tsx'
import { Mitmachen } from './Mitmachen.tsx'
import { ADRESSE } from './seiten.ts'
import type { Katalog } from './typen.ts'

// Die Methodenseite (#/methode) und die Seite zum Mitmachen (#/mitmachen) als statische Seiten /methode/ und
// /mitmachen/ für Suchmaschinen und KI-Agenten: beim Build mit dem Stil der App gerendert (vite.config.ts). <base> lässt
// die #/…-Links der Seiten auf die App zeigen.

const METHODE = {
  titel: 'So prüfen wir die Ausgewogenheit – Wer sagt Ja?',
  beschreibung:
    'Wie „Wer sagt Ja?“ die Auswahl der Quizfragen prüft: Parteipositionen auf den zwei Konfliktlinien des deutschen ' +
    'Parteiensystems, Rangkorrelation je Frage, Kriterien und Stand je Wahl – mit Quellen und offenen Punkten.',
}

const MITMACHEN = {
  titel: 'Mitmachen: Unterricht, Abschlussarbeiten, Fragen prüfen – Wer sagt Ja?',
  beschreibung:
    'Das Quiz zu Wahlprogrammen im Politikunterricht der Oberstufe einsetzen (Ablauf für eine Doppelstunde), Themen ' +
    'für Bachelor- und Masterarbeiten in Politikwissenschaft und Politikdidaktik, Fragen und Positionen prüfen.',
}

function seite(pfad: string, { titel, beschreibung }: { titel: string; beschreibung: string }, inhalt: ReactElement, stile: string[], base: string) {
  const url = `${ADRESSE}${pfad}/`
  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <base href="${base}" />
    <title>${titel}</title>
    <meta name="description" content="${beschreibung}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${url}" />
    <meta name="theme-color" content="#eef1f5" />
    <link rel="icon" type="image/svg+xml" href="favicon.svg" />
    <link rel="apple-touch-icon" href="icon-180.png" />
    <meta property="og:type" content="article" />
    <meta property="og:locale" content="de_DE" />
    <meta property="og:site_name" content="Wer sagt Ja?" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${titel}" />
    <meta property="og:description" content="${beschreibung}" />
    <meta property="og:image" content="${ADRESSE}vorschau.png" />
    <meta name="twitter:card" content="summary_large_image" />
${stile.map((s) => `    <link rel="stylesheet" href="${s}" />`).join('\n')}
  </head>
  <body>
    <div id="root">${renderToStaticMarkup(inhalt)}</div>
  </body>
</html>
`
}

export const methodeSeite = (katalog: Katalog, stile: string[], base = '/') => seite('methode', METHODE, <Methode vorab={katalog} />, stile, base)

export const mitmachenSeite = (stile: string[], base = '/') => seite('mitmachen', MITMACHEN, <Mitmachen />, stile, base)
