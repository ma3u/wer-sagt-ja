import type { QuizFrage, QuizPartei, QuizPosition } from './typen.ts'

// Ausgewogenheit eines Katalogs (Issue #1). Das Spielprinzip bleibt: Gefragt wird immer, wer Ja sagt, und die Fragen
// dürfen zuspitzen. Ausgewogen sein muss die Auswahl: Jede Partei soll ihre Forderungen als Ja-Frage wiederfinden,
// und ein Katalog soll nicht überwiegend Forderungen einer Seite abfragen. Diese Kennzahlen machen das sichtbar –
// `npm run fragen` warnt, die Übersicht (#/fragen) zeigt sie. Sie ändern nichts am Spiel und an keiner Position.

/** Grobe Lager für den Richtungswert. Eine bewusste Vereinfachung; alle anderen Parteien bleiben außen vor. */
export type Lager = 'links' | 'rechts'

/** Zuordnung nach Kurzname. BSW, Volt, Freie Wähler u. a. lassen sich nicht eindeutig zuordnen und zählen nicht mit. */
export const LAGER: Readonly<Record<string, Lager>> = {
  SPD: 'links',
  Grüne: 'links',
  Linke: 'links',
  Union: 'rechts',
  CDU: 'rechts',
  CSU: 'rechts',
  FDP: 'rechts',
  AfD: 'rechts',
}

/** Wohin das Ja einer Frage zeigt; `offen`, wenn in einem Lager keine Partei eine Aussage hat. */
export type Richtung = 'links' | 'quer' | 'rechts' | 'offen'

export const RICHTUNG_TEXT: Record<Richtung, string> = {
  links: 'Ja eher links',
  quer: 'gemischt',
  rechts: 'Ja eher rechts',
  offen: 'nicht bestimmbar',
}

/** Ab diesem Betrag zählt eine Frage als gerichtet (Richtungswert zwischen −1 und +1). */
export const RICHTUNG_SCHWELLE = 0.5
/** Höchstens so viel der gerichteten Fragen eines Katalogs dürfen in dieselbe Richtung zeigen. */
export const HOECHSTANTEIL = 0.6
/** Erst ab so vielen gerichteten Fragen ist der Anteil aussagekräftig. */
export const MINDEST_GERICHTET = 6
/** So viele Profilfragen soll jede Partei je Katalog mindestens haben. */
export const MIN_PROFILFRAGEN = 2
/** Eine Profilfrage: Die Partei sagt Ja und höchstens so viele Parteien insgesamt. */
export const PROFIL_HOECHSTENS = 2

const WERT: Partial<Record<QuizPosition['position'], number>> = { ja: 1, teils: 0.5, nein: 0 }

/**
 * Richtungswert einer Frage: Ja-Anteil links minus Ja-Anteil rechts, je nur unter Parteien mit Aussage („teils“ zählt
 * halb). +1 heißt: links sagen alle Ja, rechts keine. null, wenn ein Lager gar keine Aussage hat.
 */
export function richtungswert(positionen: QuizPosition[], parteien: QuizPartei[]): number | null {
  const werte: Record<Lager, number[]> = { links: [], rechts: [] }
  for (const p of positionen) {
    const kurz = parteien.find((x) => x.id === p.partei_id)?.kurzname
    const lager = kurz ? LAGER[kurz] : undefined
    const wert = WERT[p.position]
    if (lager && wert !== undefined) werte[lager].push(wert)
  }
  if (!werte.links.length || !werte.rechts.length) return null
  const schnitt = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  return schnitt(werte.links) - schnitt(werte.rechts)
}

export function richtungVon(wert: number | null): Richtung {
  if (wert === null) return 'offen'
  if (wert >= RICHTUNG_SCHWELLE) return 'links'
  if (wert <= -RICHTUNG_SCHWELLE) return 'rechts'
  return 'quer'
}

/** Profilfrage einer Partei: Sie sagt Ja, und insgesamt sagen höchstens `PROFIL_HOECHSTENS` Parteien Ja. */
export const istProfilfrage = (frage: Pick<QuizFrage, 'richtig'>, parteiId: number) =>
  frage.richtig.includes(parteiId) && frage.richtig.length <= PROFIL_HOECHSTENS

export interface Ausgewogenheit {
  /** Zahl der Fragen je Richtung. */
  richtung: Record<Richtung, number>
  /** Anteil „Ja eher links“ an allen gerichteten Fragen (links + rechts); null ohne gerichtete Fragen. */
  anteilLinks: number | null
  /** Profilfragen je Partei, in der Reihenfolge der Parteienliste. */
  profil: { partei: QuizPartei; anzahl: number }[]
  /** Was auffällt, als Sätze – leer heißt: nichts zu beanstanden. */
  hinweise: string[]
}

type Katalogdaten = { parteien: QuizPartei[]; fragen: Pick<QuizFrage, 'positionen' | 'richtig'>[] }

/** Kennzahlen eines Katalogs (einer Wahl). */
export function ausgewogenheit({ parteien, fragen }: Katalogdaten): Ausgewogenheit {
  const richtung: Record<Richtung, number> = { links: 0, quer: 0, rechts: 0, offen: 0 }
  for (const f of fragen) richtung[richtungVon(richtungswert(f.positionen, parteien))]++
  const gerichtet = richtung.links + richtung.rechts
  const anteilLinks = gerichtet ? richtung.links / gerichtet : null
  const profil = parteien.map((partei) => ({ partei, anzahl: fragen.filter((f) => istProfilfrage(f, partei.id)).length }))

  const hinweise: string[] = []
  if (anteilLinks !== null && gerichtet >= MINDEST_GERICHTET) {
    const [seite, anteil, anzahl] =
      anteilLinks > HOECHSTANTEIL
        ? ['links', anteilLinks, richtung.links]
        : 1 - anteilLinks > HOECHSTANTEIL
          ? ['rechts', 1 - anteilLinks, richtung.rechts]
          : [null, 0, 0]
    if (seite)
      hinweise.push(
        `${anzahl} von ${gerichtet} gerichteten Fragen (${Math.round(anteil * 100)} %) zeigen mit dem Ja nach ${seite} – ` +
          `ebenso zugespitzte Fragen aus der Gegenrichtung ergänzen.`,
      )
  }
  const zuWenig = profil.filter((x) => x.anzahl < MIN_PROFILFRAGEN)
  if (zuWenig.length)
    hinweise.push(
      `Weniger als ${MIN_PROFILFRAGEN} Profilfragen: ${zuWenig.map((x) => `${x.partei.kurzname} (${x.anzahl})`).join(', ')}.`,
    )
  if (richtung.offen)
    hinweise.push(`${richtung.offen} Fragen ohne Aussage eines ganzen Lagers – „keine Aussage“ dort nachprüfen.`)
  return { richtung, anteilLinks, profil, hinweise }
}
