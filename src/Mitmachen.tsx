import { APP_NAME, QUELLCODE } from './app'
import { useAnsicht, useFokusZurueck } from './barrierefrei'
import { BETREIBER } from './betreiber'
import { UnterseitenKopf } from './Rechtliches'
import { uebersichtHash } from './uebersicht'

// Mitmachen (#/mitmachen, statisch als /mitmachen/): Unterricht in der Oberstufe, Themen für Abschlussarbeiten und
// Fragen prüfen. Auf diese Seite verweisen die Anschreiben an Studienseminare, Lehrstühle und Jugendorganisationen.

export const FRAGE_VORSCHLAGEN = `${QUELLCODE}/issues/new?template=frage-vorschlagen.yml`

/** Ablauf einer Doppelstunde: Minuten und Schritt. */
const DOPPELSTUNDE: { minuten: number; titel: string; text: string }[] = [
  {
    minuten: 10,
    titel: 'Einstieg',
    text: 'Wer hat schon einmal in ein Wahlprogramm geschaut? Was steht darin, und wer liest es?',
  },
  {
    minuten: 20,
    titel: 'Spielen',
    text:
      'Die Lehrkraft eröffnet einen Raum und zeigt den QR-Code am Beamer. Teams von zwei bis vier Personen teilen sich ' +
      'ein Gerät – bis zu acht Teams je Raum. Zwei Runden mit je fünf Fragen, Zeit je Frage „doppelt“ oder „ohne Zeitlimit“.',
  },
  {
    minuten: 25,
    titel: 'Belege prüfen',
    text:
      'Jedes Team nimmt eine Frage aus dem Spiel, öffnet sie unter „Alle Fragen“ und liest die Stellen im Programm ' +
      'nach (Link mit Seitenangabe). Stimmt die Einordnung als Ja, Nein, teils oder keine Aussage?',
  },
  {
    minuten: 20,
    titel: 'Auswerten',
    text:
      'Was macht eine Frage fair? Zuspitzen ist erlaubt, eine Schlagseite nicht. Die Methodenseite zeigt, wo die ' +
      'Parteien stehen und von welcher Seite das Ja einer Frage eher kommt.',
  },
  {
    minuten: 15,
    titel: 'Sichern',
    text:
      'Jedes Team formuliert eine eigene Ja-Frage und belegt sie mit dem Wortlaut aus mindestens zwei Programmen. ' +
      'Gute Fragen können als Vorschlag ins Spiel kommen.',
  },
]

/** Themen für Abschlussarbeiten – jeweils mit einem Ansatz, wie man es untersuchen kann. */
const THEMEN: { titel: string; text: string; fach: string }[] = [
  {
    titel: 'Lernwirkung im Unterricht',
    text: 'Wissen Schülerinnen und Schüler nach dem Spiel mehr über die Positionen der Parteien? Vor- und Nachtest mit Vergleichsgruppe.',
    fach: 'Politikdidaktik',
  },
  {
    titel: 'Quiz oder Wahl-O-Mat',
    text: 'Das Quiz fragt Wissen über die Programme ab, der Wahl-O-Mat gleicht die eigene Meinung ab. Was bleibt danach hängen?',
    fach: 'Politikdidaktik, politische Bildung',
  },
  {
    titel: 'Zweite, unabhängige Codierung',
    text:
      'Die Positionen eines Katalogs ein zweites Mal aus den Programmen bestimmen und die Übereinstimmung messen ' +
      '(Krippendorffs Alpha). Das ist einer der offenen Punkte der Methode.',
    fach: 'Politikwissenschaft, Methoden',
  },
  {
    titel: 'Ausgewogenheit messen',
    text:
      'Halten die Schwellen und Kriterien der Methodenseite? Prüfbar mit Simulationen oder im Vergleich mit der ' +
      'Thesenauswahl des Wahl-O-Mat.',
    fach: 'Wahlforschung',
  },
  {
    titel: 'Themenraster',
    text: 'Welche Politikfelder decken die Fragen ab, gemessen daran, wie viel Raum sie in den Programmen einnehmen?',
    fach: 'Wahlforschung, Parteienforschung',
  },
  {
    titel: 'Landesparteien und Bundespartei',
    text: 'Wie weit weichen Landesprogramme vom Bundesprogramm ab? Belegt an den Katalogen der Landtagswahlen.',
    fach: 'Parteienforschung',
  },
  {
    titel: 'Nur nach Ja fragen',
    text: 'Wirkt eine Frage anders, wenn sie nach Zustimmung fragt statt nach Ablehnung? Ein Experiment zum Framing.',
    fach: 'Politische Psychologie',
  },
]

/** Ohne `onZurueck`: beim Build als /mitmachen/ gerendert (src/methodeSeite.tsx), mit Link zur Startseite. */
export function Mitmachen({ onZurueck }: { onZurueck?: () => void }) {
  const titel = useAnsicht('Mitmachen')
  useFokusZurueck()
  const mail = `mailto:${BETREIBER.email}?subject=${encodeURIComponent(APP_NAME)}`

  return (
    <main className="seite recht mitmachen">
      <UnterseitenKopf onZurueck={onZurueck} />
      <article>
        <h1 ref={titel}>Mitmachen</h1>
        <p>
          „{APP_NAME}“ ist ein kostenloses Quiz zu Wahlprogrammen, ohne Konto, ohne Cookies und ohne Werbung. Es entsteht
          privat und offen. Wir suchen Kurse, die es im Unterricht einsetzen, Studierende, die darüber eine Abschlussarbeit
          schreiben, und Menschen, die die Fragen prüfen.
        </p>

        <h2>Im Politikunterricht</h2>
        <p>
          Gedacht für die Oberstufe in Politik, Sozialkunde, Gemeinschaftskunde, PoWi, SoWi oder PGW. Es gibt Kataloge zur
          Bundestagswahl 2025 und zu Landtagswahlen; für die Wahlen 2027 kommen sie, sobald die Programme vorliegen. Ein
          Gerät je Team genügt, für die Lehrkraft dazu ein Beamer.
        </p>
        <h3>Ablauf für eine Doppelstunde</h3>
        <ol>
          {DOPPELSTUNDE.map((s) => (
            <li key={s.titel}>
              <strong>
                {s.titel} ({s.minuten} Minuten).
              </strong>{' '}
              {s.text}
            </li>
          ))}
        </ol>
        <p>
          Die Positionen sind mit KI-Hilfe aus den Programmen erfasst und erst zum Teil von Menschen geprüft. Das Spiel
          sagt das bei jeder Frage. Im Unterricht ist das ein Anlass für Quellenkritik: Jede Antwort lässt sich am Wortlaut
          nachprüfen.
        </p>
        <p>
          Wir speichern keine Spieldaten; die Geräte sind direkt miteinander verbunden. Mehr dazu in der{' '}
          <a href="#/datenschutz">Datenschutzerklärung</a>. Wie es in eurem Kurs lief, hilft uns sehr – eine kurze
          Rückmeldung per <a href={mail}>E-Mail</a> genügt.
        </p>

        <h2>Themen für Abschlussarbeiten</h2>
        <p>
          Für Bachelor, Master oder Staatsexamen in Politikwissenschaft oder Politikdidaktik. Betreuen muss ein Lehrstuhl;
          wir stellen die Daten bereit und beantworten Fragen zum Spiel.
        </p>
        <ul>
          {THEMEN.map((t) => (
            <li key={t.titel}>
              <strong>{t.titel}.</strong> {t.text} <span className="meta">({t.fach})</span>
            </li>
          ))}
        </ul>
        <p>
          Alle Fragen und Positionen liegen offen als <a href="fragen.json">fragen.json</a>, der Quellcode mit der
          Rechnung zur Ausgewogenheit auf <a href={QUELLCODE}>GitHub</a>. Die App selbst speichert keine Spielergebnisse.
          Wer Wirkung messen will, braucht deshalb einen eigenen Fragebogen. Wie wir die Ausgewogenheit bisher prüfen,
          steht auf der <a href="#/methode">Methodenseite</a>.
        </p>

        <h2>Fragen prüfen</h2>
        <ul>
          <li>
            <strong>Positionen prüfen:</strong> In der <a href={uebersichtHash()}>Fragenübersicht</a> hat jede Position
            einer Partei „Position bestätigen“ und „Fehler melden“. Bestätigte Positionen tragen ein Häkchen mit Nachweis.
          </li>
          <li>
            <strong>Eine Frage vorschlagen:</strong> Gefragt wird immer, wer Ja sagt. Ein Vorschlag braucht den Wortlaut
            aus mindestens einem Programm mit Link und Seite –{' '}
            <a href={FRAGE_VORSCHLAGEN} target="_blank" rel="noopener noreferrer">
              Frage vorschlagen
            </a>
            .
          </li>
          <li>
            <strong>Für Parteien und ihre Jugendorganisationen:</strong> Findet ihr eure Forderungen als Ja-Frage wieder?
            Jede Partei soll das können. Fehlt etwas, ergänzen wir eine ebenso zugespitzte Frage.
          </li>
        </ul>
        <p className="meta">
          Prüfen und Vorschlagen läuft über GitHub und ist dort öffentlich; dafür braucht es ein Konto. Ohne Konto geht es
          per <a href={mail}>E-Mail</a>.
        </p>

        <h2>Kontakt</h2>
        <p>
          {BETREIBER.name}, <a href={mail}>{BETREIBER.email}</a>. Fragen und Vorschläge gern auch öffentlich als{' '}
          <a href={`${QUELLCODE}/issues`}>Issue auf GitHub</a>.
        </p>
      </article>
    </main>
  )
}
