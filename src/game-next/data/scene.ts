import type { NarrativeElement, DialogueLine, SceneId, ExitCondition } from '@/game-next/core/types'
import { t } from '@/engine/i18n'

/**
 * Datos de las escenas del juego Acay.
 *
 * Cada escena tiene su propio set de elementos narrativos. El ExploreScreen
 * carga la escena activa (state.currentScene) y renderiza sus elementos.
 *
 * Escenas:
 *   - river_shore (Escena 01): orilla del río. Acay despierta, rocas en el
 *     cauce, salida izquierda (bloqueada) y salida derecha (→ campamento).
 *   - campamento (Escena 02): campamento del gaucho. Gaucho dormido, pava,
 *     maderas, cenizas, río. Scaffold — interacciones detalladas en 2.1-2.3.
 */

/** Posición inicial de Acay al entrar a cada escena. */
export const ACAY_ENTER_POS: Record<SceneId, { x: number; y: number }> = {
  river_shore: { x: 500, y: 630 },
  campamento: { x: 100, y: 630 }, // entra desde la izquierda
}

/** Asset del fondo de cada escena. */
export const SCENE_BACKGROUND: Record<SceneId, string> = {
  river_shore: 'scene.river_shore',
  campamento: 'scene.campamento_background',
}

/** Factory: construye los elementos de la escena activa (lazy, t() resuelve). */
export function buildSceneElements(sceneId: string): NarrativeElement[] {
  if (sceneId === 'campamento') return buildCampamentoElements()
  return buildRiverShoreElements()
}

/* ────────────────────── Escena 01: River Shore ────────────────────── */

function buildRiverShoreElements(): NarrativeElement[] {
  return [
    // ─── Acay (protagonista, especial: manejado por ExploreScreen) ───
    {
      id: 'acay',
      asset: 'acay.unconscious',
      x: 500, y: 630, scale: 1.0,
      hitW: 140, hitH: 80,
      label: t('scene01.acay_label'),
      hoverText: t('scene01.acay_unconscious_hover'),
      inspectText: t('scene01.acay_unconscious_hover'),
      isCharacter: true,
    },
    // ─── Rocas atrapadas en el cauce (1.3 + 4.1: useItem=vara) ───
    // Tras questGauchoCompleted: acepta Vara de Hierro (useItem).
    // Tras usar Vara: hideFlag=rocksPushed (roca cae al río).
    {
      id: 'rocks',
      asset: 'scene.rocks_in_river',
      x: 640, y: 430, scale: 1.0,
      hitW: 180, hitH: 100,
      walkToX: 580,
      label: t('scene01.rocks_label'),
      hoverText: t('scene01.rocks_hover'),
      inspectText: t('scene01.rocks_inspect'),
      isCharacter: false,
      hideFlag: 'rocksPushed',
      useItem: 'vara',
      useItemText: t('scene04.vara_use'),
      useItemFlag: 'rocksPushed',
    },
    // ─── Roca inestable (4.1: aparece tras rocksPushed, useItem=maderas) ───
    {
      id: 'unstable_rock',
      asset: 'scene.unstable_rock',
      x: 640, y: 450, scale: 1.0,
      hitW: 120, hitH: 80,
      walkToX: 580,
      label: t('scene04.unstable_rock_label'),
      hoverText: t('scene04.unstable_rock_hover'),
      inspectText: t('scene04.unstable_rock_inspect'),
      isCharacter: false,
      appearsAfterFlag: 'rocksPushed',
      hideFlag: 'bridgeBuilt',
      useItem: 'wood',
      useItemText: t('scene04.wood_use'),
      useItemFlag: 'bridgeBuilt',
    },
    // ─── Puente de maderas (4.1: aparece tras bridgeBuilt → cruzar, 4.2) ───
    {
      id: 'wood_bridge',
      asset: 'scene.wood_bridge',
      x: 640, y: 440, scale: 1.0,
      hitW: 200, hitH: 60,
      walkToX: 580,
      label: t('scene04.bridge_label'),
      hoverText: t('scene04.bridge_hover'),
      inspectText: t('scene04.bridge_inspect'),
      isCharacter: false,
      appearsAfterFlag: 'bridgeBuilt',
    },
    // ─── Salida izquierda (regresar — bloqueada, 1.3) ───
    {
      id: 'left_exit',
      asset: '', // sin sprite (exit hotspot)
      x: 60, y: 500, scale: 1.0,
      hitW: 120, hitH: 400,
      walkToX: 120,
      label: t('scene01.left_exit_label'),
      hoverText: t('scene01.left_exit_hover'),
      inspectText: '',
      isCharacter: false,
      isExit: true,
      exitTargetScene: '', // vacío = bloqueada
    },
    // ─── Salida derecha (→ campamento, CON CONDICIONES) ───
    {
      id: 'right_exit',
      asset: '',
      x: 1220, y: 500, scale: 1.0,
      hitW: 120, hitH: 400,
      walkToX: 1160,
      label: t('scene01.right_exit_label'),
      hoverText: t('scene01.right_exit_hover'),
      inspectText: '',
      isCharacter: false,
      isExit: true,
      exitTargetScene: 'campamento',
      conditions: buildRiverShoreRightExitConditions(),
    },
  ]
}

/* ────────────────────── Escena 02: Campamento (scaffold) ────────────────────── */

function buildCampamentoElements(): NarrativeElement[] {
  return [
    // ─── Acay ───
    {
      id: 'acay',
      asset: 'acay.stand_front',
      x: 100, y: 630, scale: 1.0,
      hitW: 100, hitH: 170,
      label: t('scene01.acay_label'),
      hoverText: '',
      inspectText: '',
      isCharacter: true,
    },
    // ─── Río (2.1: inspect, long/short dialogue) ───
    {
      id: 'river_02',
      asset: '',
      x: 300, y: 420, scale: 1.0,
      hitW: 400, hitH: 120,
      walkToX: 280,
      label: t('scene02.river_label'),
      hoverText: t('scene02.river_hover'),
      inspectText: t('scene02.river_inspect_short'),
      isCharacter: false,
    },
    // ─── Gaucho dormido (2.2: click → despierta + dialogue con pausas) ───
    {
      id: 'gaucho',
      asset: 'prop.gaucho_sleeping',
      x: 850, y: 600, scale: 1.0,
      hitW: 140, hitH: 140,
      walkToX: 720,
      label: t('scene02.gaucho_label'),
      hoverText: t('scene02.gaucho_hover'),
      inspectText: t('scene02.gaucho_sleeping'),
      isCharacter: true,
      dialogue: buildGauchoDialogue(),
      // altAsset: tras click, cambia a gaucho_awake (despierto, hablando)
      altAsset: { flag: 'gauchoAwake', asset: 'prop.gaucho_awake' },
      // Diálogo condicional: si el jugador vuelve tras haber hablado + usado
      // la vara (rocksPushed) pero sin tener maderas → "¿Te olvidaste?"
      dialogueConditions: [
        {
          flag: 'rocksPushed',
          notFlag: 'woodTaken',
          dialogue: [
            { speaker: t('scene02.gaucho_speaker'), text: t('scene02.gaucho_return') },
          ],
        },
      ],
    },
    // ─── Cardón (decorativo) ───
    {
      id: 'cardon',
      asset: 'prop.cardon',
      x: 920, y: 580, scale: 0.9,
      hitW: 80, hitH: 200,
      walkToX: 760,
      label: t('scene02.cardon_label'),
      hoverText: t('scene02.cardon_hover'),
      inspectText: t('scene02.cardon_inspect'),
      isCharacter: false,
    },
    // ─── Pava (2.3: blocked hasta diálogo gaucho; pickup multi-speaker) ───
    {
      id: 'kettle',
      asset: 'prop.kettle',
      x: 500, y: 660, scale: 1.0,
      hitW: 60, hitH: 60,
      walkToX: 440,
      label: t('scene02.kettle_label'),
      hoverText: t('scene02.kettle_hover'),
      inspectText: t('scene02.kettle_inspect'),
      isCharacter: false,
      blocked: true, // dinámico: desbloquea cuando flags.gauchoDialogueDone
      blockedText: t('scene02.blocked_gaucho'),
      hideFlag: 'kettleTaken',
      pickup: {
        itemId: 'pava',
        label: t('scene02.kettle_label'),
        icon: 'ui.item_pava',
        description: t('scene02.kettle_desc'),
        pickupText: t('scene02.kettle_acay'),
      },
    },
    // ─── Maderas (2.3: blocked hasta diálogo gaucho; pickup multi-speaker) ───
    {
      id: 'wood',
      asset: 'prop.wood_pile',
      x: 620, y: 665, scale: 1.0,
      hitW: 90, hitH: 50,
      walkToX: 560,
      label: t('scene02.wood_label'),
      hoverText: t('scene02.wood_hover'),
      inspectText: t('scene02.wood_inspect'),
      isCharacter: false,
      blocked: true,
      blockedText: t('scene02.blocked_gaucho'),
      hideFlag: 'woodTaken',
      pickup: {
        itemId: 'wood',
        label: t('scene02.wood_label'),
        icon: 'ui.item_wood',
        description: t('scene02.wood_desc'),
        pickupText: t('scene02.wood_acay'),
      },
    },
    // ─── Cenizas / fogata (blocked hasta diálogo gaucho) ───
    {
      id: 'ashes',
      asset: 'prop.firepit_ashes',
      x: 720, y: 670, scale: 1.0,
      hitW: 80, hitH: 40,
      walkToX: 660,
      label: t('scene02.ashes_label'),
      hoverText: t('scene02.ashes_hover'),
      inspectText: t('scene02.ashes_inspect'),
      isCharacter: false,
      blocked: true,
      blockedText: t('scene02.blocked_gaucho'),
    },
    // ─── Salida izquierda (→ river_shore, CON CONDICIONES) ───
    // Condiciones evaluadas en orden: la primera que coincide determina la acción.
    // Data-driven: el ExploreScreen consume conditions, no ifs hardcoded.
    {
      id: 'left_exit',
      asset: '',
      x: 60, y: 500, scale: 1.0,
      hitW: 120, hitH: 400,
      walkToX: 120,
      label: t('scene01.left_exit_label'),
      hoverText: t('scene01.left_exit_hover'),
      inspectText: '',
      isCharacter: false,
      isExit: true,
      exitTargetScene: 'river_shore',
      conditions: buildCampamentoLeftExitConditions(),
    },
    // ─── Salida derecha (CON CONDICIONES) ───
    {
      id: 'right_exit',
      asset: '',
      x: 1220, y: 500, scale: 1.0,
      hitW: 120, hitH: 400,
      walkToX: 1160,
      label: t('scene01.right_exit_label'),
      hoverText: t('scene01.right_exit_hover'),
      inspectText: '',
      isCharacter: false,
      isExit: true,
      exitTargetScene: '',
      conditions: buildCampamentoRightExitConditions(),
    },
  ]
}

/**
 * Diálogo del gaucho (2.2) con pausa dramática en "Hmmm..." (0.8s).
 * Al terminar: desbloquea kettle/wood/ashes (flags.gauchoDialogueDone).
 */
function buildGauchoDialogue(): DialogueLine[] {
  const g = t('scene02.gaucho_speaker')
  return [
    { speaker: g, text: t('scene02.gaucho_l1') },
    { speaker: g, text: t('scene02.gaucho_l2'), waitSec: 0.8 },
    { speaker: g, text: t('scene02.gaucho_l3') },
    { speaker: g, text: t('scene02.gaucho_l4') },
  ]
}

/* ────────────────────── Condiciones data-driven de exits ────────────────────── */

/**
 * Condiciones del exit izquierdo del campamento (→ river_shore).
 * Evaluadas en orden: la primera que coincide determina la acción.
 *
 * 1. No habló con el gaucho → bloqueado ("No debería irme sin hablar con el gaucho.")
 * 2. No hizo tutorial → gaucho lo detiene (3.1: stop dialogue → tutorial coop)
 * 3. No completó quest → gaucho lo detiene (3.2: warning → battle turn-based)
 * 4. Quest completada → transición a river_shore
 */
function buildCampamentoLeftExitConditions(): ExitCondition[] {
  const g = t('scene02.gaucho_speaker')
  return [
    {
      notFlag: 'gauchoDialogueDone',
      action: 'blocked',
      blockedText: t('scene02.exit_blocked_no_gaucho'),
    },
    {
      notFlag: 'tutorialComplete',
      action: 'dialogue',
      owner: 'gaucho_stop',
      dialogue: [
        { speaker: g, text: t('scene02.gaucho_stop_1') },
        { speaker: t('scene01.acay_label'), text: '…', isAcay: true },
        { speaker: g, text: t('scene02.gaucho_stop_3') },
      ],
    },
    {
      notFlag: 'questGauchoCompleted',
      action: 'dialogue',
      owner: 'trigger:gaucho_warning',
      dialogue: [
        { speaker: g, text: t('scene02.gaucho_warning') },
        { speaker: 'Duende', text: t('scene02.duende_intro') },
      ],
    },
    {
      flag: 'questGauchoCompleted',
      action: 'transition',
      targetScene: 'river_shore',
    },
  ]
}

/**
 * Condiciones del exit derecho del campamento.
 * Mismas condiciones 1-3 que el izquierdo. Tras quest completada → bloqueado
 * (el río está al otro lado, debe volver y cruzar por river_shore).
 */
function buildCampamentoRightExitConditions(): ExitCondition[] {
  const g = t('scene02.gaucho_speaker')
  return [
    {
      notFlag: 'gauchoDialogueDone',
      action: 'blocked',
      blockedText: t('scene02.exit_blocked_right_no_gaucho'),
    },
    {
      notFlag: 'tutorialComplete',
      action: 'dialogue',
      owner: 'gaucho_stop',
      dialogue: [
        { speaker: g, text: t('scene02.gaucho_stop_1') },
        { speaker: t('scene01.acay_label'), text: '…', isAcay: true },
        { speaker: g, text: t('scene02.gaucho_stop_3') },
      ],
    },
    {
      notFlag: 'questGauchoCompleted',
      action: 'dialogue',
      owner: 'trigger:gaucho_warning',
      dialogue: [
        { speaker: g, text: t('scene02.gaucho_warning') },
        { speaker: 'Duende', text: t('scene02.duende_intro') },
      ],
    },
    {
      flag: 'questGauchoCompleted',
      action: 'blocked',
      blockedText: t('scene02.exit_blocked_quest_done_right'),
    },
  ]
}

/**
 * Condiciones del exit derecho de river_shore (→ campamento).
 * Tras questGauchoCompleted: bloqueado con hints hacia el cruce (Escena 04).
 */
function buildRiverShoreRightExitConditions(): ExitCondition[] {
  return [
    {
      notFlag: 'questGauchoCompleted',
      action: 'transition',
      targetScene: 'campamento',
    },
    {
      notFlag: 'rocksPushed',
      action: 'blocked',
      blockedText: t('scene04.exit_right_no_rocks'),
    },
    {
      notFlag: 'bridgeBuilt',
      action: 'transition',
      targetScene: 'campamento',
    },
    {
      flag: 'bridgeBuilt',
      action: 'blocked',
      blockedText: t('scene04.exit_right_bridge_ready'),
    },
  ]
}

/** Antagonistas disponibles para batallas rítmicas. */
export const ANTAGONISTS: Record<string, { name: string; asset: string }> = {
  ucumar: { name: 'Ucumar', asset: 'ant.ucumar' },
  shadow: { name: 'Sombra', asset: 'ant.shadow' },
  duende: { name: 'Duende', asset: 'ant.duende' },
}
