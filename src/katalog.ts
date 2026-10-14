import type { Katalog, QuizDaten, QuizFrage, QuizPartei, QuizPosition, QuizZielkonflikt, Wahl } from './typen.ts'

// Die Fragen pflegt dieses Projekt selbst in public/fragen.json: je Wahl die Parteien mit ihren Programmen, je Frage
// die Position jedes Programms mit Beleg. Was richtig ist, leitet das Spiel daraus ab – gefragt wird immer, wer Ja
// sagt („Wer sagt Ja?“). Prüfen: `npm run fragen` (und `npm test`).

/** Eine Wahl, wie sie in public/fragen.json steht: mit ihren Parteien – leer, solange die Programme noch fehlen. */
export interface WahlEintrag extends Wahl {
  parteien: QuizPartei[]
}

/** Eine Frage, wie sie in public/fragen.json steht. */
export interface FragenEintrag {
  /** Stabile Kennung, über alle Wahlen eindeutig – nie ändern: Die Aufnahmen heißen danach (frage-<id>.mp3). */
  id: string
  /** Zu welcher Wahl die Frage gehört (`wahlen[].id`). */
  wahl: string
  /** Ja/Nein-Frage, neutral formuliert. Gefragt wird im Spiel immer, wer Ja sagt. */
  frage: string
  beschreibung: string
  /** true, solange die Positionen nur mit KI-Hilfe erfasst und noch nicht von Menschen geprüft sind. */
  ki_entwurf: boolean
  /** Genau eine Position je Partei der Wahl. */
  positionen: QuizPosition[]
  zielkonflikte: QuizZielkonflikt[]
}

export interface FragenDatei {
  /** Die erste Wahl ist die Standardwahl (Adressen ohne Wahl, etwa #/fragen). */
  wahlen: WahlEintrag[]
  fragen: FragenEintrag[]
}

const POSITIONEN = new Set(['ja', 'nein', 'teils', 'keine_aussage'])
const WAHL_ID = /^[a-z0-9]+$/

/** Wer Ja sagt (richtig) und wer „teils“ – „keine Aussage“ bleibt keine Aussage, also kein Ja. */
function auswerten(positionen: QuizPosition[]) {
  const mit = (wert: string) => positionen.filter((p) => p.position === wert).map((p) => p.partei_id)
  return { richtig: mit('ja'), teils: mit('teils') }
}

const nachPartei = (positionen: QuizPosition[]) => [...positionen].sort((a, b) => a.partei_id - b.partei_id)

/** Was an einer Frage nicht stimmt – leer heißt: spielbar. `parteien` sind die Parteien ihrer Wahl. */
export function fehlerIn(e: FragenEintrag, parteien: QuizPartei[]): string[] {
  const fehler: string[] = []
  if (!/^[a-z0-9-]+$/.test(e.id)) fehler.push('id: nur Kleinbuchstaben, Ziffern und Bindestrich')
  if (!e.frage?.trim().endsWith('?')) fehler.push('frage: muss mit „?“ enden')
  for (const partei of parteien) {
    const anzahl = e.positionen.filter((p) => p.partei_id === partei.id).length
    if (anzahl !== 1) fehler.push(`${partei.kurzname}: ${anzahl ? 'mehrere Positionen' : 'keine Position'}`)
  }
  for (const p of e.positionen) {
    const partei = parteien.find((x) => x.id === p.partei_id)
    const name = partei?.kurzname ?? `Partei ${p.partei_id}`
    if (!partei) fehler.push(`${name}: nicht in der Parteienliste dieser Wahl`)
    if (!POSITIONEN.has(p.position)) fehler.push(`${name}: Position „${p.position}“ unbekannt`)
    else if (p.position === 'keine_aussage') {
      if (!p.begruendung) fehler.push(`${name}: „keine Aussage“ ohne Begründung, was im Programm durchsucht wurde`)
    } else if (!p.zitat || !p.beleg_url) fehler.push(`${name}: „${p.position}“ ohne Zitat und Beleg-Link`)
    if (p.geprueft && !(p.geprueft.von && /^https:\/\//.test(p.geprueft.issue_url)))
      fehler.push(`${name}: „geprueft“ braucht „von“ und „issue_url“ (https-Link zum Issue)`)
  }
  const { richtig } = auswerten(e.positionen)
  if (!richtig.length) fehler.push('keine Partei sagt Ja – das Quiz fragt nur, wer Ja sagt')
  else if (richtig.length >= parteien.length) fehler.push('alle Parteien sagen Ja – es gibt nichts zu raten')
  return fehler
}

/** Was an einer Wahl nicht stimmt (Kennung, Name, Parteien). */
export function fehlerInWahl(w: WahlEintrag): string[] {
  const fehler: string[] = []
  if (!WAHL_ID.test(w.id)) fehler.push('id: nur Kleinbuchstaben und Ziffern')
  if (!w.name?.trim()) fehler.push('name fehlt')
  if (!w.kurz?.trim()) fehler.push('kurz fehlt')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(w.datum ?? '')) fehler.push('datum: ISO-Datum (JJJJ-MM-TT)')
  // Ohne Parteien ist die Wahl nur angekündigt (steht in der Auswahl, ist aber nicht spielbar).
  if (!Array.isArray(w.parteien)) fehler.push('parteien fehlt (leere Liste für eine angekündigte Wahl)')
  else if (w.parteien.length === 1) fehler.push('mindestens zwei Parteien – oder keine für eine angekündigte Wahl')
  else {
    const ids = new Set<number>()
    const kurz = new Set<string>()
    for (const p of w.parteien) {
      if (ids.has(p.id)) fehler.push(`Partei-ID ${p.id} doppelt`)
      ids.add(p.id)
      if (kurz.has(p.kurzname)) fehler.push(`Kurzname „${p.kurzname}“ doppelt`)
      kurz.add(p.kurzname)
      if (!/^https:\/\//.test(p.programm_url ?? '')) fehler.push(`${p.kurzname}: programm_url fehlt`)
    }
  }
  return fehler
}

/** Fehler der ganzen Datei, je Zeile mit der Wahl- oder Frage-ID davor. */
export function fehlerInDatei(datei: FragenDatei): string[] {
  const fehler: string[] = []
  if (!datei.wahlen.length) return ['keine Wahl eingetragen']
  const wahlen = new Map<string, WahlEintrag>()
  for (const w of datei.wahlen) {
    if (wahlen.has(w.id)) fehler.push(`${w.id}: Wahl doppelt`)
    wahlen.set(w.id, w)
    fehler.push(...fehlerInWahl(w).map((f) => `${w.id}: ${f}`))
  }
  const ids = new Set<string>()
  for (const e of datei.fragen) {
    if (ids.has(e.id)) fehler.push(`${e.id}: id doppelt`)
    ids.add(e.id)
    const w = wahlen.get(e.wahl)
    if (!w) {
      fehler.push(`${e.id}: Wahl „${e.wahl}“ unbekannt`)
      continue
    }
    fehler.push(...fehlerIn(e, w.parteien).map((f) => `${e.id}: ${f}`))
  }
  return fehler
}

/** Spielbare Frage aus einem fehlerfreien Eintrag. */
export function alsFrage(e: FragenEintrag): QuizFrage {
  const positionen = nachPartei(e.positionen)
  const { richtig, teils } = auswerten(positionen)
  const art = richtig.length === 1 ? 'einzeln' : 'mehrfach'
  return {
    id: e.id,
    frage: e.frage,
    beschreibung: e.beschreibung,
    art,
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

const ohneParteien = ({ id, name, kurz, datum }: WahlEintrag): Wahl => ({ id, name, kurz, datum })

/** Die Spieldaten einer Wahl – nur fehlerfreie Fragen kommen ins Spiel. */
function datenFuer(w: WahlEintrag, datei: FragenDatei, version: string): QuizDaten {
  const fragen = datei.fragen.filter((e) => e.wahl === w.id && !fehlerIn(e, w.parteien).length).map(alsFrage)
  return { version, wahl: ohneParteien(w), entwurf: fragen.some((f) => f.ki_entwurf), parteien: w.parteien, fragen }
}

/** Die ganze Fragendatei als Katalog: je Wahl die Spieldaten, in der Reihenfolge der Datei. */
export function quizKatalog(datei: FragenDatei): Katalog {
  const version = pruefsumme(JSON.stringify(datei))
  const wahlen = datei.wahlen.filter((w) => !fehlerInWahl(w).length).map((w) => datenFuer(w, datei, version))
  return { version, wahlen, entwurf: wahlen.some((w) => w.entwurf) }
}

/** Die Spieldaten einer Wahl (ohne Angabe: die Standardwahl, also die erste der Datei). */
export function quizDaten(datei: FragenDatei, wahlId = datei.wahlen[0]?.id): QuizDaten {
  const k = quizKatalog(datei)
  const d = wahlFuer(k, wahlId)
  if (!d) throw new Error(`Wahl „${wahlId}“ nicht im Katalog`)
  return d
}

/** Spieldaten zu einer Wahl-ID; ohne ID oder unbekannt: null. */
export const wahlFuer = (k: Katalog, wahlId: string | null | undefined): QuizDaten | null =>
  (wahlId && k.wahlen.find((w) => w.wahl.id === wahlId)) || null

/** Die Standardwahl: die erste der Datei. */
export const standardWahl = (k: Katalog): QuizDaten => k.wahlen[0]

/** Spielbar sind Wahlen mit Programmen und Fragen; angekündigte Wahlen stehen nur in der Auswahl. */
export const spielbar = (d: QuizDaten): boolean => d.parteien.length > 0 && d.fragen.length > 0
