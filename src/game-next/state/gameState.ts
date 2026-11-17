import { GameState } from '@/engine/state/GameState'
import type {
  InventoryItem,
  DialogueLine,
  RhythmBattleState,
  DialoguePhase,
} from '@/game-next/core/types'

/**
 * Estado lógico del juego ACAY.
 *
 * Independiente de la representación visual. La UI y el renderer lo LEEN;
 * la lógica del juego (pantallas, handlers) lo ESCRIBE.
 *
 * Campos:
 *   - inventory: objetos recogidos (drag-combine en el futuro).
 *   - flags: eventos narrativos (qué se ha visto, qué diálogos están activos).
 *   - currentDialogue: diálogo activo (null si no hay).
 *   - dialogueIndex: línea actual del diálogo.
 *   - battle: estado de batalla rítmica (null si no hay).
 */
export class AcayGameState extends GameState {
  /** Inventario del jugador (empieza vacío — los items se recogen en la escena). */
  inventory: InventoryItem[] = []

  /** Flags narrativos (eventos vistos, acertijos resueltos, etc.). */
  flags: Record<string, boolean> = {}

  /** Diálogo activo (array de líneas) o null. */
  currentDialogue: DialogueLine[] | null = null
  /** Índice de la línea actual del diálogo. */
  dialogueIndex = 0
  /** Fase del diálogo (narration = inspección; conversation = con personaje). */
  dialoguePhase: DialoguePhase = 'idle'

  /** Estado de batalla rítmica en curso (null si no hay). */
  battle: RhythmBattleState | null = null

  /** ID del elemento bajo hover del puntero (null si ninguno). */
  hoveredElementId: string | null = null

  /** Reinicio completo (nueva partida). */
  reset(): void {
    this.inventory = []
    this.flags = {}
    this.currentDialogue = null
    this.dialogueIndex = 0
    this.dialoguePhase = 'idle'
    this.battle = null
    this.hoveredElementId = null
    this.markChanged()
  }

  /** Añade un item al inventario si no está ya. Devuelve true si lo añadió. */
  addItem(item: InventoryItem): boolean {
    if (this.inventory.some((i) => i.id === item.id)) return false
    this.inventory.push(item)
    return true
  }

  /** ¿Tiene el item con ese id? */
  hasItem(itemId: string): boolean {
    return this.inventory.some((i) => i.id === itemId)
  }
}
