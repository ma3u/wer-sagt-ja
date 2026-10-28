import { useEffect, useRef, useSyncExternalStore } from 'react'
import { APP_NAME, SEITENTITEL } from './app'

// Hilfen für Barrierefreiheit (WCAG 2.2 AA), für Quiz und Unterseiten gemeinsam.

// Erst nach der ersten Eingabe (Tippen, Klicken, Taste) verschiebt die App den Fokus – beim Laden der Seite
// bleibt er, wo der Browser ihn hat.
let benutzt = false
if (typeof addEventListener === 'function')
  for (const art of ['pointerdown', 'keydown'] as const) addEventListener(art, () => (benutzt = true), { capture: true, once: true })

/**
 * Wechsel der Ansicht in der Einseiten-App: Seitentitel setzen (2.4.2) und den Fokus auf die Überschrift der neuen
 * Ansicht legen (2.4.3), damit Tastatur und Screenreader nicht im Nichts landen. `schluessel` ändert sich, wenn
 * innerhalb einer Ansicht etwas Neues
 * erscheint (etwa die nächste Frage).
 */
export function useAnsicht<T extends HTMLElement = HTMLHeadingElement>(titel: string, schluessel: unknown = titel) {
  const ref = useRef<T>(null)
  useEffect(() => {
    // Das Quiz bleibt unter einer Unterseite versteckt geladen – dann bestimmt die Unterseite den Titel.
    if (ref.current?.closest('[hidden]')) return
    const vorher = document.title
    document.title = titel ? `${titel} – ${APP_NAME}` : SEITENTITEL
    // Unterseiten liegen über dem Spiel: Beim Schließen gilt wieder der Titel darunter.
    return () => {
      document.title = vorher
    }
  }, [titel])
  useEffect(() => {
    if (!benutzt) return
    const el = ref.current
    if (!el) return
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
    scrollTo({ top: 0 })
  }, [schluessel])
  return ref
}

// Bewegung reduzieren (Systemeinstellung, 2.3.3). Einen eigenen Schalter braucht es nicht: Was sich von selbst bewegt,
// steht nach spätestens fünf Sekunden still (2.2.2) – Konfetti, Wackeln vor der Auflösung, Auftritte.
const BEWEGUNG_REDUZIERT = '(prefers-reduced-motion: reduce)'

export const useBewegungAus = () =>
  useSyncExternalStore(
    (h) => {
      const m = matchMedia(BEWEGUNG_REDUZIERT)
      m.addEventListener('change', h)
      return () => m.removeEventListener('change', h)
    },
    () => matchMedia(BEWEGUNG_REDUZIERT).matches,
    () => false,
  )

/** Unterseite über dem Spiel: Beim Schließen bekommt das Element den Fokus zurück, das vorher ihn hatte. */
export function useFokusZurueck() {
  useEffect(() => {
    const vorher = document.activeElement
    return () => {
      if (vorher instanceof HTMLElement && vorher.isConnected) requestAnimationFrame(() => vorher.focus({ preventScroll: true }))
    }
  }, [])
}
