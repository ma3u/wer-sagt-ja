// Angaben für Impressum und Datenschutzerklärung. Vor dem öffentlichen Start alle Felder mit „[…]“ durch echte
// Angaben ersetzen – solange welche fehlen, zeigen beide Seiten einen deutlichen Hinweis.

export const BETREIBER = {
  /** Vor- und Nachname (bei Vereinen: Name und Rechtsform) */
  name: 'Matthias Buchhorn-Roth',
  strasse: 'Simplonstraße 56',
  ort: '10245 Berlin',
  email: 'matthias.buchhorn@web.de',
  /** Datenschutz-Aufsichtsbehörde des eigenen Bundeslands */
  aufsichtsbehoerde: {
    name: 'Berliner Beauftragte für Datenschutz und Informationsfreiheit',
    url: 'https://www.datenschutz-berlin.de/',
  },
}

/** Stand der Datenschutzerklärung – bei Änderungen an Datenflüssen anpassen. */
export const DATENSCHUTZ_STAND = '9. Oktober 2026'

export const betreiberVollstaendig = () => !JSON.stringify(BETREIBER).includes('[')
