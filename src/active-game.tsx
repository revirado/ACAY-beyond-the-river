/**
 * active-game — config central que decide qué juego monta page.tsx.
 *
 * Para switchear entre el juego cozy (referencia) y el nuevo juego (stub),
 * comenta/descomenta las dos líneas marcadas abajo. Es el ÚNICO cambio
 * necesario para cambiar de juego activo.
 *
 * El juego cozy (`src/game/`) es la referencia que demuestra que el motor
 * funciona end-to-end. El nuevo juego (`src/game-next/`) es el stub que
 * recibirá el brief detallado.
 */

import { GameRoot as CozyGameRoot } from '@/components/game/GameRoot'
import { NewGameHost } from '@/game-next/host'

/** Host activo: el componente React que monta page.tsx. */
// export const ActiveGameHost = CozyGameRoot
export const ActiveGameHost = NewGameHost  // ← descomentar para arrancar el nuevo juego
