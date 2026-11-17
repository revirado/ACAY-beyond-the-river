import type { NarrativeElement, DialogueLine } from '@/game-next/core/types'
import { t } from '@/engine/i18n'

/**
 * Datos de la escena de exploración POV (Acto I — ribera del río).
 *
 * Layout declarativo de elementos narrativos interactivos. El diseñador
 * modifica x / y / scale / hitW / hitH sin tocar lógica.
 *
 * Coordenadas en espacio virtual 1280×720. Ancla por defecto: bottom-center.
 * Los elementos están en la franja de tierra frontal (y > 540).
 */
export function buildSceneElements(): NarrativeElement[] {
  return [
    {
      id: 'rock_1',
      asset: 'narrative.rock',
      x: 280, y: 600, scale: 1.1,
      hitW: 90, hitH: 70,
      label: t('narrative.rock_label'),
      hoverText: t('narrative.rock_hover'),
      inspectText: t('narrative.rock_inspect'),
      isCharacter: false,
    },
    {
      id: 'tree_1',
      asset: 'narrative.tree',
      x: 980, y: 580, scale: 1.0,
      hitW: 100, hitH: 160,
      label: t('narrative.tree_label'),
      hoverText: t('narrative.tree_hover'),
      inspectText: t('narrative.tree_inspect'),
      isCharacter: false,
    },
    {
      id: 'ruin_1',
      asset: 'narrative.ruin',
      x: 620, y: 560, scale: 1.0,
      hitW: 150, hitH: 120,
      label: t('narrative.ruin_label'),
      hoverText: t('narrative.ruin_hover'),
      inspectText: t('narrative.ruin_inspect'),
      isCharacter: false,
    },
    {
      id: 'coquena_1',
      asset: 'narrative.coquena',
      x: 820, y: 590, scale: 1.1,
      hitW: 120, hitH: 160,
      label: t('narrative.coquena_label'),
      hoverText: t('narrative.coquena_hover'),
      inspectText: t('narrative.coquena_inspect'),
      isCharacter: true,
      dialogue: buildCoquenaDialogue(),
      // Coquena NO triggers battle (es aliado). Otros personajes sí.
    },
    {
      id: 'ucumar_1',
      asset: 'ant.ucumar',
      x: 460, y: 580, scale: 0.85,
      hitW: 130, hitH: 200,
      label: t('narrative.ucumar_label'),
      hoverText: t('narrative.ucumar_hover'),
      inspectText: t('narrative.ucumar_inspect'),
      isCharacter: true,
      triggersBattle: 'ucumar',
    },
    {
      id: 'guitar_find',
      asset: 'narrative.guitar',
      x: 180, y: 660, scale: 1.0,
      hitW: 80, hitH: 100,
      label: t('narrative.guitar_label'),
      hoverText: t('narrative.guitar_hover'),
      inspectText: t('narrative.guitar_inspect_have'),
      isCharacter: false,
      pickup: {
        itemId: 'guitar',
        label: t('items.guitar_cap'),
        icon: 'ui.item_guitar',
        description: t('narrative.guitar_desc'),
        pickupText: t('narrative.guitar_pickup'),
      },
    },
    {
      id: 'relic_find',
      asset: 'narrative.relic',
      x: 1120, y: 670, scale: 1.0,
      hitW: 60, hitH: 70,
      label: t('narrative.relic_label'),
      hoverText: t('narrative.relic_hover'),
      inspectText: t('narrative.relic_inspect_have'),
      isCharacter: false,
      pickup: {
        itemId: 'relic',
        label: t('items.relic_cap'),
        icon: 'ui.item_relic',
        description: t('narrative.relic_desc'),
        pickupText: t('narrative.relic_pickup'),
      },
    },
  ]
}

/** Diálogo de Coquena (saludo inicial). Acay balbucea (isAcay). */
function buildCoquenaDialogue(): DialogueLine[] {
  return [
    { speaker: t('dialogues.coquena_greeting.speaker_coquena'), text: t('dialogues.coquena_greeting.l1_coquena') },
    { speaker: t('dialogues.coquena_greeting.speaker_acay'), text: t('dialogues.coquena_greeting.l2_acay'), isAcay: true },
    { speaker: t('dialogues.coquena_greeting.speaker_coquena'), text: t('dialogues.coquena_greeting.l3_coquena') },
    { speaker: t('dialogues.coquena_greeting.speaker_acay'), text: t('dialogues.coquena_greeting.l4_acay'), isAcay: true },
    { speaker: t('dialogues.coquena_greeting.speaker_coquena'), text: t('dialogues.coquena_greeting.l5_coquena') },
  ]
}

/** Antagonistas disponibles para batallas rítmicas. */
export const ANTAGONISTS: Record<string, { name: string; asset: string }> = {
  ucumar: { name: 'Ucumar', asset: 'ant.ucumar' },
  shadow: { name: 'Sombra', asset: 'ant.shadow' },
}
