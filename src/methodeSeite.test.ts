import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { quizKatalog, spielbar, type FragenDatei } from './katalog'
import { methodeSeite, mitmachenSeite } from './methodeSeite'

describe('methodeSeite', () => {
  const katalog = quizKatalog(JSON.parse(readFileSync(new URL('../public/fragen.json', import.meta.url), 'utf8')) as FragenDatei)
  const html = methodeSeite(katalog, ['assets/index.css'])

  it('rendert die Methode mit kanonischer Adresse, Stil und Link zur Startseite statt „Zurück“', () => {
    expect(html).toContain('<link rel="canonical" href="https://wersagtja.de/methode/" />')
    expect(html).toContain('<link rel="stylesheet" href="assets/index.css" />')
    expect(html).toContain('So prüfen wir die Ausgewogenheit</h1>')
    expect(html).toContain('← Zur Startseite')
  })
  it('zeigt den Stand jedes spielbaren Katalogs', () => {
    for (const d of katalog.wahlen.filter(spielbar)) expect(html).toContain(d.wahl.kurz)
  })
})

describe('mitmachenSeite', () => {
  const html = mitmachenSeite(['assets/index.css'])

  it('rendert Unterricht, Abschlussarbeiten und Prüfen mit kanonischer Adresse', () => {
    expect(html).toContain('<link rel="canonical" href="https://wersagtja.de/mitmachen/" />')
    expect(html).toContain('Mitmachen</h1>')
    for (const h of ['Im Politikunterricht', 'Themen für Abschlussarbeiten', 'Fragen prüfen', 'Kontakt']) expect(html).toContain(`<h2>${h}</h2>`)
    expect(html).toContain('issues/new?template=frage-vorschlagen.yml')
    expect(html).toContain('issues/new?template=rueckmeldung-unterricht.yml')
    expect(html).toContain('← Zur Startseite')
  })
  it('plant die Doppelstunde auf 90 Minuten', () => {
    const minuten = [...html.matchAll(/\((\d+) Minuten\)/g)].map((m) => Number(m[1]))
    expect(minuten.reduce((a, b) => a + b, 0)).toBe(90)
  })
})
