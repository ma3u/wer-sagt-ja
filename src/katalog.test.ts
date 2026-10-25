import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  alsFrage,
  fehlerIn,
  fehlerInDatei,
  fehlerInWahl,
  pruefsumme,
  quizDaten,
  quizKatalog,
  spielbar,
  wahlFuer,
  type FragenDatei,
  type FragenEintrag,
  type WahlEintrag,
} from './katalog'
import { FRAGEN_JE_SPIEL } from './spielleitung'
import type { Positionswert, QuizPartei } from './typen'

const parteien: QuizPartei[] = [1, 2, 3, 4].map((id) => ({ id, name: `P${id}`, kurzname: `P${id}`, farbe: '#000', programm_url: 'https://example.org' }))
const wahl: WahlEintrag = { id: 'w1', name: 'Testwahl 2026', kurz: 'Test 2026', datum: '2026-09-20', parteien }

function eintrag(werte: Positionswert[], id = 'x1', wahlId = 'w1'): FragenEintrag {
  return {
    id,
    wahl: wahlId,
    frage: 'Soll es das geben?',
    beschreibung: '',
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

  it('„keine Aussage“ bleibt keine Aussage: weder Ja noch „teils“', () => {
    expect(alsFrage(eintrag(['keine_aussage', 'ja', 'nein', 'ja']))).toMatchObject({ richtig: [2, 4], neutral: [] })
  })

  it('fragt nie nach Nein: ohne Ja-Partei ist eine Frage nicht spielbar', () => {
    expect(fehlerIn(eintrag(['nein', 'nein', 'teils', 'keine_aussage']), parteien)).toEqual([
      'keine Partei sagt Ja – das Quiz fragt nur, wer Ja sagt',
    ])
    expect(fehlerIn(eintrag(['ja', 'ja', 'ja', 'ja']), parteien)).toEqual(['alle Parteien sagen Ja – es gibt nichts zu raten'])
  })

  it('braucht eine Partei, die Nein oder nichts sagt – „teils“ allein lässt nichts zu raten', () => {
    expect(fehlerIn(eintrag(['ja', 'ja', 'teils', 'teils']), parteien)).toEqual([
      'keine Partei sagt Nein oder nichts – es gibt nichts zu raten',
    ])
    expect(fehlerIn(eintrag(['ja', 'ja', 'teils', 'keine_aussage']), parteien)).toEqual([])
  })

  it('verlangt je Partei genau eine Position mit Beleg', () => {
    const e = eintrag(['ja', 'nein', 'nein'])
    e.positionen[1] = { ...e.positionen[1], zitat: null }
    expect(fehlerIn(e, parteien)).toEqual(['P4: keine Position', 'P2: „nein“ ohne Zitat und Beleg-Link'])
  })

  it('„geprueft“ braucht Prüfende und den Issue-Link als Nachweis', () => {
    const e = eintrag(['ja', 'nein', 'nein', 'nein'])
    e.positionen[0] = { ...e.positionen[0], geprueft: { von: 'P1', issue_url: 'https://github.com/x/y/issues/1' } }
    expect(fehlerIn(e, parteien)).toEqual([])
    e.positionen[0] = { ...e.positionen[0], geprueft: { von: '', issue_url: 'issues/1' } }
    expect(fehlerIn(e, parteien)).toEqual(['P1: „geprueft“ braucht „von“ und „issue_url“ (https-Link zum Issue)'])
  })

  it('lässt fehlerhafte Fragen aus dem Spiel und meldet doppelte IDs', () => {
    const datei: FragenDatei = { wahlen: [wahl], fragen: [eintrag(['ja', 'nein', 'nein', 'nein']), eintrag(['nein', 'nein', 'nein', 'nein'])] }
    expect(quizDaten(datei).fragen).toHaveLength(1)
    expect(fehlerInDatei(datei)[0]).toBe('x1: id doppelt')
  })

  it('prüft Wahlen: Kennung, Datum und Parteien', () => {
    expect(fehlerInWahl(wahl)).toEqual([])
    expect(fehlerInWahl({ ...wahl, id: 'be-26', datum: '2026' })).toEqual(['id: nur Kleinbuchstaben und Ziffern', 'datum: ISO-Datum (JJJJ-MM-TT)'])
    expect(fehlerInWahl({ ...wahl, parteien: [parteien[0], { ...parteien[1], kurzname: 'P1' }] })).toEqual(['Kurzname „P1“ doppelt'])
    expect(fehlerInWahl({ ...wahl, parteien: [parteien[0]] })).toEqual(['mindestens zwei Parteien – oder keine für eine angekündigte Wahl'])
    expect(fehlerInDatei({ wahlen: [wahl], fragen: [eintrag(['ja', 'nein', 'nein', 'nein'], 'x1', 'fremd')] })).toEqual(['x1: Wahl „fremd“ unbekannt'])
  })

  it('trennt die Wahlen im Katalog: eigene Parteien, eigene Fragen, die erste ist die Standardwahl', () => {
    const zweite: WahlEintrag = {
      id: 'w2',
      name: 'Andere Wahl 2027',
      kurz: 'Andere 2027',
      datum: '2027-05-09',
      parteien: parteien.slice(0, 2).map((p) => ({ ...p, id: p.id + 10, kurzname: `Q${p.id}` })),
    }
    const f2 = eintrag(['ja', 'nein'], 'y1', 'w2')
    f2.positionen = f2.positionen.map((p) => ({ ...p, partei_id: p.partei_id + 10 }))
    const datei: FragenDatei = { wahlen: [wahl, zweite], fragen: [eintrag(['ja', 'nein', 'nein', 'nein']), f2] }
    expect(fehlerInDatei(datei)).toEqual([])
    const k = quizKatalog(datei)
    expect(k.wahlen.map((d) => d.wahl.id)).toEqual(['w1', 'w2'])
    expect(k.wahlen[0].fragen.map((f) => f.id)).toEqual(['x1'])
    expect(wahlFuer(k, 'w2')?.fragen.map((f) => f.id)).toEqual(['y1'])
    expect(wahlFuer(k, 'w2')?.parteien.map((p) => p.kurzname)).toEqual(['Q1', 'Q2'])
    expect(wahlFuer(k, 'w9')).toBeNull()
    expect(wahlFuer(k, null)).toBeNull()
    // Dieselbe Fassung für alle Wahlen: Gäste prüfen die Prüfsumme der ganzen Datei.
    expect(k.wahlen[1].version).toBe(k.version)
    expect(quizDaten(datei).wahl.id).toBe('w1')
  })

  it('angekündigte Wahlen ohne Parteien stehen im Katalog, sind aber nicht spielbar', () => {
    const kommend: WahlEintrag = { id: 'w3', name: 'Kommende Wahl 2027', kurz: 'Kommend 2027', datum: '2027-04-25', parteien: [] }
    const datei: FragenDatei = { wahlen: [wahl, kommend], fragen: [eintrag(['ja', 'nein', 'nein', 'nein'])] }
    expect(fehlerInDatei(datei)).toEqual([])
    const k = quizKatalog(datei)
    expect(k.wahlen.map((d) => [d.wahl.id, spielbar(d)])).toEqual([['w1', true], ['w3', false]])
    expect(fehlerInDatei({ ...datei, fragen: [...datei.fragen, eintrag(['ja', 'nein'], 'y1', 'w3')] })).toEqual([
      'y1: Partei 1: nicht in der Parteienliste dieser Wahl',
      'y1: Partei 2: nicht in der Parteienliste dieser Wahl',
      'y1: alle Parteien sagen Ja – es gibt nichts zu raten',
    ])
  })

  it('Prüfsumme ist stabil und unterscheidet Fassungen', () => {
    expect(pruefsumme('abc')).toBe(pruefsumme('abc'))
    expect(pruefsumme('abc')).not.toBe(pruefsumme('abd'))
    expect(pruefsumme('')).toMatch(/^[0-9a-f]{8}$/)
  })

  it('public/fragen.json ist fehlerfrei und jede Wahl reicht für ein Spiel', () => {
    const datei = JSON.parse(readFileSync(new URL('../public/fragen.json', import.meta.url), 'utf8')) as FragenDatei
    expect(fehlerInDatei(datei)).toEqual([])
    const k = quizKatalog(datei)
    expect(k.wahlen[0].wahl.id).toBe('btw25')
    for (const d of k.wahlen.filter(spielbar)) expect(d.fragen.length).toBeGreaterThanOrEqual(FRAGEN_JE_SPIEL)
    expect(k.wahlen.filter(spielbar).map((d) => d.wahl.id)).toEqual(expect.arrayContaining(['btw25', 'be26']))
  })
})
