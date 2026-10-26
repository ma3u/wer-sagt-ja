import { useSyncExternalStore } from 'react'

// Unterseiten (#/impressum, #/datenschutz, #/fragen, #/methode, #/<wahl>/fragen) liegen über dem Spiel, damit eine
// laufende Partie erhalten bleibt. Eine Wahl-Kennung besteht nur aus Kleinbuchstaben und Ziffern – ein Raumname enthält
// immer einen Bindestrich, ein Raumcode Großbuchstaben, darum sind beide nie zu verwechseln.
const UNTERSEITEN = ['#/impressum', '#/datenschutz', '#/fragen', '#/methode']

export const istUnterseite = (hash: string) => UNTERSEITEN.some((s) => hash.startsWith(s)) || /^#\/[a-z0-9]+\/fragen/.test(hash)

// Wurde die Unterseite aus der App heraus geöffnet? Dann führt „Zurück“ per history.back() ins laufende Spiel,
// sonst zur Startseite.
let ausDerApp = false
addEventListener('hashchange', (e) => {
  ausDerApp = !istUnterseite(new URL(e.oldURL).hash)
})

export function zurueck() {
  if (ausDerApp) history.back()
  else location.hash = '#/'
}

export const useHash = () =>
  useSyncExternalStore(
    (f) => (addEventListener('hashchange', f), () => removeEventListener('hashchange', f)),
    () => location.hash,
  )
