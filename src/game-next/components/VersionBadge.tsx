'use client'

import { VERSION, PALETTE } from '@/game-next/core/config'

/**
 * VersionBadge — versión de desarrollo en la esquina inferior izquierda.
 * Siempre visible (todas las pantallas). Texto chico, baja opacidad, no
 * interfiere con el gameplay ni los overlays.
 *
 * La versión se centraliza en `src/game-next/core/config.ts` (`VERSION`).
 * Incrementar el último dígito en cada iteración.
 */
export function VersionBadge() {
  return (
    <div
      className="pointer-events-none absolute bottom-1 left-2 z-30 select-none"
      style={{
        color: 'rgba(243,227,194,0.4)',
        fontSize: 10,
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
      }}
      aria-hidden
    >
      {VERSION}
    </div>
  )
}
