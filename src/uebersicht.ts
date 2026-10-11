import { QUELLCODE } from './app'
import { POSITION_TEXT, positionImQuiz, type QuizFrage, type QuizPartei, type QuizPosition } from './typen'

// Fragenübersicht (#/fragen): alle Fragen mit der Position jeder Partei, zum Prüfen durch Parteien und Leser.
// Adressen: #/fragen (alle), #/fragen/<partei> (nur eine Partei), #/fragen/<partei>/<frage-id> (springt zur Frage);
// für alle Parteien steht „alle“ an der Stelle der Partei.
// Fehler landen als vorausgefülltes GitHub-Issue im Repository.

export interface UebersichtAdresse {
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

/** Adresse der Übersicht – ohne Partei alle, ohne Frage von oben. */
export function uebersichtHash(partei: string | null = null, frage: string | null = null): string {
  if (!partei && !frage) return '#/fragen'
  return frage ? `#/fragen/${partei ?? ALLE}/${frage}` : `#/fragen/${partei}`
}

/** Zerlegt eine Übersichtsadresse; null, wenn der Hash nicht zur Übersicht gehört. */
export function uebersichtAus(hash: string): UebersichtAdresse | null {
  const m = /^#\/fragen(?:\/([^/]*))?(?:\/([^/]*))?\/?$/.exec(hash)
  if (!m) return null
  const [, partei, frage] = m
  return {
    partei: partei && partei !== ALLE ? decodeURIComponent(partei) : null,
    frage: frage ? decodeURIComponent(frage) : null,
  }
}

export const STATUS_QUO_TEXT: Record<'ja' | 'nein' | 'null', string> = {
  ja: 'Heute gilt: Ja – „keine Aussage“ zählt als Ja',
  nein: 'Heute gilt: Nein – „keine Aussage“ zählt als Nein',
  null: 'Heute nicht festgelegt – „keine Aussage“ zählt weder als Ja noch als Nein',
}

/** Wer laut Spiel Ja sagt, in Kurznamen. */
export const jaSager = (frage: QuizFrage, parteien: QuizPartei[]) =>
  frage.richtig.map((id) => parteien.find((p) => p.id === id)?.kurzname ?? String(id))

/** Link zu einem neuen, vorausgefüllten Issue. */
export function issueLink(titel: string, text: string): string {
  const q = new URLSearchParams({ title: titel, body: text })
  return `${QUELLCODE}/issues/new?${q}`
}

/** Was zu einer Position eingetragen ist, als Markdown-Zeilen. */
function positionAlsText(p: QuizPosition, frage: QuizFrage): string {
  const zeilen = [`**Eingetragen:** ${positionImQuiz(p.position, frage.status_quo)}`]
  if (p.kurzfassung) zeilen.push(`**Kurzfassung:** ${p.kurzfassung}`)
  if (p.zitat) zeilen.push(`**Zitat:** „${p.zitat}“`)
  if (p.beleg_url) zeilen.push(`**Beleg:** ${p.beleg_url}`)
  if (p.begruendung) zeilen.push(`**Begründung (keine Aussage):** ${p.begruendung}`)
  return zeilen.join('\n')
}

/** Issue zur Position einer Partei bei einer Frage – mit allem, was eingetragen ist, und den Feldern zum Ausfüllen. */
export function positionMelden(frage: QuizFrage, partei: QuizPartei, p: QuizPosition, seite: string): string {
  const titel = `${partei.kurzname} zu ${frage.id}: ${frage.frage}`
  const text = [
    `**Frage ${frage.id}:** ${frage.frage}`,
    `**Partei:** ${partei.name}`,
    positionAlsText(p, frage),
    '',
    `**Richtig wäre:** (${Object.values(POSITION_TEXT).join(' / ')})`,
    '',
    '**Wörtliches Zitat aus dem Wahlprogramm 2025 mit Seite:**',
    '',
    '**Anmerkung:**',
    '',
    '---',
    `Gesehen unter ${seite}`,
  ].join('\n')
  return issueLink(titel, text)
}

/** Issue zur Frage selbst (Formulierung, Beschreibung, heutige Lage). */
export function frageMelden(frage: QuizFrage, parteien: QuizPartei[], seite: string): string {
  const titel = `Frage ${frage.id}: ${frage.frage}`
  const text = [
    `**Frage ${frage.id}:** ${frage.frage}`,
    `**Beschreibung:** ${frage.beschreibung}`,
    `**${STATUS_QUO_TEXT[frage.status_quo ?? 'null']}**`,
    `**Ja sagen laut Spiel:** ${jaSager(frage, parteien).join(', ')}`,
    '',
    '**Was stimmt nicht?** (Formulierung, Beschreibung, heutige Lage, fehlende Partei …)',
    '',
    '---',
    `Gesehen unter ${seite}`,
  ].join('\n')
  return issueLink(titel, text)
}
