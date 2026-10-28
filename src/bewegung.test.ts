import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { konfettiTeile } from './konfettiTeile'

// Ohne Schalter „Bewegung anhalten“ muss alles, was sich von selbst bewegt, nach fünf Sekunden stillstehen (WCAG 2.2.2).
describe('Bewegung', () => {
  it('Konfetti liegt nach weniger als fünf Sekunden', () => {
    for (const t of konfettiTeile(120)) expect(t.verzug + t.dauer).toBeLessThan(5)
  })
  it('keine Animation läuft endlos', () => {
    expect(readFileSync(new URL('./index.css', import.meta.url), 'utf8')).not.toMatch(/\binfinite\b/)
  })
})
