import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from '@/engine/core/config'
import type { ScreenContext } from '@/engine/core/context'
import type { Renderer } from '@/engine/render/Renderer'
import type { GameScreen } from '@/engine/core/ScreenManager'
import type { AcayGameState } from '@/game-next/state/gameState'
import type { RhythmTab, RhythmBattleState } from '@/game-next/core/types'
import { CONFIG, PALETTE } from '@/game-next/core/config'
import { ANTAGONISTS } from '@/game-next/data/scene'
import { t } from '@/engine/i18n'

/**
 * RhythmBattleScreen — modo batalla rítmica (guitar-hero INVERTIDO: esquivar).
 *
 * Composición (3 planos):
 *   - Tercer plano: antagonista (asset grande, arriba, detrás de la pista).
 *   - Segundo plano: pista de tabs en perspectiva (trapecio que se ensancha
 *     hacia abajo). Los tabs descienden desde lejos (arriba, chicos) hacia
 *     el primer plano (abajo, grandes).
 *   - Primer plano: Acay de espaldas (poncho+sombrero), en una de las lanes.
 *
 * Mecánica:
 *   - 3 lanes. Acay ocupa una. ←/→ (o A/D) cambia de lane (instantáneo).
 *   - Tabs programados con hitTime (segundos desde el inicio).
 *   - Cuando un tab llega al primer plano (elapsed >= hitTime):
 *     - Si Acay está en la misma lane → HIT (HP-1).
 *     - Si no → DODGE (score+1).
 *   - Batalla termina: HP=0 → derrota; elapsed >= duration → victoria.
 *   - ESC → volver a explore (cancelar).
 *
 * Mockup: sin música (tabs visuales + beat mock). Cuando llegue el asset de
 * música, el motor lo reproduce vía audioTracks/musicByScreen.
 */
export class RhythmBattleScreen implements GameScreen<'rhythm-battle', AcayGameState> {
  readonly id = 'rhythm-battle' as const

  /** Tabs ya resueltos (para animación de fade out). */
  private resolved: Array<{ tab: RhythmTab; result: 'hit' | 'dodge'; resolveMs: number }> = []
  /** Acay lane al inicio del frame (para detectar cambio). */
  private prevAcayLane = 1
  /** Acay lane suavizada (para animación de movimiento). */
  private acayLaneVisual = 1
  /** Flag de fin para no re-disparar requestSwitch. */
  private finished = false

  enter(ctx: ScreenContext<AcayGameState>, params?: unknown): void {
    const p = (params ?? {}) as { antagonistId?: string }
    const antId = p.antagonistId ?? 'shadow'
    const ant = ANTAGONISTS[antId] ?? ANTAGONISTS.shadow
    const cfg = CONFIG.rhythm

    // Generar schedule de tabs mockup
    const tabs: RhythmTab[] = []
    let time = 1.2 // primer tab a 1.2s (dar tiempo a posicionarse)
    while (time < cfg.battleDurationSec - 0.5) {
      tabs.push({
        lane: Math.floor(Math.random() * cfg.lanes),
        hitTime: time,
        ghost: Math.random() < cfg.ghostChance,
      })
      time += cfg.tabIntervalSec + (Math.random() - 0.5) * 0.2
    }

    ctx.state.battle = {
      antagonistId: antId,
      antagonistName: ant.name,
      lanes: cfg.lanes,
      acayLane: cfg.acayStartLane,
      tabs,
      startMs: performance.now(),
      hp: cfg.maxHp,
      dodges: 0,
      hits: 0,
      durationSec: cfg.battleDurationSec,
    }
    this.prevAcayLane = cfg.acayStartLane
    this.acayLaneVisual = cfg.acayStartLane
    this.resolved = []
    this.finished = false
    ctx.syncUI()
  }

  exit(ctx: ScreenContext<AcayGameState>): void {
    ctx.state.battle = null
    this.resolved = []
    this.finished = false
  }

  update(dt: number, ctx: ScreenContext<AcayGameState>): void {
    void dt
    const st = ctx.state
    const battle = st.battle
    if (!battle || this.finished) return

    const cfg = CONFIG.rhythm
    const elapsed = (performance.now() - battle.startMs) / 1000

    // ── Movimiento de Acay (cambio de lane instantáneo) ──
    const left = ctx.input.wasPressed('ArrowLeft') || ctx.input.wasPressed('KeyA')
    const right = ctx.input.wasPressed('ArrowRight') || ctx.input.wasPressed('KeyD')
    if (left && battle.acayLane > 0) battle.acayLane--
    if (right && battle.acayLane < battle.lanes - 1) battle.acayLane++
    // Suavizado visual de la lane
    this.acayLaneVisual += (battle.acayLane - this.acayLaneVisual) * Math.min(1, dt * 12)

    // ── Resolver tabs que llegaron al primer plano ──
    const remaining: RhythmTab[] = []
    for (const tab of battle.tabs) {
      if (elapsed >= tab.hitTime) {
        // Resolver
        if (tab.ghost) {
          // Ghost: no daña, no cuenta como dodge (solo visual)
          this.resolved.push({ tab, result: 'dodge', resolveMs: performance.now() })
        } else if (tab.lane === battle.acayLane) {
          battle.hp--
          battle.hits++
          this.resolved.push({ tab, result: 'hit', resolveMs: performance.now() })
        } else {
          battle.dodges++
          this.resolved.push({ tab, result: 'dodge', resolveMs: performance.now() })
        }
      } else {
        remaining.push(tab)
      }
    }
    battle.tabs = remaining

    // Limpiar resolved antiguos (>400ms)
    const now = performance.now()
    this.resolved = this.resolved.filter((r) => now - r.resolveMs < 400)

    // ── Fin de batalla ──
    if (battle.hp <= 0) {
      this.finished = true
      ctx.toast(t('battle.defeat'))
      ctx.screens.requestSwitch('explore', undefined, CONFIG.fade.normal)
      return
    }
    if (elapsed >= battle.durationSec) {
      this.finished = true
      ctx.toast(t('battle.victory'))
      ctx.screens.requestSwitch('explore', undefined, CONFIG.fade.normal)
      return
    }

    // ── ESC: cancelar ──
    if (ctx.input.wasPressed('Escape')) {
      this.finished = true
      ctx.screens.requestSwitch('explore', undefined, CONFIG.fade.fast)
      return
    }

    // Publicar snapshot si cambió algo (hp, lane, etc.)
    ctx.syncUI()
  }

  render(renderer: Renderer, ctx: ScreenContext<AcayGameState>): void {
    const st = ctx.state
    const battle = st.battle
    if (!battle) return

    const cfg = CONFIG.rhythm
    const elapsed = (performance.now() - battle.startMs) / 1000

    // ── Tercer plano: antagonista (grande, arriba, semi-transparente) ──
    const antAsset = ANTAGONISTS[battle.antagonistId]?.asset ?? 'ant.shadow'
    try {
      const antImg = ctx.assets.get(antAsset)
      const antSize = ctx.assets.getSize(antAsset)
      const antScale = 1.6
      renderer.image(antImg, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT * 0.32, {
        scale: antScale,
        anchor: 'center',
        alpha: 0.55,
      })
      void antSize
    } catch {
      /* placeholder */
    }

    // ── Segundo plano: pista de tabs en perspectiva ──
    renderer.image(ctx.assets.get('scene.rhythm_track'), VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, {
      anchor: 'center',
    })

    // Geometría de la pista (perspectiva)
    const cx = VIRTUAL_WIDTH / 2
    const topY = VIRTUAL_HEIGHT * 0.15
    const botY = VIRTUAL_HEIGHT * 0.92
    const topHalfW = VIRTUAL_WIDTH * 0.12
    const botHalfW = VIRTUAL_WIDTH * 0.42
    const hitY = botY - 30

    // Lane centers en función de la profundidad p (0=far/top, 1=near/bottom)
    const laneCenterAt = (lane: number, p: number): number => {
      const halfW = topHalfW + (botHalfW - topHalfW) * p
      const t = battle.lanes === 1 ? 0.5 : lane / (battle.lanes - 1)
      return cx - halfW + t * halfW * 2
    }
    const yAt = (p: number): number => topY + (hitY - topY) * p

    // ── Tabs descendiendo ──
    for (const tab of battle.tabs) {
      const p = Math.max(0, Math.min(1.05, (elapsed - (tab.hitTime - cfg.tabTravelSec)) / cfg.tabTravelSec))
      if (p <= 0) continue // aún no apareció
      const x = laneCenterAt(tab.lane, p)
      const y = yAt(p)
      const size = 12 + p * 26 // crece con la cercanía
      const color = tab.ghost ? PALETTE.tabGhost : (tab.lane === battle.acayLane ? PALETTE.tabHit : PALETTE.tab)
      const alpha = Math.min(1, p * 2) * (tab.ghost ? 0.5 : 1)
      renderer.roundRect(x - size / 2, y - size / 4, size, size / 2, 4, color, alpha)
      // Brillo del tab (no ghosts)
      if (!tab.ghost) {
        renderer.roundRect(x - size / 2, y - size / 4, size, 2, PALETTE.dorado, alpha * 0.7)
      }
    }

    // Resolved (flash de hit/dodge)
    for (const r of this.resolved) {
      const age = (performance.now() - r.resolveMs) / 400
      const alpha = (1 - age) * 0.6
      const x = laneCenterAt(r.tab.lane, 1)
      const y = hitY
      if (r.result === 'hit') {
        renderer.ellipse(x, y, 30 + age * 20, 30 + age * 20, PALETTE.tabHit, alpha)
      } else {
        renderer.ellipse(x, y, 20 + age * 15, 20 + age * 15, PALETTE.dorado, alpha)
      }
    }

    // ── Línea de hit (donde Acay esquiva) ──
    const hitHalfW = botHalfW * 0.92
    renderer.rect(cx - hitHalfW, hitY - 2, hitHalfW * 2, 3, PALETTE.acento, 0.7)

    // ── Primer plano: Acay de espaldas en su lane ──
    const acayX = laneCenterAt(this.acayLaneVisual, 1)
    const acayY = botY - 10
    try {
      const acayImg = ctx.assets.get('acay.back')
      const acaySize = ctx.assets.getSize('acay.back')
      const acayScale = 1.5
      renderer.image(acayImg, acayX, acayY, { scale: acayScale })
      // Sombra de Acay en el suelo
      renderer.ellipse(acayX, acayY + 4, acaySize.w * acayScale * 0.35, 8, 'rgba(0,0,0,0.4)')
      void acaySize
    } catch {
      /* placeholder */
    }

    // ── HUD canvas (HP corazones + score) ──
    this.drawHud(renderer, battle, elapsed)

    // Indicador "ESCAPE para volver"
    renderer.text(t('battle.exit'), VIRTUAL_WIDTH - 20, VIRTUAL_HEIGHT - 16, {
      size: 13,
      color: 'rgba(243,227,194,0.5)',
      align: 'right',
      baseline: 'alphabetic',
    })

    renderer.vignette(0.35)
  }

  /** HUD canvas: HP (corazones terracota) + dodges + hint de esquive. */
  private drawHud(renderer: Renderer, battle: RhythmBattleState, elapsed: number): void {
    const cfg = CONFIG.rhythm
    // HP corazones (esquina sup-izq)
    for (let i = 0; i < cfg.maxHp; i++) {
      const x = 30 + i * 30
      const y = 30
      const filled = i < battle.hp
      // Corazón simple (dos círculos + triángulo)
      const c = filled ? PALETTE.acento : 'rgba(60,40,20,0.4)'
      renderer.ellipse(x - 6, y, 8, 8, c)
      renderer.ellipse(x + 6, y, 8, 8, c)
      // triángulo inferior
      const save = renderer.ctx
      save.fillStyle = c
      save.beginPath()
      save.moveTo(x - 12, y + 2)
      save.lineTo(x + 12, y + 2)
      save.lineTo(x, y + 16)
      save.closePath()
      save.fill()
    }
    renderer.text(`${t('battle.hp')}`, 30, 65, {
      size: 12, color: PALETTE.pergamino, align: 'left', baseline: 'alphabetic',
    })

    // Score (esquina sup-der)
    renderer.text(`${t('battle.dodges')}: ${battle.dodges}`, VIRTUAL_WIDTH - 20, 30, {
      size: 16, weight: 'bold', color: PALETTE.dorado, align: 'right', baseline: 'alphabetic', font: 'serif',
    })
    renderer.text(`${t('battle.hits')}: ${battle.hits}`, VIRTUAL_WIDTH - 20, 52, {
      size: 14, color: PALETTE.tabHit, align: 'right', baseline: 'alphabetic',
    })

    // Timer / duración
    const remain = Math.max(0, battle.durationSec - elapsed)
    renderer.text(`${remain.toFixed(1)}s`, VIRTUAL_WIDTH / 2, 30, {
      size: 18, weight: 'bold', color: PALETTE.pergamino, align: 'center', baseline: 'alphabetic', font: 'serif',
    })

    // Hint de esquive (centro-abajo, sobre Acay)
    renderer.text(t('battle.dodge'), VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT * 0.78, {
      size: 14, color: 'rgba(230,182,85,0.7)', align: 'center', baseline: 'middle',
    })
  }
}
