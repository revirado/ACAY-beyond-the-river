import type { DialogueLine, DialoguePhase } from '@/game-next/core/types'
import { t } from '@/engine/i18n'

/**
 * ═══════════════════════════════════════════════════════════════════
 *  TRIGGERS DE DIÁLOGO — sistema de diálogos auto-iniciados.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Permite que un diálogo arranque SOLO, sin que el jugador clickee, basado
 * en una condición: al entrar a una escena, al recoger N items, al setear
 * un flag, etc.
 *
 * Reutilizable: cada trigger declara su condición + diálogo + speaker. La
 * screen (ExploreScreen) evalúa los triggers cada frame y dispara el que
 * corresponda (si no fue ya disparado, si no hay diálogo activo).
 *
 * Personajes invisibles (ej. La Pacha): se manifiestan SOLO vía diálogo.
 * No tienen asset ni sprite — su `speaker` aparece en la caja de diálogo.
 */

export type TriggerConditionType = 'onSceneEnter' | 'onInventoryCount' | 'onFlag'

export interface TriggerCondition {
  type: TriggerConditionType
  /** Para onSceneEnter: id de la escena (ej. 'explore'). */
  sceneId?: string
  /** Para onInventoryCount: cantidad mínima de items. */
  minCount?: number
  /** Para onFlag: nombre del flag que debe ser true. */
  flag?: string
}

export interface DialogueTrigger {
  id: string
  /** Condición que dispara el diálogo. */
  condition: TriggerCondition
  /** Si true, solo dispara una vez (trackea via flag `trigger:<id>`). */
  once: boolean
  /** Delay en segundos antes de disparar (tras cumplir la condición). */
  delaySec: number
  /** Speaker del diálogo (ej. "La Pacha"). */
  speaker: string
  /** Fase del diálogo (narration / conversation). */
  phase: DialoguePhase
  /** Líneas de diálogo. */
  dialogue: DialogueLine[]
}

/**
 * Estado de evaluación de triggers: trackea el tiempo desde que una
 * condición se cumplió, para respetar el `delaySec`.
 */
export interface TriggerEvalState {
  /** Timestamp (ms) en que la condición empezó a cumplirse, por trigger id. */
  conditionMetMs: Record<string, number>
}

export function newTriggerEvalState(): TriggerEvalState {
  return { conditionMetMs: {} }
}

/**
 * Evalúa todos los triggers. Si alguno cumple su condición + delay y no fue
 * disparado, devuelve el trigger a disparar (la screen lo inicia y marca el
 * flag). Reutilizable: la screen pasa el estado + flags + inventario.
 */
export function evaluateTriggers(
  triggers: DialogueTrigger[],
  evalState: TriggerEvalState,
  ctx: {
    currentSceneId: string
    inventoryCount: number
    flags: Record<string, boolean>
    hasActiveDialogue: boolean
    now: number
  },
): DialogueTrigger | null {
  if (ctx.hasActiveDialogue) return null // no interrumpir diálogo activo

  for (const trig of triggers) {
    // Si es once y ya disparado, skip
    if (trig.once && ctx.flags[`trigger:${trig.id}`]) continue

    // ¿Condición cumplida?
    const met = isConditionMet(trig.condition, ctx)
    const metKey = trig.id

    if (met) {
      // Registrar cuándo empezó a cumplirse (si no estaba)
      if (!evalState.conditionMetMs[metKey]) {
        evalState.conditionMetMs[metKey] = ctx.now
      }
      const elapsedSec = (ctx.now - evalState.conditionMetMs[metKey]) / 1000
      if (elapsedSec >= trig.delaySec) {
        return trig // disparar
      }
    } else {
      // Condición no cumplida → resetear el timer
      delete evalState.conditionMetMs[metKey]
    }
  }
  return null
}

function isConditionMet(
  cond: TriggerCondition,
  ctx: { currentSceneId: string; inventoryCount: number; flags: Record<string, boolean> },
): boolean {
  switch (cond.type) {
    case 'onSceneEnter':
      return ctx.currentSceneId === cond.sceneId
    case 'onInventoryCount':
      return ctx.inventoryCount >= (cond.minCount ?? 0)
    case 'onFlag':
      return !!ctx.flags[cond.flag ?? '']
  }
}

/* ────────────────────── Triggers del juego Acay ────────────────────── */

/**
 * Factory: construye los triggers del juego Acay. Se llama en runtime
 * (después de que el motor registró los locales) para que `t()` resuelva
 * los textos correctamente. Análoga a `buildSceneElements()`.
 */
export function buildDialogueTriggers(): DialogueTrigger[] {
  const pacha = t('dialogues.pacha_greeting.speaker_pacha')

  const pachaGreeting: DialogueTrigger = {
    id: 'pacha_greeting',
    condition: { type: 'onFlag', flag: 'acayAwakened' },
    once: true,
    delaySec: 1.5,
    speaker: pacha,
    phase: 'conversation',
    dialogue: [
      { speaker: pacha, text: t('dialogues.pacha_greeting.l1') },
      { speaker: pacha, text: t('dialogues.pacha_greeting.l2') },
      { speaker: pacha, text: t('dialogues.pacha_greeting.l3') },
      { speaker: pacha, text: t('dialogues.pacha_greeting.l4') },
    ],
  }

  // pacha_relics removido: pickup mockup fuera de scene 01.

  /**
   * Voz desconocida (1.2): tras cerrar el diálogo del despertar, Acay gira
   * a mirar el río (back view) y una voz incorpórea resuona. Trigger onFlag
   * 'scene01AwakeningDone' con 1s de delay. Phase 'voice' (estilo diferenciado).
   */
  const voiceUnknown: DialogueTrigger = {
    id: 'voice_unknown',
    condition: { type: 'onFlag', flag: 'scene01AwakeningDone' },
    once: true,
    delaySec: 1.0,
    speaker: t('scene01.voice_speaker'),
    phase: 'voice',
    dialogue: [
      { speaker: t('scene01.voice_speaker'), text: t('scene01.voice_line') },
    ],
  }

  return [pachaGreeting, voiceUnknown]
}
