// Dein Name im Spiel bleibt auf diesem Gerät (localStorage), damit er beim nächsten Mal schon dasteht. Er verlässt das
// Gerät nur im Spiel (die anderen im Raum sehen ihn). Ein leeres Namensfeld löscht ihn; Raumnamen merkt sich das Quiz
// nicht. Datenschutzerklärung: „Name im Spiel“.

const SCHLUESSEL = 'wer-sagt-ja-name'

export function gemerkterName(): string {
  try {
    const roh = localStorage.getItem(SCHLUESSEL)
    if (!roh) return ''
    const d = JSON.parse(roh) as { name?: unknown }
    return typeof d.name === 'string' ? d.name.slice(0, 20) : ''
  } catch {
    return ''
  }
}

export function nameMerken(name: string) {
  try {
    const n = name.trim()
    // Ältere Fassungen speicherten auch den Raumnamen – beim Schreiben bleibt nur der Name.
    if (n) localStorage.setItem(SCHLUESSEL, JSON.stringify({ name: n.slice(0, 20) }))
    else localStorage.removeItem(SCHLUESSEL)
  } catch {
    // privater Modus o. Ä.: dann eben nicht
  }
}

// Die zuletzt gewählte Wahl (Bundestagswahl, Landtagswahl …) bleibt ebenfalls auf dem Gerät – nur eine Kennung.
const WAHL_SCHLUESSEL = 'wer-sagt-ja-wahl'

export function gemerkteWahl(): string | null {
  try {
    const w = localStorage.getItem(WAHL_SCHLUESSEL)
    return w && /^[a-z0-9]+$/.test(w) ? w : null
  } catch {
    return null
  }
}

export function wahlMerken(wahlId: string) {
  try {
    localStorage.setItem(WAHL_SCHLUESSEL, wahlId)
  } catch {
    // privater Modus o. Ä.: dann eben nicht
  }
}
