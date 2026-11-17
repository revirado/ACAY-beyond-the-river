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
  /** Inventario del jugador (mockup: 2 items iniciales para demo). */
  inventory: InventoryItem[] = [
    { id: 'guitar', label: 'Guitarra', icon: 'ui.item_guitar', description: 'Una guitarra vieja encontrada en la ribera.' },
    { id: 'relic', label: 'Reliquia', icon: 'ui.item_relic', description: 'Una reliquia tallada en piedra.' },
  ]

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
    this.inventory = [
      { id: 'guitar', label: 'Guitarra', icon: 'ui.item_guitar', description: 'Una guitarra vieja encontrada en la ribera.' },
      { id: 'relic', label: 'Reliquia', icon: 'ui.item_relic', description: 'Una reliquia tallada en piedra.' },
    ]
    this.flags = {}
    this.currentDialogue = null
    this.dialogueIndex = 0
    this.dialoguePhase = 'idle'
    this.battle = null
    this.hoveredElementId = null
    this.markChanged()
  }
}
