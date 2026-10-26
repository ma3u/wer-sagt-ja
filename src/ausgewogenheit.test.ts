import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DIMENSIONEN, ausgewogenheit, istProfilfrage, istRatbar, rho, richtungVon, spearman } from './ausgewogenheit'
import { quizKatalog, spielbar, type FragenDatei } from './katalog'
import type { Positionswert, QuizPartei, QuizPosition } from './typen'

// CHES 2024: wirtschaftlich Linke < BSW < Grüne < SPD < CDU < FDP < AfD, gesellschaftlich Grüne < Linke < FDP < SPD <
// CDU < BSW < AfD. Volt hat keinen Wert.
const KURZ = ['SPD', 'Grüne', 'Linke', 'CDU', 'FDP', 'AfD', 'BSW', 'Volt']
const parteien: QuizPartei[] = KURZ.map((kurzname, i) => ({ id: i + 1, name: kurzname, kurzname, farbe: '#000', programm_url: 'https://example.org' }))

/** Positionen in der Reihenfolge von KURZ. */
const pos = (...werte: Positionswert[]): QuizPosition[] =>
  werte.map((position, i) => ({ partei_id: i + 1, position, kurzfassung: null, zitat: null, beleg_url: null, begruendung: null }))

let nr = 0
const frage = (...werte: Positionswert[]) => {
  const positionen = pos(...werte)
  return { id: `t${++nr}`, positionen, richtig: positionen.filter((p) => p.position === 'ja').map((p) => p.partei_id) }
}

// Ja von SPD, Grünen, Linken und BSW: wirtschaftlich die vier mit den niedrigsten Werten.
const staat = () => frage('ja', 'ja', 'ja', 'nein', 'nein', 'nein', 'ja', 'nein')
// Ja von CDU, FDP und AfD: wirtschaftlich die drei mit den höchsten Werten.
const markt = () => frage('nein', 'nein', 'nein', 'ja', 'ja', 'ja', 'nein', 'nein')

describe('spearman', () => {
  it('ist ±1 bei gleicher und umgekehrter Reihenfolge', () => {
    expect(spearman([1, 2, 3, 4], [10, 20, 30, 40])).toBeCloseTo(1)
    expect(spearman([1, 2, 3, 4], [40, 30, 20, 10])).toBeCloseTo(-1)
  })
  it('mittelt die Ränge bei Gleichstand', () => {
    expect(spearman([1, 1, 0, 0], [1, 2, 3, 4])).toBeCloseTo(-4 / Math.sqrt(20))
  })
  it('ist null ohne Streuung', () => {
    expect(spearman([1, 1, 1, 1], [1, 2, 3, 4])).toBeNull()
  })
})

describe('rho', () => {
  it('ist wirtschaftlich klar negativ, wenn die Parteien für mehr Staat Ja sagen – Volt zählt nicht mit', () => {
    const r = rho(staat().positionen, parteien, 'lrecon')
    expect(r).toBeLessThanOrEqual(-0.5)
    expect(rho(frage('ja', 'ja', 'ja', 'nein', 'nein', 'nein', 'ja', 'ja').positionen, parteien, 'lrecon')).toBe(r)
  })
  it('ist gesellschaftlich positiv, wenn CDU, BSW und AfD Ja sagen', () => {
    expect(rho(frage('nein', 'nein', 'nein', 'ja', 'nein', 'ja', 'ja', 'nein').positionen, parteien, 'galtan')).toBeGreaterThanOrEqual(0.5)
  })
  it('lässt „keine Aussage“ weg und ist null bei weniger als vier Werten', () => {
    const k = 'keine_aussage'
    expect(rho(frage('ja', k, k, 'nein', k, 'nein', k, 'ja').positionen, parteien, 'lrecon')).toBeNull()
  })
  it('kennt die Union', () => {
    const union = parteien.map((p) => (p.kurzname === 'CDU' ? { ...p, kurzname: 'Union' } : p))
    expect(rho(markt().positionen, union, 'lrecon')).toBe(rho(markt().positionen, parteien, 'lrecon'))
  })
})

describe('richtungVon', () => {
  it('teilt an der Schwelle |ρ| ≥ 0,5', () => {
    expect([0.5, 0.49, 0, -0.49, -0.5, null].map(richtungVon)).toEqual(['hoch', 'keine', 'keine', 'keine', 'niedrig', 'offen'])
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

describe('istRatbar', () => {
  it('braucht mindestens eine Partei, die weder Ja noch teils sagt', () => {
    expect(istRatbar(frage('ja', 'ja', 'teils', 'ja', 'ja', 'teils', 'ja', 'ja'))).toBe(false)
    expect(istRatbar(frage('ja', 'ja', 'teils', 'ja', 'ja', 'teils', 'ja', 'keine_aussage'))).toBe(true)
  })
})

describe('ausgewogenheit', () => {
  it('zählt Richtungen je Dimension, Profilfragen und Parteien ohne CHES-Wert', () => {
    const a = ausgewogenheit({ parteien, fragen: [staat(), markt(), frage('ja', 'nein', 'nein', 'ja', 'nein', 'nein', 'nein', 'nein')] })
    expect(a.dimension.lrecon.richtung).toEqual({ niedrig: 1, hoch: 1, keine: 1, offen: 0 })
    expect(a.profil.map((x) => x.anzahl)).toEqual([1, 0, 0, 1, 0, 0, 0, 0])
    expect(a.ohneChes.map((p) => p.kurzname)).toEqual(['Volt'])
  })

  it('warnt, wenn bei mehr als 60 % der gerichteten Fragen das Ja vom selben Pol kommt', () => {
    const a = ausgewogenheit({ parteien, fragen: [staat(), staat(), staat(), staat(), staat(), markt()] })
    expect(a.hinweise[0]).toBe(
      'Sozialstaatskonflikt: Bei 5 von 6 gerichteten Fragen (83 %) kommt das Ja eher von „soziale Gerechtigkeit“ – ' +
        'ebenso zugespitzte Fragen ergänzen, bei denen „Marktfreiheit“ Ja sagt.',
    )
  })

  it('warnt nicht bei ausgeglichener Richtung', () => {
    const a = ausgewogenheit({ parteien, fragen: [staat(), staat(), staat(), markt(), markt(), markt()] })
    expect(a.hinweise.some((h) => h.startsWith('Sozialstaatskonflikt'))).toBe(false)
  })

  it('warnt, wenn weniger als ein Drittel der Fragen auf einer Dimension gerichtet ist', () => {
    const quer = () => frage('ja', 'nein', 'ja', 'nein', 'ja', 'nein', 'ja', 'nein')
    const a = ausgewogenheit({ parteien, fragen: [quer(), quer(), quer(), staat()] })
    expect(a.hinweise).toContain('Sozialstaatskonflikt: Nur 1 von 4 Fragen sind gerichtet (Ziel: mindestens ein Drittel) – Fragen ergänzen, die diese Konfliktlinie abbilden.')
  })

  it('nennt nicht ratbare Fragen und Parteien mit zu wenigen Profilfragen', () => {
    const alle = frage('ja', 'ja', 'teils', 'ja', 'ja', 'teils', 'ja', 'ja')
    const a = ausgewogenheit({ parteien, fragen: [alle, frage('ja', 'nein', 'nein', 'nein', 'nein', 'nein', 'nein', 'nein')] })
    expect(a.nichtRatbar).toEqual([alle.id])
    expect(a.hinweise.join(' ')).toContain('SPD (1), Grüne (0)')
  })
})

describe('fragen.json', () => {
  const datei = JSON.parse(readFileSync(new URL('../public/fragen.json', import.meta.url), 'utf8')) as FragenDatei
  it('liefert für jeden spielbaren Katalog Kennzahlen über alle Fragen', () => {
    for (const d of quizKatalog(datei).wahlen.filter(spielbar)) {
      const a = ausgewogenheit(d)
      for (const dim of DIMENSIONEN)
        expect(Object.values(a.dimension[dim].richtung).reduce((x, y) => x + y, 0)).toBe(d.fragen.length)
      expect(a.profil).toHaveLength(d.parteien.length)
    }
  })
  it('hat für jede Partei außer Volt einen CHES-Wert', () => {
    const ohne = new Set(quizKatalog(datei).wahlen.flatMap((d) => ausgewogenheit(d).ohneChes.map((p) => p.kurzname)))
    expect([...ohne]).toEqual(['Volt'])
  })
})
