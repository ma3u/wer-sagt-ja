import { useMemo } from 'react'
import { konfettiTeile } from './konfettiTeile'

/**
 * Konfettiregen für den Sieg – rein dekorativ, fällt einmal, ohne Blinken (WCAG 2.3.1). Ruht bei „Bewegung
 * reduzieren“ (index.css).
 */
export function Konfetti({ teile = 120 }: { teile?: number }) {
  const liste = useMemo(() => konfettiTeile(teile), [teile])
  return (
    <div className="show-konfetti" aria-hidden="true">
      {liste.map((t, i) => (
        <span
          key={i}
          style={{
            left: `${t.links}%`,
            width: `${t.breite}px`,
            animationDelay: `${t.verzug}s`,
            animationDuration: `${t.dauer}s`,
            background: t.farbe,
            transform: `rotate(${t.drehung}deg)`,
          }}
        />
      ))}
    </div>
  )
}
