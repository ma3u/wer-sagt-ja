import { QUELLCODE } from './app'

export function Fusszeile() {
  return (
    <footer className="fusszeile">
      <a href="#/fragen">Alle Fragen</a>
      <a href="#/methode">Methode</a>
      <a href="#/mitmachen">Mitmachen</a>
      <a href="#/impressum">Impressum</a>
      <a href="#/datenschutz">Datenschutz</a>
      <a href={QUELLCODE}>Quellcode</a>
      <a href={`${QUELLCODE}/issues`} target="_blank" rel="noopener noreferrer">
        Feedback
      </a>
    </footer>
  )
}
