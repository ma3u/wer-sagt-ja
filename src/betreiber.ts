// Angaben für Impressum und Datenschutzerklärung. Vor dem öffentlichen Start alle Felder mit „[…]“ durch echte
// Angaben ersetzen – solange welche fehlen, zeigen beide Seiten einen deutlichen Hinweis.

export const BETREIBER = {
  /** Vor- und Nachname (bei Vereinen: Name und Rechtsform) */
  name: '[Vor- und Nachname]',
  strasse: '[Straße und Hausnummer]',
  ort: '[PLZ Ort]',
  email: '[E-Mail-Adresse]',
  /** Datenschutz-Aufsichtsbehörde des eigenen Bundeslands */
  aufsichtsbehoerde: {
    name: '[Landesdatenschutzbehörde des Bundeslands]',
    url: 'https://www.bfdi.bund.de/DE/Service/Anschriften/Laender/Laender-node.html',
  },
}

/** Stand der Datenschutzerklärung – bei Änderungen an Datenflüssen anpassen. */
export const DATENSCHUTZ_STAND = '9. Oktober 2026'

export const betreiberVollstaendig = () => !JSON.stringify(BETREIBER).includes('[')
