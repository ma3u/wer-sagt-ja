import { quizKatalog, type FragenDatei } from './katalog'
import type { Katalog } from './typen'

// Lädt public/fragen.json einmal je Besuch – Quiz und Fragenübersicht teilen sich den Katalog aller Wahlen.

const istFragenDatei = (d: unknown): d is FragenDatei =>
  !!d && typeof d === 'object' && Array.isArray((d as FragenDatei).wahlen) && Array.isArray((d as FragenDatei).fragen)

let laufend: Promise<Katalog> | null = null

export function ladeKatalog(): Promise<Katalog> {
  laufend ??= fetch(`${import.meta.env.BASE_URL}fragen.json`)
    .then(async (r) => {
      const d: unknown = r.ok && r.headers.get('content-type')?.includes('json') ? await r.json() : null
      if (!istFragenDatei(d)) throw new Error('Die Fragen konnten nicht geladen werden.')
      const k = quizKatalog(d)
      if (!k.wahlen.length) throw new Error('Die Fragendatei enthält keine spielbare Wahl.')
      return k
    })
    .catch((e: unknown) => {
      // Beim nächsten Aufruf noch einmal versuchen.
      laufend = null
      throw e
    })
  return laufend
}
