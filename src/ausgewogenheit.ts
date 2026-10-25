import type { QuizFrage, QuizPartei, QuizPosition } from './typen.ts'

// Ausgewogenheit eines Katalogs (Issue #1). Das Spielprinzip bleibt: Gefragt wird immer, wer Ja sagt, und die Fragen
// dürfen zuspitzen. Ausgewogen sein muss die Auswahl: Jede Partei soll ihre Forderungen als Ja-Frage wiederfinden,
// und ein Katalog soll nicht überwiegend Forderungen einer Parteigruppe abfragen. Diese Kennzahlen machen das
// sichtbar – `npm run fragen` warnt, die Übersicht (#/fragen) zeigt sie. Sie ändern nichts am Spiel und an keiner
// Position.
//
// Die beiden Gruppen sind keine ideologische Einordnung („links“/„rechts“), sondern nur zwei Parteigruppen als grober
// Frühwarnindikator. Ein Links-rechts-Strahl bildet das Parteiensystem nicht ab (mindestens zwei Dimensionen:
// wirtschaftlich und gesellschaftlich, GAL-TAN) – siehe Issue #1, „Was die Kategorien bedeuten“.

/** Zwei Parteigruppen für den Richtungswert – eine bewusste Vereinfachung, keine ideologische Einordnung. */
export type Gruppe = 'a' | 'b'

/** Wie die Gruppen in Texten heißen: nach ihren Parteien, nicht nach Lagern. */
export const GRUPPE_NAME: Record<Gruppe, string> = {
  a: 'SPD/Grüne/Linke',
  b: 'CDU/CSU/FDP/AfD',
}

/** Zuordnung nach Kurzname. BSW, Volt, Freie Wähler u. a. gehören zu keiner Gruppe und zählen hier nicht mit. */
export const GRUPPE: Readonly<Record<string, Gruppe>> = {
  SPD: 'a',
  Grüne: 'a',
  Linke: 'a',
  Union: 'b',
  CDU: 'b',
  CSU: 'b',
  FDP: 'b',
  AfD: 'b',
}

/** Von welcher Gruppe das Ja einer Frage eher kommt; `offen`, wenn in einer Gruppe keine Partei eine Aussage hat. */
export type Richtung = 'a' | 'gemischt' | 'b' | 'offen'

export const RICHTUNG_TEXT: Record<Richtung, string> = {
  a: `Ja eher ${GRUPPE_NAME.a}`,
  gemischt: 'gemischt',
  b: `Ja eher ${GRUPPE_NAME.b}`,
  offen: 'nicht bestimmbar',
}

/** Ab diesem Betrag zählt eine Frage als gerichtet (Richtungswert zwischen −1 und +1). */
export const RICHTUNG_SCHWELLE = 0.5
/** Höchstens so viel der gerichteten Fragen eines Katalogs dürfen von derselben Gruppe kommen. */
export const HOECHSTANTEIL = 0.6
/** Erst ab so vielen gerichteten Fragen ist der Anteil aussagekräftig. */
export const MINDEST_GERICHTET = 6
/** So viele Profilfragen soll jede Partei je Katalog mindestens haben. */
export const MIN_PROFILFRAGEN = 2
/** Eine Profilfrage: Die Partei sagt Ja und höchstens so viele Parteien insgesamt. */
export const PROFIL_HOECHSTENS = 2

const WERT: Partial<Record<QuizPosition['position'], number>> = { ja: 1, teils: 0.5, nein: 0 }

/**
 * Richtungswert einer Frage: Ja-Anteil der Gruppe A minus Ja-Anteil der Gruppe B, je nur unter Parteien mit Aussage
 * („teils“ zählt halb). +1 heißt: In A sagen alle Ja, in B keine. null, wenn eine Gruppe gar keine Aussage hat.
 */
export function richtungswert(positionen: QuizPosition[], parteien: QuizPartei[]): number | null {
  const werte: Record<Gruppe, number[]> = { a: [], b: [] }
  for (const p of positionen) {
    const kurz = parteien.find((x) => x.id === p.partei_id)?.kurzname
    const gruppe = kurz ? GRUPPE[kurz] : undefined
    const wert = WERT[p.position]
    if (gruppe && wert !== undefined) werte[gruppe].push(wert)
  }
  if (!werte.a.length || !werte.b.length) return null
  const schnitt = (xs: number[]) => xs.reduce((x, y) => x + y, 0) / xs.length
  return schnitt(werte.a) - schnitt(werte.b)
}

export function richtungVon(wert: number | null): Richtung {
  if (wert === null) return 'offen'
  if (wert >= RICHTUNG_SCHWELLE) return 'a'
  if (wert <= -RICHTUNG_SCHWELLE) return 'b'
  return 'gemischt'
}

/** Profilfrage einer Partei: Sie sagt Ja, und insgesamt sagen höchstens `PROFIL_HOECHSTENS` Parteien Ja. */
export const istProfilfrage = (frage: Pick<QuizFrage, 'richtig'>, parteiId: number) =>
  frage.richtig.includes(parteiId) && frage.richtig.length <= PROFIL_HOECHSTENS

export interface Ausgewogenheit {
  /** Zahl der Fragen je Richtung. */
  richtung: Record<Richtung, number>
  /** Anteil „Ja eher Gruppe A“ an allen gerichteten Fragen (A + B); null ohne gerichtete Fragen. */
  anteilA: number | null
  /** Profilfragen je Partei, in der Reihenfolge der Parteienliste. */
  profil: { partei: QuizPartei; anzahl: number }[]
  /** Was auffällt, als Sätze – leer heißt: nichts zu beanstanden. */
  hinweise: string[]
}

type Katalogdaten = { parteien: QuizPartei[]; fragen: Pick<QuizFrage, 'positionen' | 'richtig'>[] }

/** Kennzahlen eines Katalogs (einer Wahl). */
export function ausgewogenheit({ parteien, fragen }: Katalogdaten): Ausgewogenheit {
  const richtung: Record<Richtung, number> = { a: 0, gemischt: 0, b: 0, offen: 0 }
  for (const f of fragen) richtung[richtungVon(richtungswert(f.positionen, parteien))]++
  const gerichtet = richtung.a + richtung.b
  const anteilA = gerichtet ? richtung.a / gerichtet : null
  const profil = parteien.map((partei) => ({ partei, anzahl: fragen.filter((f) => istProfilfrage(f, partei.id)).length }))

  const hinweise: string[] = []
  if (anteilA !== null && gerichtet >= MINDEST_GERICHTET) {
    const ueber: Gruppe | null = anteilA > HOECHSTANTEIL ? 'a' : 1 - anteilA > HOECHSTANTEIL ? 'b' : null
    if (ueber) {
      const anzahl = richtung[ueber]
      hinweise.push(
        `Bei ${anzahl} von ${gerichtet} gerichteten Fragen (${Math.round((anzahl / gerichtet) * 100)} %) kommt das Ja ` +
          `eher von ${GRUPPE_NAME[ueber]} – ebenso zugespitzte Fragen ergänzen, bei denen ` +
          `${GRUPPE_NAME[ueber === 'a' ? 'b' : 'a']} Ja sagen.`,
      )
    }
  }
  const zuWenig = profil.filter((x) => x.anzahl < MIN_PROFILFRAGEN)
  if (zuWenig.length)
    hinweise.push(
      `Weniger als ${MIN_PROFILFRAGEN} Profilfragen: ${zuWenig.map((x) => `${x.partei.kurzname} (${x.anzahl})`).join(', ')}.`,
    )
  if (richtung.offen)
    hinweise.push(`${richtung.offen} Fragen ohne Aussage einer ganzen Parteigruppe – „keine Aussage“ dort nachprüfen.`)
  return { richtung, anteilA, profil, hinweise }
}
