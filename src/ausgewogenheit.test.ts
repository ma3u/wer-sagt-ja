import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ausgewogenheit, istProfilfrage, richtungVon, richtungswert } from './ausgewogenheit'
import { quizKatalog, spielbar, type FragenDatei } from './katalog'
import type { Positionswert, QuizPartei, QuizPosition } from './typen'

const KURZ = ['SPD', 'Grüne', 'Linke', 'CDU', 'FDP', 'AfD', 'BSW']
const parteien: QuizPartei[] = KURZ.map((kurzname, i) => ({ id: i + 1, name: kurzname, kurzname, farbe: '#000', programm_url: 'https://example.org' }))

/** Positionen in der Reihenfolge von KURZ. */
const pos = (...werte: Positionswert[]): QuizPosition[] =>
  werte.map((position, i) => ({ partei_id: i + 1, position, kurzfassung: null, zitat: null, beleg_url: null, begruendung: null }))

const frage = (...werte: Positionswert[]) => {
  const positionen = pos(...werte)
  return { positionen, richtig: positionen.filter((p) => p.position === 'ja').map((p) => p.partei_id) }
}

describe('richtungswert', () => {
  it('ist +1, wenn links alle Ja und rechts alle Nein sagen', () => {
    expect(richtungswert(pos('ja', 'ja', 'ja', 'nein', 'nein', 'nein', 'ja'), parteien)).toBe(1)
  })
  it('ist −1 im umgekehrten Fall – BSW zählt nicht mit', () => {
    expect(richtungswert(pos('nein', 'nein', 'nein', 'ja', 'ja', 'ja', 'ja'), parteien)).toBe(-1)
  })
  it('zählt „teils“ halb und lässt „keine Aussage“ weg', () => {
    // links: ja, teils → 0,75; rechts: nein → 0
    expect(richtungswert(pos('ja', 'teils', 'keine_aussage', 'nein', 'keine_aussage', 'keine_aussage', 'ja'), parteien)).toBe(0.75)
  })
  it('ist null, wenn ein Lager gar keine Aussage hat', () => {
    expect(richtungswert(pos('ja', 'ja', 'ja', 'keine_aussage', 'keine_aussage', 'keine_aussage', 'nein'), parteien)).toBeNull()
  })
  it('ordnet Union, CDU und CSU rechts zu', () => {
    const union = parteien.map((p) => (p.kurzname === 'CDU' ? { ...p, kurzname: 'Union' } : p))
    expect(richtungswert(pos('nein', 'nein', 'nein', 'ja', 'keine_aussage', 'keine_aussage', 'nein'), union)).toBe(-1)
  })
})

describe('richtungVon', () => {
  it('teilt an der Schwelle ±0,5', () => {
    expect([0.5, 0.49, 0, -0.49, -0.5, null].map(richtungVon)).toEqual(['links', 'quer', 'quer', 'quer', 'rechts', 'offen'])
  })
})

describe('istProfilfrage', () => {
  it('gilt, wenn die Partei mit höchstens einer anderen Ja sagt', () => {
    expect(istProfilfrage({ richtig: [1] }, 1)).toBe(true)
    expect(istProfilfrage({ richtig: [1, 4] }, 4)).toBe(true)
    expect(istProfilfrage({ richtig: [1, 2, 3] }, 1)).toBe(false)
    expect(istProfilfrage({ richtig: [2] }, 1)).toBe(false)
  })
})

describe('ausgewogenheit', () => {
  it('zählt Richtungen und Profilfragen', () => {
    const a = ausgewogenheit({
      parteien,
      fragen: [
        frage('ja', 'ja', 'ja', 'nein', 'nein', 'nein', 'nein'),
        frage('nein', 'nein', 'nein', 'ja', 'ja', 'nein', 'nein'),
        frage('ja', 'nein', 'nein', 'ja', 'nein', 'nein', 'nein'),
      ],
    })
    expect(a.richtung).toEqual({ links: 1, quer: 1, rechts: 1, offen: 0 })
    expect(a.anteilLinks).toBe(0.5)
    expect(a.profil.map((x) => x.anzahl)).toEqual([1, 0, 0, 2, 1, 0, 0])
  })

  it('warnt, wenn mehr als 60 % der gerichteten Fragen in eine Richtung zeigen', () => {
    const links = frage('ja', 'ja', 'ja', 'nein', 'nein', 'nein', 'nein')
    const rechts = frage('nein', 'nein', 'nein', 'ja', 'ja', 'ja', 'nein')
    const a = ausgewogenheit({ parteien, fragen: [links, links, links, links, links, rechts] })
    expect(a.hinweise[0]).toMatch(/^5 von 6 gerichteten Fragen \(83 %\) zeigen mit dem Ja nach links/)
  })

  it('warnt nicht bei ausgeglichener Richtung', () => {
    const links = frage('ja', 'ja', 'ja', 'nein', 'nein', 'nein', 'nein')
    const rechts = frage('nein', 'nein', 'nein', 'ja', 'ja', 'ja', 'nein')
    const a = ausgewogenheit({ parteien, fragen: [links, links, links, rechts, rechts, rechts] })
    expect(a.hinweise.some((h) => h.includes('gerichteten'))).toBe(false)
  })

  it('nennt Parteien mit zu wenigen Profilfragen', () => {
    const a = ausgewogenheit({ parteien, fragen: [frage('ja', 'nein', 'nein', 'nein', 'nein', 'nein', 'nein')] })
    expect(a.hinweise.join(' ')).toContain('SPD (1), Grüne (0)')
  })
})

describe('fragen.json', () => {
  const datei = JSON.parse(readFileSync(new URL('../public/fragen.json', import.meta.url), 'utf8')) as FragenDatei
  it('liefert für jeden spielbaren Katalog Kennzahlen über alle Fragen', () => {
    for (const d of quizKatalog(datei).wahlen.filter(spielbar)) {
      const a = ausgewogenheit(d)
      expect(Object.values(a.richtung).reduce((x, y) => x + y, 0)).toBe(d.fragen.length)
      expect(a.profil).toHaveLength(d.parteien.length)
    }
  })
})
