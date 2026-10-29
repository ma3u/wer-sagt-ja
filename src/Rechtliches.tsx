import { useEffect, type RefObject } from 'react'
import { APP_NAME, QUELLCODE } from './app'
import { useAnsicht, useFokusZurueck } from './barrierefrei'
import { BETREIBER, betreiberVollstaendig, DATENSCHUTZ_STAND } from './betreiber'
import { Logo } from './Logo'
import { FIREBASE_URL, firebaseStandort, STUN_URLS, stunHost } from './netz'

// Impressum und Datenschutzerklärung auf einer Seite, verlinkt als „Impressum & Datenschutz“: #/impressum öffnet sie
// oben, #/datenschutz springt zum Abschnitt Datenschutz. Beide sind so von jeder Seite mit einem Klick erreichbar und
// am Linktext erkennbar (§ 5 DDG, § 18 MStV, Art. 12 DSGVO). Die Texte beschreiben, was die App tatsächlich tut – bei
// Änderungen an Datenflüssen (neue Dienste, neue gespeicherte Felder) hier mit anpassen.

export type RechtsSeite = 'impressum' | 'datenschutz'

function Unvollstaendig() {
  if (betreiberVollstaendig()) return null
  return (
    <p className="recht-warnung" role="alert">
      Entwurf: Die Angaben zum Betreiber fehlen noch (Datei <code>src/betreiber.ts</code>).
    </p>
  )
}

function Anschrift() {
  return (
    <p>
      {BETREIBER.name}
      <br />
      {BETREIBER.strasse}
      <br />
      {BETREIBER.ort}
      <br />
      E-Mail: <a href={`mailto:${BETREIBER.email}`}>{BETREIBER.email}</a>
    </p>
  )
}

/** Kopf jeder Unterseite: zurück ins Spiel und das Logo zur Startseite. */
/** Ohne `onZurueck` (statische Seite) führt ein Link zur Startseite. */
export function UnterseitenKopf({ onZurueck }: { onZurueck?: () => void }) {
  return (
    <header className="recht-kopf">
      {onZurueck ? (
        <button className="knopf knopf-leise" onClick={onZurueck}>
          ← Zurück
        </button>
      ) : (
        <a className="knopf knopf-leise" href="#/">
          ← Zur Startseite
        </a>
      )}
      <a href="#/" className="recht-marke" aria-label={`${APP_NAME} – Startseite`}>
        <Logo groesse={32} />
      </a>
    </header>
  )
}

export function Rechtliches({ seite, onZurueck }: { seite: RechtsSeite; onZurueck: () => void }) {
  useFokusZurueck()
  // Der Fokus geht auf die Überschrift des gewünschten Teils – #/datenschutz auf „Datenschutz“, sonst auf die Seite.
  const titel = useAnsicht('Impressum und Datenschutz', seite)
  useEffect(() => {
    if (seite === 'datenschutz') document.getElementById('datenschutz')?.scrollIntoView()
    else scrollTo(0, 0)
  }, [seite])

  return (
    <main className="seite recht">
      <UnterseitenKopf onZurueck={onZurueck} />
      <Unvollstaendig />
      <article>
        <h1 ref={seite === 'impressum' ? titel : undefined}>Impressum und Datenschutz</h1>
        <Impressum />
        <Datenschutz titel={seite === 'datenschutz' ? titel : undefined} />
      </article>
    </main>
  )
}

function Impressum() {
  return (
    <section aria-labelledby="impressum">
      <h2 id="impressum">Impressum</h2>
      <h3>Angaben nach § 18 Abs. 1 MStV</h3>
      <Anschrift />
      <p>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: {BETREIBER.name}, Anschrift wie oben.</p>
      <h3>Zum Projekt</h3>
      <p>
        „{APP_NAME}“ ist ein privates, nicht-kommerzielles Quiz zu Wahlprogrammen (Bundestagswahl 2025 und weitere
        Wahlen). Es wird von keiner
        Partei beauftragt oder finanziert. Der <a href={QUELLCODE}>Quellcode ist offen</a>, ebenso die
        Fragen mit den Positionen der Parteien. Die Positionen sind zum großen Teil mit KI-Hilfe aus den Programmen
        erfasst und noch nicht von Menschen geprüft – das Spiel weist darauf hin und verlinkt jede Stelle im Programm.
        Fehler bitte als <a href={`${QUELLCODE}/issues`}>Issue</a> oder per E-Mail melden.
      </p>
      <h3>Links</h3>
      <p>
        Die Beleg-Links führen zu Wahlprogrammen und Quellen auf fremden Websites. Für deren Inhalte sind allein die
        jeweiligen Anbieter verantwortlich.
      </p>
    </section>
  )
}

function Datenschutz({ titel }: { titel?: RefObject<HTMLHeadingElement | null> }) {
  return (
    <section aria-labelledby="datenschutz">
      <h2 id="datenschutz" ref={titel}>
        Datenschutz
      </h2>
      <p className="meta">Stand: {DATENSCHUTZ_STAND}</p>

      <h3>Kurz gesagt</h3>
      <ul>
        <li>Kein Konto, keine Cookies, kein Tracking, keine Werbung, keine KI, die deine Antworten auswertet.</li>
        <li>Wir speichern keine Spieldaten. Das Spiel läuft zwischen den Geräten der Mitspielenden.</li>
        <li>Auf deinem Gerät bleiben nur dein Name im Spiel und deine Ton-Wahl – wenn du sie eingibst.</li>
      </ul>

      <h3>1. Verantwortlich</h3>
      <Anschrift />

      <h3>2. Aufruf der Seite</h3>
      <p>
        Die Seite liegt bei GitHub Pages (GitHub, Inc., USA). GitHub verarbeitet beim Aufruf technisch notwendige
        Verbindungsdaten wie die IP-Adresse; Näheres in der{' '}
        <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement">
          Datenschutzerklärung von GitHub
        </a>
        . Schriften, Fragen, Stimmen und Geräusche kommen von derselben Adresse; es werden keine weiteren Dienste
        eingebunden.
      </p>

      <h3>3. Das Spiel</h3>
      <p>
        Zwischen den Geräten im selben Raum laufen: dein Name im Spiel (freiwillig, höchstens 20 Zeichen), deine
        Antworten mit Antwortzeit und der Spielstand. Das liegt nur im Arbeitsspeicher und ist weg, wenn ihr die Seite
        schließt. Der Raumname steht hinter dem „#“ in der Adresse und wird nicht an den Webserver übertragen.
      </p>
      {FIREBASE_URL ? (
        <p>
          <strong>Verbindungsaufbau:</strong> Damit sich die Geräte finden, tauschen sie kurz technische
          Verbindungsangaben über die Firebase Realtime Database aus (Google Ireland Limited, Dublin; Rechenzentrum in{' '}
          {firebaseStandort(FIREBASE_URL)}). Darin können Netzwerkadressen der Geräte stehen. Jede Nachricht wird dort
          gelöscht, sobald das empfangende Gerät sie gelesen hat; beim Verlassen löscht jedes Gerät seine Nachrichten,
          die Spielleitung den Raum. Reste nach einem Abbruch löschen wir einmal täglich (alles älter als eine Stunde).
          Google verarbeitet dabei Verbindungsdaten einschließlich der IP-Adresse (Auftragsverarbeitung nach den
          Firebase-Bedingungen; Übermittlung in die USA nach Art. 45, 46 DSGVO). Die App lädt keine Software von Google
          und speichert dafür nichts in deinem Browser. Danach sind die Geräte direkt verbunden (WebRTC); klappt das
          nicht, laufen die Spielnachrichten auf demselben Weg – ebenfalls nur bis zum Lesen.
        </p>
      ) : (
        <p>
          <strong>Verbindungsaufbau:</strong> Diese Fassung hat keinen Verbindungsdienst; Räume funktionieren nur
          zwischen Tabs desselben Browsers.
        </p>
      )}
      <p>
        <strong>IP-Adressen:</strong> Bei einer direkten Verbindung erfahren die Geräte im Raum gegenseitig ihre
        IP-Adresse.{' '}
        {STUN_URLS.length ? (
          <>
            Dafür fragt dein Browser einen STUN-Server ({STUN_URLS.map(stunHost).join(', ')}) nach seiner öffentlichen
            Adresse; dessen Betreiber sieht dabei deine IP-Adresse.
          </>
        ) : (
          <>
            Ohne STUN-Server verbinden sich Geräte direkt nur im selben Netz (etwa im selben WLAN), sonst läuft das
            Spiel über die Weiterleitung – öffentliche IP-Adressen tauschen sie dann nicht aus.
          </>
        )}
      </p>
      <p>
        <strong>Öffentliche Räume („Mit Fremden“):</strong> Machst du einen Raum öffentlich, stehen sein Name und die
        Zahl der Mitspielenden in einer Liste, die alle Besucher sehen – in der Firebase Realtime Database, solange
        der Raum auf Mitspielende wartet. Beim Spielstart oder Verlassen wird der Eintrag gelöscht.
      </p>
      <p>
        <strong>Auf deinem Gerät:</strong> Deinen Namen im Spiel und deine Ton-Wahl (an oder aus) speichert die App im
        Browser (localStorage), damit beides beim nächsten Besuch schon dasteht – nur, wenn du sie eingibst bzw. den
        Ton ausdrücklich ein- oder ausschaltest (§ 25 Abs. 2 Nr. 2 TDDDG). Ein leeres Namensfeld löscht den Namen; die
        Ton-Wahl löschst du über die Website-Daten deines Browsers.
      </p>
      <p>
        <strong>Stimmen:</strong> Die Moderatoren Mara und Ben sind KI-Stimmen (ElevenLabs), vorab aufgenommen. Beim
        Spielen geht nichts an ElevenLabs.
      </p>
      <p>
        <strong>Rechtsgrundlage</strong> ist unser berechtigtes Interesse, das Spiel ohne Konto und ohne Speicherung
        anzubieten (Art. 6 Abs. 1 lit. f DSGVO).
      </p>

      <h3>4. Deine Rechte</h3>
      <p>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch
        (Art. 15–21 DSGVO). Da wir keine Daten speichern, die sich dir zuordnen lassen, gibt es meist nichts, worüber
        wir Auskunft geben könnten. Schreib uns gern: <a href={`mailto:${BETREIBER.email}`}>{BETREIBER.email}</a>.
        Beschweren kannst du dich bei einer Aufsichtsbehörde, etwa der für uns zuständigen:{' '}
        <a href={BETREIBER.aufsichtsbehoerde.url}>{BETREIBER.aufsichtsbehoerde.name}</a>.
      </p>
    </section>
  )
}
