import { QUELLCODE } from './app'
import { useBewegung } from './barrierefrei'

export function Fusszeile() {
  const [bewegungAus, umschalten] = useBewegung()
  return (
    <footer className="fusszeile">
      <a href="#/impressum">Impressum</a>
      <a href="#/datenschutz">Datenschutz</a>
      <a href={QUELLCODE}>Quellcode</a>
      <a href={`${QUELLCODE}/issues`} target="_blank" rel="noopener noreferrer">
        Feedback
      </a>
      <button type="button" aria-pressed={bewegungAus} onClick={umschalten}>
        Bewegung anhalten
      </button>
    </footer>
  )
}
