import { useEffect, useId, useRef, useState } from 'react'
import { APP_NAME, UNTERTITEL } from './app'
import { Fusszeile } from './Fusszeile'
import { Logo } from './Logo'
import { useErstesMal } from './erstesMal'
import { nurJaFragen } from './fragen'
import { istUnterseite, useHash } from './navigation'
import { QuizAnsicht } from './Ansicht'
import { useAnsicht } from './barrierefrei'
import { ZEITFAKTOR_TEXT, type Zeitfaktor } from './punkte'
import { pruefeText } from './namen'
import { gemerkterName, nameMerken } from './merken'
import { beobachteOeffentliche, meldeOeffentlich, OEFFENTLICH_MOEGLICH, type OeffentlicherRaum } from './oeffentlich'
import { neuerRaumname, raumAusEingabe, raumPfad, type Raum } from './raumname'
import { bereinigeName } from './spielleitung'
import type { QuizDaten } from './typen'
import { useGast, useSpielleitung } from './useSpiel'
import { TonAufruf, TonKnopf, UntertitelLeiste } from './show/Buehne'
import { alleClips, GERAEUSCHE } from './show/texte'
import { entsperren, gemerkteTonWahl, ladeShow, melodieStoppen, startmelodie, vorladen } from './show/ton'
import { SIGNAL_ART } from './verbindung'

// Das Quiz (Einladung: #/<Raumname>, z. B. #/kluge-eule-27). Ohne Datenbank: Die Fragen kommen aus
// public/fragen.json, das Spiel läuft zwischen den Browsern.

const istQuizDaten = (d: unknown): d is QuizDaten =>
  !!d &&
  typeof d === 'object' &&
  typeof (d as QuizDaten).version === 'string' &&
  Array.isArray((d as QuizDaten).parteien) &&
  Array.isArray((d as QuizDaten).fragen)

async function ladeQuiz(): Promise<QuizDaten> {
  const r = await fetch(`${import.meta.env.BASE_URL}fragen.json`)
  const d: unknown = r.ok && r.headers.get('content-type')?.includes('json') ? await r.json() : null
  if (!istQuizDaten(d)) throw new Error('Die Fragen konnten nicht geladen werden.')
  return { ...d, fragen: nurJaFragen(d.fragen) }
}

const einladungAus = (hash: string): Raum | null => {
  const teil = /^#\/(.+)$/.exec(hash)?.[1]
  if (!teil || istUnterseite(hash)) return null
  try {
    return raumAusEingabe(decodeURIComponent(teil))
  } catch {
    return null
  }
}

/** Namen, die Fremde in öffentlichen Räumen nicht sehen sollen (Beleidigung, Hetze). */
const nameAnstoessig = (name: string) => {
  const g = pruefeText(name)
  return g === 'beleidigung' || g === 'hetze'
}

/** In einer Nutzeraktion: Ton freischalten und alle Clips und Geräusche schon laden (ca. 3 MB). */
function showStarten(daten: QuizDaten) {
  melodieStoppen()
  entsperren()
  vorladen(alleClips(daten.fragen, daten.parteien), GERAEUSCHE.map((g) => g.id))
}

/** Startmusik nur einmal je Besuch – beim ersten Tippen oder Tastendruck auf der Startseite (vorher darf kein Ton). */
let melodieGespielt = false
function useStartmelodie() {
  useEffect(() => {
    if (melodieGespielt) return
    const arten = ['pointerdown', 'keydown'] as const
    const entfernen = () => arten.forEach((a) => removeEventListener(a, los, true))
    function los(e: Event) {
      // Landet das erste Tippen auf dem Ton-Knopf oder dem Hinweis, entscheiden diese (aus: keine Musik, an: Musik).
      if (e.target instanceof Element && e.target.closest('.ton-wahl')) {
        entfernen()
        melodieGespielt = true
        return
      }
      entfernen()
      if (melodieGespielt) return
      melodieGespielt = true
      void startmelodie()
    }
    arten.forEach((a) => addEventListener(a, los, true))
    // Hat man den Ton früher ausdrücklich eingeschaltet, gleich versuchen – manche Browser erlauben das bei
    // bekannten Seiten. Sonst bleibt es beim ersten Tippen (und dem Hinweis „Mit Ton spielen?“).
    if (gemerkteTonWahl() === 'an')
      void startmelodie().then((ok) => {
        if (!ok) return
        melodieGespielt = true
        entfernen()
      })
    return entfernen
  }, [])
}

const raumLink = (r: Raum) => `${location.origin}${location.pathname}#/${raumPfad(r)}`

type Modus =
  | { art: 'start' }
  | { art: 'suche' }
  | { art: 'leitung'; raum: Raum | null; oeffentlich: boolean }
  | { art: 'gast'; raum: Raum }

export function Quiz() {
  const hash = useHash()
  // Schon beim Öffnen, nicht erst mit der fertigen Startseite: Das erste Tippen startet die Musik auch, wenn die
  // Fragen noch laden.
  useStartmelodie()
  const einladung = einladungAus(hash)
  const [daten, setDaten] = useState<QuizDaten | null>(null)
  const [ladeFehler, setLadeFehler] = useState<string | null>(null)
  // Der Name bleibt auf dem Gerät (merken.ts), der Raumname nicht.
  const [name, setName] = useState(gemerkterName)
  const [eigenerRaum, setEigenerRaum] = useState(neuerRaumname)
  const [zeit, setZeit] = useState<Zeitfaktor>(1)
  const [modus, setModus] = useState<Modus>({ art: 'start' })

  useEffect(() => nameMerken(name), [name])

  useEffect(() => {
    Promise.all([ladeQuiz(), ladeShow()])
      .then(([d]) => setDaten(d))
      .catch((e: unknown) => setLadeFehler(e instanceof Error ? e.message : String(e)))
  }, [])

  const verlassen = () => {
    setModus({ art: 'start' })
    // Einladung aus der Adresse nehmen, damit die Startseite nicht erneut zum selben Raum einlädt.
    if (location.hash !== '#/') location.hash = '#/'
    scrollTo({ top: 0 })
  }

  return (
    <div className="app">
      {/* Hinweise nur auf der Startseite des Quiz – im Spiel kennzeichnet jede Auflösung Entwürfe selbst. */}
      {daten?.entwurf && modus.art === 'start' && (
        <div className="mock-hinweis" role="note">
          Testversion: Die Fragen beruhen auf KI-Entwürfen, die noch nicht von Menschen geprüft sind. Einordnungen
          können falsch sein – bitte die Belege im Programm ansehen.
        </div>
      )}
      {SIGNAL_ART === 'lokal' && modus.art === 'leitung' && modus.raum !== null && (
        <div className="mock-hinweis" role="note">
          Testmodus ohne Verbindungsdienst: Räume funktionieren nur zwischen Tabs dieses Browsers.
        </div>
      )}
      <header className="kopfzeile">
        <a href="#/" className="kopfzeile-marke">
          <Logo groesse={30} />
          <span>{APP_NAME}</span>
          <span className="sr-only"> – zur Startseite</span>
        </a>
        <span className="quiz-kopf-rechts">
          <TonKnopf />
        </span>
      </header>
      <TonAufruf mitMelodie={modus.art === 'start'} />
      {!daten ? (
        <main className="seite quiz">
          <p className="hinweis" role={ladeFehler ? 'alert' : undefined}>
            {ladeFehler ?? 'Lade Fragen …'}
          </p>
        </main>
      ) : modus.art === 'leitung' ? (
        <LeitungSpiel
          daten={daten}
          name={bereinigeName(name, 'Spielleitung')}
          raum={modus.raum}
          oeffentlich={modus.oeffentlich}
          zeit={zeit}
          onVerlassen={verlassen}
        />
      ) : modus.art === 'gast' ? (
        <GastSpiel daten={daten} name={bereinigeName(name, '')} raum={modus.raum} onVerlassen={verlassen} />
      ) : modus.art === 'suche' ? (
        <ZufallSuche
          name={name}
          onBeitreten={(raum) => {
            showStarten(daten)
            setModus({ art: 'gast', raum })
          }}
          onEroeffnen={() => {
            showStarten(daten)
            const r = raumAusEingabe(neuerRaumname())!
            setModus({ art: 'leitung', raum: r, oeffentlich: true })
          }}
          onZurueck={() => setModus({ art: 'start' })}
        />
      ) : (
        <QuizStart
          key={einladung?.code}
          daten={daten}
          name={name}
          onName={setName}
          eigenerRaum={eigenerRaum}
          onNeuerRaum={() => setEigenerRaum(neuerRaumname())}
          zeit={zeit}
          onZeit={setZeit}
          einladung={einladung}
          onEroeffnen={() => {
            showStarten(daten)
            setModus({ art: 'leitung', raum: raumAusEingabe(eigenerRaum), oeffentlich: false })
          }}
          onAllein={() => {
            showStarten(daten)
            setModus({ art: 'leitung', raum: null, oeffentlich: false })
          }}
          onZufall={() => setModus({ art: 'suche' })}
          onBeitreten={(raum) => {
            showStarten(daten)
            setModus({ art: 'gast', raum })
          }}
        />
      )}
      <UntertitelLeiste />
      <Fusszeile />
    </div>
  )
}

/** Zeit je Frage: ein Knopf, der bei jedem Tippen weiterschaltet (WCAG 2.2.1: Zeitlimit einstellbar). */
const ZEIT_REIHE: Zeitfaktor[] = [1, 2, 0]
const ZEIT_KURZ: Record<Zeitfaktor, string> = { 1: '20 s', 2: '40 s', 0: 'ohne Limit' }

function ZeitKnopf({ zeit, onZeit }: { zeit: Zeitfaktor; onZeit: (f: Zeitfaktor) => void }) {
  const [gewechselt, setGewechselt] = useState(false)
  const naechste = ZEIT_REIHE[(ZEIT_REIHE.indexOf(zeit) + 1) % ZEIT_REIHE.length]
  return (
    <>
      <button
        type="button"
        className="knopf knopf-zweit quiz-zeit-knopf"
        title={`Zeit je Frage: ${ZEITFAKTOR_TEXT[zeit]} – tippen für ${ZEITFAKTOR_TEXT[naechste]}`}
        onClick={() => {
          onZeit(naechste)
          setGewechselt(true)
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="13.5" r="7.5" />
            <path d="M12 13.5V9.5M10 3h4M18.5 6.5l1.5-1.5" />
          </g>
        </svg>
        <span className="sr-only">Zeit je Frage: </span>
        {ZEIT_KURZ[zeit]}
      </button>
      <span className="sr-only" aria-live="polite">
        {gewechselt ? `Zeit je Frage: ${ZEITFAKTOR_TEXT[zeit]}` : ''}
      </span>
    </>
  )
}

function QuizStart({
  daten,
  name,
  onName,
  eigenerRaum,
  onNeuerRaum,
  zeit,
  onZeit,
  einladung,
  onEroeffnen,
  onAllein,
  onZufall,
  onBeitreten,
}: {
  daten: QuizDaten
  name: string
  onName: (n: string) => void
  eigenerRaum: string
  onNeuerRaum: () => void
  zeit: Zeitfaktor
  onZeit: (f: Zeitfaktor) => void
  einladung: Raum | null
  onEroeffnen: () => void
  onAllein: () => void
  onZufall: () => void
  onBeitreten: (raum: Raum) => void
}) {
  const id = useId()
  const [eingabe, setEingabe] = useState('')
  const [freunde, setFreunde] = useState(false)
  const ziel = raumAusEingabe(eingabe)
  const leer = daten.fragen.length === 0
  const titel = useAnsicht('')
  const auftritt = useErstesMal('quiz')

  return (
    <main className={auftritt ? 'start quiz-start start-auftritt' : 'start quiz-start'}>
      <div className="start-inhalt stimmzettel">
        <div className="start-kopf">
          <div>
            <h1 className="titel" ref={titel}>
              {APP_NAME}
            </h1>
            <p className="slogan">{UNTERTITEL}</p>
          </div>
          <Logo groesse={72} animiert={auftritt} />
        </div>
        <p className="erklaerung">
          Welche Parteien sagen in ihrem Wahlprogramm Ja? Wer richtig liegt, bekommt Punkte – wer schneller ist, mehr.
        </p>
        <div className="quiz-start-felder">
          {leer && <p className="meta">Noch gibt es keine vollständig geprüften Fragen.</p>}

          <label className="label" htmlFor={`${id}-name`}>
            Dein Name im Spiel (freiwillig)
          </label>
          <div className="quiz-name-zeile">
            <input
              id={`${id}-name`}
              className="quiz-eingabe"
              value={name}
              maxLength={20}
              autoComplete="nickname"
              placeholder="z. B. Kim"
              onChange={(e) => onName(e.target.value)}
            />
            {!einladung && <ZeitKnopf zeit={zeit} onZeit={onZeit} />}
          </div>

          {einladung ? (
            <>
              <p className="hinweis quiz-einladung">Du bist in den Raum „{einladung.name ?? einladung.code}“ eingeladen.</p>
              <button type="button" className="knopf knopf-gross" disabled={leer} onClick={() => onBeitreten(einladung)}>
                Mitspielen
              </button>
            </>
          ) : (
            <>
              <div className="quiz-arten" role="group" aria-label="Spielen">
                  {OEFFENTLICH_MOEGLICH && (
                  <button type="button" className="knopf" disabled={leer} onClick={onZufall}>
                    Mit Fremden
                  </button>
                )}
                <button
                  type="button"
                  className={freunde ? 'knopf knopf-zweit quiz-art-offen' : 'knopf knopf-zweit'}
                  disabled={leer}
                  aria-expanded={freunde}
                  aria-controls={`${id}-freunde`}
                  onClick={() => setFreunde(!freunde)}
                >
                  Mit Freunden
                </button>
                <button type="button" className="knopf knopf-zweit" disabled={leer} onClick={onAllein}>
                  Alleine
                </button>
              </div>

              {freunde && (
                <div className="quiz-freunde" id={`${id}-freunde`}>
                  <p className="quiz-eigener-raum">
                    Dein Raum: <strong>{eigenerRaum}</strong>{' '}
                    <button type="button" className="knopf-link" onClick={onNeuerRaum}>
                      anderer Name
                    </button>
                  </p>
                  <button type="button" className="knopf knopf-gross" disabled={leer} onClick={onEroeffnen}>
                    Raum eröffnen
                  </button>
                  <form
                    className="quiz-beitreten"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (ziel) onBeitreten(ziel)
                    }}
                  >
                    <label className="label" htmlFor={`${id}-code`}>
                      Oder einem Raum beitreten
                    </label>
                    <div className="quiz-beitreten-zeile">
                      <input
                        id={`${id}-code`}
                        aria-describedby={`${id}-code-hinweis`}
                        className="quiz-eingabe quiz-code-eingabe"
                        value={eingabe}
                        maxLength={40}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="z. B. Kluge Eule 27"
                        onChange={(e) => setEingabe(e.target.value)}
                      />
                      <button type="submit" className="knopf" disabled={!ziel || leer}>
                        Beitreten
                      </button>
                    </div>
                    <p className="meta" id={`${id}-code-hinweis`}>
                      Raumname mit Zahl, z. B. „Kluge Eule 27“ – Groß- und Kleinschreibung egal.
                    </p>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        <p className="datenschutz">
          Kein Konto, keine Cookies, keine KI im Spiel. <a href="#/datenschutz">Datenschutz</a>
        </p>
      </div>
    </main>
  )
}

function LeitungSpiel({
  daten,
  name,
  raum,
  oeffentlich: oeffentlichAnfang,
  zeit,
  onVerlassen,
}: {
  daten: QuizDaten
  name: string
  raum: Raum | null
  oeffentlich: boolean
  zeit: Zeitfaktor
  onVerlassen: () => void
}) {
  const code = raum?.code ?? null
  const s = useSpielleitung(daten, name, code, zeit)
  const allein = code === null
  const [oeffentlich, setOeffentlich] = useState(oeffentlichAnfang)
  // Öffentlicher Raum: in der Liste, solange der Raum vor dem Start offen ist.
  const anmeldung = useRef<ReturnType<typeof meldeOeffentlich> | null>(null)
  const offen = oeffentlich && s.raumBereit && s.z.phase === 'lobby' && raum !== null
  useEffect(() => {
    if (!offen || !raum) return
    const a = meldeOeffentlich(raum.code, raum.name ?? raum.code, s.z.spieler.length)
    anmeldung.current = a
    return () => {
      a.abmelden()
      anmeldung.current = null
    }
    // Neu anmelden nur, wenn sich „offen“ ändert; die Spielerzahl folgt unten.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [offen, raum])
  useEffect(() => anmeldung.current?.aktualisieren(s.z.spieler.length), [s.z.spieler.length])
  // Allein üben: ohne Raum gleich los.
  const gestartet = useRef(false)
  useEffect(() => {
    if (allein && !gestartet.current) {
      gestartet.current = true
      s.starten()
    }
  }, [allein, s])

  if (s.raumFehler)
    return (
      <main className="seite quiz">
        <p className="hinweis" role="alert">
          Der Raum konnte nicht eröffnet werden: {s.raumFehler}
        </p>
        <button type="button" className="knopf" onClick={onVerlassen}>
          Zurück
        </button>
      </main>
    )
  return (
    <QuizAnsicht
      daten={daten}
      z={s.z}
      ich={s.ich!}
      restMs={s.restMs}
      istLeitung
      allein={allein}
      raum={
        raum
          ? {
              code: raum.code,
              name: raum.name,
              link: raumLink(raum),
              bereit: s.raumBereit,
              oeffentlich: OEFFENTLICH_MOEGLICH ? oeffentlich : undefined,
              onOeffentlich: setOeffentlich,
            }
          : undefined
      }
      onAntwort={s.antworten}
      onStart={s.starten}
      onZeit={s.setzeZeit}
      onAufloesen={s.aufloesen}
      onWeiter={s.weiterGehen}
      onNochmal={() => {
        s.nochmal()
        if (allein) s.starten()
      }}
      onVerlassen={onVerlassen}
    />
  )
}

function GastSpiel({ daten, name, raum, onVerlassen }: { daten: QuizDaten; name: string; raum: Raum; onVerlassen: () => void }) {
  const s = useGast(daten, name, raum.code)
  const zurueck = (
    <button type="button" className="knopf knopf-zweit" onClick={onVerlassen}>
      Zurück
    </button>
  )
  if (s.fehler)
    return (
      <main className="seite quiz">
        <p className="hinweis" role="alert">
          {s.fehler}
        </p>
        {zurueck}
      </main>
    )
  if (!s.z || !s.ich)
    return (
      <main className="seite quiz">
        <p className="hinweis" aria-live="polite">
          {s.status === 'getrennt' ? 'Die Verbindung ist abgebrochen.' : `Verbinde mit Raum „${raum.name ?? raum.code}“ …`}
        </p>
        {zurueck}
      </main>
    )
  return (
    <>
      {s.status === 'getrennt' && (
        <div className="mock-hinweis" role="alert">
          Die Verbindung zur Spielleitung ist abgebrochen.
        </div>
      )}
      <QuizAnsicht
        daten={daten}
        z={s.z}
        ich={s.ich}
        restMs={s.restMs}
        istLeitung={false}
        allein={false}
        onAntwort={s.antworten}
        onVerlassen={onVerlassen}
      />
    </>
  )
}

/** „Mit Zufälligen spielen“: offene öffentliche Räume beitreten oder selbst einen eröffnen. */
function ZufallSuche({
  name,
  onBeitreten,
  onEroeffnen,
  onZurueck,
}: {
  name: string
  onBeitreten: (r: Raum) => void
  onEroeffnen: () => void
  onZurueck: () => void
}) {
  const titel = useAnsicht('Mit Zufälligen spielen')
  const [raeume, setRaeume] = useState<OeffentlicherRaum[] | null>(null)
  useEffect(() => beobachteOeffentliche(setRaeume), [])
  const anstoessig = nameAnstoessig(name)
  return (
    <main className="seite quiz quiz-auftritt">
      <h2 ref={titel}>Mit Zufälligen spielen</h2>
      <p className="hinweis">
        Offene Räume, in denen gerade Leute auf Mitspielende warten. Alle im Raum sehen deinen Namen im Spiel.
      </p>
      {anstoessig ? (
        <p className="hinweis" role="alert">
          Mit diesem Namen geht es in öffentlichen Räumen nicht. Bitte wähle auf der Startseite einen anderen.
        </p>
      ) : raeume === null ? (
        <p className="meta">Suche offene Räume …</p>
      ) : raeume.length === 0 ? (
        <p className="meta" aria-live="polite">
          Gerade wartet niemand. Eröffne einen öffentlichen Raum – wer als Nächstes sucht, findet dich.
        </p>
      ) : (
        <ul className="quiz-spieler quiz-oeffentlich" aria-live="polite">
          {raeume.map((r) => (
            <li key={r.code}>
              <span className="quiz-spieler-name">{r.name}</span>
              <span className="quiz-weg">{r.spieler} von 8</span>
              <button
                type="button"
                className="knopf knopf-klein"
                onClick={() => onBeitreten(raumAusEingabe(r.name) ?? { code: r.code, name: r.name })}
              >
                Beitreten
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="quiz-aktion">
        <button type="button" className="knopf knopf-gross" disabled={anstoessig} onClick={onEroeffnen}>
          Öffentlichen Raum eröffnen
        </button>
        <button type="button" className="knopf knopf-leise knopf-klein" onClick={onZurueck}>
          Zurück
        </button>
      </div>
    </main>
  )
}
