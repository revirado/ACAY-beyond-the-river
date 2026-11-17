import { GameState } from '@/engine/state/GameState'

/**
 * Estado del NUEVO juego (stub).
 *
 * Cuando llegue el brief, aquí se agregan los campos del estado lógico:
 *   - progreso narrativo (qué se ha visto, qué diálogos están disponibles)
 *   - inventario / items
 *   - estado del mini-juego guitar-hero (tabs activos, score, vidas)
 *   - posición del personaje en la escena de exploración
 *   - flags de eventos
 *
 * Por ahora, un stub vacío que solo cumple el contrato (version + reset).
 */
export class NewGameState extends GameState {
  // TODO(brief): agregar campos del estado del nuevo juego.

  reset(): void {
    // TODO(brief): resetear campos del nuevo juego.
    this.flags = {}
    this.markChanged()
  }
}
