import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { quizKatalog, spielbar, type FragenDatei } from './katalog'
import { methodeSeite } from './methodeSeite'

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
