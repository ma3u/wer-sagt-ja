import type { QuizFrage, QuizPartei, QuizPosition, Wahl } from './typen.ts'

// Ausgewogenheit eines Katalogs (Issue #1). Das Spielprinzip bleibt: Gefragt wird immer, wer Ja sagt, und die Fragen
// dürfen zuspitzen. Ausgewogen sein muss die Auswahl: Jede Partei soll ihre Forderungen als Ja-Frage wiederfinden,
// und ein Katalog soll nicht überwiegend Forderungen eines Pols abfragen. Diese Kennzahlen machen das sichtbar –
// `npm run fragen` warnt, die Übersicht (#/fragen) zeigt sie. Sie ändern nichts am Spiel und an keiner Position.
//
// Methode (Issue #1, „Methode der Überarbeitung“, #6, #14): Parteipositionen auf zwei Dimensionen je Wahl aus dem
// fortgeschriebenen Datensatz „Parteienwettbewerb in den deutschen Bundesländern“ (PWIB, Wordscores aus den
// Wahlprogrammen der Landesparteien). Der Chapel Hill Expert Survey 2024 (Bundesparteien) bleibt als Gegenprobe; wo
// beide zu einem anderen Ergebnis kommen, steht es da. Je Frage und Dimension die Rangkorrelation nach Spearman zwischen
// Antwort und Position; ab |ρ| ≥ 0,5 ist die Frage auf der Dimension gerichtet.

export type Dimension = 'lrecon' | 'galtan'

/** Pol einer Dimension: `niedrig` sind die Werte nahe 0, `hoch` die nahe 10. */
export type Pol = 'niedrig' | 'hoch'

/**
 * Die zwei Konfliktlinien des deutschen Parteiensystems, benannt nach Niedermayer (NIEDERMAYER_QUELLE). Die Schlüssel
 * stammen aus CHES (LRECON, GALTAN); in PWIB entsprechen ihnen econ_pos_norm und soci_pos_norm, gleich gerichtet.
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

/** Lage der Parteien auf beiden Dimensionen, nach Kurzname. */
export type Lagen = Readonly<Record<string, Record<Dimension, number>>>

/** Woher die Lage der Parteien kommt: PWIB je Wahl, sonst und als Gegenprobe CHES je Bundespartei. */
export type Massstab = 'pwib' | 'ches'

/** Quelle der Positionen je Wahl – Zitierweise und Zusatz, wie die Autoren sie erbitten (daten/pwib/README.txt). */
export const PWIB_QUELLE = {
  text:
    'Bräuninger, Thomas; Debus, Marc; Müller, Jochen; Stecker, Christian (2020): Parteienwettbewerb in den deutschen ' +
    'Bundesländern. 2., vollständig überarbeitete Auflage. Wiesbaden: Springer VS',
  zusatz: 'Fortgeschriebene PWIB-Wordscores-Daten, Schätzstand 20.10.2026; Auszug für Wer sagt Ja? vom 28.10.2026',
  url: 'https://doi.org/10.1007/978-3-658-29222-5',
}

/**
 * econ_pos_norm und soci_pos_norm aus daten/pwib/ je Wahl, auf zwei Stellen gerundet (so geliefert; die Rangfolgen
 * bleiben erhalten). Die Skala ist nicht 0 bis 10 und kann negativ werden; für ρ zählt nur die Rangfolge je Wahl.
 * „Union“ im Bund ist das gemeinsame Programm von CDU und CSU (de2025cdu), nicht die CSU-Bayern-Agenda. Volt fehlt im
 * Datensatz, die Freien Wähler in Sachsen-Anhalt und Mecklenburg-Vorpommern: Sie zählen dort nicht mit, ergänzt wird
 * nichts.
 */
export const PWIB: Readonly<Record<string, Lagen>> = {
  btw25: {
    Union: { lrecon: 12.88, galtan: 9.74 },
    SPD: { lrecon: 8.61, galtan: 6.89 },
    Grüne: { lrecon: 8.19, galtan: 5.44 },
    FDP: { lrecon: 14.61, galtan: 5.82 },
    AfD: { lrecon: 16.05, galtan: 16.58 },
    Linke: { lrecon: 0.15, galtan: 0.41 },
    BSW: { lrecon: 8.05, galtan: 6.22 },
  },
  th24: {
    CDU: { lrecon: 13.49, galtan: 8.99 },
    SPD: { lrecon: 10.42, galtan: 6.51 },
    Grüne: { lrecon: 7.76, galtan: 3.3 },
    FDP: { lrecon: 16.59, galtan: 6.74 },
    AfD: { lrecon: 14.3, galtan: 12.13 },
    Linke: { lrecon: 4.95, galtan: 6.95 },
    BSW: { lrecon: 10.57, galtan: 7.52 },
    'Freie Wähler': { lrecon: 12.64, galtan: 9.12 },
  },
  sn24: {
    CDU: { lrecon: 12.87, galtan: 9.26 },
    SPD: { lrecon: 7.93, galtan: 5.54 },
    Grüne: { lrecon: 8.75, galtan: 3.96 },
    FDP: { lrecon: 17.32, galtan: 4.53 },
    AfD: { lrecon: 15.4, galtan: 16.12 },
    Linke: { lrecon: 5.98, galtan: 2.92 },
    BSW: { lrecon: 10.67, galtan: 7.09 },
    'Freie Wähler': { lrecon: 13.93, galtan: 10.46 },
  },
  bb24: {
    CDU: { lrecon: 12.54, galtan: 9.65 },
    SPD: { lrecon: 10.42, galtan: 9.06 },
    Grüne: { lrecon: 7.69, galtan: 3.88 },
    FDP: { lrecon: 13.3, galtan: 6.64 },
    AfD: { lrecon: 13.77, galtan: 12.03 },
    Linke: { lrecon: 3.28, galtan: 1.67 },
    BSW: { lrecon: 10.54, galtan: 8.03 },
    'Freie Wähler': { lrecon: 12.25, galtan: 7.66 },
  },
  hh25: {
    CDU: { lrecon: 10.85, galtan: 5.71 },
    SPD: { lrecon: 8.18, galtan: 4.07 },
    Grüne: { lrecon: 7.78, galtan: 2.48 },
    FDP: { lrecon: 11.53, galtan: 3.36 },
    AfD: { lrecon: 13.42, galtan: 11.65 },
    Linke: { lrecon: 0.95, galtan: -1.43 },
    BSW: { lrecon: 8.49, galtan: 4.11 },
    'Freie Wähler': { lrecon: 7.87, galtan: 3.39 },
  },
  bw26: {
    CDU: { lrecon: 12.89, galtan: 8.63 },
    SPD: { lrecon: 8.11, galtan: 4.88 },
    Grüne: { lrecon: 8.38, galtan: 4.87 },
    FDP: { lrecon: 13.54, galtan: 6.39 },
    AfD: { lrecon: 13.82, galtan: 11.66 },
    Linke: { lrecon: 1.65, galtan: 0.42 },
    BSW: { lrecon: 7.77, galtan: 4.53 },
    'Freie Wähler': { lrecon: 8.74, galtan: 7.56 },
  },
  rp26: {
    CDU: { lrecon: 11.39, galtan: 7.86 },
    SPD: { lrecon: 9.15, galtan: 6.35 },
    Grüne: { lrecon: 5.6, galtan: 1.57 },
    FDP: { lrecon: 12.64, galtan: 5.57 },
    AfD: { lrecon: 13.44, galtan: 11.81 },
    Linke: { lrecon: 2.04, galtan: -0.29 },
    BSW: { lrecon: 6.4, galtan: 6.09 },
    'Freie Wähler': { lrecon: 12.33, galtan: 7.94 },
  },
  st26: {
    CDU: { lrecon: 12.33, galtan: 9.81 },
    SPD: { lrecon: 8.92, galtan: 6.38 },
    Grüne: { lrecon: 8.17, galtan: 3.67 },
    FDP: { lrecon: 13.68, galtan: 7.68 },
    AfD: { lrecon: 11.95, galtan: 10.15 },
    Linke: { lrecon: 6.28, galtan: 4.11 },
    BSW: { lrecon: 8.89, galtan: 6.4 },
  },
  be26: {
    CDU: { lrecon: 11.5, galtan: 7.57 },
    SPD: { lrecon: 5.91, galtan: 4.19 },
    Grüne: { lrecon: 5.57, galtan: 1.83 },
    FDP: { lrecon: 11.26, galtan: 5.33 },
    AfD: { lrecon: 13.67, galtan: 10.97 },
    Linke: { lrecon: 4.83, galtan: 1.81 },
    BSW: { lrecon: 8.09, galtan: 5.45 },
  },
  mv26: {
    CDU: { lrecon: 13.39, galtan: 8.35 },
    SPD: { lrecon: 9.75, galtan: 7.32 },
    Grüne: { lrecon: 6.67, galtan: 3.52 },
    FDP: { lrecon: 15.62, galtan: 6.37 },
    AfD: { lrecon: 13.07, galtan: 9.75 },
    Linke: { lrecon: 5.07, galtan: 3.36 },
    BSW: { lrecon: 9.69, galtan: 7.01 },
  },
}

/** Quelle der Gegenprobe – Zitierweise, wie CHES sie erbittet. */
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
export const CHES: Lagen = {
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
/** Erst ab so vielen Parteien mit Aussage und Position lässt sich ρ sinnvoll berechnen. */
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

/** Die Lage der Parteien einer Wahl: PWIB, wenn es die Wahl enthält, sonst CHES. */
export function massstabFuer(wahl: string | undefined): { massstab: Massstab; lagen: Lagen } {
  const pwib = wahl ? PWIB[wahl] : undefined
  return pwib ? { massstab: 'pwib', lagen: pwib } : { massstab: 'ches', lagen: CHES }
}

/**
 * ρ einer Frage auf einer Dimension: Antwort (Ja 1, teils 0,5, Nein 0; „keine Aussage“ fehlt) gegen die Position in
 * `lagen`, und `n`, wie viele Parteien eingehen. Positiv heißt: Das Ja kommt eher vom Pol `hoch`. ρ ist null bei
 * weniger als `MINDEST_PARTEIEN` Werten oder ohne Streuung, etwa wenn alle gleich antworten.
 */
export function korrelation(
  positionen: QuizPosition[],
  parteien: QuizPartei[],
  d: Dimension,
  lagen: Lagen,
): { rho: number | null; n: number } {
  const antwort: number[] = []
  const lage: number[] = []
  for (const p of positionen) {
    const kurz = parteien.find((x) => x.id === p.partei_id)?.kurzname
    const l = kurz ? lagen[kurz] : undefined
    const wert = WERT[p.position]
    if (l && wert !== undefined) {
      antwort.push(wert)
      lage.push(l[d])
    }
  }
  return { rho: antwort.length >= MINDEST_PARTEIEN ? spearman(antwort, lage) : null, n: antwort.length }
}

export const rho = (positionen: QuizPosition[], parteien: QuizPartei[], d: Dimension, lagen: Lagen) =>
  korrelation(positionen, parteien, d, lagen).rho

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

/** Die Richtungen eines Katalogs, gemessen an einem Maßstab. */
export interface Messung {
  massstab: Massstab
  dimension: Record<Dimension, Dimensionswerte>
  /** Parteien ohne Position in diesem Maßstab – sie zählen bei der Richtung nicht mit. */
  ohneLage: QuizPartei[]
}

/** Eine Frage, deren Richtung auf einer Dimension in der Gegenprobe anders ausfällt; beide sind bestimmbar. */
export interface Abweichung {
  id: string
  dimension: Dimension
  richtung: Richtung
  gegenprobe: Richtung
}

export interface Ausgewogenheit extends Messung {
  /** CHES als Gegenprobe, wenn PWIB der Maßstab ist; `abweichend` sind die Fragen mit anderer Richtung. */
  gegenprobe: (Messung & { abweichend: Abweichung[] }) | null
  /** Profilfragen je Partei, in der Reihenfolge der Parteienliste. */
  profil: { partei: QuizPartei; anzahl: number }[]
  /** Fragen, bei denen keine Partei Nein oder nichts sagt. */
  nichtRatbar: string[]
  /** Was auffällt, als Sätze – leer heißt: nichts zu beanstanden. */
  hinweise: string[]
}

type Katalogdaten = {
  wahl?: Pick<Wahl, 'id'>
  parteien: QuizPartei[]
  fragen: Pick<QuizFrage, 'id' | 'positionen' | 'richtig'>[]
}

const prozent = (x: number) => `${Math.round(x * 100)} %`

/** Richtungen je Frage und Dimension an einem Maßstab, dazu die Hinweise zu Drittel und Schlagseite. */
function messen(massstab: Massstab, lagen: Lagen, { parteien, fragen }: Katalogdaten) {
  const hinweise = { drittel: [] as string[], schlagseite: [] as string[] }
  const dimension = {} as Record<Dimension, Dimensionswerte>
  const je = new Map<string, Record<Dimension, Richtung>>(fragen.map((f) => [f.id, {} as Record<Dimension, Richtung>]))
  for (const d of DIMENSIONEN) {
    const richtung: Record<Richtung, number> = { niedrig: 0, hoch: 0, keine: 0, offen: 0 }
    const werte: number[] = []
    for (const f of fragen) {
      const r = rho(f.positionen, parteien, d, lagen)
      const x = richtungVon(r)
      richtung[x]++
      je.get(f.id)![d] = x
      if (r !== null) werte.push(r)
    }
    const mittel = werte.length ? werte.reduce((a, b) => a + b, 0) / werte.length : null
    dimension[d] = { richtung, mittel }

    const { name, pol } = DIMENSION[d]
    const gerichtet = richtung.niedrig + richtung.hoch
    if (fragen.length && gerichtet / fragen.length < MINDESTANTEIL_GERICHTET)
      hinweise.drittel.push(
        `${name}: Nur ${gerichtet} von ${fragen.length} Fragen sind gerichtet (Ziel: mindestens ein Drittel) – ` +
          `Fragen ergänzen, die diese Konfliktlinie abbilden.`,
      )
    if (gerichtet >= MINDEST_GERICHTET) {
      const ueber: Pol | null =
        richtung.niedrig / gerichtet > HOECHSTANTEIL ? 'niedrig' : richtung.hoch / gerichtet > HOECHSTANTEIL ? 'hoch' : null
      if (ueber) {
        const gegen: Pol = ueber === 'niedrig' ? 'hoch' : 'niedrig'
        hinweise.schlagseite.push(
          `${name}: Bei ${richtung[ueber]} von ${gerichtet} gerichteten Fragen ` +
            `(${prozent(richtung[ueber] / gerichtet)}) kommt das Ja eher von „${pol[ueber]}“ – ebenso zugespitzte ` +
            `Fragen ergänzen, bei denen „${pol[gegen]}“ Ja sagt.`,
        )
      }
    }
  }
  const messung: Messung = { massstab, dimension, ohneLage: parteien.filter((p) => !lagen[p.kurzname]) }
  return { messung, je, hinweise }
}

/** Kennzahlen eines Katalogs (einer Wahl): gemessen an PWIB, wenn es die Wahl enthält, mit CHES als Gegenprobe. */
export function ausgewogenheit(daten: Katalogdaten): Ausgewogenheit {
  const { parteien, fragen } = daten
  const { massstab, lagen } = massstabFuer(daten.wahl?.id)
  const haupt = messen(massstab, lagen, daten)
  const hinweise = [...haupt.hinweise.schlagseite, ...haupt.hinweise.drittel]

  let gegenprobe: Ausgewogenheit['gegenprobe'] = null
  if (massstab === 'pwib') {
    const ches = messen('ches', CHES, daten)
    const abweichend: Abweichung[] = []
    for (const f of fragen)
      for (const d of DIMENSIONEN) {
        const richtung = haupt.je.get(f.id)![d]
        const anders = ches.je.get(f.id)![d]
        if (richtung !== anders && richtung !== 'offen' && anders !== 'offen')
          abweichend.push({ id: f.id, dimension: d, richtung, gegenprobe: anders })
      }
    gegenprobe = { ...ches.messung, abweichend }
    for (const h of ches.hinweise.schlagseite) hinweise.push(`Gegenprobe mit CHES – ${h}`)
  }

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
  const offen = Math.max(...DIMENSIONEN.map((d) => haupt.messung.dimension[d].richtung.offen))
  if (offen)
    hinweise.push(
      `${offen} Fragen nicht bestimmbar: zu wenige Parteien mit Aussage oder alle gleich – „keine Aussage“ dort nachprüfen.`,
    )
  return { ...haupt.messung, gegenprobe, profil, nichtRatbar, hinweise }
}
