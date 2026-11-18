/**
 * Tipos del juego ACAY / BEYOND THE RIVER.
 *
 * Especializa los tipos genéricos del motor con los tipos concretos de este
 * juego: pantallas (studio / explore / rhythm-battle), elementos narrativos,
 * diálogos (con typewriting), inventario (drag-combine), y tabs rítmicos.
 */
import type { BaseUISnapshot, WorldObjectDef } from '@/engine/core/types'

/** Pantallas del juego Acay. */
export type ScreenId = 'studio' | 'title' | 'explore' | 'rhythm-battle'

/** Fase de la caja de diálogo (UI React). */
export type DialoguePhase = 'idle' | 'narration' | 'conversation' | 'voice'

/* ───────────────── Elementos narrativos (escena de exploración POV) ───────────────── */

/**
 * Elemento narrativo de la escena POV: objeto/personaje con el que se puede
 * interactuar via hover/clic del puntero customizado.
 *
 * - hover: revela una descripción breve (tooltip en canvas).
 * - clic: si es personaje → inicia conversación (caja de diálogo se expande).
 *        si tiene triggersBattle → inicia batalla rítmica.
 *        si no → revela información extendida (narración).
 */
export interface NarrativeElement {
  id: string
  /** assetId lógico (resuelto por el índice). */
  asset: string
  /** Posición base (ancla bottom-center) en coords virtuales. */
  x: number
  y: number
  scale?: number
  /** Hit area (rectángulo centrado en x,y). Si no se da, se infiere del asset. */
  hitW?: number
  hitH?: number
  /** Etiqueta corta (nombre del elemento/personaje). */
  label: string
  /** Texto al hacer hover (descripción breve). */
  hoverText: string
  /** Texto al hacer clic si NO es personaje (narración extendida). */
  inspectText: string
  /** Si es un personaje (inicia conversación al clic). */
  isCharacter: boolean
  /** Diálogo de conversación (si isCharacter). */
  dialogue?: DialogueLine[]
  /** Si al clic inicia una batalla rítmica (id del antagonista). */
  triggersBattle?: string
  /**
   * Si al clic recoge un item (lo añade al inventario si no está).
   * Solo para elementos no-personaje (isCharacter=false).
   */
  pickup?: {
    itemId: string
    label: string
    icon: string
    description: string
    /** Texto de narración al recoger el item (primera vez). */
    pickupText: string
  }
  /** X donde Acay debe detenerse al caminar hacia el elemento (default: el.x). */
  walkToX?: number
  /** Si es una salida (exit hotspot): no tiene sprite, indicador sutil. */
  isExit?: boolean
  /** Si es salida: id de la escena destino (null = bloqueada, ej. left exit). */
  exitTargetScene?: string
  /** Si está bloqueado (no se puede interactuar hasta cumplir condición). */
  blocked?: boolean
  /** Texto a mostrar cuando se clickea estando bloqueado. */
  blockedText?: string
  /** Flag que, cuando es true, oculta el elemento de la escena (ej. pickup). */
  hideFlag?: string
  /** Asset alternativo cuando un flag es true (ej. gaucho despierto). */
  altAsset?: { flag: string; asset: string }
  /** Item requerido para interactuar (use-item mechanic). Si null, interacción normal. */
  useItem?: string
  /** Diálogo al usar el item correctamente. */
  useItemText?: string
  /** Flag que se setea al usar el item (tracking de estado de escena). */
  useItemFlag?: string
  /** Si el elemento aparece solo después de que un flag es true (ej. unstable_rock). */
  appearsAfterFlag?: string
  /**
   * Condiciones data-driven para exits (evaluadas en orden, primera coincidencia).
   * Reemplaza la lógica hardcoded: el código consume condiciones, no ifs por escena.
   * Editable en scene.ts (datos), no en ExploreScreen (código).
   */
  conditions?: ExitCondition[]
  /**
   * Diálogos condicionales (evaluados en orden antes del diálogo default).
   * Permite que un personaje diga cosas distintas según el estado del juego.
   * Ej: gaucho dice "¿Te olvidaste?" si el jugador vuelve sin las maderas.
   */
  dialogueConditions?: Array<{
    flag?: string
    notFlag?: string
    dialogue: DialogueLine[]
    owner?: string
  }>
}

/** Condición para un exit hotspot (data-driven). */
export interface ExitCondition {
  /** Flag que debe ser true para que la condición coincida. */
  flag?: string
  /** Flag que debe ser false (no seteado) para que coincida. */
  notFlag?: string
  /** Acción a ejecutar cuando la condición coincide. */
  action: 'transition' | 'dialogue' | 'blocked'
  /** Para 'transition': escena destino. */
  targetScene?: string
  /** Para 'dialogue': líneas de diálogo. */
  dialogue?: DialogueLine[]
  /** Para 'blocked': texto a mostrar. */
  blockedText?: string
  /** Owner del diálogo (para follow-up actions como tutorial/battle). */
  owner?: string
}

/** Escenas del juego Acay. */
export type SceneId = 'river_shore' | 'campamento'

/** Línea de diálogo. Acay balbucea (isAcay=true → texto incomprensible). */
export interface DialogueLine {
  speaker: string
  text: string
  /** Si es Acay: el jugador no entiende (se muestra como balbuceo). */
  isAcay?: boolean
  /** Pausa dramática antes de mostrar la línea (segundos). */
  waitSec?: number
}

/* ───────────────── Inventario ───────────────── */

export interface InventoryItem {
  id: string
  label: string
  /** assetId lógico del icono. */
  icon: string
  description: string
}

/* ───────────────── Batalla rítmica (guitar-hero invertido: esquivar) ───────────────── */

/**
 * Tab rítmico: desciende por una lane hacia Acay. Acay debe estar en OTRA lane
 * cuando el tab llega al primer plano (esquive). Si está en la misma lane → hit.
 */
export interface RhythmTab {
  /** Lane por la que desciende (0..lanes-1). */
  lane: number
  /** Tiempo (segundos desde el inicio de la batalla) en que llega al primer plano. */
  hitTime: number
  /** Si es un tab "fantasma" (visual, no daña) — para mockup de ritmo. */
  ghost?: boolean
}

/** Estado de una batalla rítmica en curso. */
export interface RhythmBattleState {
  /** Modo: 'dodge' (esquivar tabs) o 'tutorial' (tocar notas, coop, sin daño). */
  mode: 'dodge' | 'tutorial'
  /** Si es batalla por turnos (player turn = tocar notas, enemy turn = esquivar). */
  turnBased: boolean
  /** Turno actual (solo turnBased): 'player' = Acay ataca, 'enemy' = Acay esquiva. */
  turn: 'player' | 'enemy'
  /** HP del enemigo/Duende (solo turnBased). -1 por nota tocada en player turn. */
  enemyHp: number
  /** HP máximo del enemigo. */
  enemyMaxHp: number
  /** Tabs totales del turno actual. */
  turnTabsTotal: number
  /** Tabs resueltos del turno actual. */
  turnTabsResolved: number
  /** Antagonista (para display). En tutorial es el gaucho. */
  antagonistId: string
  antagonistName: string
  /** Cantidad de lanes (eje horizontal). */
  lanes: number
  /** Lane actual de Acay (0..lanes-1). */
  acayLane: number
  /** Tabs programados (ordenados por hitTime). */
  tabs: RhythmTab[]
  /** Tiempo de inicio (performance.now ms) — referencia para hitTime. */
  startMs: number
  /** HP de Acay (empieza 3, -1 por tab hit). */
  hp: number
  /** Score (esquives exitosos). */
  dodges: number
  /** Hits recibidos. */
  hits: number
  /** Duración total de la batalla (segundos). */
  durationSec: number
}

/* ───────────────── Snapshot UI ───────────────── */

/**
 * Snapshot del juego Acay publicado al store para React.
 * Extiende BaseUISnapshot con los campos que los overlays leen.
 */
export interface AcaySnapshot extends BaseUISnapshot {
  screen: ScreenId
  locale: 'es' | 'en'
  /** Diálogo actual (si hay) — para DialogueBox. */
  dialogue: {
    phase: DialoguePhase
    speaker: string
    /** Texto completo de la línea actual. */
    fullText: string
    /** Si la línea es de Acay (balbuceo). */
    isAcay: boolean
    /** Índice de línea actual / total. */
    lineIndex: number
    lineCount: number
    /** Pausa dramática antes de mostrar la línea (segundos, 0 = sin pausa). */
    waitSec: number
  } | null
  /** Inventario actual. */
  inventory: InventoryItem[]
  /** Estado de batalla (si screen='rhythm-battle') — para RhythmHud. */
  battle: {
    antagonistName: string
    hp: number
    maxHp: number
    dodges: number
    hits: number
    lanes: number
    acayLane: number
    elapsedSec: number
    durationSec: number
  } | null
  /** Elemento bajo hover del puntero (para tooltip). */
  hoveredElementId: string | null
  /**
   * Si la UI está desbloqueada (inventario, language switch, cursor custom).
   * Inicia false — se desbloquea diegéticamente cuando Acay despierta (1.1).
   */
  uiUnlocked: boolean
  /** Si el inventario está desbloqueado (se abre tras recoger la pava, 2.3). */
  inventoryUnlocked: boolean
  /** Objetivo actual (string i18n key resuelta) o null si no hay. */
  objective: string | null
  /** Item seleccionado del inventario (para use-item mechanic). null = ninguno. */
  selectedItemId: string | null
  /** Si la demo terminó (pantalla de fin). */
  demoEnded: boolean
  /** Si el título ya se mostró (controla TitleOverlay). */
  titleShown: boolean
}

/** WorldObjectDef del juego (interaction = NarrativeElement payload). */
export type AcayWorldObject = WorldObjectDef
