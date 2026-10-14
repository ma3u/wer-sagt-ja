import { describe, expect, it } from 'vitest'
import type { QuizFrage, QuizPartei } from './typen'
import { parteiPfad, positionBestaetigen, positionMelden, uebersichtAus, uebersichtHash } from './uebersicht'

const partei: QuizPartei = { id: 18, name: 'Volt Deutschland', kurzname: 'Volt', farbe: '#502379', programm_url: 'https://volt.example/p.pdf' }
const frage: QuizFrage = {
  id: 'h1',
  frage: 'Soll es ein Tempolimit geben?',
  beschreibung: 'Ob überall 130 gilt.',
  art: 'einzeln',
  richtig: [18],
  neutral: [],
  positionen: [
    {
      partei_id: 18,
      position: 'ja',
      kurzfassung: 'Will 130.',
      zitat: 'Wir wollen ein Tempolimit von 130 km/h.',
      beleg_url: 'https://volt.example/p.pdf#page=12',
      begruendung: null,
    },
  ],
  zielkonflikte: [],
  ki_entwurf: true,
}

describe('Fragenübersicht (uebersicht.ts)', () => {
  it('bildet Pfadstücke ohne Umlaute und Sonderzeichen', () => {
    expect(parteiPfad({ kurzname: 'Grüne' })).toBe('gruene')
    expect(parteiPfad({ kurzname: 'CDU/CSU' })).toBe('cdu-csu')
    expect(parteiPfad(partei)).toBe('volt')
  })

  it('baut und liest Adressen', () => {
    expect(uebersichtHash()).toBe('#/fragen')
    expect(uebersichtHash('volt')).toBe('#/fragen/volt')
    expect(uebersichtHash('volt', 'h1')).toBe('#/fragen/volt/h1')
    expect(uebersichtHash(null, 'h1')).toBe('#/fragen/alle/h1')
    expect(uebersichtAus('#/fragen')).toEqual({ wahl: null, partei: null, frage: null })
    expect(uebersichtAus('#/fragen/')).toEqual({ wahl: null, partei: null, frage: null })
    expect(uebersichtAus('#/fragen/volt')).toEqual({ wahl: null, partei: 'volt', frage: null })
    expect(uebersichtAus('#/fragen/volt/h1')).toEqual({ wahl: null, partei: 'volt', frage: 'h1' })
    expect(uebersichtAus('#/fragen/alle/h1')).toEqual({ wahl: null, partei: null, frage: 'h1' })
  })

  it('verwechselt Raumnamen und andere Seiten nicht mit der Übersicht', () => {
    expect(uebersichtAus('#/')).toBeNull()
    expect(uebersichtAus('#/fragenkatalog')).toBeNull()
    expect(uebersichtAus('#/kluge-eule-27')).toBeNull()
    expect(uebersichtAus('#/impressum')).toBeNull()
  })

  it('andere Wahlen stehen vor „fragen“ – die Standardwahl bleibt ohne Wahl in der Adresse', () => {
    expect(uebersichtHash(null, null, 'be26')).toBe('#/be26/fragen')
    expect(uebersichtHash('volt', null, 'be26')).toBe('#/be26/fragen/volt')
    expect(uebersichtHash(null, 'be-1', 'be26')).toBe('#/be26/fragen/alle/be-1')
    expect(uebersichtHash('volt', 'h1', null)).toBe('#/fragen/volt/h1')
    expect(uebersichtAus('#/be26/fragen')).toEqual({ wahl: 'be26', partei: null, frage: null })
    expect(uebersichtAus('#/be26/fragen/volt/be-1')).toEqual({ wahl: 'be26', partei: 'volt', frage: 'be-1' })
    // Raumnamen haben einen Bindestrich, Raumcodes Großbuchstaben – nie eine Wahl.
    expect(uebersichtAus('#/kluge-eule-27/fragen')).toBeNull()
    expect(uebersichtAus('#/ABC123/fragen')).toBeNull()
  })

  it('füllt das Issue zu einer Position mit Frage, Partei, Zitat und Beleg', () => {
    const url = new URL(positionMelden(frage, partei, frage.positionen[0], 'https://example.org/#/fragen/volt/h1'))
    expect(url.origin + url.pathname).toBe('https://github.com/ma3u/wer-sagt-ja/issues/new')
    expect(url.searchParams.get('title')).toBe('Volt zu h1: Soll es ein Tempolimit geben?')
    const text = url.searchParams.get('body') ?? ''
    expect(text).toContain('**Partei:** Volt Deutschland')
    expect(text).toContain('**Eingetragen:** Ja')
    expect(text).toContain('„Wir wollen ein Tempolimit von 130 km/h.“')
    expect(text).toContain('https://volt.example/p.pdf#page=12')
    expect(text).toContain('**Richtig wäre:**')
    expect(text).toContain('**Wörtliches Zitat aus dem Wahlprogramm mit Seite:**')
    expect(text).toContain('Gesehen unter https://example.org/#/fragen/volt/h1')
  })

  it('nennt die Wahl im Issue, wenn sie bekannt ist', () => {
    const wahl = { id: 'be26', name: 'Abgeordnetenhauswahl Berlin 2026', kurz: 'Berlin 2026', datum: '2026-09-20' }
    const melden = new URL(positionMelden(frage, partei, frage.positionen[0], 'https://example.org/#/be26/fragen', wahl)).searchParams.get('body') ?? ''
    expect(melden).toContain('**Wahl:** Abgeordnetenhauswahl Berlin 2026')
    expect(melden).toContain('**Wörtliches Zitat aus dem Wahlprogramm zur Abgeordnetenhauswahl Berlin 2026 mit Seite:**')
    const bestaetigen = new URL(positionBestaetigen(frage, partei, frage.positionen[0], 'https://example.org/#/be26/fragen', wahl)).searchParams.get('body') ?? ''
    expect(bestaetigen).toContain('**Geprüft gegen:** Wahlprogramm zur Abgeordnetenhauswahl Berlin 2026, Seite …')
  })

  it('nimmt die Frage selbst mit ins Meldeissue', () => {
    const text = new URL(positionMelden(frage, partei, frage.positionen[0], 'https://example.org/#/fragen')).searchParams.get('body') ?? ''
    expect(text).toContain('**Beschreibung:** Ob überall 130 gilt.')
    expect(text).toContain('**Beschreibung:** Ob überall 130 gilt.')
    expect(text).toContain('**Betrifft die Frage selbst?**')
  })

  it('füllt das Bestätigungs-Issue mit Position und Feld für die prüfende Person', () => {
    const url = new URL(positionBestaetigen(frage, partei, frage.positionen[0], 'https://example.org/#/fragen/volt/h1'))
    expect(url.searchParams.get('title')).toBe('Geprüft: Volt zu h1 stimmt')
    const text = url.searchParams.get('body') ?? ''
    expect(text).toContain('**Eingetragen:** Ja')
    expect(text).toContain('**Geprüft von:**')
    expect(text).toContain('Gesehen unter https://example.org/#/fragen/volt/h1')
  })
})
