# PROJECT_STRUCTURE.md — Mapa del motor para próximas iteraciones

> **REGLA PARA EL AGENTE (léeme primero):** al retomar este proyecto, lee SOLO este
> archivo para conocer la estructura. No hagas un nuevo exploration del código
> salvo que necesites el detalle línea a línea de un archivo puntual. El brief
> conceptual de capacidades del motor está en `BRIEF_CONCEPTUAL.md`. El historial
> del juego cozy de origen está archivado en `docs/legacy/worklog.md`.

---

## 1. Qué es

**Motor de videojuegos 2D web online** — un motor genérico para juegos 2D
renderizados en **Canvas 2D** dentro de una app **Next.js 16 (App Router) +
React 19 + TypeScript 5**. El motor corre 100% en el cliente: no usa base de
datos ni API routes funcionales para el gameplay.

El motor está separado físicamente de cualquier juego concreto:
- **`src/engine/`** — el motor (genérico, independiente de mecánicas).
- **`src/game/`** — juego cozy de referencia (demuestra que el motor funciona).
- **`src/game-next/`** — stub del nuevo juego (recibirá el brief detallado).

**Agregar un juego nuevo = implementar un `GameModule` y montarlo.** No se
modifica el motor. Ver §5.

## 2. Comandos

```bash
bun run dev     # next dev -p 3000 (loguea a dev.log) — servidor de desarrollo
bun run lint    # eslint .  (debe terminar en 0 problemas)
bun run build   # next build  (simple, listo para Vercel)
bun run start   # next start  (producción local)
```

Única variable de entorno usada por el juego: `DEV_MODE` (setear en el
dashboard de Vercel; en local vive en `.env`). Semántica estricta: solo el
string `'true'` la activa.

## 3. Mapa de archivos

```
src/
  app/
    page.tsx               # Server component: lee DEV_MODE y monta <ActiveGameHost/>
    layout.tsx             # <html lang> + metadata
    globals.css            # Tailwind 4 + tema
    api/route.ts           # Placeholder "hello world" — NO se usa
  active-game.tsx          # ⭐ Switch de juego activo: ActiveGameHost = CozyGameRoot | NewGameHost
                           #   (una línea comenta/descomenta para cambiar de juego)

  engine/                  ← ═════════════ MOTOR (genérico, independiente de mecánicas) ════
    core/
      types.ts             # Tipos primitivos del motor: Vec2, Anchor, AssetImage, Collider,
                           #   WorldObjectDef<TInteraction>, AssetSourceDef, AnimDef, AnimKind,
                           #   FadeConfig, BaseUISnapshot, GameStateContract, TrackDef, UiBridge.
                           #   NO incluye ScreenContext ni GameScreen (viven en context.ts y
                           #   ScreenManager.ts para evitar ciclos de tipos).
      config.ts            # Config del motor: VIRTUAL_WIDTH/HEIGHT/ASPECT (1280×720),
                           #   FADE_PRESETS (fast/normal/long), DEFAULT_MUSIC_VOLUME,
                           #   DEFAULT_HUD_HEIGHT.
      context.ts           # ScreenContext<TState>: renderer, input, audio, assets, state,
                           #   screens, ui, toast, syncUI, time, debug. Fuertemente tipado
                           #   (type-only imports de servicios para evitar ciclos).
      ScreenManager.ts     # GameScreen<TScreenId> interface + ScreenManager class. Genérico:
                           #   ScreenId es string (el juego acota con su unión). Registro,
                           #   requestSwitch con/sin fade, applyPending, render (pantalla + fade).
      FadeSystem.ts        # idle→toBlack→hold→fromBlack. update(dt) en SEGUNDOS, duraciones en
                           #   MS. hold UNA vez por transición (flag heldOnce — sin él, hold
                           #   re-entraba y el reinicio quedaba en negro eterno).
      GameEngine.ts        # ⭐ Loop rAF + watchdog anti-pestaña-oculta. Recibe un GameModule en
                           #   el constructor: crea AssetLoader(module.assetIndex, module.drawers),
                           #   AudioManager(module.audioTracks, audioSources derivados del index),
                           #   state = module.createInitialState(), registra module.createScreens(ctx).
                           #   syncUI → module.buildSnapshot → module.store.setSnapshot.
                           #   Expone: actions (module.uiActions bindeadas a this), setInteraction,
                           #   getInteraction, setVolume, toggleMute, setLocale, getTime, getClock.
      module.ts            # ⭐ GameModule<TState, TSnapshot> interface — el contrato motor↔juego.
                           #   GameSnapshotContext: state + assets + audio + screens + time + pushToast.
      engineBridge.ts      # Singleton: setEngineInstance/getEngine (React → engine instance).
    render/
      Renderer.ts          # Canvas 1280×720 ×dpr(máx 2). API: clear, image (anchors
                           #   bottom-center/center, flip, skewX=deformación PURA anclada en base),
                           #   rect, roundRect, ellipse, gradientRect, text, textWidth, dim, vignette,
                           #   clipRect/restoreClip. Unidades virtuales siempre.
      anim.ts              # Animación por deformación: ANIM_EVALUATORS (kind → lógica), evalAnim(def,
                           #   t, phaseShift) → Deform{skewX}, phaseFromId(id). Extender = 1 kind +
                           #   1 evaluator. Costo 0 sin `anim`.
    input/InputManager.ts  # Teclado en window (ignora e.repeat, preventDefault en flechas/Space),
                           #   pointerdown SOLO del canvas → coords virtuales; onFirstGesture para
                           #   desbloquear audio. Blur/visibilitychange limpian `down` (anti stuck keys).
    audio/AudioManager.ts  # WebAudio procedural (scheduler setInterval 100ms, lookahead 0.25s,
                           #   corcheas 60/bpm/2, pad/bass/lead) + HTMLAudioElement para file-based.
                           #   GENÉRICO: recibe tracks (Record<string,TrackDef>) y audioSources
                           #   (Record<string,string>) del GameModule. No hardcodea pistas.
    assets/
      AssetLoader.ts       # loadAll() con onProgress; NUNCA rechaza; fallback a placeholder SVG.
                           #   Recibe index + drawers vía constructor (del GameModule).
                           #   get/getUrl/getSize/getAnim.
      drawers.ts           # DrawerDef interface + NO_DRAWERS (registro vacío). El motor NO incluye
                           #   drawers concretos — cada juego provee los suyos.
      placeholder.ts       # makePlaceholder(id) → SVG data-URI por categoría (color por prefijo).
    state/
      GameState.ts         # Base genérica: version, flags, subscribe, markChanged, abstract reset().
                           #   Cada juego extiende y agrega sus campos.
      store.ts             # createGameStore<TSnapshot>(initial) factory + GameStore<T> type.
                           #   Cada juego crea su instancia (singleton) con su snapshot tipado.
    i18n/index.ts          # ⭐ i18n registry-based: registerLocale/registerLocales, setLocale,
                           #   getLocale, isLocale, getLocales, t, tOr. El motor NO incluye locales;
                           #   cada juego los registra vía GameModule.locales.

  game/                    ← ═════════════ JUEGO COZY (referencia) ════
    core/
      types.ts             # Re-exporta tipos del motor + tipos cozy: ScreenId (7 pantallas),
                           #   ItemId, InteractionType, CozyInteractionPayload, WorldObjectDef,
                           #   CostItem, UIInteractionOption, UIInteractionState, CozySnapshot
                           #   (extiende BaseUISnapshot con coins/inventory/prosperity/ovenUnlocked).
      config.ts            # Re-exporta config del motor + CONFIG cozy: movementAngle 45°,
                           #   playerSpeed, playerCollider, interactRadius, walkFrameMs, worldBounds,
                           #   fade (referencia FADE_PRESETS), intro, studio, day (dayLengthSec 180,
                           #   fases), hudHeight, musicVolume. MUSIC_BY_SCREEN.
      context.ts           # Re-exporta ScreenContext<CozyGameState> + UiBridge cozy tipado.
      engineBridge.ts      # getEngine()/setEngineInstance() tipados con CozyEngine.
      module.ts            # ⭐ cozyModule: GameModule<CozyGameState, CozySnapshot>. Conecta
                           #   assets/drawers/locales/store/screens/tracks/snapshot/uiActions.
    state/
      gameState.ts         # CozyGameState extends GameState: player, coins, inventory,
                           #   coinsEarned, breadSold, breadProduced, ovenUnlocked, introCompleted,
                           #   prosperity. addItem/getItemCount/reset.
      store.ts             # useGameStore = createGameStore<CozySnapshot>(initial).
    data/
      assetIndex.ts        # ⭐ ÍNDICE cozy: IDs lógicos → fuente. Reemplazar arte = editar SOLO esto.
      world.ts             # WORLD_LAYOUT (objetos del pueblo), PLAYER_START.
      items.ts trades.ts progression.ts  # Economía cozy (wheat/apple/wood/bread, 5 etapas prosperidad).
    logic/
      EconomySystem.ts     # executeTrade/produceBread/gatherResource.
      interactions.ts      # INTERACTION_HANDLERS (merchant/gather/oven) — sin ifs por tipo.
      movement.ts CollisionSystem.ts  # Vectores caballera normalizados; AABB por ejes.
    screens/               # 7 pantallas cozy: StudioScreen, TitleScreen, IntroScreen, GameScreen,
                           #   InteractionScreen, MenuScreen, RestartScreen.
    audio/tracks.ts        # COZY_TRACKS: 4 pistas procedurales (title/intro/village/menu).
    assets/drawers.ts      # ~30 drawers procedurales cozy (paleta cozy SIN azules).
    i18n/
      index.ts             # Re-exporta motor i18n + helpers cozy (itemNameLower, stageMessageKey).
      useT.ts              # Hook React (suscribe al store cozy).
      locales/en.json es.json
    components/AssetImg.tsx (movido a src/components/game/AssetImg.tsx)

  game-next/               ← ═════════════ NUEVO JUEGO (stub — recibir brief) ════
    core/
      types.ts             # ScreenId stub ('placeholder'), NewGameSnapshot (solo base).
      module.ts            # ⭐ newGameModule: GameModule<NewGameState, NewGameSnapshot>. Stub mínimo.
    state/gameState.ts     # NewGameState extends GameState (vacío, listo para el brief).
    state/store.ts         # useGameStore = createGameStore<NewGameSnapshot>(initial).
    data/assetIndex.ts     # Índice stub (1 placeholder).
    i18n/locales/en.json es.json  # Textos stub.
    screens/PlaceholderScreen.ts  # Pantalla "READY FOR NEW GAME".
    host.tsx               # NewGameHost: React host que monta el motor con newGameModule.

  components/
    ui/                    # shadcn/ui (librería, no tocar para features).
    game/                  # Overlays React cozy: GameRoot, TitleOverlay, HudOverlay,
                           #   InteractionOverlay, MenuOverlay, RestartOverlay, Toasts, AssetImg.

public/                    # logo.svg, robots.txt, assets/ (arte del juego cozy).
docs/legacy/               # Brief técnico original + documento del juego cozy + worklog histórico.
BRIEF_CONCEPTUAL.md        # ⭐ Capacidades del motor (genérico, independiente de mecánicas).
PROJECT_STRUCTURE.md       # ESTE ARCHIVO.
```

**Carpetas que NO son del motor (infra sandbox/docs, no tocar para features):**
`examples/` (demo websocket), `tests/` (scripts bash), `upload/` (zip original),
`download/`, `skills/`, `mini-services/`, `prisma/`, `db/`.

## 4. Arquitectura: separación motor ↔ juego

```
                 ┌─────────────┐
                 │ GAME LOGIC  │  ← src/game (cozy) o src/game-next (nuevo)
                 └──────┬──────┘
                        │
                  GAME STATE (TState extends GameState)
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
      RENDERER         UI           AUDIO     ← src/engine (GENÉRICO)
          │
          ↓
       ASSETS (índice del juego)
```

**Regla de dependencia (NO romper):** el motor (`src/engine/`) NUNCA importa
de `src/game/*` o `src/game-next/*`. El juego sí importa de `src/engine/*`.
Unidireccional.

**El contrato entre motor y juego es `GameModule`** (`src/engine/core/module.ts`):

```ts
interface GameModule<TState extends GameStateContract, TSnapshot extends BaseUISnapshot> {
  id: string
  assetIndex: Record<string, AssetSourceDef>      // índice de assets del juego
  drawers: Record<string, DrawerDef>              // drawers procedurales del juego
  uiAssetUrls: string[]                           // IDs de assets para <img> en React
  locales: LocaleEntry[]                          // i18n
  defaultLocale: string
  store: UseBoundStore<StoreApi<GameStore<TSnapshot>>>  // store Zustand del juego
  createInitialState(): TState                    // factory del estado inicial
  createScreens(ctx: ScreenContext<TState>): GameScreen[]  // factory de pantallas
  initialScreen: string                          // pantalla al arrancar
  musicByScreen: Record<string, string>          // id pantalla → id pista
  audioTracks?: Record<string, TrackDef>         // pistas procedurales (WebAudio)
  buildSnapshot(ctx: GameSnapshotContext<TState>): TSnapshot  // snapshot UI
  onStateChanged?(state, ctx): void              // hook de progresión
  uiActions?: Record<string, (engine, ...args) => void>  // acciones desde React
  initialFadeIn?: number | null                  // fade inicial (ms)
  clockDayLengthSec?: number                     // ciclo día/noche opcional
}
```

El `GameEngine` recibe un `GameModule` en su constructor y lo usa para:
1. Crear `AssetLoader(module.assetIndex, module.drawers)`.
2. Crear `AudioManager(module.audioTracks, audioSources derivados del index)`.
3. Crear `state = module.createInitialState()`.
4. Registrar `module.createScreens(ctx)` en el ScreenManager.
5. Registrar `module.locales` en el i18n.
6. Suscribirse a `state` → `module.onStateChanged(state, ctx)` + `syncUI`.
7. `syncUI()` → `module.buildSnapshot(ctx)` → `module.store.setSnapshot()`.
8. Exponer `module.uiActions` en `engine.actions.<name>(...args)` (bindeadas a `this`).

**Acciones genéricas del motor** (todo juego las hereda sin definirlas):
- `engine.setVolume(v)`, `engine.toggleMute()`, `engine.setLocale(locale)`.
- `engine.setInteraction(state)`, `engine.getInteraction()`.
- `engine.getTime()`, `engine.getClock()` (con `dayLengthSec` del módulo).
- Teclas globales: `M` (mute), `F3` (debug colliders).

**Acciones del juego** (en `engine.actions`): las define el módulo. React las
llama vía `getEngine()?.actions.<name>(...args)`.

## 5. Cómo agregar un juego nuevo

1. Crear `src/game-<nombre>/` con la estructura de `src/game-next/` (stub).
2. Implementar un `GameModule` en `src/game-<nombre>/core/module.ts`.
3. Implementar un host React en `src/game-<nombre>/host.tsx` (monta el motor + overlays).
4. En `src/active-game.tsx`, apuntar `ActiveGameHost` al nuevo host (una línea).
5. No se modifica `src/engine/`.

El juego cozy (`src/game/`) es la referencia completa: muestra cómo implementar
pantallas, estado, lógica, datos, audio, overlays y uiActions contra el motor.

## 6. Flujo del motor (game loop)

```
requestAnimationFrame
        ↓
input (teclas globales M/F3, música por pantalla)
        ↓
if (!isTransitioning) screen.update(dt, ctx)
        ↓
screens.update(dt, ctx)         ← FadeSystem.update
        ↓
screens.applyPending(ctx)       ← ejecuta requestSwitch pendiente (con/sin fade)
        ↓
screens.render(renderer, ctx)   ← pantalla actual + capa de fade
        ↓
input.endFrame()                ← limpia "pressed"
```

React NO participa del update por frame: solo recibe snapshots publicados al
store Zustand cuando `syncUI()` se llama (cambio de estado, cambio de pantalla,
acción de UI).

## 7. Decisiones e invariantes (NO romper)

1. **Índice de assets es el contrato central del juego**: los IDs lógicos viven
   en `src/game-*/data/assetIndex.ts`. El código NUNCA referencia rutas. Fallback
   a placeholder SVG garantizado.
2. **Unidades**: dt en SEGUNDOS; duraciones de fade/animación en MILISEGUNDOS.
3. **i18n solo-textos**: cero lógica en los JSON. El motor es registry-based; el
   juego registra sus locales vía `GameModule.locales`.
4. **Store por juego**: cada juego crea su store con `createGameStore<TSnapshot>`.
   El motor lo recibe vía `GameModule.store`.
5. **DEV_MODE**: se lee SOLO en server (`page.tsx`); solo `'true'` es true.
6. **Rendimiento**: el reloj HUD usa rAF propio con refs (0 re-renders/frame);
   Zustand solo publica snapshots. El loop del motor es independiente de React.
7. **Clicks del juego**: solo desde el canvas; los botones React no contaminan
   la cola de input.
8. **Paleta**: el juego cozy evita azules/índigo. El nuevo juego decidirá su
   paleta en su brief.
9. **Footer sticky**: si algún día se agregan páginas con footer, usar
   `min-h-screen flex flex-col` + `mt-auto`.
10. **FadeSystem — hold UNA vez por transición**: `advanceAfterCover()` entra en
    hold solo si `!heldOnce` (y `transition()` resetea el flag). Sin esto, hold
    re-entraba y el reinicio quedaba en negro eterno.
11. **Animación por deformación (3 capas separadas)**:
    (a) `Renderer.image({skewX})` = DEFORMACIÓN PURA (cizalla anclada en la base).
    (b) `anim.ts` = ANIMACIÓN (evaluadores kind→Deform; pandeo = senoidal).
    (c) `asset.anim` en el índice = PROPIEDAD declarativa para cualquier asset.

## 8. Gotchas de infraestructura (sandbox)

- El dev server muere si el proceso padre del shell termina → arrancar con
  `(setsid bun run dev > /dev/null 2>&1 &)`.
- **Preview de nube sin cargar = dev server muerto**: verificar con
  `pgrep -f next dev` + `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`.
- **PROBE DEL ENGINE (solo dev)**: GameRoot expone `window.__game` (el engine).
  Leer `__game.state`, `__game.input.down`, `__game.screens.currentId`,
  `__game.module.id`, `__game.getTime()`, `Object.keys(__game.actions)`.
- **Teclas trabadas (stuck keys)**: si un keyup se pierde, la tecla queda en
  `InputManager.down` → el jugador deriva. FIX: blur/visibilitychange limpian
  `down`. En E2E: `__game.input.down.clear()`.
- **Fast Refresh puede recargar la página a mitad del E2E**: si el estado se
  resetea, fue una recarga — reintentar. Artefacto del sandbox.
- **Teclas pulsadas DURANTE un fade se pierden**: `endFrame()` limpia `pressed`
  cada frame aunque el update esté congelado por `isTransitioning`. En E2E:
  sondear `__game.screens.fade.phase === 'idle'` antes de enviar teclas.
- `tsc --noEmit` reporta errores PRE-EXISTENTES en `examples/` y `skills/` (no
  son del motor; el build los ignora vía `typescript.ignoreBuildErrors`).

## 9. Regla de mantenimiento de este archivo

**Actualizar `PROJECT_STRUCTURE.md` al final de CADA tarea** que cambie
estructura, layout, contratos o conducta verificada (y sumar a §8 cualquier
gotcha nuevo descubierto). Es lo que hace que el método valga la pena: cada
iteración comparte su aprendizaje con la siguiente.
