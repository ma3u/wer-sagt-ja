import type { QuizFrage } from './typen.ts'

// Texte zur Frage. Die Fragen selbst entstehen im Politik-Duell (`npm run quiz:erzeugen`) aus den Haltungen des
// Datenkatalogs und liegen hier als public/fragen.json.

/** Anleitung unter der Frage – ein kurzer Satz: was gesucht ist. */
export function anleitung(f: Pick<QuizFrage, 'art' | 'gesucht'>): string {
  const wort = f.gesucht === 'ja' ? 'Ja' : 'Nein'
  if (f.art === 'einzeln') return `Nur eine Partei sagt ${wort}. Welche?`
  return `Wer sagt ${wort}? Mehrere sind richtig.`
}

/** Regeln in Stichworten darunter: wie „teils“ und „keine Aussage“ zählen, wie man abgibt. */
export function anleitungRegeln(f: Pick<QuizFrage, 'art' | 'status_quo'>): string[] {
  return [
    ...(f.art === 'mehrfach' ? ['„teils“ zählt nicht'] : ['ein Tipp gibt ab']),
    ...(f.status_quo ? [`keine Aussage zählt als ${f.status_quo === 'ja' ? 'Ja' : 'Nein'}`] : []),
  ]
}
