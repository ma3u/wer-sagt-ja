// Wer sagt im Wahlprogramm Ja? Ohne Datenbank – die Fragen kommen als statische Datei (public/fragen.json, gepflegt
// in diesem Projekt, gelesen über katalog.ts), das Spiel läuft zwischen den Browsern.

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
  /** Stabile Kennung aus public/fragen.json. */
  id: string
  frage: string
  beschreibung: string
  art: Antwortart
  /** Antwort, die der heutigen Lage entspricht – `keine_aussage` zählt wie sie (null: nicht festgelegt). */
  status_quo: 'ja' | 'nein' | null
  /** Parteien, die Ja sagen (gefragt wird immer nach Ja). */
  richtig: number[]
  /** Parteien mit `teils` bei Mehrfachauswahl – zählen weder als richtig noch als falsch. */
  neutral: number[]
  /** Alle Programme, nach Partei-ID. */
  positionen: QuizPosition[]
  zielkonflikte: QuizZielkonflikt[]
  /** Positionen nur mit KI-Hilfe erfasst, noch nicht von Menschen geprüft. */
  ki_entwurf: boolean
}

export interface QuizDaten {
  /** Prüfsumme über die Fragendatei: Alle Geräte im Raum müssen dieselbe Fassung haben. */
  version: string
  /** true = enthält Fragen mit ungeprüften KI-Entwürfen. */
  entwurf: boolean
  parteien: QuizPartei[]
  fragen: QuizFrage[]
}
