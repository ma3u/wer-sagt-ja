import { useEffect, useId, useState } from 'react'
import { QUELLCODE } from './app'
import {
  CHES,
  CHES_QUELLE,
  DIMENSION,
  HOECHSTANTEIL,
  MIN_PROFILFRAGEN,
  MINDEST_GERICHTET,
  MINDEST_PARTEIEN,
  MINDESTANTEIL_GERICHTET,
  NIEDERMAYER_QUELLE,
  PWIB,
  PWIB_QUELLE,
  RHO_SCHWELLE,
  VOLT_QUELLEN,
  ausgewogenheit,
} from './ausgewogenheit'
import { useAnsicht, useFokusZurueck } from './barrierefrei'
import { spielbar, standardWahl } from './katalog'
import { ladeKatalog } from './laden'
import { UnterseitenKopf } from './Rechtliches'
import { uebersichtHash } from './uebersicht'
import type { Katalog } from './typen'

// So prüfen wir die Ausgewogenheit (#/methode): Methode, Stand je Katalog und offene Punkte (Issue #1, #6, #14). Schwellen,
// Kriterien und Parteipositionen kommen aus src/ausgewogenheit.ts, der Stand je Katalog wird live berechnet – die Seite
// bleibt so von selbst aktuell.

const WAHL_O_MAT_RECHNUNG = 'https://www.bpb.de/themen/wahl-o-mat/294576/wie-funktioniert-der-wahl-o-mat/'

/** Literatur zu den Fragen aus Issue #6. */
const LITERATUR: { text: string; url?: string }[] = [
  {
    text: 'Marc Debus (2026): Die Landtagswahlen 2026 in Baden-Württemberg. Notes du Cerfa, Ifri, S. 24–26',
    url: 'https://www.ifri.org/sites/default/files/2026-03/ifri_debus_landtagswahlen_baden_wurtemburg_03.2026.pdf',
  },
  { text: 'Thomas Bräuninger, Marc Debus, Jochen Müller, Christian Stecker (2020): Parteienwettbewerb in den deutschen Bundesländern. 2. Aufl., Springer VS' },
  { text: 'Bundeszentrale für politische Bildung: Wie funktioniert der Wahl-O-Mat?', url: WAHL_O_MAT_RECHNUNG },
  { text: 'Stefaan Walgrave, Michiel Nuytemans, Koen Pepermans (2009): Voting Aid Applications and the Effect of Statement Selection. West European Politics 32 (6), 1161–1180' },
  { text: 'Klaus Krippendorff (2004): Content Analysis. An Introduction to Its Methodology. 2. Aufl., Sage' },
  { text: 'Jacob Cohen (1988): Statistical Power Analysis for the Behavioral Sciences. 2. Aufl., Erlbaum' },
]

const prozent = (x: number) => `${Math.round(x * 100)} %`
const komma = (x: number) => x.toFixed(2).replace('.', ',')

/** `vorab`: Katalog schon geladen – beim Build für die statische Seite /methode/ (src/methodeSeite.tsx). */
export function Methode({ onZurueck, vorab }: { onZurueck?: () => void; vorab?: Katalog }) {
  const titel = useAnsicht('So prüfen wir die Ausgewogenheit')
  useFokusZurueck()
  const [katalog, setKatalog] = useState<Katalog | null>(vorab ?? null)
  const [fehler, setFehler] = useState<string | null>(null)

  useEffect(() => {
    if (vorab) return
    ladeKatalog()
      .then(setKatalog)
      .catch((e: unknown) => setFehler(e instanceof Error ? e.message : String(e)))
  }, [vorab])

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
          Wir verorten die Parteien auf den zwei Konfliktlinien des deutschen Parteiensystems, wie Oskar Niedermayer sie
          beschreibt: im Sozialstaatskonflikt zwischen sozialer Gerechtigkeit, also mehr Staat und Umverteilung, und
          Marktfreiheit, im soziokulturellen Konflikt zwischen linksliberal-kosmopolitischen und konservativen bis
          autoritären Werten.
        </p>
        <p>
          Die Positionen stammen je Wahl aus dem Datensatz „Parteienwettbewerb in den deutschen Bundesländern“ von Thomas
          Bräuninger, Marc Debus, Jochen Müller und Christian Stecker. Er schätzt die Lage jeder Landespartei aus ihrem
          vollständigen Wahlprogramm (Wordscores), auf einer wirtschafts- und einer gesellschaftspolitischen Dimension.
          Die Autoren haben uns einen Auszug für unsere zehn Wahlen überlassen;{' '}
          <a href={`${QUELLCODE}/tree/main/daten/pwib`} target="_blank" rel="noopener noreferrer">
            er liegt mit Dokumentation im Quellcode
          </a>
          . So wird sichtbar, wie weit Landesparteien von der Bundespartei abweichen: Das BSW steht in
          Baden-Württemberg 2026 gesellschaftlich bei {komma(PWIB.bw26.BSW.galtan)}, liberaler als SPD (
          {komma(PWIB.bw26.SPD.galtan)}) und Grüne ({komma(PWIB.bw26.Grüne.galtan)}). Bundesweit gilt es als
          konservativ.
        </p>
        <PwibTabelle />
        <p className="meta">
          Die Werte liegen nicht auf einer Skala von 0 bis 10 und können negativ sein; für die Rechnung zählt nur die
          Rangfolge innerhalb einer Wahl. Niedrige Werte stehen für mehr Umverteilung und Eingriffe des Staates bzw. für
          progressive Positionen. Die wirtschaftspolitische Dimension erfasst den breiten Konflikt um Markt und Staat,
          nicht allein den Sozialstaat. Für die Union im Bund gilt das gemeinsame Programm von CDU und CSU. Volt ist im
          Datensatz nicht enthalten, die Freien Wähler in Sachsen-Anhalt und Mecklenburg-Vorpommern auch nicht. Sie zählen
          dort bei der Richtung nicht mit; Werte ergänzen wir nicht.
        </p>
        <p>
          <strong>Kein unabhängiger Maßstab.</strong> Die Positionen beruhen auf denselben Programmen wie die Antworten im
          Spiel. Der Vergleich ist deshalb eine Plausibilitätsprüfung, keine unabhängige Bestätigung – so schreiben es auch
          die Autoren in ihrer Dokumentation. Als Gegenprobe rechnen wir jede Frage zusätzlich mit dem Chapel Hill Expert
          Survey 2024, einer Befragung von Fachleuten zu den Bundesparteien, und weisen aus, wo beide Maßstäbe zu einem
          anderen Ergebnis kommen. Auch Fachleute urteilen nicht zwangsläufig unabhängig von den Programmen.
        </p>
        <Parteienkarte />
        <p className="meta">
          In der Gegenprobe ist die Union im Bund das nach Zweitstimmen 2021 gewichtete Mittel aus CDU und CSU. Volt
          Deutschland fehlt auch in CHES 2024. Dort nehmen wir das Mittel aus zwei Quellen: dem CHES-Wert für Volt
          Nederland ({komma(VOLT_QUELLEN.chesNl.lrecon)} und {komma(VOLT_QUELLEN.chesNl.galtan)}), derselben
          pan-europäischen Partei, und einer Schätzung aus den Antworten von Volt in unseren Katalogen (
          {komma(VOLT_QUELLEN.programme.lrecon)} und {komma(VOLT_QUELLEN.programme.galtan)}). Die Schätzung ist der Wert,
          an dem die Antworten von Volt am besten zur Antwortstruktur der übrigen Parteien passen.
        </p>

        <h2>Von wem das Ja einer Frage kommt</h2>
        <p>
          Für jede Frage und jede Achse vergleichen wir die Antworten der Parteien mit ihrer Lage, als Rangkorrelation
          nach Spearman. Dabei zählt Ja als 1, teils als 0,5 und Nein als 0; „keine Aussage“ zählt nicht mit, auch nicht
          als Nein, ebenso wenig eine Partei ohne Position. Gerechnet wird ab {MINDEST_PARTEIEN} Parteien mit Aussage und
          Position; antworten alle gleich, ist keine Richtung bestimmbar. Ab einem Wert von{' '}
          {String(RHO_SCHWELLE).replace('.', ',')} oder −{String(RHO_SCHWELLE).replace('.', ',')} gilt eine Frage auf dieser Achse als gerichtet: Das Ja kommt
          dann eher von einem Pol.
        </p>
        <p>
          Die Zählung folgt dem{' '}
          <a href={WAHL_O_MAT_RECHNUNG} target="_blank" rel="noopener noreferrer">
            Wahl-O-Mat
          </a>
          : Dort ist „neutral“ die Mitte zwischen Zustimmung und Ablehnung, und übersprungene Thesen zählen nicht.
        </p>
        {/* Die Anteile gelten für die Schwelle 0,5: exakte Verteilung von ρ ohne Gleichstände, 4 bis 9 Parteien. */}
        {RHO_SCHWELLE === 0.5 && (
          <p>
            „Gerichtet“ ist eine beschreibende Einordnung, kein statistischer Test. Ein Wert von 0,5 gilt als großer
            Zusammenhang. Bei vier bis neun Parteien erreicht aber auch eine rein zufällige Reihenfolge der Antworten
            diesen Wert in 18 bis 45 % der Fälle. Aussagekräftig ist deshalb das Gesamtbild eines Katalogs, nicht die
            einzelne Frage.
          </p>
        )}

        <h2>Wann ein Katalog als ausgewogen gilt</h2>
        <p>
          Dass das wichtig ist, zeigt die Forschung zu Wahlhilfen wie dem Wahl-O-Mat: Schon die Auswahl der Thesen kann
          das Ergebnis deutlich zugunsten einzelner Parteien verschieben (Walgrave, Nuytemans und Pepermans 2009). Eine
          feste Norm für Ausgewogenheit gibt es dort nicht. Unsere Kriterien sind deshalb Festlegungen, die wir offen
          ausweisen:
        </p>
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
          Im Oktober 2026 haben wir 113 Fragen ergänzt, gezielt gegen die Lücken. Vorher kam etwa in Thüringen das Ja bei
          8 von 9 gerichteten Fragen im Sozialstaatskonflikt von der Seite „soziale Gerechtigkeit“, in Berlin im
          soziokulturellen Konflikt bei 5 von 7 von der konservativen Seite, in Sachsen und Mecklenburg-Vorpommern bei 4
          von 5 von der linksliberalen. Diese Zahlen sind noch mit CHES gemessen. Die Tabelle zeigt den heutigen Stand nach
          den Positionen je Wahl, darunter klein die Gegenprobe mit CHES. Einzelheiten stehen in der Fragenübersicht
          jedes Katalogs unter „Ausgewogenheit dieses Katalogs“.
        </p>
        {fehler && (
          <p className="hinweis" role="alert">
            {fehler}
          </p>
        )}
        {!katalog && !fehler && <p className="hinweis">Lade Fragen …</p>}
        {katalog && <StandTabelle katalog={katalog} />}

        <h2>Was die Forschung schon klärt</h2>
        <ul>
          <li>
            <strong>Landesparteien weichen ab.</strong> Die Bundespartei taugt nicht als Näherung. Marc Debus zeigt für
            Baden-Württemberg 2026, dass das BSW dort laut Wahlprogramm den Grünen und der SPD nahesteht. Bundesweit
            gilt es gesellschaftlich als konservativ. Wir messen deshalb an den Positionen je Wahl (siehe oben).
          </li>
          <li>
            <strong>Die Zählung von „teils“ und „keine Aussage“</strong> entspricht der des Wahl-O-Mat (siehe oben).
          </li>
          <li>
            <strong>Für die Prüfung der Positionen</strong> gilt eine Übereinstimmung zweier unabhängiger Codierungen ab
            Krippendorffs Alpha 0,8 als belastbar, ab 0,667 für vorläufige Schlüsse.
          </li>
        </ul>

        <h2>Was wir noch abstimmen</h2>
        <p>Für diese Punkte gibt es keine feste Norm. Wir klären sie mit Fachleuten, bevor wir die Schwellen festschreiben:</p>
        <ul>
          <li>Passt die Schwelle von {String(RHO_SCHWELLE).replace('.', ',')} für eine gerichtete Frage?</li>
          <li>Ist die Grenze von {prozent(HOECHSTANTEIL)} vom selben Pol zu streng oder zu locker?</li>
          <li>
            Profilfragen haben oft nur zwei oder drei Parteien mit Aussage; dann ist keine Richtung messbar. Das
            Kriterium „ein Drittel gerichtet“ zieht deshalb gegen die Profilfragen. Unser Vorschlag: es nur auf Fragen mit
            messbarer Richtung beziehen.
          </li>
          <li>
            Gibt es eine Verortung für Volt Deutschland? In den Positionen je Wahl fehlt Volt, in der Gegenprobe steht
            das Mittel aus zwei Näherungen.
          </li>
          <li>Wer übernimmt die zweite, unabhängige Codierung der Positionen?</li>
        </ul>

        <h2>Grenzen</h2>
        <ul>
          <li>
            Alle Positionen sind mit KI-Hilfe erfasst und noch nicht von Menschen geprüft. Jede lässt sich in der{' '}
            <a href={uebersichtHash()}>Fragenübersicht</a> prüfen: „Position bestätigen“ oder „Fehler melden“.
          </li>
          <li>
            Die Messung sagt nichts darüber, ob die Themen angemessen gewichtet sind. Gleich viele Fragen von beiden Polen
            belegen für sich noch keine ausgewogene Auswahl. Ein Themenraster ist geplant.
          </li>
          <li>Bei wenigen Parteien und eng beieinander liegenden Positionen ist die Richtung einer Frage unsicher.</li>
          <li>Viele Profilfragen sind auf einer Achse nicht messbar, weil die meisten Programme dazu nichts sagen.</li>
        </ul>

        <h2>Quellen</h2>
        <p className="meta">
          Konfliktlinien:{' '}
          <a href={NIEDERMAYER_QUELLE.url} target="_blank" rel="noopener noreferrer">
            {NIEDERMAYER_QUELLE.text}
          </a>
        </p>
        <p className="meta">
          Parteipositionen je Wahl: {PWIB_QUELLE.text}.{' '}
          <a href={PWIB_QUELLE.url} target="_blank" rel="noopener noreferrer">
            Buch
          </a>
          . {PWIB_QUELLE.zusatz}. Das Buch beschreibt die Methode; die jüngeren Wahlen stammen aus der Fortschreibung.
        </p>
        <p className="meta">
          Gegenprobe: {CHES_QUELLE.text}.{' '}
          <a href={CHES_QUELLE.url} target="_blank" rel="noopener noreferrer">
            Artikel
          </a>
        </p>
        <p className="meta">Literatur:</p>
        <ul className="meta">
          {LITERATUR.map(({ text, url }) => (
            <li key={text}>
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {text}
                </a>
              ) : (
                text
              )}
            </li>
          ))}
        </ul>
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

/** Die Positionen je Wahl aus PWIB als Tabelle, eine Wahl zur Auswahl, nach der wirtschaftspolitischen Lage geordnet. */
function PwibTabelle() {
  const id = useId()
  const [wahl, setWahl] = useState('bw26')
  const namen: Record<string, string> = {
    btw25: 'Bund 2025', th24: 'Thüringen 2024', sn24: 'Sachsen 2024', bb24: 'Brandenburg 2024', hh25: 'Hamburg 2025',
    bw26: 'Baden-Württemberg 2026', rp26: 'Rheinland-Pfalz 2026', st26: 'Sachsen-Anhalt 2026', be26: 'Berlin 2026',
    mv26: 'Mecklenburg-Vorpommern 2026',
  }
  const zeilen = Object.entries(PWIB[wahl]).sort(([, a], [, b]) => a.lrecon - b.lrecon)
  return (
    <div className="methode-tabelle">
      <label className="label" htmlFor={id}>
        Positionen je Wahl
      </label>
      <select id={id} value={wahl} onChange={(e) => setWahl(e.target.value)}>
        {Object.keys(PWIB).map((w) => (
          <option key={w} value={w}>
            {namen[w] ?? w}
          </option>
        ))}
      </select>
      <table>
        <caption>Positionen nach PWIB, {namen[wahl] ?? wahl}</caption>
        <thead>
          <tr>
            <th scope="col">Partei</th>
            <th scope="col">Sozialstaat ({DIMENSION.lrecon.kurz.niedrig} ← → {DIMENSION.lrecon.kurz.hoch})</th>
            <th scope="col">Werte ({DIMENSION.galtan.kurz.niedrig} ← → {DIMENSION.galtan.kurz.hoch})</th>
          </tr>
        </thead>
        <tbody>
          {zeilen.map(([name, w]) => (
            <tr key={name}>
              <th scope="row">{name}</th>
              <td>{komma(w.lrecon)}</td>
              <td>{komma(w.galtan)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Beschriftung neben dem Punkt: Versatz in Pixeln und Ausrichtung, damit sich die eng beieinander liegenden Parteien
// (CDU, CSU, Freie Wähler) nicht überdecken.
const BESCHRIFTUNG: Record<string, [number, number, 'start' | 'middle' | 'end']> = {
  CDU: [7, 10, 'start'],
  CSU: [7, -4, 'start'],
  'Freie Wähler': [-7, -6, 'end'],
  Grüne: [0, 16, 'middle'],
  Volt: [7, -4, 'start'],
}

/** Gegenprobe: die Parteien nach CHES 2024 (Volt als Mittel aus zwei Quellen) als maßstabsgetreues Streudiagramm (0 bis 10). */
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
          {`Gegenprobe: Parteien nach CHES 2024, waagerecht Sozialstaatskonflikt, senkrecht soziokultureller Konflikt: ${parteien
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
            Sozialstaat: Gerechtigkeit ← → Markt
          </text>
          <text transform={`translate(14 ${(oben + unten) / 2}) rotate(-90)`} textAnchor="middle">
            Werte: liberal ← → konservativ
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
      <figcaption className="meta">
        Gegenprobe: die Bundesparteien nach CHES 2024, 0 bis 10. Waagerecht der Sozialstaatskonflikt (CHES: LRECON),
        senkrecht der soziokulturelle Konflikt (CHES: GALTAN). Volt: Mittel aus Volt Nederland und unserer Schätzung.
      </figcaption>
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
            <th scope="col">{DIMENSION.lrecon.kurz.niedrig} : {DIMENSION.lrecon.kurz.hoch}</th>
            <th scope="col">{DIMENSION.galtan.kurz.niedrig} : {DIMENSION.galtan.kurz.hoch}</th>
            <th scope="col">Profil&shy;fragen min&shy;destens</th>
          </tr>
        </thead>
        <tbody>
          {wahlen.map((d) => {
            const a = ausgewogenheit(d)
            const r = (dim: 'lrecon' | 'galtan') => (
              <>
                {a.dimension[dim].richtung.niedrig} : {a.dimension[dim].richtung.hoch}
                {a.gegenprobe && (
                  <span className="meta methode-gegenprobe">
                    CHES {a.gegenprobe.dimension[dim].richtung.niedrig} : {a.gegenprobe.dimension[dim].richtung.hoch}
                  </span>
                )}
              </>
            )
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
