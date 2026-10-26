import type { QuizFrage, QuizPartei, QuizPosition } from './typen.ts'

// Ausgewogenheit eines Katalogs (Issue #1). Das Spielprinzip bleibt: Gefragt wird immer, wer Ja sagt, und die Fragen
// dürfen zuspitzen. Ausgewogen sein muss die Auswahl: Jede Partei soll ihre Forderungen als Ja-Frage wiederfinden,
// und ein Katalog soll nicht überwiegend Forderungen eines Pols abfragen. Diese Kennzahlen machen das sichtbar –
// `npm run fragen` warnt, die Übersicht (#/fragen) zeigt sie. Sie ändern nichts am Spiel und an keiner Position.
//
// Methode (Issue #1, „Methode der Überarbeitung“): Parteipositionen auf zwei Dimensionen aus dem Chapel Hill Expert
// Survey 2024 – unabhängig von den Programmen, aus denen die Antworten stammen. Je Frage und Dimension die
// Rangkorrelation nach Spearman zwischen Antwort und Position; ab |ρ| ≥ 0,5 ist die Frage auf der Dimension gerichtet.

export type Dimension = 'lrecon' | 'galtan'

/** Pol einer Dimension: `niedrig` sind die Werte nahe 0, `hoch` die nahe 10. */
export type Pol = 'niedrig' | 'hoch'

/**
 * Die zwei Konfliktlinien des deutschen Parteiensystems, benannt nach Niedermayer (NIEDERMAYER_QUELLE). Die Werte
 * kommen bis auf Weiteres aus CHES: LRECON für den Sozialstaatskonflikt, GALTAN für den soziokulturellen Konflikt.
 * `kurz` ist die knappe Form für Tabellenköpfe und Achsen, mit weichem Trennstrich für schmale Bildschirme.
 */
export const DIMENSION: Record<Dimension, { name: string; pol: Record<Pol, string>; kurz: Record<Pol, string> }> = {
  lrecon: {
    name: 'Sozialstaatskonflikt',
    pol: { niedrig: 'soziale Gerechtigkeit', hoch: 'Marktfreiheit' },
    kurz: { niedrig: 'Gerech\u00adtigkeit', hoch: 'Markt' },
  },
  galtan: {
    name: 'Soziokultureller Konflikt',
    pol: { niedrig: 'linksliberal-kosmopolitisch', hoch: 'konservativ bis autoritär' },
    kurz: { niedrig: 'liberal', hoch: 'konser\u00advativ' },
  },
}

export const DIMENSIONEN = Object.keys(DIMENSION) as Dimension[]

/** Quelle der Begriffe für die zwei Konfliktlinien. */
export const NIEDERMAYER_QUELLE = {
  text: 'Oskar Niedermayer: Der Vergleich von Parteiensystemen. Bundeszentrale für politische Bildung, Dossier Parteien in Deutschland',
  url: 'https://www.bpb.de/themen/parteien/parteien-in-deutschland/314753/der-vergleich-von-parteiensystemen/',
}

/** Quelle der Parteipositionen – Zitierweise, wie CHES sie erbittet. */
export const CHES_QUELLE = {
  text:
    'Rovny, Polk, Bakker, Hooghe, Jolly, Marks, Steenbergen & Vachudova (2025): The 2024 Chapel Hill Expert Survey ' +
    'on political party positioning in Europe. Electoral Studies 97, 102981',
  url: 'https://doi.org/10.1016/j.electstud.2025.102981',
}

/**
 * Volt Deutschland fehlt in CHES 2024. Wir nehmen das Mittel aus zwei Quellen: CHES 2024 für Volt Nederland (Wahl
 * 2023, gleiche pan-europäische Partei) und unsere Schätzung aus den Antworten von Volt in sieben Katalogen – der Wert,
 * an dem die Antworten am besten zur Antwortstruktur der übrigen Parteien passen (Mitte des besten Bereichs).
 */
export const VOLT_QUELLEN = {
  chesNl: { lrecon: 4.7, galtan: 1.09, text: 'CHES 2024, Volt Nederland' },
  programme: { lrecon: 3.4, galtan: 2.75, text: 'Schätzung aus den Antworten von Volt in unseren Katalogen' },
}

/**
 * Mittelwerte aus CHES 2024 (CHES_2024_final_v2.csv, Deutschland), 0 bis 10, auf zwei Stellen gerundet. CHES verortet
 * Bundesparteien; für Landtagswahlen gilt die Bundespartei als Näherung. „Union“ ist das Mittel von CDU und CSU,
 * gewichtet nach ihrem Zweitstimmenanteil 2021 (18,9 und 6,2 %). Volt ist das Mittel aus VOLT_QUELLEN.
 */
export const CHES: Readonly<Record<string, Record<Dimension, number>>> = {
  CDU: { lrecon: 6.58, galtan: 6.56 },
  CSU: { lrecon: 6.77, galtan: 7.54 },
  Union: { lrecon: 6.63, galtan: 6.8 },
  SPD: { lrecon: 3.47, galtan: 3.61 },
  Grüne: { lrecon: 3.37, galtan: 1.61 },
  FDP: { lrecon: 7.58, galtan: 3.22 },
  AfD: { lrecon: 7.63, galtan: 9.39 },
  Linke: { lrecon: 1.37, galtan: 2.29 },
  BSW: { lrecon: 2.78, galtan: 7.06 },
  'Freie Wähler': { lrecon: 6.45, galtan: 6.7 },
  Volt: {
    lrecon: (VOLT_QUELLEN.chesNl.lrecon + VOLT_QUELLEN.programme.lrecon) / 2,
    galtan: (VOLT_QUELLEN.chesNl.galtan + VOLT_QUELLEN.programme.galtan) / 2,
  },
}

/** Richtung einer Frage auf einer Dimension; `offen`, wenn sie sich nicht berechnen lässt. */
export type Richtung = Pol | 'keine' | 'offen'

export const richtungText = (d: Dimension, r: Richtung): string =>
  r === 'offen' ? 'nicht bestimmbar' : r === 'keine' ? 'ungerichtet' : `Ja eher ${DIMENSION[d].pol[r]}`

/** Ab diesem Betrag von ρ zählt eine Frage auf einer Dimension als gerichtet (nach Cohen ein großer Zusammenhang). */
export const RHO_SCHWELLE = 0.5
/** Erst ab so vielen Parteien mit Aussage und CHES-Wert lässt sich ρ sinnvoll berechnen. */
export const MINDEST_PARTEIEN = 4
/** Je Dimension soll mindestens dieser Anteil der Fragen gerichtet sein. */
export const MINDESTANTEIL_GERICHTET = 1 / 3
/** Höchstens so viel der gerichteten Fragen einer Dimension dürfen ihr Ja vom selben Pol bekommen. */
export const HOECHSTANTEIL = 0.6
/** Erst ab so vielen gerichteten Fragen ist der Anteil eines Pols aussagekräftig. */
export const MINDEST_GERICHTET = 6
/** So viele Profilfragen soll jede Partei je Katalog mindestens haben. */
export const MIN_PROFILFRAGEN = 2
/** Eine Profilfrage: Die Partei sagt Ja und höchstens so viele Parteien insgesamt. */
export const PROFIL_HOECHSTENS = 2

const WERT: Partial<Record<QuizPosition['position'], number>> = { ja: 1, teils: 0.5, nein: 0 }

/** Ränge mit Durchschnitt bei Gleichstand (1 = kleinster Wert). */
function raenge(xs: number[]): number[] {
  const sortiert = xs.map((x, i) => ({ x, i })).sort((a, b) => a.x - b.x)
  const r = new Array<number>(xs.length)
  for (let von = 0; von < sortiert.length; ) {
    let bis = von
    while (bis + 1 < sortiert.length && sortiert[bis + 1].x === sortiert[von].x) bis++
    for (let k = von; k <= bis; k++) r[sortiert[k].i] = (von + bis) / 2 + 1
    von = bis + 1
  }
  return r
}

/** Rangkorrelation nach Spearman (Pearson der Ränge, Gleichstände gemittelt); null ohne Streuung. */
export function spearman(xs: number[], ys: number[]): number | null {
  const rx = raenge(xs)
  const ry = raenge(ys)
  const n = xs.length
  const mx = rx.reduce((a, b) => a + b, 0) / n
  const my = ry.reduce((a, b) => a + b, 0) / n
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (let i = 0; i < n; i++) {
    sxy += (rx[i] - mx) * (ry[i] - my)
    sxx += (rx[i] - mx) ** 2
    syy += (ry[i] - my) ** 2
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null
}

/**
 * ρ einer Frage auf einer Dimension: Antwort (Ja 1, teils 0,5, Nein 0; „keine Aussage“ fehlt) gegen die CHES-Position.
 * Positiv heißt: Das Ja kommt eher vom Pol `hoch`. null bei weniger als `MINDEST_PARTEIEN` Werten oder ohne Streuung.
 */
export function rho(positionen: QuizPosition[], parteien: QuizPartei[], d: Dimension): number | null {
  const antwort: number[] = []
  const lage: number[] = []
  for (const p of positionen) {
    const kurz = parteien.find((x) => x.id === p.partei_id)?.kurzname
    const ches = kurz ? CHES[kurz] : undefined
    const wert = WERT[p.position]
    if (ches && wert !== undefined) {
      antwort.push(wert)
      lage.push(ches[d])
    }
  }
  return antwort.length >= MINDEST_PARTEIEN ? spearman(antwort, lage) : null
}

export function richtungVon(r: number | null): Richtung {
  if (r === null) return 'offen'
  if (r >= RHO_SCHWELLE) return 'hoch'
  if (r <= -RHO_SCHWELLE) return 'niedrig'
  return 'keine'
}

/** Profilfrage einer Partei: Sie sagt Ja, und insgesamt sagen höchstens `PROFIL_HOECHSTENS` Parteien Ja. */
export const istProfilfrage = (frage: Pick<QuizFrage, 'richtig'>, parteiId: number) =>
  frage.richtig.includes(parteiId) && frage.richtig.length <= PROFIL_HOECHSTENS

/** Ratbar ist eine Frage, wenn mindestens eine Partei weder Ja noch teils sagt – sonst gibt es nichts zu raten. */
export const istRatbar = (frage: Pick<QuizFrage, 'positionen'>) =>
  frage.positionen.some((p) => p.position === 'nein' || p.position === 'keine_aussage')

export interface Dimensionswerte {
  /** Zahl der Fragen je Richtung. */
  richtung: Record<Richtung, number>
  /** Mittleres ρ aller berechenbaren Fragen – nahe 0 heißt: beide Pole kommen etwa gleich zum Zug. */
  mittel: number | null
}

export interface Ausgewogenheit {
  dimension: Record<Dimension, Dimensionswerte>
  /** Parteien ohne CHES-Wert – sie zählen bei der Richtung nicht mit. */
  ohneChes: QuizPartei[]
  /** Profilfragen je Partei, in der Reihenfolge der Parteienliste. */
  profil: { partei: QuizPartei; anzahl: number }[]
  /** Fragen, bei denen keine Partei Nein oder nichts sagt. */
  nichtRatbar: string[]
  /** Was auffällt, als Sätze – leer heißt: nichts zu beanstanden. */
  hinweise: string[]
}

type Katalogdaten = { parteien: QuizPartei[]; fragen: Pick<QuizFrage, 'id' | 'positionen' | 'richtig'>[] }

const prozent = (x: number) => `${Math.round(x * 100)} %`

/** Kennzahlen eines Katalogs (einer Wahl). */
export function ausgewogenheit({ parteien, fragen }: Katalogdaten): Ausgewogenheit {
  const hinweise: string[] = []
  const dimension = {} as Record<Dimension, Dimensionswerte>
  for (const d of DIMENSIONEN) {
    const richtung: Record<Richtung, number> = { niedrig: 0, hoch: 0, keine: 0, offen: 0 }
    const werte: number[] = []
    for (const f of fragen) {
      const r = rho(f.positionen, parteien, d)
      richtung[richtungVon(r)]++
      if (r !== null) werte.push(r)
    }
    const mittel = werte.length ? werte.reduce((a, b) => a + b, 0) / werte.length : null
    dimension[d] = { richtung, mittel }

    const { name, pol } = DIMENSION[d]
    const gerichtet = richtung.niedrig + richtung.hoch
    if (fragen.length && gerichtet / fragen.length < MINDESTANTEIL_GERICHTET)
      hinweise.push(
        `${name}: Nur ${gerichtet} von ${fragen.length} Fragen sind gerichtet (Ziel: mindestens ein Drittel) – ` +
          `Fragen ergänzen, die diese Konfliktlinie abbilden.`,
      )
    if (gerichtet >= MINDEST_GERICHTET) {
      const ueber: Pol | null =
        richtung.niedrig / gerichtet > HOECHSTANTEIL ? 'niedrig' : richtung.hoch / gerichtet > HOECHSTANTEIL ? 'hoch' : null
      if (ueber) {
        const gegen: Pol = ueber === 'niedrig' ? 'hoch' : 'niedrig'
        hinweise.push(
          `${name}: Bei ${richtung[ueber]} von ${gerichtet} gerichteten Fragen ` +
            `(${prozent(richtung[ueber] / gerichtet)}) kommt das Ja eher von „${pol[ueber]}“ – ebenso zugespitzte ` +
            `Fragen ergänzen, bei denen „${pol[gegen]}“ Ja sagt.`,
        )
      }
    }
  }

  const ohneChes = parteien.filter((p) => !CHES[p.kurzname])
  const profil = parteien.map((partei) => ({ partei, anzahl: fragen.filter((f) => istProfilfrage(f, partei.id)).length }))
  const zuWenig = profil.filter((x) => x.anzahl < MIN_PROFILFRAGEN)
  if (zuWenig.length)
    hinweise.push(
      `Weniger als ${MIN_PROFILFRAGEN} Profilfragen: ${zuWenig.map((x) => `${x.partei.kurzname} (${x.anzahl})`).join(', ')}.`,
    )
  const nichtRatbar = fragen.filter((f) => !istRatbar(f)).map((f) => f.id)
  if (nichtRatbar.length)
    hinweise.push(
      `Nicht ratbar, weil keine Partei Nein oder nichts sagt: ${nichtRatbar.join(', ')} – „teils“ am Programm prüfen.`,
    )
  const offen = Math.max(...DIMENSIONEN.map((d) => dimension[d].richtung.offen))
  if (offen)
    hinweise.push(
      `${offen} Fragen nicht bestimmbar: zu wenige Parteien mit Aussage oder alle gleich – „keine Aussage“ dort nachprüfen.`,
    )
  return { dimension, ohneChes, profil, nichtRatbar, hinweise }
}
