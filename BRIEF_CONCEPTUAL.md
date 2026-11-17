# BRIEF CONCEPTUAL — Motor de videojuegos 2D web online

> Este documento describe las **capacidades del motor** de forma genérica,
> independiente de cualquier mecánica de juego concreta. El brief técnico
> original (en `docs/legacy/BRIEF_DE_DESARROLLO_TECNICO.md`) describe la
> implementación detallada; este lo adapta a una descripción de capacidades
> que el motor ofrece a cualquier juego que se construya sobre él.

---

## 1. Qué es

Un **motor de videojuegos 2D web online**. Renderiza en Canvas 2D dentro de
una app Next.js 16 + React 19 + TypeScript 5. El motor corre 100% en el
cliente: el gameplay no depende de base de datos ni API routes.

El motor está **separado físicamente** de cualquier juego concreto. Un juego
se construye implementando un `GameModule` que le provee al motor: assets,
pantallas, estado, lógica, audio, textos y acciones UI. El motor no conoce
los detalles del juego — solo ejecuta el loop, renderiza, sincroniza la UI y
gestiona las transiciones.

## 2. Stack

```
Next.js 16 (App Router) + React 19 + TypeScript 5
HTML5 Canvas 2D
Zustand (snapshot UI)
Tailwind CSS 4 + shadcn/ui (overlays React)
```

Target: desktop (con diseño que no impide futura adaptación a mobile).

## 3. Principio arquitectónico

Separar estrictamente:

```
GAME DATA        ← datos del juego (índice de assets, layout, items, etc.)
WORLD LAYOUT     ← posiciones declarativas de objetos
GAME LOGIC       ← lógica del juego (movement, collisions, interactions, economy...)
RENDERING        ← motor: canvas, renderer, animación por deformación
UI               ← overlays React (HUD, diálogos, menús)
AUDIO            ← motor: WebAudio procedural + file-based
SCREEN MANAGEMENT← motor: registro de pantallas, transiciones con fade
```

**El arte no contiene lógica de gameplay. La lógica no depende de la
composición visual del asset.** El motor (rendering, audio, screen management)
es independiente de la mecánica del juego.

## 4. Capacidades del motor

### 4.1 Renderer (Canvas 2D)

- **Resolución virtual fija** 1280×720 (16:9). El canvas se escala con
  letterbox para adaptarse al viewport sin deformar el contenido.
- **Dibujo en coordenadas virtuales**: el juego piensa en 1280×720 siempre.
- **Anclas**: `bottom-center` (base del sprite, para "gravedad") y `center`.
- **Transformaciones**: `scale`, `flip` (espejo horizontal), `alpha`,
  `skewX` (cizalla horizontal anclada en la base — deformación PURA).
- **Primitivas**: `clear`, `rect`, `roundRect`, `ellipse`, `gradientRect`
  (degradado vertical), `text` (serif/sans), `textWidth`, `dim`, `vignette`,
  `clipRect`/`restoreClip` (región de recorte).
- **Anti-aliasing**: `imageSmoothingEnabled` + `imageSmoothingQuality: 'high'`.
- **DPR**: máximo 2 (retina sin sobrecarga).

### 4.2 Animación por deformación (declarativa)

Tres capas separadas:
- **Renderer.image({skewX})** = deformación PURA (cizalla anclada en la base).
  Funciona igual para arte procedural, placeholder SVG, file o url.
- **anim.ts** = animación: evaluadores `kind → Deform`. Pandeo = senoidal;
  amplitud/periodo/fase son DATOS. Extender = 1 kind + 1 evaluator.
- **asset.anim** en el índice = propiedad declarativa para cualquier asset.
  Declararla aquí anima TODAS las instancias sin tocar código.

Costo cero para assets sin `anim`. Las instancias se desincronizan por fase
derivada de su id (campo de viento natural).

### 4.3 Índice de assets (reemplazable)

El código NUNCA referencia rutas. Solo conoce IDs lógicos (ej.
`world.market_01`, `characters.player_detail`). El índice del juego decide de
dónde sale cada imagen:

```
{ type: 'procedural', drawer: 'market' }  → drawer Canvas 2D del juego
{ type: 'file', src: '/assets/world/market_01.png' }  → PNG en /public
{ type: 'url',  src: 'https://...' }      → imagen externa
{ type: 'placeholder' }                   → SVG cuadrado con etiqueta
```

**Reemplazar arte = editar SOLO el índice. Cero cambios de código.** Fallback
automático a placeholder SVG si un file/url falla o un drawer no existe.
`loadAll()` NUNCA rechaza (degradación elegante garantizada).

Cada juego provee su propio índice y sus propios drawers procedurales vía
`GameModule.assetIndex` y `GameModule.drawers`.

### 4.4 Objetos del mundo (visual + lógica)

Cada objeto se define conceptualmente como:

```
OBJECT
├── visual: asset (id lógico), x, y, scale, layer, anchor
└── logic:  collider (rectangle | circle), interaction (payload genérico)
```

El campo `interaction` es genérico — cada juego tipa su propio payload
(comercio, recolección, conversación, mini-juego, lo que sea). El motor solo
necesita saber si hay interaction; el contenido lo interpreta el juego.

El layout del mundo es una descripción declarativa de posiciones. El diseñador
modifica `x / y / scale / layer / collider` sin tocar lógica.

### 4.5 Sistema de movimiento (vectorial)

No se hardcodean cuatro comportamientos independientes. Una sola variable
configurable (`movementAngle`) genera los vectores automáticamente:

```
right = (1, 0)        left = (-1, 0)
down  = ( cos θ,  sin θ)    up = (-cos θ, -sin θ)
```

Los vectores se normalizan. El código de movimiento solo conoce: input,
dirección, velocidad, deltaTime. Cambiar el ángulo no requiere tocar la lógica.

### 4.6 Input Manager (separado del Player)

```
Keyboard / Pointer
   ↓
InputManager
   ↓
PlayerController / Screens
```

- Teclado en `window` (ignora auto-repeat, preventDefault en flechas/Space).
- Puntero: `pointerdown` SOLO del canvas → coords virtuales; los clicks de
  botones React no se registran como clicks del juego.
- Primer gesto (keydown/pointerdown en cualquier parte) desbloquea el
  AudioContext (políticas de autoplay).
- Anti stuck keys: blur/visibilitychange limpian el estado de teclas.

### 4.7 Collision System (independiente del asset)

El PNG no define la colisión. Tipos: `rectangle`, `circle` (con offset
opcional). El sistema responde `canMove(player, proposedPosition)` y aplica
movimiento por ejes (AABB) — el jugador puede deslizar contra una pared en un
eje mientras se bloquea en el otro.

### 4.8 Screen Manager (pantallas desacopladas)

Cada pantalla implementa el contrato `GameScreen`:
```
enter(ctx, params) / exit(ctx) / update(dt, ctx) / render(renderer, ctx)
```

El ScreenManager maneja: pantalla actual, transición con/sin fade, montaje,
desmontaje, update, render, input específico (vía update), audio asociado.

- `requestSwitch(id, params, fade?)` — guarda la petición (última intención gana).
- `applyPending(ctx)` — ejecuta cuando el fade está libre.
- `isTransitioning` — el motor congela el update de la pantalla actual durante
  el fade pero sigue renderizando.

Las pantallas no controlan directamente la lógica interna de otras pantallas.

### 4.9 Game Loop (independiente de React)

```
requestAnimationFrame → input → update → collision → game state → render
```

React se usa para la aplicación/UI, no como mecanismo principal para actualizar
cada frame del gameplay. El motor publica snapshots al store Zustand cuando
hay cambios (no por frame) — React re-renderiza solo cuando el snapshot cambia.

### 4.10 Estado del juego (separado de la representación)

```
GAME STATE (lógico puro)
     ↓
UI / RENDERER (leen)
```

La UI no es la fuente de verdad. Cada juego implementa su `GameState`
extendiendo la base genérica del motor (con `version`, `subscribe`,
`markChanged`, `reset`). El motor observa los cambios y sincroniza la UI.

Estructura preparada para persistencia futura (guardado/carga).

### 4.11 Fade System (efecto reutilizable)

Máquina de estados: `idle → toBlack → hold → fromBlack`. Parámetros en ms:
`fadeIn / hold / fadeOut`. Presets del motor: `fast` (200/0/200), `normal`
(450/0/450), `long` (800/900/800).

El hold se entra UNA vez por transición (flag interno) — sin esto, el hold
re-entraba y la transición nunca terminaba (pantalla en negro eterna).

Aplicable a: transición entre escenas, aparición/desaparición de elementos,
intros, resets.

### 4.12 Audio Manager (procedural + file-based)

Independiente de las pantallas. Funciones: `playTrack`, `stop`, `setVolume`,
`toggleMute`, `dispose`. Cada juego declara su música por pantalla y sus pistas.

Dos vías:
- **Procedural (WebAudio)**: el juego define `TrackDef` (bpm, progresión de
  acordes MIDI, patrón de lead pentatónico, gain). El motor sintetiza sin
  archivos: scheduler con lookahead, pad (triangle lowpass), bass (sine), lead
  (triangle pluck).
- **File-based (HTMLAudioElement)**: el juego declara `src` en el índice para
  la pista; el motor reproduce en loop.

Mute sin chasquidos (setTargetAtTime en el master gain).

### 4.13 i18n (registry-based)

El motor no incluye locales. Cada juego registra los suyos vía
`GameModule.locales`. Funciones: `t(key, vars)`, `tOr(key, fallback, vars)`,
`setLocale`, `getLocale`, `isLocale`, `getLocales`. Interpolación `{var}`.

Solo se traducen textos. La lógica y el layout quedan intactos. Agregar un
idioma = 1 JSON + registrarlo en el GameModule.

### 4.14 UI / Overlays React

El motor publica un snapshot al store Zustand del juego. Los overlays React
leen del store y pintan UI declarativa (HUD, diálogos, menús, inventarios).

- **Letterbox 16:9**: el canvas se escala proporcionalmente; los overlays se
  posicionan sobre el canvas escalado.
- **Clicks del juego solo desde el canvas**: los botones React no contaminan la
  cola de input.
- **Acciones UI**: React llama a `engine.actions.<name>(...args)` (acciones del
  juego) o `engine.setVolume/toggleMute/setLocale` (genéricas del motor).

### 4.15 GameModule — el contrato motor ↔ juego

Cada juego provee un `GameModule` que conecta TODO lo específico al motor:

```
id, assetIndex, drawers, uiAssetUrls, locales, defaultLocale, store,
createInitialState(), createScreens(ctx), initialScreen, musicByScreen,
audioTracks?, buildSnapshot(ctx), onStateChanged?, uiActions?,
initialFadeIn?, clockDayLengthSec?
```

**Agregar un juego nuevo = implementar un GameModule y montarlo.** No se
modifica el motor.

## 5. Qué NO hace el motor (fuera de alcance)

- Mobile UI completa (el diseño no la impide, pero no se optimiza).
- Mouse-to-move (el input es teclado + puntero del canvas).
- Pathfinding.
- Generación procedural del mundo (el layout es manual, declarativo).
- Multiplayer.
- Guardado en servidor (el estado es en memoria; preparado para persistencia
  futura).
- Editor visual de mapas.
- Collider automático desde PNG.
- Perspectiva/renderizado isométrico (el mundo es 2D plano; la "perspectiva
  caballera" es solo una convención de input → vectores).
- Animaciones complejas (solo deformación declarativa por ahora).

## 6. Criterio de éxito

El motor se considera exitoso cuando un diseñador puede:

```
Implementar un GameModule con sus pantallas, estado, lógica, datos, audio
y acciones UI → montarlo en page.tsx → el juego arranca y es jugable.
```

sin modificar `src/engine/`.

Y cuando puede modificar:

```
asset (índice), x, y, scale, layer, collider, interaction, movementAngle,
pantallas, música, textos
```

sin tocar la lógica central del motor.

## 7. Regla arquitectónica final

```
                 ┌─────────────┐
                 │ GAME LOGIC  │  ← vive en src/game-* (implementa GameModule)
                 └──────┬──────┘
                        │
                  GAME STATE
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
      RENDERER         UI           AUDIO     ← viven en src/engine (GENÉRICO)
          │
          ↓
       ASSETS (índice del juego)
```

Los assets son reemplazables. El layout es editable. Los parámetros de
presentación son configurables. La lógica de juego permanece independiente del
motor. Un juego se construye implementando un `GameModule` — el motor lo
ejecuta sin conocer sus detalles.
