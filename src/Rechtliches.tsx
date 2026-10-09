import { useEffect } from 'react'
import { APP_NAME, DATENQUELLE, QUELLCODE } from './app'
import { useAnsicht, useFokusZurueck } from './barrierefrei'
import { BETREIBER, betreiberVollstaendig, DATENSCHUTZ_STAND } from './betreiber'
import { Logo } from './Logo'
import { FIREBASE_URL, firebaseStandort, STUN_URLS, stunHost } from './netz'

// Impressum (#/impressum) und Datenschutzerklärung (#/datenschutz). Die Texte beschreiben, was die App tatsächlich
// tut – bei Änderungen an Datenflüssen (neue Dienste, neue gespeicherte Felder) hier mit anpassen.

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

export function Rechtliches({ seite, onZurueck }: { seite: RechtsSeite; onZurueck: () => void }) {
  useFokusZurueck()
  useEffect(() => {
    scrollTo(0, 0)
  }, [seite])

  return (
    <main className="seite recht">
      <header className="recht-kopf">
        <button className="knopf knopf-leise" onClick={onZurueck}>
          ← Zurück
        </button>
        <a href="#/" className="recht-marke" aria-label={`${APP_NAME} – Startseite`}>
          <Logo groesse={32} />
        </a>
      </header>
      <Unvollstaendig />
      {seite === 'impressum' ? <Impressum /> : <Datenschutz />}
    </main>
  )
}

function Impressum() {
  const titel = useAnsicht('Impressum')
  return (
    <article>
      <h1 ref={titel}>Impressum</h1>
      <h2>Angaben nach § 5 DDG</h2>
      <Anschrift />
      <p>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: {BETREIBER.name}, Anschrift wie oben.</p>
      <h2>Zum Projekt</h2>
      <p>
        „{APP_NAME}“ ist ein privates, nicht-kommerzielles Quiz zu den Bundeswahlprogrammen 2025. Es wird von keiner
        Partei beauftragt oder finanziert. Der <a href={QUELLCODE}>Quellcode ist offen</a>. Die Fragen und die Positionen
        der Parteien stammen aus dem Datenkatalog des <a href={DATENQUELLE}>Politik-Duells</a>; sie sind zum großen Teil
        mit KI-Hilfe erfasst und noch nicht von Menschen geprüft – das Spiel weist darauf hin und verlinkt jede Stelle im
        Programm. Fehler bitte dort als Issue melden oder per E-Mail.
      </p>
      <h2>Links</h2>
      <p>
        Die Beleg-Links führen zu Wahlprogrammen und Quellen auf fremden Websites. Für deren Inhalte sind allein die
        jeweiligen Anbieter verantwortlich.
      </p>
    </article>
  )
}

function Datenschutz() {
  const titel = useAnsicht('Datenschutz')
  return (
    <article>
      <h1 ref={titel}>Datenschutz</h1>
      <p className="meta">Stand: {DATENSCHUTZ_STAND}</p>

      <h2>Kurz gesagt</h2>
      <ul>
        <li>Kein Konto, keine Cookies, kein Tracking, keine Werbung, keine KI, die deine Antworten auswertet.</li>
        <li>Wir speichern keine Spieldaten. Das Spiel läuft zwischen den Geräten der Mitspielenden.</li>
        <li>Auf deinem Gerät bleiben nur dein Name im Spiel und deine Ton-Wahl – wenn du sie eingibst.</li>
      </ul>

      <h2>1. Verantwortlich</h2>
      <Anschrift />

      <h2>2. Aufruf der Seite</h2>
      <p>
        Die Seite liegt bei GitHub Pages (GitHub, Inc., USA). GitHub verarbeitet beim Aufruf technisch notwendige
        Verbindungsdaten wie die IP-Adresse; Näheres in der{' '}
        <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement">
          Datenschutzerklärung von GitHub
        </a>
        . Schriften, Fragen, Stimmen und Geräusche kommen von derselben Adresse; es werden keine weiteren Dienste
        eingebunden.
      </p>

      <h2>3. Das Spiel</h2>
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

      <h2>4. Deine Rechte</h2>
      <p>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch
        (Art. 15–21 DSGVO). Da wir keine Daten speichern, die sich dir zuordnen lassen, gibt es meist nichts, worüber
        wir Auskunft geben könnten. Schreib uns gern: <a href={`mailto:${BETREIBER.email}`}>{BETREIBER.email}</a>.
        Beschweren kannst du dich bei einer Aufsichtsbehörde, etwa der für uns zuständigen:{' '}
        <a href={BETREIBER.aufsichtsbehoerde.url}>{BETREIBER.aufsichtsbehoerde.name}</a>.
      </p>
    </article>
  )
}
