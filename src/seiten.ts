import { KI_HINWEIS, POSITION_TEXT, type QuizDaten, type QuizFrage, type QuizPartei, type Wahl } from './typen.ts'

// Statische Seiten für Suchmaschinen: Die App selbst liegt unter einer Adresse, ihre Unterseiten hinter #/… – die
// nimmt keine Suchmaschine einzeln auf. Darum erzeugt der Build (vite.config.ts) je spielbarer Wahl eine eigene Seite
// mit allen Fragen, der Position jeder Partei und der Belegstelle, je angekündigter Wahl eine Seite mit Wahltag, dazu
// sitemap.xml mit allen Adressen. Für KI-Agenten dieselbe Seite als Markdown (<pfad>/index.md) und llms.txt mit der
// Liste aller Wahlen.

/** Öffentliche Adresse – auch in index.html, public/robots.txt und src/llms.txt. */
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

interface Rahmen {
  wahl: Wahl
  titel: string
  beschreibung: string
  /** Parteien für JSON-LD (`mentions`). */
  parteien: string[]
  /** Mit Markdown-Fassung (`<pfad>/index.md`) – nur spielbare Wahlen. */
  markdown: boolean
  base: string
  inhalt: string
}

/** Kopf, Brotkrumen und Fußzeile, gemeinsam für die Seiten spielbarer und angekündigter Wahlen. */
function rahmen({ wahl, titel, beschreibung, parteien, markdown, base, inhalt }: Rahmen): string {
  const url = `${ADRESSE}${pfad(wahl)}/`
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
        mentions: parteien.map((name) => ({ '@type': 'PoliticalParty', name })),
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
    <link rel="canonical" href="${url}" />${markdown ? `\n    <link rel="alternate" type="text/markdown" href="${url}index.md" title="Markdown für KI-Agenten" />` : ''}
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
      <main>${inhalt}
      </main>
      <footer>
        <a href="${base}methode/">Methode</a>
        <a href="${base}mitmachen/">Mitmachen</a>
        <a href="${base}#/impressum">Impressum</a>
        <a href="${base}#/datenschutz">Datenschutz</a>
        <a href="https://github.com/ma3u/wer-sagt-ja">Quellcode</a>${markdown ? `\n        <a href="${base}${pfad(wahl)}/index.md">Als Markdown (für KI-Agenten)</a>` : ''}
      </footer>
    </div>
  </body>
</html>
`
}

/** Die Seite einer Wahl: alle Fragen mit Auflösung, Positionen, Zitaten und Belegen. */
export function wahlSeite(d: QuizDaten, alle: QuizDaten[], base = '/'): string {
  const { wahl, parteien, fragen } = d
  const kurznamen = parteien.map((p) => p.kurzname)
  return rahmen({
    wahl,
    titel: `${wahl.name}: Wer sagt Ja? – Quiz zu den Wahlprogrammen`,
    beschreibung: `Quiz zur ${wahl.name}: ${fragen.length} Fragen zu den Wahlprogrammen von ${liste(kurznamen)}. Welche Partei sagt Ja? Mit Zitat und Beleg aus jedem Programm – kostenlos, ohne Anmeldung.`,
    parteien: parteien.map((p) => p.name),
    markdown: true,
    base,
    inhalt: `
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
        </ul>`,
  })
}

/**
 * Die Seite einer angekündigten Wahl, noch ohne Programme: Wahltag, die bisher im Parlament vertretenen Parteien und
 * der Hinweis, dass die Fragen folgen. Die Adresse bleibt, wenn die Wahl spielbar wird – so ist sie bis zum Wahlkampf
 * schon bei den Suchmaschinen bekannt.
 */
export function ankuendigungsSeite(d: QuizDaten, alle: QuizDaten[], base = '/'): string {
  const { wahl } = d
  const bisher = wahl.bisher
  const buergerschaft = wahl.name.startsWith('Bürgerschaftswahl')
  return rahmen({
    wahl,
    titel: `${wahl.name}: Wer sagt Ja? – Quiz zu den Wahlprogrammen`,
    beschreibung: `Quiz zur ${wahl.name} am ${datum(wahl.datum)}: Sobald die Wahlprogramme beschlossen sind, fragen wir, welche Partei Ja sagt – mit Zitat und Beleg aus jedem Programm. Bis dahin: Quiz zu ${alle.length} früheren Wahlen.`,
    parteien: bisher?.parteien ?? [],
    markdown: false,
    base,
    inhalt: `
        <h1>${esc(wahl.name)}: Welche Partei sagt Ja?</h1>
        <p>
          Wahltag ist der ${datum(wahl.datum)}. Die Parteien beschließen ihre Wahlprogramme in den Monaten davor. Sobald
          sie vorliegen, kommen hier die Fragen dazu: Im Quiz rätst du allein oder mit bis zu acht Personen, welche
          Parteien Ja sagen, und siehst danach für jede Partei das Zitat mit dem Link zur Stelle im Programm.
        </p>${
          bisher
            ? `
        <h2>Bisher ${buergerschaft ? 'in der Bürgerschaft' : 'im Landtag'}</h2>
        <p>
          Bei der ${esc(bisher.wahl)} in ${buergerschaft ? 'die Bürgerschaft' : 'den Landtag'} gewählt: ${esc(liste(bisher.parteien))}
          (<a href="${esc(bisher.quelle)}" rel="nofollow">Quelle</a>). Welche Parteien ins Quiz kommen, steht fest,
          sobald die Programme vorliegen.
        </p>`
            : ''
        }
        <h2>Bis dahin: frühere Wahlen spielen</h2>
        <p><a class="knopf" href="${base}">Quiz spielen</a></p>
        <ul>
          ${wahlLinks(alle, base)}
        </ul>`,
  })
}

/** Links zu den Seiten angekündigter Wahlen, mit Wahltag. */
export function kommendLinks(kommend: QuizDaten[], base: string): string {
  return kommend
    .map((d) => `<li><a href="${base}${pfad(d.wahl)}/">${esc(d.wahl.name)}</a> – ${datum(d.wahl.datum)}, Fragen folgen</li>`)
    .join('\n          ')
}

/** Markdown-Fassung einer Wahlseite für KI-Agenten (`<pfad>/index.md`): dieselben Fragen, Positionen und Belege. */
export function wahlMarkdown(d: QuizDaten): string {
  const { wahl, parteien, fragen } = d
  const kurz = (id: number) => parteien.find((p) => p.id === id)?.kurzname ?? String(id)
  const zeilen = [
    `# ${wahl.name}: Wer sagt Ja?`,
    '',
    `> ${fragen.length} Fragen aus dem Quiz „Wer sagt Ja?“ zu den Wahlprogrammen zur ${wahl.name} (Wahltag ${datum(wahl.datum)}),`,
    '> je Frage die Position jeder Partei mit Zitat und Link zur Stelle im Programm.',
    '',
    `Quelle: ${ADRESSE}${pfad(wahl)}/ · Rohdaten: ${ADRESSE}fragen.json · Hinweise: ${ADRESSE}llms.txt`,
    '',
    'Positionen: Ja, Nein, Teils oder Keine Aussage im Programm (weder Ja noch Nein). Fragen mit dem Vermerk',
    '„KI-Entwurf“ sind noch nicht von Menschen geprüft – bitte das Zitat nennen und auf das Programm verweisen.',
    '',
    '## Wahlprogramme',
    '',
    ...parteien.map((p) => `- ${p.kurzname}${p.name === p.kurzname ? '' : ` (${p.name})`}: ${p.programm_url}`),
    '',
    '## Fragen',
  ]
  for (const f of fragen) {
    const teils = f.neutral.length ? ` · Teils: ${f.neutral.map(kurz).join(', ')}` : ''
    zeilen.push('', `### ${f.frage}`, '', `Kennung: ${f.id}${f.ki_entwurf ? ' · KI-Entwurf, noch nicht von Menschen geprüft' : ''}`, '', f.beschreibung, '')
    zeilen.push(`Ja: ${f.richtig.map(kurz).join(', ')}${teils}`, '')
    for (const p of parteien) {
      const pos = f.positionen.find((x) => x.partei_id === p.id)
      if (!pos) continue
      const teile = [`- ${p.kurzname}: ${POSITION_TEXT[pos.position]}`]
      if (pos.kurzfassung) teile.push(`– ${pos.kurzfassung}`)
      if (pos.zitat) teile.push(`Zitat: „${pos.zitat}“`)
      if (pos.beleg_url) teile.push(`Beleg: ${pos.beleg_url}`)
      else if (pos.begruendung) teile.push(`(${pos.begruendung})`)
      zeilen.push(teile.join(' '))
    }
  }
  return `${zeilen.join('\n')}\n`
}

/** llms.txt aus der Vorlage src/llms.txt: Der Platzhalter `<!-- wahlen -->` wird zur Liste der Wahlseiten. */
export function llmsTxt(vorlage: string, alle: QuizDaten[], kommend: QuizDaten[] = []): string {
  const liste = [
    ...alle.map((d) => `- [${d.wahl.name}](${ADRESSE}${pfad(d.wahl)}/index.md): ${d.fragen.length} Fragen, ${d.parteien.map((p) => p.kurzname).join(', ')}`),
    ...kommend.map((d) => `- [${d.wahl.name}](${ADRESSE}${pfad(d.wahl)}/): Wahltag ${datum(d.wahl.datum)}, Fragen folgen mit den Programmen`),
  ].join('\n')
  return vorlage.replace('<!-- wahlen -->', liste)
}

/** sitemap.xml: die Startseite, die Methodenseite, die Seite zum Mitmachen und die Seite jeder Wahl, auch der angekündigten. */
export function sitemap(alle: QuizDaten[], kommend: QuizDaten[] = []): string {
  const urls = [
    `  <url>\n    <loc>${ADRESSE}</loc>\n    <image:image>\n      <image:loc>${ADRESSE}vorschau.png</image:loc>\n    </image:image>\n  </url>`,
    `  <url>\n    <loc>${ADRESSE}methode/</loc>\n  </url>`,
    `  <url>\n    <loc>${ADRESSE}mitmachen/</loc>\n  </url>`,
    ...[...alle, ...kommend].map((d) => `  <url>\n    <loc>${ADRESSE}${pfad(d.wahl)}/</loc>\n  </url>`),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`
}
