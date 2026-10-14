import { useHash, zurueck } from './navigation.ts'
import { Quiz } from './Quiz.tsx'
import { Rechtliches, type RechtsSeite } from './Rechtliches.tsx'
import { Uebersicht } from './Uebersicht.tsx'
import { uebersichtAus } from './uebersicht.ts'

function rechtsSeite(hash: string): RechtsSeite | null {
  if (hash.startsWith('#/impressum')) return 'impressum'
  if (hash.startsWith('#/datenschutz')) return 'datenschutz'
  return null
}

/** Das Quiz bleibt unter einer Unterseite geladen, damit Raum und Verbindungen erhalten bleiben. */
export function App() {
  const hash = useHash()
  const seite = rechtsSeite(hash)
  const uebersicht = uebersichtAus(hash)
  return (
    <>
      {seite && <Rechtliches seite={seite} onZurueck={zurueck} />}
      {uebersicht && <Uebersicht wahlId={uebersicht.wahl} partei={uebersicht.partei} frageId={uebersicht.frage} onZurueck={zurueck} />}
      <div hidden={seite !== null || uebersicht !== null}>
        <Quiz />
      </div>
    </>
  )
}
