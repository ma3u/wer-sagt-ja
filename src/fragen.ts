import type { QuizFrage } from './typen.ts'

// Texte zur Frage. Die Fragen selbst stehen in public/fragen.json (siehe katalog.ts); gefragt wird immer nach Ja.

/** Anleitung unter der Frage – ein kurzer Satz: was gesucht ist. */
export function anleitung(f: Pick<QuizFrage, 'art'>): string {
  if (f.art === 'einzeln') return 'Nur eine Partei sagt Ja. Welche?'
  return 'Wer sagt Ja? Mehrere sind richtig.'
}

/** Regeln in Stichworten darunter: wie „teils“ zählt, wie man abgibt. */
export function anleitungRegeln(f: Pick<QuizFrage, 'art'>): string[] {
  return f.art === 'mehrfach' ? ['„teils“ zählt nicht'] : ['ein Tipp gibt ab']
}
