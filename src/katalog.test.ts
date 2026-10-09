import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { alsFrage, fehlerIn, fehlerInDatei, pruefsumme, quizDaten, type FragenDatei, type FragenEintrag } from './katalog'
import { FRAGEN_JE_SPIEL } from './spielleitung'
import type { Positionswert, QuizPartei } from './typen'

const parteien: QuizPartei[] = [1, 2, 3, 4].map((id) => ({ id, name: `P${id}`, kurzname: `P${id}`, farbe: '#000', programm_url: '' }))

function eintrag(werte: Positionswert[], status_quo: FragenEintrag['status_quo'] = null): FragenEintrag {
  return {
    id: 'x1',
    frage: 'Soll es das geben?',
    beschreibung: '',
    status_quo,
    ki_entwurf: false,
    zielkonflikte: [],
    positionen: werte.map((position, i) => ({
      partei_id: i + 1,
      position,
      kurzfassung: 'k',
      zitat: position === 'keine_aussage' ? null : 'Zitat',
      beleg_url: position === 'keine_aussage' ? null : 'https://example.org',
      begruendung: position === 'keine_aussage' ? 'Kapitel durchsucht' : null,
    })),
  }
}

describe('Fragendatei (katalog.ts)', () => {
  it('leitet richtig, „teils“ und die Antwortart aus den Positionen ab', () => {
    const f = alsFrage(eintrag(['ja', 'teils', 'nein', 'ja']))
    expect(f).toMatchObject({ art: 'mehrfach', richtig: [1, 4], neutral: [2] })
    expect(alsFrage(eintrag(['nein', 'ja', 'teils', 'nein']))).toMatchObject({ art: 'einzeln', richtig: [2], neutral: [] })
  })

  it('„keine Aussage“ zählt wie die heutige Lage', () => {
    expect(alsFrage(eintrag(['keine_aussage', 'ja', 'nein', 'nein'], 'ja')).richtig).toEqual([1, 2])
    expect(alsFrage(eintrag(['keine_aussage', 'ja', 'nein', 'nein'], null)).richtig).toEqual([2])
  })

  it('fragt nie nach Nein: ohne Ja-Partei ist eine Frage nicht spielbar', () => {
    expect(fehlerIn(eintrag(['nein', 'nein', 'teils', 'keine_aussage']), parteien)).toEqual([
      'keine Partei sagt Ja – das Quiz fragt nur, wer Ja sagt',
    ])
    expect(fehlerIn(eintrag(['ja', 'ja', 'ja', 'ja']), parteien)).toEqual(['alle Parteien sagen Ja – es gibt nichts zu raten'])
  })

  it('verlangt je Partei genau eine Position mit Beleg', () => {
    const e = eintrag(['ja', 'nein', 'nein'])
    e.positionen[1] = { ...e.positionen[1], zitat: null }
    expect(fehlerIn(e, parteien)).toEqual(['P4: keine Position', 'P2: „nein“ ohne Zitat und Beleg-Link'])
  })

  it('lässt fehlerhafte Fragen aus dem Spiel und meldet doppelte IDs', () => {
    const datei: FragenDatei = { parteien, fragen: [eintrag(['ja', 'nein', 'nein', 'nein']), eintrag(['nein', 'nein', 'nein', 'nein'])] }
    expect(quizDaten(datei).fragen).toHaveLength(1)
    expect(fehlerInDatei(datei)[0]).toBe('x1: id doppelt')
  })

  it('Prüfsumme ist stabil und unterscheidet Fassungen', () => {
    expect(pruefsumme('abc')).toBe(pruefsumme('abc'))
    expect(pruefsumme('abc')).not.toBe(pruefsumme('abd'))
    expect(pruefsumme('')).toMatch(/^[0-9a-f]{8}$/)
  })

  it('public/fragen.json ist fehlerfrei und reicht für ein Spiel', () => {
    const datei = JSON.parse(readFileSync(new URL('../public/fragen.json', import.meta.url), 'utf8')) as FragenDatei
    expect(fehlerInDatei(datei)).toEqual([])
    expect(quizDaten(datei).fragen.length).toBeGreaterThanOrEqual(FRAGEN_JE_SPIEL)
  })
})
