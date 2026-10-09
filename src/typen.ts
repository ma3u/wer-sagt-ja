// Wer sagt im Wahlprogramm Ja? Ohne Datenbank – die Fragen kommen als statische Datei (public/fragen.json, erzeugt
// im Politik-Duell aus dessen Haltungen), das Spiel läuft zwischen den Browsern.

/** Position eines Programms zu einer Wertfrage. */
export type Positionswert = 'ja' | 'nein' | 'teils' | 'keine_aussage'

export const POSITION_TEXT: Record<Positionswert, string> = {
  ja: 'Ja',
  nein: 'Nein',
  teils: 'Teils',
  keine_aussage: 'Keine Aussage im Programm',
}

/** Positionen, die nur als KI-Entwurf vorliegen. */
export const KI_HINWEIS = 'Vorläufig: Positionen mit KI-Hilfe erfasst – noch nicht von Menschen geprüft'

export interface QuizPartei {
  id: number
  name: string
  kurzname: string
  farbe: string
  programm_url: string
}

export interface QuizPosition {
  partei_id: number
  position: Positionswert
  kurzfassung: string | null
  /** Wörtliches Zitat – nur als Beleg in der Auflösung (§ 51 UrhG), nie als Rätseltext. */
  zitat: string | null
  beleg_url: string | null
  /** Nur bei `keine_aussage`: was im Programm durchsucht wurde. */
  begruendung: string | null
}

export interface QuizZielkonflikt {
  seite: 'ja' | 'nein'
  text: string
  quelle_url: string
}

export type Antwortart = 'einzeln' | 'mehrfach'

export interface QuizFrage {
  /** `h` + ID der Haltung. */
  id: string
  haltung_id: number
  frage: string
  beschreibung: string
  art: Antwortart
  /** Nach welcher Position gefragt wird. */
  gesucht: 'ja' | 'nein'
  /** Antwort, die der heutigen Lage entspricht – `keine_aussage` zählt wie sie (null: nicht festgelegt). */
  status_quo: 'ja' | 'nein' | null
  /** Parteien mit der gesuchten Position. */
  richtig: number[]
  /** Parteien mit `teils` bei Mehrfachauswahl – zählen weder als richtig noch als falsch. */
  neutral: number[]
  /** Alle Bundesprogramme, nach Partei-ID. */
  positionen: QuizPosition[]
  zielkonflikte: QuizZielkonflikt[]
  /** Mindestens eine Position ist nur KI-Entwurf (nie in der öffentlichen Datei). */
  ki_entwurf: boolean
}

export interface QuizDaten {
  /** Kurzer Hash über Parteien und Fragen: Alle Geräte im Raum müssen dieselbe Fassung haben. */
  version: string
  /** true = enthält ungeprüfte KI-Entwürfe (nur lokal). */
  entwurf: boolean
  parteien: QuizPartei[]
  fragen: QuizFrage[]
}
