import type { TrackDef } from '@/engine/core/types'
import { DEFAULT_MUSIC_VOLUME } from '@/engine/core/config'

/**
 * AudioManager — música independiente de las pantallas.
 *
 * GENÉRICO: el motor no conoce pistas concretas. Recibe:
 *   - `tracks`: registro de pistas procedurales (WebAudio) — TrackDef por id.
 *   - `audioSources`: registro de pistas file-based — trackId → src (URL/ruta).
 *
 * Ambos los provee el GameModule del juego (audioTracks + audioSources).
 *
 * Dos vías según el trackId pedido en playTrack():
 *  - Si está en `audioSources` → HTMLAudioElement en loop.
 *  - Si está en `tracks` → música generada con WebAudio (scheduler procedural).
 *  - Si no está en ninguno → silencio (no-op).
 *
 * Música procedural: scheduler con setInterval (~100 ms) y lookahead de 0.25 s
 * que programa corcheas (stepDur = 60/bpm/2). Por compás (8 corcheas, 4/4):
 *  - Pad: acorde sostenido del compás (triangle, ataque 0.4 s, lowpass 900 Hz).
 *  - Bajo: root-12 en sine, golpes en los beats 0 y 2, envolvente suave.
 *  - Lead: arpegio triangle tipo pluck (lowpass 1800 Hz), un grado pentatónico
 *    por corchea según el patrón de la pista (-1 = silencio).
 */

/** Pentatónica mayor sobre C: C4 D4 E4 G4 A4 C5. */
const PENTA = [60, 62, 64, 67, 69, 72]

/** Corcheas por compás (4/4). Los patrones de lead duran 2 compases. */
const STEPS_PER_BAR = 8
const SCHEDULER_INTERVAL_MS = 100
const LOOKAHEAD_S = 0.25

const midiToFreq = (m: number): number => 440 * Math.pow(2, (m - 69) / 12)

interface LiveOsc {
  osc: OscillatorNode
  endsAt: number
}

export class AudioManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null

  private volume: number = DEFAULT_MUSIC_VOLUME
  private muted = false
  private unlocked = false

  private currentTrack: string | null = null
  /** Pista pedida antes del unlock; arranca en cuanto haya gesto del usuario. */
  private pendingTrack: string | null = null

  // Vía archivo (HTMLAudioElement)
  private htmlAudio: HTMLAudioElement | null = null

  // Vía procedural (WebAudio)
  private schedulerId: number | null = null
  private stepIndex = 0
  private nextStepTime = 0
  private stepDur = 0.25
  private trackDef: TrackDef | null = null
  private trackGain = 1
  private leadBus: BiquadFilterNode | null = null
  private padBus: BiquadFilterNode | null = null
  private liveOscs: LiveOsc[] = []

  constructor(
    private tracks: Record<string, TrackDef> = {},
    private audioSources: Record<string, string> = {},
  ) {}

  /**
   * Crea/resume el AudioContext. Debe llamarse dentro del primer gesto del
   * usuario (InputManager.onFirstGesture) por las políticas de autoplay.
   */
  unlock(): void {
    if (this.ctx) {
      this.unlocked = true
      void this.ctx.resume().catch(() => {})
      this.flushPending()
      return
    }
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return // sin WebAudio: degradación silenciosa
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : this.volume
    this.master.connect(this.ctx.destination)
    this.unlocked = true
    void this.ctx.resume().catch(() => {})
    this.flushPending()
  }

  /** Cambia de pista: detiene la anterior y arranca la nueva (o la encola). */
  playTrack(track: string): void {
    const alreadyPlaying =
      track === this.currentTrack && (this.schedulerId !== null || this.htmlAudio !== null)
    if (alreadyPlaying) return
    if (!this.unlocked || !this.ctx) {
      this.pendingTrack = track // se arranca automáticamente en unlock()
      return
    }
    this.startTrack(track)
  }

  stop(): void {
    this.stopCurrent()
    this.currentTrack = null
    this.pendingTrack = null
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v))
    this.applyGains()
  }

  getVolume(): number {
    return this.volume
  }

  /** Alterna mute (gain master a 0). Devuelve el nuevo estado. */
  toggleMute(): boolean {
    this.muted = !this.muted
    this.applyGains()
    return this.muted
  }

  get isMuted(): boolean {
    return this.muted
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   *  SISTEMA REUTILIZABLE DE AUDIO — SFX + OST con parámetros.
   * ═══════════════════════════════════════════════════════════════════
   *
   * Funciones genéricas para reproducir sonidos puntuales (SFX) y loops
   * (OST/soundtrack). Parámetros: nombre, volumen, loop, duración.
   * El juego configura qué sonidos existen; el motor los reproduce.
   *
   * Uso:
   *   audio.playSfx('guitar')              // one-shot nota de guitarra
   *   audio.playLoop('ost_explore', { src: '/assets/audio/explore.mp3', volume: 0.3 })
   *   audio.stopLoop('ost_explore')
   *   audio.setLoopVolume('ost_explore', 0.5)
   */

  /** Loops activos (OST/soundtrack) — registrados por nombre. */
  private loops: Map<string, { audio: HTMLAudioElement; gain: GainNode | null }> = new Map()

  /**
   * Reproduce un efecto de sonido one-shot.
   * name: identificador del SFX ('guitar', 'click', 'babble', etc.).
   * opts: { volume?, duration? } — parámetros opcionales.
   */
  playSfx(name: string, opts?: { volume?: number; duration?: number }): void {
    if (!this.ctx || !this.master || !this.unlocked) return
    const ctx = this.ctx
    const now = ctx.currentTime
    const vol = opts?.volume ?? 0.15
    const dur = opts?.duration ?? 0.3
    if (name === 'guitar') {
      const notes = [196, 220, 247, 294, 330, 392]
      const freq = notes[Math.floor(Math.random() * notes.length)]
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, now)
      g.gain.linearRampToValueAtTime(vol, now + 0.005)
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
      osc.connect(g)
      g.connect(this.master)
      osc.start(now)
      osc.stop(now + dur + 0.05)
    }
  }

  /**
   * Reproduce un loop (OST/soundtrack). Si ya está sonando, no hace nada.
   * name: identificador del loop ('ost_explore', 'ost_battle', etc.).
   * opts: { src?, volume?, loop? } — src es la URL del archivo; si no se
   *   provee, usa el assetIndex del motor (audio.music_<name>).
   * loop: default true (soundtrack). false = one-shot con duración del archivo.
   */
  playLoop(name: string, opts?: { src?: string; volume?: number; loop?: boolean }): void {
    if (this.loops.has(name)) return // ya sonando
    const src = opts?.src ?? this.audioSources[name] ?? ''
    if (!src) return // sin source: silencio (degradación elegante)
    const volume = opts?.volume ?? 0.3
    const loop = opts?.loop ?? true
    const audio = new Audio(src)
    audio.loop = loop
    audio.volume = this.muted ? 0 : volume
    void audio.play().catch(() => { /* autoplay bloqueado */ })
    this.loops.set(name, { audio, gain: null })
  }

  /** Detiene un loop por nombre. */
  stopLoop(name: string): void {
    const entry = this.loops.get(name)
    if (!entry) return
    entry.audio.pause()
    entry.audio.removeAttribute('src')
    this.loops.delete(name)
  }

  /** Detiene todos los loops. */
  stopAllLoops(): void {
    for (const name of this.loops.keys()) this.stopLoop(name)
  }

  /** Cambia el volumen de un loop por nombre. */
  setLoopVolume(name: string, volume: number): void {
    const entry = this.loops.get(name)
    if (!entry) return
    entry.audio.volume = this.muted ? 0 : Math.min(1, Math.max(0, volume))
  }

  /** ¿Está sonando un loop? */
  isLoopPlaying(name: string): boolean {
    return this.loops.has(name)
  }

  dispose(): void {
    this.stop()
    this.stopAllLoops()
    if (this.ctx) {
      try {
        void this.ctx.close()
      } catch {
        /* noop */
      }
    }
    this.ctx = null
    this.master = null
    this.unlocked = false
  }

  // ── Internos: arranque/parada de pistas ──

  private flushPending(): void {
    if (!this.pendingTrack) return
    const track = this.pendingTrack
    this.pendingTrack = null
    this.startTrack(track)
  }

  private startTrack(track: string): void {
    this.stopCurrent()
    this.currentTrack = track

    // 1) Vía archivo: el juego provee src para esta pista en audioSources.
    const src = this.audioSources[track]
    if (src) {
      const audio = new Audio(src)
      audio.loop = true
      audio.volume = this.muted ? 0 : this.volume
      void audio.play().catch(() => {
        /* autoplay bloqueado: se reintentará en el próximo gesto/unlock */
      })
      this.htmlAudio = audio
      return
    }

    // 2) Vía procedural (WebAudio) — si el juego definió el track.
    const def = this.tracks[track]
    const ctx = this.ctx
    if (!def || !ctx || !this.master) return // sin track: silencio
    this.trackDef = def
    this.trackGain = def.gain
    this.stepDur = 60 / def.bpm / 2 // corchea = mitad de beat
    this.stepIndex = 0
    this.nextStepTime = ctx.currentTime + 0.08 // pequeño margen de arranque

    // Bus de lead (pluck brillante) y bus de pad (suave) con lowpass propios.
    this.leadBus = ctx.createBiquadFilter()
    this.leadBus.type = 'lowpass'
    this.leadBus.frequency.value = 1800
    this.leadBus.connect(this.master)

    this.padBus = ctx.createBiquadFilter()
    this.padBus.type = 'lowpass'
    this.padBus.frequency.value = 900
    this.padBus.connect(this.master)

    // Scheduler incremental: programa notas 0.25 s por delante del reloj.
    this.schedulerId = window.setInterval(() => this.schedule(), SCHEDULER_INTERVAL_MS)
    this.schedule()
  }

  private stopCurrent(): void {
    if (this.schedulerId !== null) {
      window.clearInterval(this.schedulerId)
      this.schedulerId = null
    }
    // Cortar osciladores aún vivos (algunos están programados dentro del lookahead).
    for (const { osc } of this.liveOscs) {
      try {
        osc.stop()
      } catch {
        /* ya detenido/finalizado */
      }
      try {
        osc.disconnect()
      } catch {
        /* noop */
      }
    }
    this.liveOscs = []
    if (this.leadBus) {
      try {
        this.leadBus.disconnect()
      } catch {
        /* noop */
      }
    }
    if (this.padBus) {
      try {
        this.padBus.disconnect()
      } catch {
        /* noop */
      }
    }
    this.leadBus = null
    this.padBus = null
    this.trackDef = null
    if (this.htmlAudio) {
      this.htmlAudio.pause()
      this.htmlAudio.removeAttribute('src')
      this.htmlAudio = null
    }
  }

  // ── Internos: scheduler procedural ──

  private schedule(): void {
    const ctx = this.ctx
    const def = this.trackDef
    if (!ctx || !def) return

    const now = ctx.currentTime
    // Purga de osciladores terminados (evita crecimiento sin límite).
    if (this.liveOscs.length > 0) {
      this.liveOscs = this.liveOscs.filter((o) => o.endsAt > now - 0.5)
    }
    while (this.nextStepTime < now + LOOKAHEAD_S) {
      this.scheduleStep(def, this.stepIndex, this.nextStepTime)
      this.stepIndex++
      this.nextStepTime += this.stepDur
    }
  }

  private scheduleStep(def: TrackDef, i: number, t: number): void {
    const stepInBar = i % STEPS_PER_BAR
    const bar = Math.floor(i / STEPS_PER_BAR)
    const chord = def.chords[bar % def.chords.length]

    // Pad: acorde sostenido, se crea al inicio de cada compás y dura el compás.
    if (stepInBar === 0) this.schedulePad(chord, t)

    // Bajo: golpes en los beats 0 y 2 (corcheas 0 y 4 del compás).
    if (stepInBar === 0 || stepInBar === 4) this.scheduleBass(chord[0] - 12, t)

    // Lead: un grado pentatónico por corchea (patrón de 16 = 2 compases).
    const degree = def.lead[i % def.lead.length]
    if (degree >= 0) this.scheduleLead(PENTA[degree % PENTA.length], t)
  }

  private scheduleBass(note: number, t: number): void {
    const ctx = this.ctx
    if (!ctx || !this.master) return
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = midiToFreq(note)
    const g = ctx.createGain()
    const peak = 0.14 * this.trackGain
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(peak, t + 0.02) // ataque suave
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55) // decaimiento largo
    osc.connect(g)
    g.connect(this.master)
    this.trackOsc(osc, t, 0.6)
  }

  private schedulePad(chord: number[], t: number): void {
    const ctx = this.ctx
    if (!ctx || !this.padBus) return
    const dur = STEPS_PER_BAR * this.stepDur
    const g = ctx.createGain()
    const peak = 0.05 * this.trackGain
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(peak, t + 0.4) // ataque lento
    g.gain.setValueAtTime(peak, t + Math.max(0.45, dur - 0.35))
    g.gain.linearRampToValueAtTime(0.0001, t + dur) // suelta sin chasquido
    g.connect(this.padBus)
    for (const note of chord) {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = midiToFreq(note)
      osc.detune.value = (Math.random() - 0.5) * 6 // ligero ensanchado
      osc.connect(g)
      this.trackOsc(osc, t, dur + 0.05) // start/stop con tiempos absolutos
    }
  }

  private scheduleLead(note: number, t: number): void {
    const ctx = this.ctx
    if (!ctx || !this.leadBus) return
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = midiToFreq(note)
    const g = ctx.createGain()
    const peak = 0.08 * this.trackGain
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(peak, t + 0.01) // pluck
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26) // decay 0.25 s
    osc.connect(g)
    g.connect(this.leadBus)
    this.trackOsc(osc, t, 0.3)
  }

  /** Programa start/stop del oscilador y lo registra para poder cortarlo. */
  private trackOsc(osc: OscillatorNode, t: number, dur: number): void {
    osc.start(t)
    osc.stop(t + dur)
    this.liveOscs.push({ osc, endsAt: t + dur })
  }

  // ── Internos: volumen/mute ──

  private applyGains(): void {
    const target = this.muted ? 0 : this.volume
    if (this.master && this.ctx) {
      // setTargetAtTime: cambio de gain sin chasquidos.
      this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.03)
    }
    if (this.htmlAudio) this.htmlAudio.volume = target
  }
}
