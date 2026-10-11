import { quizDaten, type FragenDatei } from './katalog'
import type { QuizDaten } from './typen'

// Lädt public/fragen.json einmal je Besuch – Quiz und Fragenübersicht teilen sich die Daten.

const istFragenDatei = (d: unknown): d is FragenDatei =>
  !!d && typeof d === 'object' && Array.isArray((d as FragenDatei).parteien) && Array.isArray((d as FragenDatei).fragen)

let laufend: Promise<QuizDaten> | null = null

export function ladeQuiz(): Promise<QuizDaten> {
  laufend ??= fetch(`${import.meta.env.BASE_URL}fragen.json`)
    .then(async (r) => {
      const d: unknown = r.ok && r.headers.get('content-type')?.includes('json') ? await r.json() : null
      if (!istFragenDatei(d)) throw new Error('Die Fragen konnten nicht geladen werden.')
      return quizDaten(d)
    })
    .catch((e: unknown) => {
      // Beim nächsten Aufruf noch einmal versuchen.
      laufend = null
      throw e
    })
  return laufend
}
