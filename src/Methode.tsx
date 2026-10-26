import { useEffect, useState } from 'react'
import { QUELLCODE } from './app'
import {
  CHES,
  CHES_QUELLE,
  HOECHSTANTEIL,
  MIN_PROFILFRAGEN,
  MINDEST_GERICHTET,
  MINDEST_PARTEIEN,
  MINDESTANTEIL_GERICHTET,
  RHO_SCHWELLE,
  ausgewogenheit,
} from './ausgewogenheit'
import { useAnsicht, useFokusZurueck } from './barrierefrei'
import { spielbar, standardWahl } from './katalog'
import { ladeKatalog } from './laden'
import { UnterseitenKopf } from './Rechtliches'
import { uebersichtHash } from './uebersicht'
import type { Katalog } from './typen'

// So prüfen wir die Ausgewogenheit (#/methode): Methode, Stand je Katalog und offene Punkte (Issue #1, #6). Schwellen,
// Kriterien und Parteipositionen kommen aus src/ausgewogenheit.ts, der Stand je Katalog wird live berechnet – die Seite
// bleibt so von selbst aktuell.

const prozent = (x: number) => `${Math.round(x * 100)} %`
const komma = (x: number) => x.toFixed(2).replace('.', ',')

export function Methode({ onZurueck }: { onZurueck: () => void }) {
  const titel = useAnsicht('So prüfen wir die Ausgewogenheit')
  useFokusZurueck()
  const [katalog, setKatalog] = useState<Katalog | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)

  useEffect(() => {
    ladeKatalog()
      .then(setKatalog)
      .catch((e: unknown) => setFehler(e instanceof Error ? e.message : String(e)))
  }, [])

  return (
    <main className="seite recht methode">
      <UnterseitenKopf onZurueck={onZurueck} />
      <article>
        <h1 ref={titel}>So prüfen wir die Ausgewogenheit</h1>
        <p>
          Ein Politikwissenschaftler hat uns nach dem Testen zurückgemeldet, die Fragen seien eher linksliberal
          ausgewählt. Wir haben das nachgemessen und die Kataloge ergänzt. Hier steht, wie wir messen, wo jeder Katalog
          heute steht und welche Punkte wir noch mit Fachleuten abstimmen.
        </p>
        <div className="methode-grundsatz">
          <p>
            <strong>Zuspitzung ja, Schlagseite nein.</strong> Gefragt wird immer, wer Ja sagt, und die Fragen dürfen
            zuspitzen. Ausgewogen sein muss die Auswahl: Jede Partei soll ihre eigenen Forderungen als Ja-Frage
            wiederfinden. Eine Schlagseite beheben wir mit ebenso pointierten Fragen der Gegenseite. Bestehende Fragen
            schwächen wir nicht ab, und keiner Partei schreiben wir eine Position zu, die nicht im Programm steht.
          </p>
        </div>

        <h2>Wo die Parteien stehen</h2>
        <p>
          Wir verorten die Parteien auf zwei Achsen: wirtschaftlich von mehr Staat und Umverteilung (0) bis mehr Markt
          (10), gesellschaftlich von grün-alternativ-libertär (0) bis traditionell-autoritär-national (10). Die Werte
          stammen aus dem Chapel Hill Expert Survey 2024, einer Befragung von Fachleuten für Parteien. Sie kommen also
          nicht aus den Programmen, aus denen die Antworten im Spiel stammen. So prüfen wir die Fragen an einem
          unabhängigen Maßstab.
        </p>
        <Parteienkarte />
        <p className="meta">
          CHES verortet Bundesparteien; für Landtagswahlen gilt die Bundespartei als Näherung. Die Union im Bund ist das
          nach Zweitstimmen 2021 gewichtete Mittel aus CDU und CSU. Volt ist in CHES 2024 nicht enthalten und zählt bei
          der Richtung nicht mit.
        </p>

        <h2>Von wem das Ja einer Frage kommt</h2>
        <p>
          Für jede Frage und jede Achse vergleichen wir die Antworten der Parteien mit ihrer Lage, als Rangkorrelation
          nach Spearman. Dabei zählt Ja als 1, teils als 0,5 und Nein als 0; „keine Aussage“ zählt nicht mit, auch nicht
          als Nein. Gerechnet wird ab {MINDEST_PARTEIEN} Parteien mit Aussage. Ab einem Wert von{' '}
          {String(RHO_SCHWELLE).replace('.', ',')} oder −{String(RHO_SCHWELLE).replace('.', ',')} gilt eine Frage auf dieser Achse als gerichtet: Das Ja kommt
          dann eher von einem Pol.
        </p>

        <h2>Wann ein Katalog als ausgewogen gilt</h2>
        <ul>
          <li>
            <strong>Beide Pole kommen zum Zug:</strong> Je Achse kommt das Ja bei höchstens {prozent(HOECHSTANTEIL)} der
            gerichteten Fragen vom selben Pol, geprüft ab {MINDEST_GERICHTET} gerichteten Fragen.
          </li>
          <li>
            <strong>Jede Partei ist erkennbar:</strong> Jede Partei hat mindestens {MIN_PROFILFRAGEN} Profilfragen, bei
            denen sie mit höchstens einer anderen Partei Ja sagt.
          </li>
          <li>
            <strong>Beide Konfliktlinien sind vertreten:</strong> Je Achse ist mindestens{' '}
            {MINDESTANTEIL_GERICHTET === 1 / 3 ? 'ein Drittel' : prozent(MINDESTANTEIL_GERICHTET)} der Fragen gerichtet.
          </li>
          <li>
            <strong>Jede Frage ist ratbar:</strong> Mindestens eine Partei sagt Nein oder nichts dazu. Sonst wäre alles
            anzukreuzen immer richtig, und die Frage kommt nicht ins Spiel.
          </li>
        </ul>

        <h2>Stand je Katalog</h2>
        <p>
          Im Oktober 2026 haben wir 104 Fragen ergänzt, gezielt gegen die Lücken. Vorher kam etwa in Thüringen das Ja bei
          8 von 9 wirtschaftlich gerichteten Fragen von „mehr Staat“, in Berlin gesellschaftlich bei 5 von 7 von der
          traditionellen Seite. Die Tabelle zeigt den heutigen Stand; Einzelheiten stehen in der Fragenübersicht jedes
          Katalogs unter „Ausgewogenheit dieses Katalogs“.
        </p>
        {fehler && (
          <p className="hinweis" role="alert">
            {fehler}
          </p>
        )}
        {!katalog && !fehler && <p className="hinweis">Lade Fragen …</p>}
        {katalog && <StandTabelle katalog={katalog} />}

        <h2>Was wir noch abstimmen</h2>
        <p>Diese Punkte klären wir mit dem Politikwissenschaftler, bevor wir die Schwellen festschreiben:</p>
        <ul>
          <li>Ist die Rangkorrelation bei vier bis neun Parteien je Wahl ein tragfähiges Maß, und passt die Schwelle?</li>
          <li>Ist die Grenze von {prozent(HOECHSTANTEIL)} vom selben Pol zu streng oder zu locker?</li>
          <li>
            Profilfragen haben oft nur zwei oder drei Parteien mit Aussage; dann ist keine Richtung messbar. Das
            Kriterium „ein Drittel gerichtet“ zieht deshalb gegen die Profilfragen. Unser Vorschlag: es nur auf Fragen mit
            messbarer Richtung beziehen.
          </li>
          <li>Taugt die Bundespartei als Näherung für Landesverbände, etwa beim BSW oder bei den Freien Wählern?</li>
          <li>Ist die Zählung von „teils“ (halb) und „keine Aussage“ (gar nicht) angemessen?</li>
          <li>Wie lässt sich Volt verorten, das in CHES 2024 fehlt?</li>
          <li>
            Reichen Codebuch, eine zweite unabhängige Codierung und ein Übereinstimmungsmaß (Krippendorffs Alpha) für die
            Prüfung der Positionen?
          </li>
        </ul>

        <h2>Grenzen</h2>
        <ul>
          <li>
            Alle Positionen sind mit KI-Hilfe erfasst und noch nicht von Menschen geprüft. Jede lässt sich in der{' '}
            <a href={uebersichtHash()}>Fragenübersicht</a> prüfen: „Position bestätigen“ oder „Fehler melden“.
          </li>
          <li>Die Messung sagt nichts darüber, ob die Themen angemessen gewichtet sind. Ein Themenraster ist geplant.</li>
          <li>Viele Profilfragen sind auf einer Achse nicht messbar, weil die meisten Programme dazu nichts sagen.</li>
        </ul>

        <h2>Quellen</h2>
        <p className="meta">
          Parteipositionen: {CHES_QUELLE.text}.{' '}
          <a href={CHES_QUELLE.url} target="_blank" rel="noopener noreferrer">
            Artikel
          </a>
        </p>
        <p className="meta">
          Ausführlich mit allen Zahlen:{' '}
          <a href={`${QUELLCODE}/issues/1`} target="_blank" rel="noopener noreferrer">
            Issue #1 zur Ausgewogenheit
          </a>
          {' · '}
          <a href={`${QUELLCODE}/issues/6`} target="_blank" rel="noopener noreferrer">
            Abstimmung der Schwellen
          </a>
          {' · '}
          <a href={`${QUELLCODE}/blob/main/src/ausgewogenheit.ts`} target="_blank" rel="noopener noreferrer">
            Berechnung im Quellcode
          </a>
        </p>
      </article>
    </main>
  )
}

// Beschriftung neben dem Punkt: Versatz in Pixeln und Ausrichtung, damit sich die eng beieinander liegenden Parteien
// (CDU, CSU, Freie Wähler) nicht überdecken.
const BESCHRIFTUNG: Record<string, [number, number, 'start' | 'end']> = {
  CDU: [7, 10, 'start'],
  CSU: [7, -4, 'start'],
  'Freie Wähler': [-7, -6, 'end'],
}

/** Die Parteien nach CHES 2024 als maßstabsgetreues Streudiagramm (0 bis 10 auf beiden Achsen). */
function Parteienkarte() {
  const links = 50
  const rechts = 330
  const oben = 20
  const unten = 250
  const x = (v: number) => links + ((rechts - links) * v) / 10
  const y = (v: number) => unten - ((unten - oben) * v) / 10
  const parteien = Object.entries(CHES).filter(([name]) => name !== 'Union')
  return (
    <figure className="methode-karte">
      <svg viewBox="0 0 360 300" role="img" aria-labelledby="methode-karte-titel">
        <title id="methode-karte-titel">
          {`Parteien nach CHES 2024, waagerecht wirtschaftlich, senkrecht gesellschaftlich: ${parteien
            .map(([n, w]) => `${n} ${komma(w.lrecon)} und ${komma(w.galtan)}`)
            .join(', ')}`}
        </title>
        <g className="methode-gitter">
          {[0, 5, 10].map((v) => (
            <line key={`h${v}`} x1={links} y1={y(v)} x2={rechts} y2={y(v)} />
          ))}
          {[0, 5, 10].map((v) => (
            <line key={`v${v}`} x1={x(v)} y1={oben} x2={x(v)} y2={unten} />
          ))}
        </g>
        <g className="methode-skala">
          {[0, 5, 10].map((v) => (
            <text key={`x${v}`} x={x(v)} y={unten + 16} textAnchor="middle">
              {v}
            </text>
          ))}
          {[0, 5, 10].map((v) => (
            <text key={`y${v}`} x={links - 8} y={y(v) + 4} textAnchor="end">
              {v}
            </text>
          ))}
          <text x={(links + rechts) / 2} y={292} textAnchor="middle">
            wirtschaftlich: mehr Staat ← → mehr Markt
          </text>
          <text transform={`translate(14 ${(oben + unten) / 2}) rotate(-90)`} textAnchor="middle">
            gesellschaftlich: GAL ← → TAN
          </text>
        </g>
        {parteien.map(([name, w]) => {
          const [dx, dy, anker] = BESCHRIFTUNG[name] ?? [7, 4, 'start']
          return (
            <g key={name} className="methode-partei">
              <circle cx={x(w.lrecon)} cy={y(w.galtan)} r={4} />
              <text x={x(w.lrecon) + dx} y={y(w.galtan) + dy} textAnchor={anker}>
                {name}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="meta">GAL = grün-alternativ-libertär, TAN = traditionell-autoritär-national.</figcaption>
    </figure>
  )
}

/** Je spielbarer Wahl: gerichtete Fragen je Pol, die wenigsten Profilfragen einer Partei und die offenen Hinweise. */
function StandTabelle({ katalog }: { katalog: Katalog }) {
  const wahlen = katalog.wahlen.filter(spielbar)
  return (
    <div className="methode-tabelle">
      <table>
        <caption>Gerichtete Fragen je Pol</caption>
        <thead>
          <tr>
            <th scope="col">Katalog</th>
            <th scope="col">Fragen</th>
            <th scope="col">Staat : Markt</th>
            <th scope="col">GAL : TAN</th>
            <th scope="col">Profil&shy;fragen min&shy;destens</th>
          </tr>
        </thead>
        <tbody>
          {wahlen.map((d) => {
            const a = ausgewogenheit(d)
            const r = (dim: 'lrecon' | 'galtan') => `${a.dimension[dim].richtung.niedrig} : ${a.dimension[dim].richtung.hoch}`
            const wenigste = Math.min(...a.profil.map((p) => p.anzahl))
            return (
              <tr key={d.wahl.id}>
                <th scope="row">
                  <a href={uebersichtHash(null, null, d === standardWahl(katalog) ? null : d.wahl.id)}>{d.wahl.kurz}</a>
                </th>
                <td>{d.fragen.length}</td>
                <td>{r('lrecon')}</td>
                <td>{r('galtan')}</td>
                <td>{wenigste}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
