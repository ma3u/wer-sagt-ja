const FARBEN = ['var(--stimmblau)', 'var(--kuli)', 'var(--warnung)', 'var(--gut)', '#ffffff']

/**
 * Feste Verteilung aus dem Index statt Zufall: gleich auf allen Geräten und bei jedem Rendern. Verzug plus Fallzeit
 * bleiben unter fünf Sekunden – danach liegt alles still (WCAG 2.2.2).
 */
export const konfettiTeile = (teile: number) =>
  Array.from({ length: teile }, (_, i) => ({
    links: (i * 37) % 100,
    verzug: ((i * 53) % 100) / 100,
    dauer: 2.4 + ((i * 29) % 100) / 62,
    farbe: FARBEN[i % FARBEN.length],
    drehung: (i * 47) % 360,
    breite: 7 + (i % 3) * 2,
  }))
