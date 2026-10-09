import type { QuizDaten, QuizFrage, QuizPartei, QuizPosition, QuizZielkonflikt } from './typen.ts'

// Die Fragen pflegt dieses Projekt selbst in public/fragen.json: je Frage die Position jedes Bundeswahlprogramms mit
// Beleg. Was richtig ist, leitet das Spiel daraus ab – gefragt wird immer, wer Ja sagt („Wer sagt Ja?“).
// Prüfen: `npm run fragen` (und `npm test`).

/** Eine Frage, wie sie in public/fragen.json steht. */
export interface FragenEintrag {
  /** Stabile Kennung – nie ändern: Die Aufnahmen heißen danach (frage-<id>.mp3, loesung-<id>.mp3). */
  id: string
  /** Ja/Nein-Frage, neutral formuliert. Gefragt wird im Spiel immer, wer Ja sagt. */
  frage: string
  beschreibung: string
  /** Was heute gilt: „keine Aussage“ im Programm zählt wie diese Antwort (null: zählt weder als Ja noch als Nein). */
  status_quo: 'ja' | 'nein' | null
  /** true, solange die Positionen nur mit KI-Hilfe erfasst und noch nicht von Menschen geprüft sind. */
  ki_entwurf: boolean
  /** Genau eine Position je Partei. */
  positionen: QuizPosition[]
  zielkonflikte: QuizZielkonflikt[]
}

export interface FragenDatei {
  parteien: QuizPartei[]
  fragen: FragenEintrag[]
}

const POSITIONEN = new Set(['ja', 'nein', 'teils', 'keine_aussage'])

/** Wer Ja sagt (richtig) und wer „teils“ – „keine Aussage“ zählt wie die heutige Lage. */
function auswerten(positionen: QuizPosition[], status_quo: FragenEintrag['status_quo']) {
  const gilt = (p: QuizPosition) => (p.position === 'keine_aussage' && status_quo ? status_quo : p.position)
  const mit = (wert: string) => positionen.filter((p) => gilt(p) === wert).map((p) => p.partei_id)
  return { richtig: mit('ja'), teils: mit('teils') }
}

const nachPartei = (positionen: QuizPosition[]) => [...positionen].sort((a, b) => a.partei_id - b.partei_id)

/** Was an einer Frage nicht stimmt – leer heißt: spielbar. */
export function fehlerIn(e: FragenEintrag, parteien: QuizPartei[]): string[] {
  const fehler: string[] = []
  if (!/^[a-z0-9-]+$/.test(e.id)) fehler.push('id: nur Kleinbuchstaben, Ziffern und Bindestrich')
  if (!e.frage?.trim().endsWith('?')) fehler.push('frage: muss mit „?“ enden')
  if (!(e.status_quo === 'ja' || e.status_quo === 'nein' || e.status_quo === null))
    fehler.push('status_quo: "ja", "nein" oder null')
  for (const partei of parteien) {
    const anzahl = e.positionen.filter((p) => p.partei_id === partei.id).length
    if (anzahl !== 1) fehler.push(`${partei.kurzname}: ${anzahl ? 'mehrere Positionen' : 'keine Position'}`)
  }
  for (const p of e.positionen) {
    const partei = parteien.find((x) => x.id === p.partei_id)
    const name = partei?.kurzname ?? `Partei ${p.partei_id}`
    if (!partei) fehler.push(`${name}: nicht in der Parteienliste`)
    if (!POSITIONEN.has(p.position)) fehler.push(`${name}: Position „${p.position}“ unbekannt`)
    else if (p.position === 'keine_aussage') {
      if (!p.begruendung) fehler.push(`${name}: „keine Aussage“ ohne Begründung, was im Programm durchsucht wurde`)
    } else if (!p.zitat || !p.beleg_url) fehler.push(`${name}: „${p.position}“ ohne Zitat und Beleg-Link`)
  }
  const { richtig } = auswerten(e.positionen, e.status_quo)
  if (!richtig.length) fehler.push('keine Partei sagt Ja – das Quiz fragt nur, wer Ja sagt')
  else if (richtig.length >= parteien.length) fehler.push('alle Parteien sagen Ja – es gibt nichts zu raten')
  return fehler
}

/** Fehler der ganzen Datei, je Zeile mit der Frage-ID davor. */
export function fehlerInDatei(datei: FragenDatei): string[] {
  const fehler: string[] = []
  const ids = new Set<string>()
  for (const e of datei.fragen) {
    if (ids.has(e.id)) fehler.push(`${e.id}: id doppelt`)
    ids.add(e.id)
    fehler.push(...fehlerIn(e, datei.parteien).map((f) => `${e.id}: ${f}`))
  }
  return fehler
}

/** Spielbare Frage aus einem fehlerfreien Eintrag. */
export function alsFrage(e: FragenEintrag): QuizFrage {
  const positionen = nachPartei(e.positionen)
  const { richtig, teils } = auswerten(positionen, e.status_quo)
  const art = richtig.length === 1 ? 'einzeln' : 'mehrfach'
  return {
    id: e.id,
    frage: e.frage,
    beschreibung: e.beschreibung,
    art,
    status_quo: e.status_quo,
    richtig,
    neutral: art === 'mehrfach' ? teils : [],
    positionen,
    zielkonflikte: e.zielkonflikte,
    ki_entwurf: e.ki_entwurf,
  }
}

/** Kurze Prüfsumme (FNV-1a, 32 Bit): Alle Geräte im Raum müssen dieselbe Fassung der Fragen haben. */
export function pruefsumme(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193)
  return (h >>> 0).toString(16).padStart(8, '0')
}

/** Die Fragendatei als Spieldaten – nur fehlerfreie Fragen kommen ins Spiel. */
export function quizDaten(datei: FragenDatei): QuizDaten {
  const fragen = datei.fragen.filter((e) => !fehlerIn(e, datei.parteien).length).map(alsFrage)
  return {
    version: pruefsumme(JSON.stringify(datei)),
    entwurf: fragen.some((f) => f.ki_entwurf),
    parteien: datei.parteien,
    fragen,
  }
}
