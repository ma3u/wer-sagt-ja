import { useHash, zurueck } from './navigation.ts'
import { Quiz } from './Quiz.tsx'
import { Rechtliches, type RechtsSeite } from './Rechtliches.tsx'

function rechtsSeite(hash: string): RechtsSeite | null {
  if (hash.startsWith('#/impressum')) return 'impressum'
  if (hash.startsWith('#/datenschutz')) return 'datenschutz'
  return null
}

/** Das Quiz bleibt unter einer Rechtsseite geladen, damit Raum und Verbindungen erhalten bleiben. */
export function App() {
  const hash = useHash()
  const seite = rechtsSeite(hash)
  return (
    <>
      {seite && <Rechtliches seite={seite} onZurueck={zurueck} />}
      <div hidden={seite !== null}>
        <Quiz />
      </div>
    </>
  )
}
