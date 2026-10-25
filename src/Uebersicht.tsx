import { useEffect, useState } from 'react'
import { Geprueft, KiHinweis, Positionen, ProgrammLink, PruefZeile, Zielkonflikte } from './Ansicht'
import { QUELLCODE } from './app'
import { RICHTUNG_TEXT, ausgewogenheit, type Richtung } from './ausgewogenheit'
import { useAnsicht, useFokusZurueck } from './barrierefrei'
import { spielbar, standardWahl, wahlFuer } from './katalog'
import { ladeKatalog } from './laden'
import { UnterseitenKopf } from './Rechtliches'
import { parteiStil } from './stil'
import { POSITION_TEXT, type Katalog, type Positionswert, type QuizDaten, type QuizFrage, type QuizPartei } from './typen'
import { jaSager, parteiPfad, pruefLinks, uebersichtHash } from './uebersicht'

// Fragenübersicht (#/fragen): jede Frage mit Position, Zitat und Beleg aller Parteien – zum Prüfen. Mit Partei im
// Pfad (#/fragen/volt) steht nur deren Position da, mit Wortlaut aufgeklappt. Je Position führen „Position
// bestätigen“ und „Fehler melden“ zu einem vorausgefüllten GitHub-Issue; ein bestätigendes Issue trägt die Pflege als
// `geprueft` in fragen.json ein, dann steht die Position hier und in der Auflösung als geprüft.
// Je Wahl eine Übersicht: #/fragen ist die Standardwahl, andere Wahlen stehen davor (#/be26/fragen).

const ALLE: Positionswert[] = ['ja', 'nein', 'teils', 'keine_aussage']

/** Adresse dieser Seite, wie sie im Issue steht. */
const seitenLink = (wahl: string | null, partei: string | null, frage: string | null) =>
  `${location.origin}${location.pathname}${uebersichtHash(partei, frage, wahl)}`

export function Uebersicht({
  wahlId,
  partei,
  frageId,
  onZurueck,
}: {
  wahlId: string | null
  partei: string | null
  frageId: string | null
  onZurueck: () => void
}) {
  const titel = useAnsicht('Alle Fragen mit Belegen')
  useFokusZurueck()
  const [katalog, setKatalog] = useState<Katalog | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)

  useEffect(() => {
    ladeKatalog()
      .then(setKatalog)
      .catch((e: unknown) => setFehler(e instanceof Error ? e.message : String(e)))
  }, [])

  // Unbekannte Wahl in der Adresse: die Standardwahl zeigen und es sagen.
  const daten = katalog ? (wahlFuer(katalog, wahlId) ?? standardWahl(katalog)) : null
  const wahlUnbekannt = !!katalog && !!wahlId && !wahlFuer(katalog, wahlId)
  // In Adressen steht die Standardwahl nicht (alte Links bleiben gültig).
  const wahlPfad = katalog && daten && daten !== standardWahl(katalog) ? daten.wahl.id : null
  const gewaehlt = daten?.parteien.find((p) => parteiPfad(p) === partei) ?? null
  const pfad = gewaehlt ? parteiPfad(gewaehlt) : null

  // Mit Frage in der Adresse (aus einem Issue): dorthin springen, sobald die Liste steht.
  useEffect(() => {
    if (!daten || !frageId) return
    document.getElementById(`frage-${frageId}`)?.scrollIntoView({ block: 'start' })
  }, [daten, frageId])

  return (
    <main className="seite recht uebersicht">
      <UnterseitenKopf onZurueck={onZurueck} />
      <article>
        <h1 ref={titel}>Alle Fragen mit Belegen</h1>
        <p>
          Zu jeder Frage steht hier, was die {daten ? `${daten.parteien.length} Wahlprogramme zur ${daten.wahl.name}` : 'Wahlprogramme'}{' '}
          sagen: Position, Wortlaut, Seite und Link ins Programm. Gefragt wird im Spiel immer, wer Ja sagt. Jede
          Position lässt sich prüfen: „Position bestätigen“ oder „Fehler melden“ öffnet ein vorausgefülltes Issue bei
          GitHub – beim Fehler bitte das richtige Zitat mit Seite eintragen. Bestätigte Positionen stehen danach mit
          Nachweis als geprüft hier und im Spiel.
        </p>
        {fehler && (
          <p className="hinweis" role="alert">
            {fehler}
          </p>
        )}
        {wahlUnbekannt && (
          <p className="hinweis" role="alert">
            Die Wahl „{wahlId}“ gibt es hier nicht – gezeigt wird die {daten?.wahl.name}.
          </p>
        )}
        {!daten && !fehler && <p className="hinweis">Lade Fragen …</p>}
        {katalog && daten && (
          <>
            {katalog.wahlen.filter(spielbar).length > 1 && (
              <nav className="wahl-filter" aria-label="Wahl">
                {katalog.wahlen.filter(spielbar).map((w) => (
                  <a
                    key={w.wahl.id}
                    href={uebersichtHash(null, null, w === standardWahl(katalog) ? null : w.wahl.id)}
                    aria-current={w.wahl.id === daten.wahl.id ? 'page' : undefined}
                  >
                    {w.wahl.name}
                  </a>
                ))}
              </nav>
            )}
            <nav className="partei-filter" aria-label="Nach Partei filtern">
              <a href={uebersichtHash(null, null, wahlPfad)} aria-current={gewaehlt ? undefined : 'page'}>
                Alle Parteien
              </a>
              {daten.parteien.map((p) => (
                <a
                  key={p.id}
                  href={uebersichtHash(parteiPfad(p), null, wahlPfad)}
                  aria-current={gewaehlt?.id === p.id ? 'page' : undefined}
                  style={parteiStil(p.farbe)}
                  title={p.name}
                >
                  <span className="partei-punkt" aria-hidden="true" />
                  {p.kurzname}
                </a>
              ))}
            </nav>
            {!daten.parteien.length && (
              <p className="hinweis">Die Programme zur {daten.wahl.name} liegen noch nicht vor.</p>
            )}
            <ParteiStand daten={daten} partei={gewaehlt} />
            {!gewaehlt && daten.fragen.length > 0 && <Ausgewogenheit daten={daten} />}
            {daten.fragen.map((f) => (
              <Frage key={f.id} frage={f} daten={daten} partei={gewaehlt} pfad={pfad} wahlPfad={wahlPfad} ziel={f.id === frageId} />
            ))}
            <p className="meta">
              Rohdaten: <a href={`${import.meta.env.BASE_URL}fragen.json`}>fragen.json</a> – Fragen, Positionen und
              Belege, wie das Spiel sie lädt.
            </p>
          </>
        )}
      </article>
    </main>
  )
}

/** Zusammenfassung über alle Fragen: ohne Partei die Zahl der Fragen, mit Partei ihre Positionen gezählt. */
function ParteiStand({ daten, partei }: { daten: QuizDaten; partei: QuizPartei | null }) {
  if (!partei) {
    const entwuerfe = daten.fragen.filter((f) => f.ki_entwurf).length
    return (
      <p className="meta uebersicht-stand" aria-live="polite">
        {daten.fragen.length} Fragen{entwuerfe ? `, davon ${entwuerfe} mit KI-Hilfe erfasst und noch nicht von Menschen geprüft` : ''}.
      </p>
    )
  }
  const eigene = daten.fragen.map((f) => f.positionen.find((p) => p.partei_id === partei.id))
  const zahl = (wert: Positionswert) => eigene.filter((p) => p?.position === wert).length
  const geprueft = eigene.filter((p) => p?.geprueft).length
  return (
    <p className="meta uebersicht-stand" aria-live="polite">
      <strong>{partei.name}</strong> in {daten.fragen.length} Fragen:{' '}
      {ALLE.map((w) => `${zahl(w)}× ${POSITION_TEXT[w]}`).join(', ')}
      {geprueft ? `, ${geprueft} davon geprüft` : ''}.{' '}
      <a href={partei.programm_url} target="_blank" rel="noopener noreferrer">
        Wahlprogramm
      </a>
    </p>
  )
}

/**
 * Ausgewogenheit des Katalogs (Issue #1): von welcher Parteigruppe das Ja der Fragen eher kommt und wie viele Profilfragen jede Partei hat.
 * Das Spielprinzip bleibt – die Kennzahlen zeigen, ob die Auswahl der Fragen alle Parteien fair abbildet.
 */
function Ausgewogenheit({ daten }: { daten: QuizDaten }) {
  const a = ausgewogenheit(daten)
  const reihenfolge: Richtung[] = ['a', 'gemischt', 'b', 'offen']
  return (
    <details className="ausgewogenheit">
      <summary>Ausgewogenheit dieses Katalogs</summary>
      <p className="meta">
        Gefragt wird immer, wer Ja sagt, und die Fragen dürfen zuspitzen. Ausgewogen sein muss die Auswahl: Jede
        Partei soll ihre Forderungen als Ja-Frage wiederfinden. Die Zahlen sind eine grobe Prüfung: Sie zählen, ob das
        Ja eher von SPD, Grünen und Linken oder eher von CDU/CSU, FDP und AfD kommt. Das ist keine Einordnung nach links
        und rechts – andere Parteien zählen hier nicht mit, bei den Profilfragen aber schon.
      </p>
      <h2 className="ausgewogenheit-titel">Von wem das Ja eher kommt</h2>
      <ul className="ausgewogenheit-richtung">
        {reihenfolge.map((r) => (
          <li key={r}>
            <strong>{a.richtung[r]}</strong> {RICHTUNG_TEXT[r]}
          </li>
        ))}
      </ul>
      <table className="ausgewogenheit-profil">
        <caption>Profilfragen je Partei – Fragen, bei denen sie mit höchstens einer anderen Partei Ja sagt</caption>
        <thead>
          <tr>
            <th scope="col">Partei</th>
            <th scope="col">Profilfragen</th>
          </tr>
        </thead>
        <tbody>
          {a.profil.map(({ partei, anzahl }) => (
            <tr key={partei.id}>
              <th scope="row">{partei.kurzname}</th>
              <td>{anzahl}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {a.hinweise.length > 0 && (
        <>
          <h2 className="ausgewogenheit-titel">Woran wir arbeiten</h2>
          <ul>
            {a.hinweise.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </>
      )}
      <p className="meta">
        Methode und Diskussion:{' '}
        <a href={`${QUELLCODE}/issues/1`} target="_blank" rel="noopener noreferrer">
          Issue #1 zur Ausgewogenheit
        </a>
      </p>
    </details>
  )
}

function Frage({
  frage,
  daten,
  partei,
  pfad,
  wahlPfad,
  ziel,
}: {
  frage: QuizFrage
  daten: QuizDaten
  partei: QuizPartei | null
  pfad: string | null
  wahlPfad: string | null
  ziel: boolean
}) {
  const link = seitenLink(wahlPfad, pfad, frage.id)
  const ja = jaSager(frage, daten.parteien)
  return (
    <section className={`uebersicht-frage${ziel ? ' uebersicht-ziel' : ''}`} id={`frage-${frage.id}`} aria-labelledby={`frage-${frage.id}-titel`}>
      <h2 id={`frage-${frage.id}-titel`}>
        {frage.frage} <span className="uebersicht-id">{frage.id}</span>
      </h2>
      <p className="meta">{frage.beschreibung}</p>
      <p className="uebersicht-loesung">
        Ja {ja.length === 1 ? 'sagt' : 'sagen'}: {ja.join(', ')}
      </p>
      <KiHinweis frage={frage} />
      {partei ? (
        <EinePosition frage={frage} partei={partei} link={link} daten={daten} />
      ) : (
        <Positionen frage={frage} parteien={daten.parteien} auswahl={null} pruefen={(p, pos) => pruefLinks(frage, p, pos, link, daten.wahl)} />
      )}
      <Zielkonflikte frage={frage} />
    </section>
  )
}

/** Die Position einer Partei – Wortlaut offen, damit sich der Beleg ohne Klick prüfen lässt. */
function EinePosition({ frage, partei, link, daten }: { frage: QuizFrage; partei: QuizPartei; link: string; daten: QuizDaten }) {
  const p = frage.positionen.find((x) => x.partei_id === partei.id)
  if (!p) return null
  return (
    <div className="position uebersicht-position" style={parteiStil(partei.farbe)}>
      <span className="fund-partei">{partei.kurzname}</span>
      <span className="position-wert">{POSITION_TEXT[p.position]}</span>
      {p.position === 'keine_aussage' ? (
        p.begruendung && <p className="position-text meta">{p.begruendung}</p>
      ) : (
        <>
          <p className="position-text">
            {p.kurzfassung} {p.beleg_url && <ProgrammLink url={p.beleg_url} />}
          </p>
          {p.zitat && <blockquote className="uebersicht-zitat">„{p.zitat}“</blockquote>}
        </>
      )}
      <Geprueft p={p} />
      <PruefZeile links={pruefLinks(frage, partei, p, link, daten.wahl)} partei={partei} />
    </div>
  )
}
