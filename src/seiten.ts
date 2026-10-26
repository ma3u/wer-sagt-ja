import { KI_HINWEIS, POSITION_TEXT, type QuizDaten, type QuizFrage, type QuizPartei, type Wahl } from './typen.ts'

// Statische Seiten für Suchmaschinen: Die App selbst liegt unter einer Adresse, ihre Unterseiten hinter #/… – die
// nimmt keine Suchmaschine einzeln auf. Darum erzeugt der Build (vite.config.ts) je spielbarer Wahl eine eigene Seite
// mit allen Fragen, der Position jeder Partei und der Belegstelle, dazu sitemap.xml mit allen Adressen.

/** Öffentliche Adresse – auch in index.html, public/robots.txt und public/llms.txt. */
export const ADRESSE = 'https://wersagtja.de/'

/** Pfad der Seite einer Wahl aus ihrem Namen: „Landtagswahl Sachsen 2024“ → „landtagswahl-sachsen-2024“. */
export const pfad = (w: Wahl) =>
  w.name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const datum = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

const liste = (namen: string[]) => (namen.length < 2 ? namen.join('') : `${namen.slice(0, -1).join(', ')} und ${namen.at(-1)}`)

/** Links zu den Seiten aller Wahlen – für die Startseite und die Seiten selbst. `aktuell` steht ohne Link. */
export function wahlLinks(alle: QuizDaten[], base: string, aktuell?: string): string {
  return alle
    .map((d) =>
      d.wahl.id === aktuell
        ? `<li aria-current="page">${esc(d.wahl.name)}</li>`
        : `<li><a href="${base}${pfad(d.wahl)}/">${esc(d.wahl.name)}</a></li>`,
    )
    .join('\n          ')
}

function position(f: QuizFrage, p: QuizPartei): string {
  const pos = f.positionen.find((x) => x.partei_id === p.id)
  if (!pos) return ''
  const teile = [`<strong>${esc(p.kurzname)}: ${POSITION_TEXT[pos.position]}</strong>`]
  if (pos.kurzfassung) teile.push(esc(pos.kurzfassung))
  if (pos.zitat) teile.push(`<q>${esc(pos.zitat)}</q>`)
  if (pos.beleg_url) teile.push(`<a href="${esc(pos.beleg_url)}" rel="nofollow">Beleg im Programm</a>`)
  else if (pos.begruendung) teile.push(`<span class="klein">${esc(pos.begruendung)}</span>`)
  return `<li>${teile.join(' ')}</li>`
}

function frage(f: QuizFrage, parteien: QuizPartei[]): string {
  const namen = (ids: number[]) => ids.map((id) => parteien.find((p) => p.id === id)?.kurzname ?? String(id))
  const teils = f.neutral.length ? ` · Teils: ${esc(namen(f.neutral).join(', '))}` : ''
  return `
        <section id="${esc(f.id)}">
          <h3>${esc(f.frage)}</h3>
          <p>${esc(f.beschreibung)}</p>
          <details>
            <summary>Wer sagt Ja? Auflösung mit Belegen</summary>
            <p><strong>Ja: ${esc(namen(f.richtig).join(', '))}</strong>${teils}</p>
            <ul>
              ${parteien.map((p) => position(f, p)).join('\n              ')}
            </ul>${f.ki_entwurf ? `\n            <p class="klein">${KI_HINWEIS}.</p>` : ''}
          </details>
        </section>`
}

const STIL = `
      body { margin: 0; background: #eef1f5; color: #1a2233; font: 1.05rem/1.55 system-ui, sans-serif; }
      .seite { max-width: 46rem; margin: 0 auto; padding: 1.5rem 1rem 3rem; }
      a { color: #1f4bb8; }
      h1 { font-size: 2rem; line-height: 1.15; margin: 0.5rem 0 1rem; }
      h2 { font-size: 1.35rem; margin: 2rem 0 0.5rem; }
      h3 { font-size: 1.1rem; margin: 0 0 0.25rem; }
      section { background: #fff; border-radius: 0.75rem; padding: 1rem; margin: 0 0 0.75rem; }
      section p { margin: 0.25rem 0; }
      summary { cursor: pointer; color: #1f4bb8; min-height: 24px; padding: 0.25rem 0; }
      details ul { padding-left: 1.2rem; }
      details li { margin: 0.4rem 0; }
      .klein { font-size: 0.9rem; color: #4a5568; }
      .knopf { display: inline-block; background: #1f4bb8; color: #fff; padding: 0.6rem 1.1rem; border-radius: 0.5rem;
        text-decoration: none; font-weight: 600; margin: 0 0.75rem 0.5rem 0; }
      nav ol { list-style: none; padding: 0; margin: 0; display: flex; gap: 0.4rem; flex-wrap: wrap; }
      nav ol li + li::before { content: '›'; margin-right: 0.4rem; }
      footer { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 2rem; }`

/** Die Seite einer Wahl: alle Fragen mit Auflösung, Positionen, Zitaten und Belegen. */
export function wahlSeite(d: QuizDaten, alle: QuizDaten[], base = '/'): string {
  const { wahl, parteien, fragen } = d
  const url = `${ADRESSE}${pfad(wahl)}/`
  const titel = `${wahl.name}: Wer sagt Ja? – Quiz zu den Wahlprogrammen`
  const kurznamen = parteien.map((p) => p.kurzname)
  const beschreibung = `Quiz zur ${wahl.name}: ${fragen.length} Fragen zu den Wahlprogrammen von ${liste(kurznamen)}. Welche Partei sagt Ja? Mit Zitat und Beleg aus jedem Programm – kostenlos, ohne Anmeldung.`
  const daten = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#seite`,
        url,
        name: titel,
        description: beschreibung,
        inLanguage: 'de',
        isPartOf: { '@id': `${ADRESSE}#website` },
        about: { '@type': 'Event', name: wahl.name, startDate: wahl.datum, location: { '@type': 'Country', name: 'Deutschland' } },
        mentions: parteien.map((p) => ({ '@type': 'PoliticalParty', name: p.name })),
        primaryImageOfPage: `${ADRESSE}vorschau.png`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Wer sagt Ja?', item: ADRESSE },
          { '@type': 'ListItem', position: 2, name: wahl.name, item: url },
        ],
      },
    ],
  }
  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(titel)}</title>
    <meta name="description" content="${esc(beschreibung)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${url}" />
    <meta name="theme-color" content="#eef1f5" />
    <link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />
    <link rel="apple-touch-icon" href="${base}icon-180.png" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="de_DE" />
    <meta property="og:site_name" content="Wer sagt Ja?" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(titel)}" />
    <meta property="og:description" content="${esc(beschreibung)}" />
    <meta property="og:image" content="${ADRESSE}vorschau.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">${JSON.stringify(daten).replace(/</g, '\\u003c')}</script>
    <style>${STIL}
    </style>
  </head>
  <body>
    <div class="seite">
      <nav aria-label="Brotkrumen">
        <ol>
          <li><a href="${base}">Wer sagt Ja?</a></li>
          <li aria-current="page">${esc(wahl.name)}</li>
        </ol>
      </nav>
      <main>
        <h1>${esc(wahl.name)}: Welche Partei sagt Ja?</h1>
        <p>
          ${fragen.length} Fragen zu den Wahlprogrammen zur ${esc(wahl.name)} (Wahltag ${datum(wahl.datum)}). Im Quiz
          rätst du allein oder mit bis zu acht Personen, welche Parteien Ja sagen. Hier stehen alle Fragen mit der
          Antwort jeder Partei, dem Wortlaut und dem Link zur Stelle im Programm.
        </p>
        <p>
          <a class="knopf" href="${base}">Quiz spielen</a>
          <a href="${base}#/${wahl.id}/fragen">Fragen in der App ansehen</a>
        </p>
        <h2>Die Wahlprogramme</h2>
        <ul>
          ${parteien.map((p) => `<li><a href="${esc(p.programm_url)}" rel="nofollow">${esc(p.name)}</a></li>`).join('\n          ')}
        </ul>
        <h2>Die Fragen</h2>${fragen.map((f) => frage(f, parteien)).join('')}
        <h2>Weitere Wahlen</h2>
        <ul>
          ${wahlLinks(alle, base, wahl.id)}
        </ul>
      </main>
      <footer>
        <a href="${base}#/methode">Methode</a>
        <a href="${base}#/impressum">Impressum</a>
        <a href="${base}#/datenschutz">Datenschutz</a>
        <a href="https://github.com/ma3u/wer-sagt-ja">Quellcode</a>
      </footer>
    </div>
  </body>
</html>
`
}

/** sitemap.xml: die Startseite und die Seite jeder Wahl. */
export function sitemap(alle: QuizDaten[]): string {
  const urls = [
    `  <url>\n    <loc>${ADRESSE}</loc>\n    <image:image>\n      <image:loc>${ADRESSE}vorschau.png</image:loc>\n    </image:image>\n  </url>`,
    ...alle.map((d) => `  <url>\n    <loc>${ADRESSE}${pfad(d.wahl)}/</loc>\n  </url>`),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`
}
