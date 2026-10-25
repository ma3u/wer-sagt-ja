import type { Antwortart, QuizFrage, QuizPosition } from './typen.ts'

// Punkte im Quiz: Anteil richtig × Tempo. Höchstens 1000 je Frage.

export const MAX_PUNKTE = 1000

/** Antwortzeit je Frage in Millisekunden. */
export const ZEIT_MS: Record<Antwortart, number> = { einzeln: 20_000, mehrfach: 30_000 }

/** Zeit je Frage, vor dem Start einstellbar (WCAG 2.2.1): 1 = normal, 2 = doppelt, 0 = ohne Zeitlimit. */
export type Zeitfaktor = 0 | 1 | 2

export const ZEITFAKTOR_TEXT: Record<Zeitfaktor, string> = {
  1: 'Normal (20 s, bei mehreren Antworten 30 s)',
  2: 'Doppelte Zeit (40 s bzw. 60 s)',
  0: 'Ohne Zeitlimit (ohne Tempobonus)',
}

/** Zeitlimit einer Frage – null = ohne Zeitlimit. */
export const zeitlimit = (art: Antwortart, faktor: Zeitfaktor): number | null => (faktor ? ZEIT_MS[art] * faktor : null)

export interface Bewertung {
  /** 0 bis 1. */
  anteil: number
  treffer: number
  fehler: number
  punkte: number
}

/**
 * Bewertet eine Auswahl. Einzelauswahl: richtig oder nicht. Mehrfachauswahl: (Treffer − Fehlgriffe) / Zahl der
 * richtigen, nicht unter 0 – wer nichts oder alles ankreuzt, bekommt nichts. `neutral` zählt weder noch. Gibt es
 * weniger falsche als richtige Parteien, kostet ein Fehlgriff 1 / Zahl der falschen – sonst brächte „alles
 * ankreuzen“ Punkte.
 * `ms` = Antwortzeit; null = keine Antwort. `limit` = Zeitlimit der Frage; null = ohne Zeitlimit, dann ohne
 * Tempobonus (volle Punkte für richtige Antworten).
 */
export function bewerte(
  frage: Pick<QuizFrage, 'art' | 'richtig' | 'neutral'> & { positionen: Pick<QuizPosition, 'partei_id'>[] },
  auswahl: number[],
  ms: number | null,
  limit: number | null = ZEIT_MS[frage.art],
): Bewertung {
  const gewaehlt = [...new Set(auswahl)]
  const treffer = gewaehlt.filter((id) => frage.richtig.includes(id)).length
  const fehler = gewaehlt.filter((id) => !frage.richtig.includes(id) && !frage.neutral.includes(id)).length
  if (ms === null || !gewaehlt.length) return { anteil: 0, treffer, fehler, punkte: 0 }
  const falsch = frage.positionen.filter(
    (p) => !frage.richtig.includes(p.partei_id) && !frage.neutral.includes(p.partei_id),
  ).length
  const anteil =
    frage.art === 'einzeln'
      ? gewaehlt.length === 1 && treffer === 1
        ? 1
        : 0
      : Math.max(0, treffer / frage.richtig.length - (fehler ? fehler / Math.min(frage.richtig.length, falsch) : 0))
  const tempo = limit === null ? 1 : 0.5 + 0.5 * (1 - Math.min(Math.max(ms, 0), limit) / limit)
  return { anteil, treffer, fehler, punkte: Math.round(MAX_PUNKTE * anteil * tempo) }
}
