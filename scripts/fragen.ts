// Übersicht und Prüfung der Fragen in public/fragen.json: je Frage, welche Parteien Ja sagen (richtig) und was
// fehlt. Aufruf: npm run fragen – endet mit Fehlercode, wenn eine Frage nicht spielbar ist.

import { readFileSync } from 'node:fs'
import { alsFrage, fehlerIn, quizDaten, type FragenDatei } from '../src/katalog.ts'

const datei = JSON.parse(readFileSync(new URL('../public/fragen.json', import.meta.url), 'utf8')) as FragenDatei
const name = (id: number) => datei.parteien.find((p) => p.id === id)?.kurzname ?? String(id)
let fehlerhaft = 0
const ids = new Set<string>()

for (const e of datei.fragen) {
  const fehler = fehlerIn(e, datei.parteien)
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
  console.log(`✓ ${e.id}  ${e.frage}\n    Ja: ${f.richtig.map(name).join(', ')} (${f.art})${teils}${e.ki_entwurf ? '  · KI-Entwurf' : ''}`)
}

const daten = quizDaten(datei)
console.log(`\n${daten.fragen.length} spielbare Fragen, ${fehlerhaft} mit Fehlern · Fassung ${daten.version}`)
if (fehlerhaft) process.exit(1)
