import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from '@/engine/core/config'
import type { ScreenContext } from '@/engine/core/context'
import type { Renderer } from '@/engine/render/Renderer'
import type { GameScreen } from '@/engine/core/ScreenManager'
import type { AcayGameState } from '@/game-next/state/gameState'
import type { NarrativeElement } from '@/game-next/core/types'
import { CONFIG, PALETTE } from '@/game-next/core/config'
import { CONTROLS, wasAnyPressed } from '@/game-next/core/controls'
import { buildSceneElements, ANTAGONISTS, ACAY_ENTER_POS, SCENE_BACKGROUND } from '@/game-next/data/scene'
import { buildDialogueTriggers, evaluateTriggers, newTriggerEvalState, type DialogueTrigger, type TriggerEvalState } from '@/game-next/core/triggers'
import { t, getLocale } from '@/engine/i18n'
import { evalAnim, phaseFromId } from '@/engine/render/anim'

/**
 * ExploreScreen — modo exploración POV (point & click) con movimiento de Acay.
 *
 * SISTEMA DE ESCENAS:
 *   - state.currentScene determina qué escena se carga (river_shore | campamento).
 *   - Cada escena tiene sus elementos (buildSceneElements(sceneId)).
 *   - Transición: fade-out → cambiar escena → fade-in.
 *
 * MOVIMIENTO DE ACAY (MoveTo):
 *   - Clic en hotspot → Acay camina hacia walkToX → ejecuta acción (diálogo,
 *     inspección, pickup, exit, etc.).
 *   - Durante el caminado, hover/clic deshabilitados.
 *
 * FLUJO 1.1-1.3 (Escena 01: River Shore):
 *   1. Fade-in desde negro. UI oculta. Acay inconsciente.
 *   2. Clic Acay → incorporación → diálogo → UI desbloqueada.
 *   3. Clic rocas → camina → "Si pudiera tirar esta roca..." → objetivo actualizado.
 *   4. Clic izquierda → camina → diálogo según contador (bloqueada).
 *   5. Clic derecha → camina → fade-out → Escena 02 (campamento).
 *
 * ESCENA 02 (Campamento — scaffold):
 *   - Gaucho dormido, pava, maderas, cenizas, río, cardón.
 *   - Pava/maderas/cenizas bloqueadas hasta diálogo con gaucho (2.2 futuro).
 *   - Río inspeccionable (diálogo largo 1ra vez, corto después).
 */
type AcayState = 'unconscious' | 'standing_up' | 'awake'
type FadeDir = 'in' | 'out' | null

export class ExploreScreen implements GameScreen<'explore', AcayGameState> {
  readonly id = 'explore' as const

  private elements: NarrativeElement[] = []
  private triggers: DialogueTrigger[] = []
  private prevHoveredId: string | null = null
  private builtLocale = ''
  private triggerEval: TriggerEvalState = newTriggerEvalState()

  private acayState: AcayState = 'unconscious'
  private standUpUntilMs = 0
  private enterMs = 0

  /** Sistema de fade (0=visible, 1=negro). */
  private fadeAlpha = 1
  private fadeDir: FadeDir = 'in'
  /** Escena pendiente de cargar (cuando fadeAlpha llega a 1). */
  private pendingScene: string | null = null

  /** Movimiento de Acay. */
  private acayX = 500
  private acayTargetX: number | null = null
  private pendingAction: (() => void) | null = null
  private facing: 1 | -1 = 1
  /** Owner del diálogo activo (para detectar fin de diálogo del gaucho). */
  private _dialogueOwner: string | null = null

  enter(ctx: ScreenContext<AcayGameState>): void {
    this.loadScene(ctx, ctx.state.currentScene)
    this.acayState = ctx.state.flags.acayAwakened ? 'awake' : 'unconscious'
    // Si el título no se mostró aún, la TitleOverlay maneja el fade visual.
    // El ExploreScreen no hace fade-in (fadeAlpha=0) para que la escena se vea
    // debajo del overlay desde el principio.
    if (ctx.state.flags.titleShown) {
      this.fadeAlpha = 1
      this.fadeDir = 'in'
      this.enterMs = performance.now()
    } else {
      this.fadeAlpha = 0
      this.fadeDir = null
    }
    this.pendingScene = null
    ctx.syncUI()
  }

  /** Carga los elementos de una escena + resetea Acay. */
  private loadScene(ctx: ScreenContext<AcayGameState>, sceneId: string): void {
    this.rebuildForLocale(sceneId)
    ctx.state.hoveredElementId = null
    this.prevHoveredId = null
    this.triggerEval = newTriggerEvalState()
    const pos = ACAY_ENTER_POS[sceneId as 'river_shore' | 'campamento'] ?? { x: 500, y: 630 }
    this.acayX = pos.x
    this.acayTargetX = null
    this.pendingAction = null
    this.facing = 1
  }

  private rebuildForLocale(sceneId?: string): void {
    const sid = sceneId ?? this.elements.length > 0 ? this.currentSceneId() : 'river_shore'
    this.elements = buildSceneElements(sid)
    this.triggers = buildDialogueTriggers()
    this.builtLocale = getLocale()
  }

  private currentSceneId(): string {
    // Hack: can't access state here without ctx. Stored externally.
    return this._sceneId ?? 'river_shore'
  }
  private _sceneId = 'river_shore'

  exit(ctx: ScreenContext<AcayGameState>): void {
    ctx.state.hoveredElementId = null
    this.prevHoveredId = null
  }

  update(dt: number, ctx: ScreenContext<AcayGameState>): void {
    const st = ctx.state
    const input = ctx.input

    // ── Si el título está activo (!titleShown), deshabilitar interacción ──
    // El jugador no puede hacer hover/click hasta que la TitleOverlay termine.
    if (!st.flags.titleShown) {
      // Consumar clicks para que no se acumulen durante el título
      input.consumeClick()
      return
    }

    // ── Detectar cambio de idioma → reconstruir ──
    const curLocale = getLocale()
    if (curLocale !== this.builtLocale) {
      this.rebuildForLocale(this._sceneId)
      this.prevHoveredId = null
      st.hoveredElementId = null
      ctx.syncUI()
    }

    // ── Sistema de fade ──
    if (this.fadeDir === 'in') {
      const elapsed = (performance.now() - this.enterMs) / 1000
      const dur = CONFIG.explore.introFadeInMs / 1000
      this.fadeAlpha = Math.max(0, 1 - elapsed / dur)
      if (this.fadeAlpha <= 0) { this.fadeDir = null; ctx.syncUI() }
    } else if (this.fadeDir === 'out') {
      this.fadeAlpha = Math.min(1, this.fadeAlpha + dt / (CONFIG.explore.introFadeInMs / 1000))
      if (this.fadeAlpha >= 1) {
        // Fade completo → cambiar escena si hay pendiente
        if (this.pendingScene) {
          this._sceneId = this.pendingScene
          st.currentScene = this.pendingScene
          this.loadScene(ctx, this.pendingScene)
          this.pendingScene = null
          this.fadeDir = 'in'
          this.enterMs = performance.now()
          ctx.syncUI()
        }
      }
    }

    // ── Animación de incorporación: standing_up → awake ──
    if (this.acayState === 'standing_up' && performance.now() >= this.standUpUntilMs) {
      this.acayState = 'awake'
      st.flags.acayAwakened = true
      st.currentDialogue = [
        { speaker: t('scene01.acay_label'), text: t('scene01.acay_line'), isAcay: true },
      ]
      st.dialogueIndex = 0
      st.dialoguePhase = 'conversation'
      ctx.syncUI()
      return
    }

    // ── Movimiento de Acay (walk to target) ──
    if (this.acayTargetX !== null) {
      const target = this.acayTargetX
      const speed = CONFIG.explore.walkSpeed
      const dx = target - this.acayX
      const dist = Math.abs(dx)
      if (dist < CONFIG.explore.walkArriveDist) {
        // Llegó
        this.acayX = target
        this.acayTargetX = null
        const action = this.pendingAction
        this.pendingAction = null
        if (action) action()
        ctx.syncUI()
        return
      } else {
        const move = Math.min(dist, speed * dt)
        this.acayX += Math.sign(dx) * move
        this.facing = dx > 0 ? 1 : -1
      }
      return // mientras camina, no procesar hover/clic
    }

    // ── Triggers (en cualquier escena, solo tras despertar) ──
    if (this.acayState === 'awake' && this.fadeAlpha <= 0) {
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
        this._dialogueOwner = `trigger:${trigger.id}`
        ctx.syncUI()
        return
      }
    }

    // ── Hover detection ──
    const ptr = input.getPointerPos()
    let hovered: NarrativeElement | null = null
    if (ptr && !st.currentDialogue && this.fadeAlpha <= 0 && this.acayState === 'awake') {
      for (const el of this.elements) {
        if (el.id === 'acay') continue // Acay no es hoverable post-despertar
        // Ocultar elementos con hideFlag activo (ej. pickup ya recogido)
        if (el.hideFlag && st.flags[el.hideFlag]) continue
        // Mostrar elementos que aparecen solo tras un flag (ej. unstable_rock)
        if (el.appearsAfterFlag && !st.flags[el.appearsAfterFlag]) continue
        const scale = el.scale ?? 1
        const hw = (el.hitW ?? 80) * scale
        const hh = (el.hitH ?? 100) * scale
        if (
          ptr.x >= el.x - hw / 2 && ptr.x <= el.x + hw / 2 &&
          ptr.y >= el.y - hh && ptr.y <= el.y
        ) {
          hovered = el
          break
        }
      }
    }
    // Hover especial: Acay inconsciente
    if (ptr && !st.currentDialogue && this.fadeAlpha <= 0 && this.acayState === 'unconscious') {
      const acayEl = this.elements.find((e) => e.id === 'acay')
      if (acayEl) {
        const scale = acayEl.scale ?? 1
        const hw = (acayEl.hitW ?? 80) * scale
        const hh = (acayEl.hitH ?? 100) * scale
        if (
          ptr.x >= acayEl.x - hw / 2 && ptr.x <= acayEl.x + hw / 2 &&
          ptr.y >= acayEl.y - hh && ptr.y <= acayEl.y
        ) {
          hovered = acayEl
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
        // Diálogo activo: avanza o cierra
        if (st.dialogueIndex < st.currentDialogue.length - 1) {
          st.dialogueIndex++
          ctx.syncUI()
        } else {
          st.currentDialogue = null
          st.dialogueIndex = 0
          st.dialoguePhase = 'idle'
          // 1.2: tras cerrar diálogo del despertar → Acay gira + objetivo
          if (st.flags.acayAwakened && !st.flags.scene01AwakeningDone) {
            st.flags.scene01AwakeningDone = true
            st.objective = t('scene01.objective_cross_river')
          }
          // 2.2: tras cerrar diálogo del gaucho → desbloquear props
          if (this._dialogueOwner === 'gaucho' && !st.flags.gauchoDialogueDone) {
            st.flags.gauchoDialogueDone = true
          }
          // 3.1: tras cerrar diálogo del gaucho_stop → transición a tutorial coop
          if (this._dialogueOwner === 'gaucho_stop' && !st.flags.tutorialComplete) {
            ctx.screens.requestSwitch('rhythm-battle', { mode: 'tutorial', antagonistId: 'gaucho' }, CONFIG.fade.normal)
          }
          // 3.2: tras cerrar diálogo del gaucho_warning → transición a battle turn-based
          if (this._dialogueOwner === 'trigger:gaucho_warning' && !st.flags.questGauchoCompleted) {
            ctx.screens.requestSwitch('rhythm-battle', { mode: 'dodge', antagonistId: 'duende', turnBased: true }, CONFIG.fade.normal)
          }
          // 4.2: tras cerrar diálogo del cruce → fin de demo
          if (this._dialogueOwner === 'crossing') {
            st.flags.demoEnded = true
            ctx.syncUI()
          }
          this._dialogueOwner = null
          ctx.syncUI()
        }
      } else if (hovered) {
        // ── Click especial: Acay inconsciente → despertar ──
        if (hovered.id === 'acay' && this.acayState === 'unconscious') {
          this.acayState = 'standing_up'
          this.standUpUntilMs = performance.now() + CONFIG.explore.standUpMs
          st.hoveredElementId = null
          this.prevHoveredId = null
          ctx.syncUI()
          return
        }
        // ── Click normal: caminar hacia el elemento + ejecutar acción ──
        if (this.acayState !== 'awake') return
        const walkToX = hovered.walkToX ?? hovered.x
        this.startWalkTo(walkToX, () => this.interactElement(ctx, hovered))
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

  /** Inicia el caminado de Acay hacia targetX + acción al llegar. */
  private startWalkTo(targetX: number, action: () => void): void {
    this.acayTargetX = targetX
    this.pendingAction = action
  }

  /** Ejecuta la interacción con un elemento (tras caminar hasta él). */
  private interactElement(ctx: ScreenContext<AcayGameState>, el: NarrativeElement): void {
    const st = ctx.state

    // ── 4.1: Use-item mechanic ── Si hay un item seleccionado, intentar usarlo
    if (st.selectedItemId) {
      if (el.useItem && el.useItem === st.selectedItemId) {
        // Éxito: usar el item
        if (el.useItemFlag) st.flags[el.useItemFlag] = true
        st.removeItem(st.selectedItemId)
        st.currentDialogue = [
          { speaker: t('scene01.acay_label'), text: el.useItemText || '...', isAcay: true },
        ]
        st.dialogueIndex = 0
        st.dialoguePhase = 'conversation'
        st.selectedItemId = null
        ctx.syncUI()
        return
      } else {
        // Item incorrecto
        st.currentDialogue = [{ speaker: '', text: t('scene04.cant_use') }]
        st.dialogueIndex = 0
        st.dialoguePhase = 'narration'
        st.selectedItemId = null
        ctx.syncUI()
        return
      }
    }

    // ── 4.2: Cruce del puente → fin de demo ──
    if (el.id === 'wood_bridge') {
      st.currentDialogue = [
        { speaker: t('scene01.acay_label'), text: t('scene04.cross_line'), isAcay: true },
      ]
      st.dialogueIndex = 0
      st.dialoguePhase = 'conversation'
      this._dialogueOwner = 'crossing'
      ctx.syncUI()
      return
    }

    // Exit hotspot — data-driven: evalúa conditions en orden (primera coincidencia).
    // Si no hay conditions, usa el comportamiento fallback (exitTargetScene o contador).
    if (el.isExit) {
      if (el.conditions && el.conditions.length > 0) {
        for (const cond of el.conditions) {
          const flagOk = cond.flag ? !!st.flags[cond.flag] : true
          const notFlagOk = cond.notFlag ? !st.flags[cond.notFlag] : true
          if (flagOk && notFlagOk) {
            // Condición coincide → ejecutar acción
            if (cond.action === 'transition' && cond.targetScene) {
              this.pendingScene = cond.targetScene
              this.fadeDir = 'out'
            } else if (cond.action === 'dialogue' && cond.dialogue) {
              st.currentDialogue = cond.dialogue
              st.dialogueIndex = 0
              st.dialoguePhase = 'conversation'
              this._dialogueOwner = cond.owner || null
            } else if (cond.action === 'blocked') {
              st.currentDialogue = [{ speaker: '', text: cond.blockedText || '...' }]
              st.dialogueIndex = 0
              st.dialoguePhase = 'narration'
            }
            ctx.syncUI()
            return
          }
        }
        // Ninguna condición coincidió → no hacer nada (no debería pasar si las conditions cubren todos los estados)
        return
      }
      // Fallback para exits sin conditions (ej. left_exit river_shore: contador)
      if (el.exitTargetScene && el.exitTargetScene.length > 0) {
        this.pendingScene = el.exitTargetScene
        this.fadeDir = 'out'
      } else {
        st.leftExitAttempts++
        const n = st.leftExitAttempts
        const line = n === 1 ? t('scene01.left_exit_1') : n === 2 ? t('scene01.left_exit_2') : t('scene01.left_exit_3')
        st.currentDialogue = [{ speaker: t('scene01.acay_label'), text: line, isAcay: true }]
        st.dialogueIndex = 0
        st.dialoguePhase = 'conversation'
      }
      ctx.syncUI()
      return
    }

    // Bloqueado (dinámico: kettle/wood/ashes desbloquean tras diálogo gaucho)
    if (el.blocked && !st.flags.gauchoDialogueDone) {
      st.currentDialogue = [{ speaker: '', text: el.blockedText ?? '...' }]
      st.dialogueIndex = 0
      st.dialoguePhase = 'narration'
      ctx.syncUI()
      return
    }

    // Personaje con batalla
    if (el.isCharacter && el.triggersBattle) {
      ctx.screens.requestSwitch('rhythm-battle', { antagonistId: el.triggersBattle }, CONFIG.fade.normal)
      return
    }

    // Gaucho (2.2): despierta + diálogo con pausas; al cerrar → unblock props
    // 60.3: diálogo condicional — si vuelve tras rocksPushed sin maderas → "¿Te olvidaste?"
    if (el.id === 'gaucho') {
      st.flags.gauchoAwake = true
      // Evaluar dialogueConditions (data-driven) antes del default
      let dialogue = el.dialogue
      let owner = 'gaucho'
      if (el.dialogueConditions) {
        for (const dc of el.dialogueConditions) {
          const flagOk = dc.flag ? !!st.flags[dc.flag] : true
          const notFlagOk = dc.notFlag ? !st.flags[dc.notFlag] : true
          if (flagOk && notFlagOk) {
            dialogue = dc.dialogue
            owner = dc.owner || 'gaucho'
            break
          }
        }
      }
      if (dialogue) {
        st.currentDialogue = dialogue
        st.dialogueIndex = 0
        st.dialoguePhase = 'conversation'
        this._dialogueOwner = owner
        ctx.syncUI()
      }
      return
    }

    // Personaje con diálogo (genérico) — también con dialogueConditions
    if (el.isCharacter && el.dialogue) {
      st.currentDialogue = el.dialogue
      st.dialogueIndex = 0
      st.dialoguePhase = 'conversation'
      this._dialogueOwner = el.id
      ctx.syncUI()
      return
    }

    // Pickup especial: kettle (2.3) → multi-speaker + precargado inventory
    if (el.id === 'kettle' && el.pickup && !st.hasItem(el.pickup.itemId)) {
      // Ocultar pava del escenario
      st.flags.kettleTaken = true
      // Añadir Item_Pava
      st.addItem({
        id: el.pickup.itemId, label: el.pickup.label,
        icon: el.pickup.icon, description: el.pickup.description,
      })
      // Precargado: Guitarra, Poncho, Lentes (primera vez que se abre inventario)
      if (!st.flags.inventoryUnlocked) {
        st.flags.inventoryUnlocked = true
        st.addItem({ id: 'guitar', label: t('scene02.guitar_label'), icon: 'ui.item_guitar', description: t('scene02.guitar_desc') })
        st.addItem({ id: 'poncho', label: t('scene02.poncho_label'), icon: 'ui.item_poncho', description: t('scene02.poncho_desc') })
        st.addItem({ id: 'lentes', label: t('scene02.lentes_label'), icon: 'ui.item_lentes', description: t('scene02.lentes_desc') })
        ctx.toast(t('scene02.inventory_unlocked'))
      }
      // Diálogo multi-speaker: Gaucho + Acay
      const g = t('scene02.gaucho_speaker')
      st.currentDialogue = [
        { speaker: g, text: t('scene02.kettle_gaucho') },
        { speaker: t('scene01.acay_label'), text: el.pickup.pickupText, isAcay: true },
      ]
      st.dialogueIndex = 0
      st.dialoguePhase = 'conversation'
      ctx.syncUI()
      return
    }

    // Pickup especial: wood (2.3) → multi-speaker
    if (el.id === 'wood' && el.pickup && !st.hasItem(el.pickup.itemId)) {
      st.flags.woodTaken = true
      st.addItem({
        id: el.pickup.itemId, label: el.pickup.label,
        icon: el.pickup.icon, description: el.pickup.description,
      })
      const g = t('scene02.gaucho_speaker')
      st.currentDialogue = [
        { speaker: g, text: t('scene02.wood_gaucho') },
        { speaker: t('scene01.acay_label'), text: el.pickup.pickupText, isAcay: true },
      ]
      st.dialogueIndex = 0
      st.dialoguePhase = 'conversation'
      ctx.syncUI()
      return
    }

    // Pickup genérico
    if (el.pickup) {
      if (!st.hasItem(el.pickup.itemId)) {
        st.addItem({
          id: el.pickup.itemId, label: el.pickup.label,
          icon: el.pickup.icon, description: el.pickup.description,
        })
        if (el.hideFlag) st.flags[el.hideFlag] = true
        st.currentDialogue = [{ speaker: el.label, text: el.pickup.pickupText }]
      } else {
        st.currentDialogue = [{ speaker: el.label, text: el.inspectText }]
      }
      st.dialogueIndex = 0
      st.dialoguePhase = 'narration'
      ctx.syncUI()
      return
    }

    // Inspección especial: rocas (1.3) → actualiza objetivo
    if (el.id === 'rocks') {
      st.currentDialogue = [{ speaker: t('scene01.acay_label'), text: t('scene01.rocks_inspect'), isAcay: true }]
      st.dialogueIndex = 0
      st.dialoguePhase = 'conversation'
      st.objective = t('scene01.objective_push_rocks')
      ctx.syncUI()
      return
    }

    // Inspección especial: río (scene 02) → long/short
    if (el.id === 'river_02') {
      if (!st.flags.river02Inspected) {
        st.flags.river02Inspected = true
        st.currentDialogue = [{ speaker: t('scene01.acay_label'), text: t('scene02.river_inspect_long'), isAcay: true }]
      } else {
        st.currentDialogue = [{ speaker: t('scene01.acay_label'), text: t('scene02.river_inspect_short'), isAcay: true }]
      }
      st.dialogueIndex = 0
      st.dialoguePhase = 'conversation'
      ctx.syncUI()
      return
    }

    // Inspección normal
    st.currentDialogue = [{ speaker: el.label, text: el.inspectText }]
    st.dialogueIndex = 0
    st.dialoguePhase = 'narration'
    ctx.syncUI()
  }

  render(renderer: Renderer, ctx: ScreenContext<AcayGameState>): void {
    const st = ctx.state

    // Fondo de la escena
    const bgAsset = SCENE_BACKGROUND[this._sceneId as 'river_shore' | 'campamento'] ?? 'scene.river_shore'
    renderer.image(ctx.assets.get(bgAsset), VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, { anchor: 'center' })

    // Elementos (excluyendo Acay — se dibuja aparte con posición dinámica)
    const acayEl = this.elements.find((e) => e.id === 'acay')
    const otherEls = this.elements.filter((e) => e.id !== 'acay')

    const drawables: Array<{ y: number; draw: () => void }> = []

    // Acay (con asset según estado + posición dinámica)
    if (acayEl) {
      drawables.push({ y: this.acayY(acayEl), draw: () => this.drawAcay(renderer, ctx, acayEl) })
    }

    // Otros elementos (solo tras despertar, o siempre en campamento)
    // Skip ocultos (hideFlag activo, ej. pickup ya recogido)
    if (this.acayState === 'awake' || this._sceneId === 'campamento') {
      for (const el of otherEls) {
        if (el.isExit) continue // exits no tienen sprite
        if (el.hideFlag && st.flags[el.hideFlag]) continue // oculto
        if (el.appearsAfterFlag && !st.flags[el.appearsAfterFlag]) continue // no apareció aún
        drawables.push({ y: el.y, draw: () => this.drawElement(renderer, ctx, el) })
      }
      // Exit indicators (flechas sutiles)
      for (const el of otherEls) {
        if (el.isExit) drawables.push({ y: el.y, draw: () => this.drawExitIndicator(renderer, ctx, el) })
      }
    }

    drawables.sort((a, b) => a.y - b.y)
    for (const d of drawables) d.draw()

    // Tooltip de hover (con clamp para que no se salga de pantalla)
    const hovered = st.hoveredElementId ? this.elements.find((e) => e.id === st.hoveredElementId) : null
    if (hovered && this.fadeAlpha <= 0) {
      const bounce = Math.sin(ctx.time * 5) * 2
      const py = hovered.y - (hovered.hitH ?? 100) * (hovered.scale ?? 1) - 16 + bounce
      const label = hovered.label
      const w = renderer.textWidth(label, { size: 18, weight: 'bold' }) + 28
      // Clamp X para que el tooltip no se salga de pantalla (70.3)
      const halfW = w / 2
      const tx = Math.max(halfW + 4, Math.min(VIRTUAL_WIDTH - halfW - 4, hovered.x))
      renderer.roundRect(tx - halfW, py - 26, w, 34, 17, 'rgba(243,227,194,0.95)')
      renderer.text(label, tx, py - 9, {
        size: 18, weight: 'bold', color: PALETTE.tinta,
        align: 'center', baseline: 'middle', font: 'serif',
      })
    }

    // Fade overlay
    if (this.fadeAlpha > 0.001) {
      renderer.rect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, '#000000', this.fadeAlpha)
    }

    renderer.vignette(0.2)
  }

  /** Y de Acay (fijo según el elemento, solo X es dinámica). */
  private acayY(el: NarrativeElement): number {
    return el.y
  }

  /** Dibuja Acay según estado + posición dinámica. */
  private drawAcay(renderer: Renderer, ctx: ScreenContext<AcayGameState>, el: NarrativeElement): void {
    const scale = el.scale ?? 1
    const isHovered = ctx.state.hoveredElementId === 'acay'
    const st = ctx.state

    if (isHovered && this.acayState === 'unconscious') {
      const hw = (el.hitW ?? 80) * scale
      const hh = (el.hitH ?? 100) * scale
      renderer.roundRect(this.acayX - hw / 2 - 6, el.y - hh - 6, hw + 12, hh + 12, 12, CONFIG.explore.hoverHighlight)
    }

    // Asset según estado
    let assetId: string
    if (this.acayState === 'unconscious') {
      assetId = 'acay.unconscious'
    } else if (st.flags.scene01AwakeningDone) {
      assetId = 'acay.back'
    } else {
      assetId = 'acay.stand_front'
    }

    // Shake durante standing_up
    let shakeX = 0
    if (this.acayState === 'standing_up') {
      const now = performance.now()
      const remaining = (this.standUpUntilMs - now) / CONFIG.explore.standUpMs
      const intensity = Math.max(0, remaining) * CONFIG.explore.standUpShakePx
      shakeX = Math.sin(now / 30) * intensity
    }

    // Bob durante caminado
    let bobY = 0
    if (this.acayTargetX !== null) {
      bobY = Math.abs(Math.sin(ctx.time * 8)) * 3
    }

    // Anim de respiración (unconscious)
    let skewX = 0
    if (this.acayState === 'unconscious') {
      const anim = ctx.assets.getAnim(assetId)
      if (anim) skewX = evalAnim(anim, ctx.time, phaseFromId('acay')).skewX
    }

    renderer.image(ctx.assets.get(assetId), this.acayX + shakeX, el.y - bobY, {
      scale, skewX, flip: this.facing === -1,
    })
  }

  /** Dibuja un elemento narrativo con highlight de hover + altAsset + blocked overlay. */
  private drawElement(renderer: Renderer, ctx: ScreenContext<AcayGameState>, el: NarrativeElement): void {
    const st = ctx.state
    const isHovered = st.hoveredElementId === el.id
    const scale = el.scale ?? 1

    if (isHovered) {
      const hw = (el.hitW ?? 80) * scale
      const hh = (el.hitH ?? 100) * scale
      renderer.roundRect(el.x - hw / 2 - 6, el.y - hh - 6, hw + 12, hh + 12, 12, CONFIG.explore.hoverHighlight)
    }

    // Asset: usar altAsset si el flag está activo (ej. gaucho despierto)
    let assetId = el.asset
    if (el.altAsset && st.flags[el.altAsset.flag]) {
      assetId = el.altAsset.asset
    }
    if (assetId) {
      renderer.image(ctx.assets.get(assetId), el.x, el.y, { scale })
    }

    // Indicador de bloqueado (overlay semitransparente) — dinámico
    if (el.blocked && !st.flags.gauchoDialogueDone) {
      const hw = (el.hitW ?? 80) * scale
      const hh = (el.hitH ?? 100) * scale
      renderer.rect(el.x - hw / 2, el.y - hh, hw, hh, 'rgba(0,0,0,0.3)')
    }
  }

  /** Indicador sutil de salida (flecha direccional). */
  private drawExitIndicator(renderer: Renderer, _ctx: ScreenContext<AcayGameState>, el: NarrativeElement): void {
    const st = _ctx.state
    const isHovered = st.hoveredElementId === el.id
    const cx = el.x
    // Triángulo visual: 20% hacia arriba del hitH (sin mover el área clickeable)
    const visualOffset = (el.hitH ?? 400) * 0.2
    const cy = el.y - visualOffset
    const dir = el.id === 'left_exit' ? -1 : 1
    const alpha = isHovered ? 0.8 : 0.3
    const bounce = isHovered ? Math.sin(_ctx.time * 4) * 4 : 0

    // Flecha
    const save = renderer.ctx
    save.save()
    save.globalAlpha = alpha
    save.fillStyle = PALETTE.dorado
    save.beginPath()
    const tipX = cx + dir * (20 + bounce)
    save.moveTo(tipX, cy)
    save.lineTo(cx, cy - 15)
    save.lineTo(cx, cy + 15)
    save.closePath()
    save.fill()
    save.restore()
  }
}
