import { describe, expect, it } from 'vitest'
import { anleitung, anleitungRegeln } from './fragen'
import { bewerte, ZEIT_MS, zeitlimit } from './punkte'
import {
  alleFertig,
  alsGastNachricht,
  alsLeitungNachricht,
  aufloesen,
  bereinigeName,
  mitAntwort,
  mitSpieler,
  mitZeitfaktor,
  neuerZustand,
  ohneSpieler,
  rangliste,
  starte,
  waehleFragen,
  weiter,
  zurLobby,
  type QuizZustand,
} from './spielleitung'
import type { QuizFrage } from './typen'

describe('anleitung', () => {
  it('fragt immer nach Ja und nennt die Regeln', () => {
    expect(anleitung({ art: 'mehrfach' })).toBe('Wer sagt Ja? Mehrere sind richtig.')
    expect(anleitung({ art: 'einzeln' })).toBe('Nur eine Partei sagt Ja. Welche?')
    expect(anleitungRegeln({ art: 'mehrfach', status_quo: null })).toEqual(['„teils“ zählt nicht'])
    expect(anleitungRegeln({ art: 'mehrfach', status_quo: 'nein' })).toEqual(['„teils“ zählt nicht'])
    expect(anleitungRegeln({ art: 'einzeln', status_quo: 'ja' })).toEqual(['ein Tipp gibt ab', 'keine Aussage zählt als Ja'])
  })
})

describe('bewerte', () => {
  const mehr = { art: 'mehrfach' as const, richtig: [12, 13, 16], neutral: [15] }
  const ein = { art: 'einzeln' as const, richtig: [15], neutral: [] }

  it('volle Punkte für sofort und vollständig richtig, halbe bei Zeitablauf', () => {
    expect(bewerte(mehr, [12, 13, 16], 0).punkte).toBe(1000)
    expect(bewerte(mehr, [12, 13, 16], ZEIT_MS.mehrfach).punkte).toBe(500)
    expect(bewerte(ein, [15], ZEIT_MS.einzeln / 2).punkte).toBe(750)
  })

  it('Mehrfachauswahl: Fehlgriffe ziehen ab, „teils“ zählt nicht, nichts oder alles bringt 0', () => {
    expect(bewerte(mehr, [12, 13], 0)).toMatchObject({ treffer: 2, fehler: 0, punkte: 667 })
    expect(bewerte(mehr, [12, 13, 16, 15], 0)).toMatchObject({ fehler: 0, punkte: 1000 })
    expect(bewerte(mehr, [12, 13, 11], 0)).toMatchObject({ treffer: 2, fehler: 1, punkte: 333 })
    expect(bewerte(mehr, [], 0).punkte).toBe(0)
    expect(bewerte(mehr, [11, 12, 13, 14, 15, 16, 17], 0).punkte).toBe(0)
  })

  it('Einzelauswahl: nur genau die richtige Partei zählt', () => {
    expect(bewerte(ein, [14], 0).punkte).toBe(0)
    expect(bewerte(ein, [15, 14], 0).punkte).toBe(0)
  })

  it('Zeit je Frage (WCAG 2.2.1): doppelt verschiebt den Tempobonus, ohne Zeitlimit gibt es keinen', () => {
    expect(zeitlimit('mehrfach', 2)).toBe(60_000)
    expect(zeitlimit('einzeln', 0)).toBeNull()
    expect(bewerte(mehr, [12, 13, 16], 30_000, zeitlimit('mehrfach', 2)).punkte).toBe(750)
    expect(bewerte(mehr, [12, 13, 16], 999_999, null).punkte).toBe(1000)
    expect(bewerte(mehr, [12, 13], 5_000, null).punkte).toBe(667)
    expect(bewerte(ein, [15], null, null).punkte).toBe(0)
  })

  it('keine Antwort = 0; Zeiten außerhalb werden begrenzt; doppelte Kreuze zählen einmal', () => {
    expect(bewerte(ein, [15], null).punkte).toBe(0)
    expect(bewerte(ein, [15], -500).punkte).toBe(1000)
    expect(bewerte(ein, [15], 99_999).punkte).toBe(500)
    expect(bewerte(mehr, [12, 12, 12], 0).treffer).toBe(1)
  })
})

describe('Spielleitung', () => {
  const frage: QuizFrage = {
    id: 'h1', frage: 'F?', beschreibung: '', art: 'einzeln', status_quo: null, richtig: [15], neutral: [],
    positionen: [], zielkonflikte: [], ki_entwurf: false,
  }
  const raum = () => {
    let z: QuizZustand = neuerZustand('v1', { id: 'L', name: 'Leitung' })
    z = mitSpieler(z, { id: 'a', name: 'Ada', weg: 'direkt' }) as QuizZustand
    return mitSpieler(z, { id: 'b', name: 'Bo', weg: 'server' }) as QuizZustand
  }

  it('spielt eine Frage durch: Antworten sammeln, auflösen, Punkte vergeben, ans Ende', () => {
    let z = starte(raum(), ['h1'])
    expect(z).toMatchObject({ phase: 'frage', index: 0 })
    z = mitAntwort(mitAntwort(z, 'L'), 'a')
    expect(alleFertig(z)).toBe(false)
    z = mitAntwort(z, 'b')
    expect(alleFertig(z)).toBe(true)
    z = aufloesen(z, frage, { L: { auswahl: [15], ms: 0 }, a: { auswahl: [14], ms: 1000 } })
    expect(z.phase).toBe('aufloesung')
    expect(z.verlauf[0].b).toMatchObject({ ms: null, punkte: 0 })
    expect(z.spieler.map((s) => s.punkte)).toEqual([1000, 0, 0])
    z = weiter(z)
    expect(z.phase).toBe('ende')
    expect(rangliste(z.spieler).map((r) => [r.spieler.id, r.rang])).toEqual([['L', 1], ['a', 2], ['b', 2]])
  })

  it('Zeit je Frage lässt sich nur vor dem Start ändern und zählt bei der Auflösung', () => {
    let z = mitZeitfaktor(raum(), 2)
    expect(z.zeitfaktor).toBe(2)
    z = starte(z, ['h1'])
    expect(mitZeitfaktor(z, 0).zeitfaktor).toBe(2)
    z = aufloesen(z, frage, { L: { auswahl: [15], ms: 20_000 } })
    expect(z.verlauf[0].L.punkte).toBe(750)
    expect(alsLeitungNachricht({ t: 'zustand', du: 'a', z: { ...z, zeitfaktor: 5 } })).toBeNull()
  })

  it('nimmt nach dem Start und über acht Personen niemanden mehr auf', () => {
    expect(mitSpieler(starte(raum(), ['h1']), { id: 'c', name: 'C', weg: 'direkt' })).toBe('laeuft')
    let z = raum()
    for (const id of ['c', 'd', 'e', 'f', 'g']) z = mitSpieler(z, { id, name: id, weg: 'direkt' }) as QuizZustand
    expect(z.spieler).toHaveLength(8)
    expect(mitSpieler(z, { id: 'h', name: 'h', weg: 'direkt' })).toBe('voll')
  })

  it('wer im Spiel die Verbindung verliert, bleibt mit Punkten stehen und hält niemanden auf', () => {
    let z = ohneSpieler(starte(raum(), ['h1']), 'b')
    expect(z.spieler.find((s) => s.id === 'b')?.verbunden).toBe(false)
    z = mitAntwort(mitAntwort(z, 'L'), 'a')
    expect(alleFertig(z)).toBe(true)
    expect(zurLobby(z).spieler.map((s) => s.id)).toEqual(['L', 'a'])
    expect(ohneSpieler(raum(), 'a').spieler.map((s) => s.id)).toEqual(['L', 'b'])
  })

  it('zählt eine Antwort nur einmal und nur in der Fragephase', () => {
    const z = mitAntwort(mitAntwort(starte(raum(), ['h1']), 'a'), 'a')
    expect(z.beantwortet).toEqual(['a'])
    expect(mitAntwort(raum(), 'a').beantwortet).toEqual([])
    expect(mitAntwort(z, 'fremd').beantwortet).toEqual(['a'])
  })

  it('waehleFragen mischt und kürzt', () => {
    const f = (id: string) => ({ id, art: 'mehrfach' as const, richtig: [11, 12] })
    expect(waehleFragen([f('a'), f('b'), f('c')], 2, () => 0)).toEqual(['b', 'c'])
    expect(waehleFragen([f('a')], 5)).toEqual(['a'])
  })

  it('waehleFragen: keine Partei ist zweimal die einzige richtige Antwort, solange genug andere Fragen da sind', () => {
    const allein = (id: string, partei: number) => ({ id, art: 'einzeln' as const, richtig: [partei] })
    const mehr = (id: string) => ({ id, art: 'mehrfach' as const, richtig: [11, 12] })
    const fragen = [allein('x1', 15), allein('x2', 15), allein('x3', 15), mehr('m1'), mehr('m2'), allein('y', 12)]
    for (let i = 0; i < 20; i++) {
      const ids = waehleFragen(fragen, 4)
      expect(ids).toHaveLength(4)
      expect(ids.filter((id) => id.startsWith('x'))).toHaveLength(1)
    }
    // Reicht der Rest nicht, wird aufgefüllt.
    expect(waehleFragen([allein('x1', 15), allein('x2', 15)], 5)).toHaveLength(2)
  })
})

describe('Nachrichten', () => {
  it('Namen: Steuerzeichen raus, Leerraum zusammengefasst, höchstens 20 Zeichen', () => {
    expect(bereinigeName('  Ada\u0000 \n Lovelace‮ ', 'Gast')).toBe('Ada Lovelace')
    expect(bereinigeName('x'.repeat(50), 'Gast')).toHaveLength(20)
    expect(bereinigeName(42, 'Gast')).toBe('Gast')
  })

  it('verwirft fremde oder kaputte Nachrichten von Gästen', () => {
    expect(alsGastNachricht({ t: 'antwort', index: 0, auswahl: [15], ms: 1200 })).toEqual({ t: 'antwort', index: 0, auswahl: [15], ms: 1200 })
    expect(alsGastNachricht({ t: 'antwort', index: 0, auswahl: Array(8).fill(1), ms: 1 })).not.toBeNull()
    expect(alsGastNachricht({ t: 'antwort', index: 0, auswahl: Array(21).fill(1), ms: 1 })).toBeNull()
    expect(alsGastNachricht({ t: 'antwort', index: 0, auswahl: ['x'], ms: 1 })).toBeNull()
    expect(alsGastNachricht({ t: 'antwort', index: 0, auswahl: [1], ms: Infinity })).toBeNull()
    expect(alsGastNachricht({ t: 'zustand' })).toBeNull()
    expect(alsGastNachricht('hallo')).toBeNull()
  })

  it('nimmt Schnappschüsse der Spielleitung nur in erwarteter Form an', () => {
    const z = neuerZustand('v1', { id: 'L', name: 'Leitung' })
    expect(alsLeitungNachricht({ t: 'zustand', du: 'a', z })).toMatchObject({ t: 'zustand', du: 'a' })
    expect(alsLeitungNachricht({ t: 'zustand', du: 'a', z: { ...z, phase: 'hack' } })).toBeNull()
    expect(alsLeitungNachricht({ t: 'abgelehnt', grund: 'voll' })).toEqual({ t: 'abgelehnt', grund: 'voll' })
  })
})
