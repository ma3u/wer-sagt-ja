import { QUELLCODE } from './app'
import { POSITION_TEXT, type QuizFrage, type QuizPartei, type QuizPosition, type Wahl } from './typen'

// Fragenübersicht (#/fragen): alle Fragen mit der Position jeder Partei, zum Prüfen durch Parteien und Leser.
// Adressen: #/fragen (alle), #/fragen/<partei> (nur eine Partei), #/fragen/<partei>/<frage-id> (springt zur Frage);
// für alle Parteien steht „alle“ an der Stelle der Partei. Ohne Wahl gilt die Standardwahl (die erste der Datei);
// andere Wahlen stehen davor: #/<wahl>/fragen/… (etwa #/be26/fragen/volt).
// Eine Wahl-Kennung besteht nur aus Kleinbuchstaben und Ziffern – ein Raumname hat immer einen Bindestrich.
// Fehler und Bestätigungen landen als vorausgefülltes GitHub-Issue im Repository; ein bestätigtes Issue wird als
// `geprueft` in public/fragen.json eingetragen.

export interface UebersichtAdresse {
  /** Wahl-Kennung aus der Adresse; null = Standardwahl. */
  wahl: string | null
  /** Kurzname der Partei als Pfadstück (`parteiPfad`) oder null für alle. */
  partei: string | null
  frage: string | null
}

/** Pfadstück für eine Partei: „Grüne“ → „gruene“. */
export const parteiPfad = (partei: Pick<QuizPartei, 'kurzname'>) =>
  partei.kurzname
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')

const ALLE = 'alle'

/** Adresse der Übersicht – ohne Partei alle, ohne Frage von oben, ohne Wahl die Standardwahl. */
export function uebersichtHash(partei: string | null = null, frage: string | null = null, wahl: string | null = null): string {
  const anfang = wahl ? `#/${wahl}/fragen` : '#/fragen'
  if (!partei && !frage) return anfang
  return frage ? `${anfang}/${partei ?? ALLE}/${frage}` : `${anfang}/${partei}`
}

/** Zerlegt eine Übersichtsadresse; null, wenn der Hash nicht zur Übersicht gehört. */
export function uebersichtAus(hash: string): UebersichtAdresse | null {
  const m = /^#\/(?:([a-z0-9]+)\/)?fragen(?:\/([^/]*))?(?:\/([^/]*))?\/?$/.exec(hash)
  if (!m) return null
  const [, wahl, partei, frage] = m
  return {
    wahl: wahl ?? null,
    partei: partei && partei !== ALLE ? decodeURIComponent(partei) : null,
    frage: frage ? decodeURIComponent(frage) : null,
  }
}

/** Wer laut Spiel Ja sagt, in Kurznamen. */
export const jaSager = (frage: QuizFrage, parteien: QuizPartei[]) =>
  frage.richtig.map((id) => parteien.find((p) => p.id === id)?.kurzname ?? String(id))

/** Beide Links zu einer Position: bestätigen oder Fehler melden. */
export interface PruefLinks {
  bestaetigen: string
  melden: string
}

export const pruefLinks = (frage: QuizFrage, partei: QuizPartei, p: QuizPosition, seite: string, wahl?: Wahl): PruefLinks => ({
  bestaetigen: positionBestaetigen(frage, partei, p, seite, wahl),
  melden: positionMelden(frage, partei, p, seite, wahl),
})

/** Wie das Programm im Issue heißt: „Wahlprogramm zur Bundestagswahl 2025“, ohne Wahl schlicht „Wahlprogramm“. */
const programmName = (wahl?: Wahl) => (wahl ? `Wahlprogramm zur ${wahl.name}` : 'Wahlprogramm')

/** Link zu einem neuen, vorausgefüllten Issue. */
export function issueLink(titel: string, text: string): string {
  const q = new URLSearchParams({ title: titel, body: text })
  return `${QUELLCODE}/issues/new?${q}`
}

/** Was zu einer Position eingetragen ist, als Markdown-Zeilen. */
function positionAlsText(p: QuizPosition): string {
  const zeilen = [`**Eingetragen:** ${POSITION_TEXT[p.position]}`]
  if (p.kurzfassung) zeilen.push(`**Kurzfassung:** ${p.kurzfassung}`)
  if (p.zitat) zeilen.push(`**Zitat:** „${p.zitat}“`)
  if (p.beleg_url) zeilen.push(`**Beleg:** ${p.beleg_url}`)
  if (p.begruendung) zeilen.push(`**Begründung (keine Aussage):** ${p.begruendung}`)
  return zeilen.join('\n')
}

/** Issue zur Position einer Partei bei einer Frage – mit allem, was eingetragen ist, und den Feldern zum Ausfüllen. */
export function positionMelden(frage: QuizFrage, partei: QuizPartei, p: QuizPosition, seite: string, wahl?: Wahl): string {
  const titel = `${partei.kurzname} zu ${frage.id}: ${frage.frage}`
  const text = [
    frageAlsText(frage),
    ...(wahl ? [`**Wahl:** ${wahl.name}`] : []),
    `**Partei:** ${partei.name}`,
    positionAlsText(p),
    '',
    `**Richtig wäre:** (${Object.values(POSITION_TEXT).join(' / ')})`,
    '',
    `**Wörtliches Zitat aus dem ${programmName(wahl)} mit Seite:**`,
    '',
    '**Betrifft die Frage selbst?** (Formulierung, Beschreibung)',
    '',
    '**Anmerkung:**',
    '',
    '---',
    `Gesehen unter ${seite}`,
  ].join('\n')
  return issueLink(titel, text)
}

/**
 * Issue, das eine Position bestätigt: Wer geprüft hat, trägt sich ein; der Issue-Link kommt dann als `geprueft` in
 * public/fragen.json und die Übersicht zeigt die Position als bestätigt.
 */
export function positionBestaetigen(frage: QuizFrage, partei: QuizPartei, p: QuizPosition, seite: string, wahl?: Wahl): string {
  const titel = `Geprüft: ${partei.kurzname} zu ${frage.id} stimmt`
  const text = [
    frageAlsText(frage),
    ...(wahl ? [`**Wahl:** ${wahl.name}`] : []),
    `**Partei:** ${partei.name}`,
    positionAlsText(p),
    '',
    '**Geprüft von:** (Name und Rolle, etwa „Volt Deutschland, Bundesvorstand“)',
    '',
    `**Geprüft gegen:** ${programmName(wahl)}, Seite …`,
    '',
    '**Anmerkung:**',
    '',
    '---',
    `Gesehen unter ${seite}`,
  ].join('\n')
  return issueLink(titel, text)
}

/** Frage und Beschreibung als Markdown-Zeilen. */
function frageAlsText(frage: QuizFrage): string {
  return [
    `**Frage ${frage.id}:** ${frage.frage}`,
    `**Beschreibung:** ${frage.beschreibung}`,
  ].join('\n')
}
