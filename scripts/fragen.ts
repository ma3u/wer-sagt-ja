// Übersicht und Prüfung der Fragen in public/fragen.json: je Frage, welche Parteien Ja sagen (richtig) und was
// fehlt. Aufruf: npm run fragen – endet mit Fehlercode, wenn eine Frage nicht spielbar ist.
// Dazu je Wahl die Ausgewogenheit (src/ausgewogenheit.ts): Richtung je Frage, Verteilung und Profilfragen je Partei.
// Auffälligkeiten stehen als Warnung (⚠) da, ändern aber den Fehlercode nicht – sie sind ein Arbeitsauftrag.

import { readFileSync } from 'node:fs'
import { RICHTUNG_TEXT, ausgewogenheit, richtungVon, richtungswert } from '../src/ausgewogenheit.ts'
import { alsFrage, fehlerIn, fehlerInWahl, quizKatalog, type FragenDatei } from '../src/katalog.ts'

const datei = JSON.parse(readFileSync(new URL('../public/fragen.json', import.meta.url), 'utf8')) as FragenDatei
let fehlerhaft = 0
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
    const wert = richtungswert(e.positionen, w.parteien)
    const richtung = `  · ${RICHTUNG_TEXT[richtungVon(wert)]}${wert === null ? '' : ` (${wert > 0 ? '+' : ''}${wert.toFixed(2)})`}`
    console.log(`✓ ${e.id}  ${e.frage}\n    Ja: ${f.richtig.map(name).join(', ')} (${f.art})${teils}${richtung}${e.ki_entwurf ? '  · KI-Entwurf' : ''}`)
  }
}

console.log('\nAusgewogenheit je Wahl (Issue #1) – Spielprinzip bleibt, ausgewogen sein muss die Auswahl:')
for (const d of quizKatalog(datei).wahlen.filter((d) => d.parteien.length && d.fragen.length)) {
  const a = ausgewogenheit(d)
  const r = a.richtung
  console.log(`\n${d.wahl.name}: ${r.links}× links · ${r.quer}× gemischt · ${r.rechts}× rechts · ${r.offen}× nicht bestimmbar`)
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
