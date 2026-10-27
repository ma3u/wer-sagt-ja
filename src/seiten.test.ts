import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { quizKatalog, spielbar, type FragenDatei } from './katalog'
import { ADRESSE, ankuendigungsSeite, kommendLinks, llmsTxt, pfad, sitemap, wahlLinks, wahlMarkdown, wahlSeite } from './seiten'

const datei = JSON.parse(readFileSync(new URL('../public/fragen.json', import.meta.url), 'utf8')) as FragenDatei
const katalog = quizKatalog(datei)
const alle = katalog.wahlen.filter(spielbar)
const kommend = katalog.wahlen.filter((d) => !spielbar(d) && d.wahl.datum >= '2026-10-27')

describe('pfad', () => {
  it('macht aus dem Namen der Wahl einen lesbaren Pfad ohne Umlaute', () => {
    const wahl = { id: 'x', kurz: '', datum: '2026-01-01' }
    expect(pfad({ ...wahl, name: 'Landtagswahl Baden-Württemberg 2026' })).toBe('landtagswahl-baden-wuerttemberg-2026')
    expect(pfad({ ...wahl, name: 'Bürgerschaftswahl Hamburg 2025' })).toBe('buergerschaftswahl-hamburg-2025')
  })
  it('ist je Wahl eindeutig', () => {
    expect(new Set(katalog.wahlen.map((d) => pfad(d.wahl))).size).toBe(katalog.wahlen.length)
  })
})

describe('wahlSeite', () => {
  it('enthält Titel, kanonische Adresse und jede Frage der Wahl', () => {
    for (const d of alle) {
      const html = wahlSeite(d, alle)
      expect(html).toContain(`<title>${d.wahl.name}: Wer sagt Ja?`)
      expect(html).toContain(`<link rel="canonical" href="${ADRESSE}${pfad(d.wahl)}/" />`)
      for (const f of d.fragen) expect(html).toContain(`<section id="${f.id}">`)
    }
  })
  it('maskiert Text aus der Fragendatei', () => {
    const d = alle[0]
    const f = { ...d.fragen[0], frage: 'A <b>&</b> "B"' }
    expect(wahlSeite({ ...d, fragen: [f] }, alle)).toContain('<h3>A &lt;b&gt;&amp;&lt;/b&gt; &quot;B&quot;</h3>')
  })
})

describe('wahlLinks und sitemap', () => {
  it('verlinken jede spielbare Wahl, angekündigte nicht', () => {
    const links = wahlLinks(alle, '/')
    const karte = sitemap(alle)
    for (const d of katalog.wahlen) {
      expect(links.includes(`/${pfad(d.wahl)}/`)).toBe(spielbar(d))
      expect(karte.includes(`${ADRESSE}${pfad(d.wahl)}/`)).toBe(spielbar(d))
    }
  })
})

describe('wahlMarkdown und llmsTxt', () => {
  it('enthält jede Frage mit Kennung und jede Partei mit Position', () => {
    for (const d of alle) {
      const md = wahlMarkdown(d)
      expect(md.startsWith(`# ${d.wahl.name}: Wer sagt Ja?`)).toBe(true)
      for (const f of d.fragen) expect(md).toContain(`Kennung: ${f.id}`)
      for (const p of d.parteien) expect(md).toContain(`- ${p.kurzname}: `)
    }
  })
  it('ersetzt den Platzhalter der Vorlage durch die Markdown-Seiten aller Wahlen', () => {
    const vorlage = readFileSync(new URL('./llms.txt', import.meta.url), 'utf8')
    expect(vorlage).toContain('<!-- wahlen -->')
    const txt = llmsTxt(vorlage, alle)
    expect(txt).not.toContain('<!-- wahlen -->')
    for (const d of alle) expect(txt).toContain(`${ADRESSE}${pfad(d.wahl)}/index.md`)
  })
})

describe('sitemap', () => {
  it('enthält die Methodenseite', () => {
    expect(sitemap(alle)).toContain(`<loc>${ADRESSE}methode/</loc>`)
  })
})

describe('ankuendigungsSeite', () => {
  it('gibt es für jede kommende Wahl, mit Wahltag, bisherigen Parteien und Quelle', () => {
    for (const d of kommend) {
      const html = ankuendigungsSeite(d, alle)
      expect(html).toContain(`<link rel="canonical" href="${ADRESSE}${pfad(d.wahl)}/" />`)
      expect(html).toContain('Fragen dazu')
      expect(html).not.toContain('text/markdown')
      expect(d.wahl.bisher).toBeDefined()
      for (const p of d.wahl.bisher?.parteien ?? []) expect(html).toContain(p)
      expect(html).toContain(d.wahl.bisher?.quelle)
      for (const s of alle) expect(html).toContain(`/${pfad(s.wahl)}/`)
    }
  })
  it('steht in Sitemap, llms.txt und Startseiten-Links', () => {
    const karte = sitemap(alle, kommend)
    const txt = llmsTxt('<!-- wahlen -->', alle, kommend)
    const links = kommendLinks(kommend, '/')
    for (const d of kommend) {
      expect(karte).toContain(`<loc>${ADRESSE}${pfad(d.wahl)}/</loc>`)
      expect(txt).toContain(`(${ADRESSE}${pfad(d.wahl)}/): Wahltag`)
      expect(links).toContain(`/${pfad(d.wahl)}/`)
    }
  })
})
