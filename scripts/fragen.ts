// Übersicht und Prüfung der Fragen in public/fragen.json: je Frage, welche Parteien Ja sagen (richtig) und was
// fehlt. Aufruf: npm run fragen – endet mit Fehlercode, wenn eine Frage nicht spielbar ist.
// Dazu je Wahl die Ausgewogenheit (src/ausgewogenheit.ts): je Frage ρ auf beiden Dimensionen mit der Zahl der
// einbezogenen Parteien (n), gemessen an PWIB je Wahl und an CHES als Gegenprobe; je Wahl die Verteilung, die Fragen
// mit abweichender Richtung, die Profilfragen je Partei und nicht ratbare Fragen.
// Auffälligkeiten stehen als Warnung (⚠) da, ändern aber den Fehlercode nicht – sie sind ein Arbeitsauftrag.

import { readFileSync } from 'node:fs'
import {
  CHES,
  CHES_QUELLE,
  DIMENSION,
  DIMENSIONEN,
  PWIB_QUELLE,
  ausgewogenheit,
  korrelation,
  massstabFuer,
  richtungText,
  richtungVon,
  type Dimensionswerte,
  type Lagen,
  type Richtung,
} from '../src/ausgewogenheit.ts'
import { alsFrage, fehlerIn, fehlerInWahl, quizKatalog, type FragenDatei } from '../src/katalog.ts'

const datei = JSON.parse(readFileSync(new URL('../public/fragen.json', import.meta.url), 'utf8')) as FragenDatei
let fehlerhaft = 0
const NAME = { pwib: 'PWIB', ches: 'CHES' }
const zahl = (r: number | null) => (r === null ? '–' : `${r > 0 ? '+' : ''}${r.toFixed(2)}`)
const verteilung = (dim: (typeof DIMENSIONEN)[number], { richtung: r, mittel }: Dimensionswerte) =>
  (['niedrig', 'hoch', 'keine', 'offen'] as const).map((x: Richtung) => `${r[x]}× ${richtungText(dim, x)}`).join(' · ') +
  ` · mittleres ρ ${zahl(mittel)}`
const ids = new Set<string>()

for (const w of datei.wahlen) {
  const wahlFehler = fehlerInWahl(w)
  console.log(`\n${w.name} (${w.id}) – ${w.parteien.length ? `${w.parteien.length} Parteien` : 'Platzhalter ohne Programme'}`)
  for (const f of wahlFehler) console.log(`    – ${f}`)
  if (wahlFehler.length) fehlerhaft++
  const name = (id: number) => w.parteien.find((p) => p.id === id)?.kurzname ?? String(id)
  for (const e of datei.fragen.filter((e) => e.wahl === w.id)) {
    const fehler = fehlerIn(e, w.parteien)
    if (ids.has(e.id)) fehler.push('id doppelt')
    ids.add(e.id)
    if (fehler.length) {
      fehlerhaft++
      console.log(`✗ ${e.id}  ${e.frage}`)
      for (const f of fehler) console.log(`    – ${f}`)
      continue
    }
    const f = alsFrage(e)
    const teils = f.neutral.length ? `  · teils: ${f.neutral.map(name).join(', ')}` : ''
    const { massstab, lagen } = massstabFuer(w.id)
    const zeile = (l: Lagen) =>
      DIMENSIONEN.map((d) => {
        const { rho: r, n } = korrelation(e.positionen, w.parteien, d, l)
        return `${DIMENSION[d].name} ρ ${zahl(r)} (n ${n}) ${richtungText(d, richtungVon(r))}`
      }).join(' · ')
    const gegen = massstab === 'pwib' ? `\n    CHES: ${zeile(CHES)}` : ''
    console.log(
      `✓ ${e.id}  ${e.frage}\n    Ja: ${f.richtig.map(name).join(', ')} (${f.art})${teils}\n    ` +
        `${NAME[massstab]}: ${zeile(lagen)}${gegen}${e.ki_entwurf ? '  · KI-Entwurf' : ''}`,
    )
  }
}

console.log('\nAusgewogenheit je Wahl (Issue #1) – Spielprinzip bleibt, ausgewogen sein muss die Auswahl.')
console.log(`Parteipositionen je Wahl: ${PWIB_QUELLE.text}. ${PWIB_QUELLE.zusatz}`)
console.log(`Gegenprobe: ${CHES_QUELLE.text}`)
for (const d of quizKatalog(datei).wahlen.filter((d) => d.parteien.length && d.fragen.length)) {
  const a = ausgewogenheit(d)
  const ohne = (m: typeof a | NonNullable<typeof a.gegenprobe>) =>
    m.ohneLage.length ? ` (ohne Position: ${m.ohneLage.map((p) => p.kurzname).join(', ')})` : ''
  console.log(`\n${d.wahl.name} – gemessen an ${NAME[a.massstab]}${ohne(a)}`)
  for (const dim of DIMENSIONEN) console.log(`    ${DIMENSION[dim].name}: ${verteilung(dim, a.dimension[dim])}`)
  if (a.gegenprobe) {
    console.log(`  Gegenprobe ${NAME[a.gegenprobe.massstab]}${ohne(a.gegenprobe)}`)
    for (const dim of DIMENSIONEN) console.log(`    ${DIMENSION[dim].name}: ${verteilung(dim, a.gegenprobe.dimension[dim])}`)
    const ab = a.gegenprobe.abweichend
    const kurz = (dim: (typeof DIMENSIONEN)[number], r: Richtung) =>
      r === 'niedrig' || r === 'hoch' ? DIMENSION[dim].kurz[r].replace('\u00ad', '') : 'ungerichtet'
    const gegensaetzlich = ab.filter((x) => x.richtung !== 'keine' && x.gegenprobe !== 'keine').length
    console.log(`    Richtung abweichend (PWIB/CHES): ${ab.length}, davon gegensätzlich ${gegensaetzlich}`)
    for (const x of ab)
      console.log(`      ${x.id} ${DIMENSION[x.dimension].name}: ${kurz(x.dimension, x.richtung)} / ${kurz(x.dimension, x.gegenprobe)}`)
  }
  console.log(`    Profilfragen: ${a.profil.map((x) => `${x.partei.kurzname} ${x.anzahl}`).join(', ')}`)
  for (const h of a.hinweise) console.log(`    ⚠ ${h}`)
}
const bekannt = new Set(datei.wahlen.map((w) => w.id))
for (const e of datei.fragen.filter((e) => !bekannt.has(e.wahl))) {
  fehlerhaft++
  console.log(`✗ ${e.id}  Wahl „${e.wahl}“ unbekannt`)
}

const katalog = quizKatalog(datei)
const summe = katalog.wahlen.map((d) => `${d.wahl.kurz}: ${d.parteien.length ? d.fragen.length : '–'}`).join(', ')
console.log(`\nSpielbare Fragen – ${summe}; ${fehlerhaft} Einträge mit Fehlern · Fassung ${katalog.version}`)
if (fehlerhaft) process.exit(1)
