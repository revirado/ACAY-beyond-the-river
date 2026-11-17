import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from '@/engine/core/config'
import type { ScreenContext } from '@/engine/core/context'
import type { Renderer } from '@/engine/render/Renderer'
import type { GameScreen } from '@/engine/core/ScreenManager'
import type { AcayGameState } from '@/game-next/state/gameState'
import type { NarrativeElement, DialogueLine } from '@/game-next/core/types'
import { CONFIG, PALETTE } from '@/game-next/core/config'
import { CONTROLS, wasAnyPressed } from '@/game-next/core/controls'
import { buildSceneElements, ANTAGONISTS } from '@/game-next/data/scene'
import { buildDialogueTriggers, evaluateTriggers, newTriggerEvalState, type DialogueTrigger, type TriggerEvalState } from '@/game-next/core/triggers'
import { t, getLocale } from '@/engine/i18n'

/**
 * ExploreScreen — modo exploración POV (point & click).
 *
 * - Renderiza el fondo de la ribera + elementos narrativos (y-sorted).
 * - Puntero customizado: sigue al mouse (coords virtuales via InputManager).
 * - Hover sobre un elemento → highlight + tooltip con label.
 * - Clic:
 *   - Si hay diálogo activo → avanza la línea (o cierra si es la última).
 *   - Si el elemento es personaje con triggersBattle → switch a rhythm-battle.
 *   - Si el elemento es personaje → inicia conversación (caja de diálogo se expande).
 *   - Si no → revela narración (inspección) en la caja de diálogo.
 * - ESC: cierra el diálogo activo.
 */
export class ExploreScreen implements GameScreen<'explore', AcayGameState> {
  readonly id = 'explore' as const

  private elements: NarrativeElement[] = []
  private triggers: DialogueTrigger[] = []
  private prevHoveredId: string | null = null
  /** Locale con el que se construyeron elements/triggers (para detectar cambio). */
  private builtLocale = ''
  /** Estado de evaluación de triggers de diálogo (timers por trigger). */
  private triggerEval: TriggerEvalState = newTriggerEvalState()

  enter(ctx: ScreenContext<AcayGameState>): void {
    this.rebuildForLocale()
    ctx.state.hoveredElementId = null
    this.prevHoveredId = null
    this.triggerEval = newTriggerEvalState()
    ctx.syncUI()
  }

  /** Reconstruye elements + triggers con el locale actual (t() resuelve). */
  private rebuildForLocale(): void {
    this.elements = buildSceneElements()
    this.triggers = buildDialogueTriggers()
    this.builtLocale = getLocale()
  }

  exit(ctx: ScreenContext<AcayGameState>): void {
    ctx.state.hoveredElementId = null
    this.prevHoveredId = null
  }

  update(dt: number, ctx: ScreenContext<AcayGameState>): void {
    void dt
    const st = ctx.state
    const input = ctx.input

    // ── Detectar cambio de idioma → reconstruir elements + triggers ──
    // (test de centralización de textos: al switchear ES/EN, todos los
    // labels/hover/inspect/dialogues se re-resuelven con el nuevo locale.)
    const curLocale = getLocale()
    if (curLocale !== this.builtLocale) {
      this.rebuildForLocale()
      // Reset hover para que el tooltip use los textos nuevos
      this.prevHoveredId = null
      st.hoveredElementId = null
      ctx.syncUI()
    }

    // ── Triggers de diálogo auto-iniciados (La Pacha, etc.) ──
    const trigger = evaluateTriggers(this.triggers, this.triggerEval, {
      currentSceneId: this.id,
      inventoryCount: st.inventory.length,
      flags: st.flags,
      hasActiveDialogue: !!st.currentDialogue,
      now: performance.now(),
    })
    if (trigger) {
      st.currentDialogue = trigger.dialogue
      st.dialogueIndex = 0
      st.dialoguePhase = trigger.phase
      if (trigger.once) st.flags[`trigger:${trigger.id}`] = true
      ctx.syncUI()
      return // el diálogo arranca; no procesar hover/clic este frame
    }

    // ── Hover detection: elemento bajo el puntero ──
    const ptr = input.getPointerPos()
    let hovered: NarrativeElement | null = null
    if (ptr && !st.currentDialogue) {
      // Solo hover si no hay diálogo activo (el cursor está "ocupado")
      for (const el of this.elements) {
        const scale = el.scale ?? 1
        const hw = (el.hitW ?? 80) * scale
        const hh = (el.hitH ?? 100) * scale
        // Hit area: rect centrado en (el.x, el.y - hh/2) — base en el.y
        if (
          ptr.x >= el.x - hw / 2 && ptr.x <= el.x + hw / 2 &&
          ptr.y >= el.y - hh && ptr.y <= el.y
        ) {
          hovered = el
          break
        }
      }
    }
    const hoveredId = hovered?.id ?? null
    if (hoveredId !== this.prevHoveredId) {
      st.hoveredElementId = hoveredId
      this.prevHoveredId = hoveredId
      ctx.syncUI()
    }

    // ── Clic ──
    const click = input.consumeClick()
    if (click) {
      if (st.currentDialogue) {
        // Diálogo activo: avanza línea o cierra
        if (st.dialogueIndex < st.currentDialogue.length - 1) {
          st.dialogueIndex++
          ctx.syncUI()
        } else {
          // Última línea → cerrar
          st.currentDialogue = null
          st.dialogueIndex = 0
          st.dialoguePhase = 'idle'
          ctx.syncUI()
        }
      } else if (hovered) {
        // Clic en elemento (sin diálogo)
        if (hovered.isCharacter && hovered.triggersBattle) {
          // Inicia batalla rítmica
          ctx.screens.requestSwitch('rhythm-battle', { antagonistId: hovered.triggersBattle }, CONFIG.fade.normal)
        } else if (hovered.isCharacter && hovered.dialogue) {
          // Inicia conversación
          st.currentDialogue = hovered.dialogue
          st.dialogueIndex = 0
          st.dialoguePhase = 'conversation'
          ctx.syncUI()
        } else if (hovered.pickup) {
          // Elemento pickup: recoge item si no lo tiene, si no inspección normal
          if (!st.hasItem(hovered.pickup.itemId)) {
            st.addItem({
              id: hovered.pickup.itemId,
              label: hovered.pickup.label,
              icon: hovered.pickup.icon,
              description: hovered.pickup.description,
            })
            st.currentDialogue = [
              { speaker: hovered.label, text: hovered.pickup.pickupText },
            ]
          } else {
            // Ya lo tiene → inspección normal
            st.currentDialogue = [
              { speaker: hovered.label, text: hovered.inspectText },
            ]
          }
          st.dialogueIndex = 0
          st.dialoguePhase = 'narration'
          ctx.syncUI()
        } else {
          // Inspección (narración de una sola línea)
          st.currentDialogue = [
            { speaker: hovered.label, text: hovered.inspectText },
          ]
          st.dialogueIndex = 0
          st.dialoguePhase = 'narration'
          ctx.syncUI()
        }
      }
    }

    // ── Cancel (ESC): cierra diálogo ──
    if (wasAnyPressed(input, CONTROLS.cancel) && st.currentDialogue) {
      st.currentDialogue = null
      st.dialogueIndex = 0
      st.dialoguePhase = 'idle'
      ctx.syncUI()
    }
  }

  render(renderer: Renderer, ctx: ScreenContext<AcayGameState>): void {
    const st = ctx.state

    // Fondo de la ribera
    renderer.image(ctx.assets.get('scene.river_shore'), VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, {
      anchor: 'center',
    })

    // Elementos narrativos (y-sorted por profundidad)
    const drawables = this.elements.map((el) => ({
      y: el.y,
      draw: () => this.drawElement(renderer, ctx, el),
    }))
    drawables.sort((a, b) => a.y - b.y)
    for (const d of drawables) d.draw()

    // Tooltip de hover (label del elemento)
    const hovered = st.hoveredElementId ? this.elements.find((e) => e.id === st.hoveredElementId) : null
    if (hovered) {
      const bounce = Math.sin(ctx.time * 5) * 2
      const py = hovered.y - (hovered.hitH ?? 100) * (hovered.scale ?? 1) - 16 + bounce
      const label = hovered.label
      const w = renderer.textWidth(label, { size: 18, weight: 'bold' }) + 28
      renderer.roundRect(hovered.x - w / 2, py - 26, w, 34, 17, 'rgba(243,227,194,0.95)')
      renderer.text(label, hovered.x, py - 9, {
        size: 18,
        weight: 'bold',
        color: PALETTE.tinta,
        align: 'center',
        baseline: 'middle',
        font: 'serif',
      })
    }

    // Puntero customizado: ahora es React overlay (CustomCursor) para que
    // quede por encima de diálogos/inventario. No se dibuja en canvas.

    // Hint sutil (esquina sup-izq) — solo si no hay diálogo ni hover
    if (!st.currentDialogue && !hovered) {
      renderer.text(t('explore.hint'), 20, 28, {
        size: 14,
        color: 'rgba(243,227,194,0.6)',
        align: 'left',
        baseline: 'alphabetic',
      })
    }

    renderer.vignette(0.2)
  }

  /** Dibuja un elemento narrativo con highlight de hover. */
  private drawElement(renderer: Renderer, ctx: ScreenContext<AcayGameState>, el: NarrativeElement): void {
    const st = ctx.state
    const isHovered = st.hoveredElementId === el.id
    const scale = el.scale ?? 1

    // Highlight de hover (resplandor detrás del sprite)
    if (isHovered) {
      const hw = (el.hitW ?? 80) * scale
      const hh = (el.hitH ?? 100) * scale
      renderer.roundRect(
        el.x - hw / 2 - 6, el.y - hh - 6,
        hw + 12, hh + 12, 12,
        CONFIG.explore.hoverHighlight,
      )
    }

    renderer.image(ctx.assets.get(el.asset), el.x, el.y, { scale })
  }

}

