# Worklog — Cozy Trading Village (PoC)

Proyecto: Juego cozy 2D de comercio (PoC vertical slice) según los 3 documentos en /upload.
Stack: Next.js 16 + React 19 + TS + Tailwind 4 + Canvas 2D + Zustand.
Regla clave: el arte es reemplazable vía **índice de assets** (`src/game/data/assetIndex.ts`) — el código nunca referencia rutas directamente; fallback a placeholder SVG cuadrado si un asset no se encuentra.

---
Task ID: 1
Agent: Z.ai Code (main)
Task: Contratos y datos base del juego

Work Log:
- Creados contratos compartidos: src/game/core/types.ts, src/game/core/config.ts (resolución virtual 1280x720, movementAngle 45°), src/game/core/context.ts (ScreenContext/UiBridge).
- Creado el índice de assets: src/game/data/assetIndex.ts (IDs lógicos → fuente: procedural | file | url | placeholder; fallback automático).
- Datos del mundo/economía: src/game/data/world.ts (layout manual), items.ts, trades.ts (camino económico único), progression.ts (5 etapas de prosperidad → skyline).
- Estado: src/game/state/gameState.ts (estado lógico puro + version + subscribe), src/game/state/store.ts (Zustand, snapshot UI).
- Lógica pura: src/game/logic/movement.ts (vectores caballera normalizados), src/game/logic/CollisionSystem.ts (AABB, movimiento por ejes).

Stage Summary:
- Todos los módulos dependen solo de types.ts y data/*. Los subagentes 2-a (assets) y 2-b (primitivas engine) implementan contra estos contratos.
- IDs de assets y drawers quedan congelados como contrato. La economía: trigo(1c)/manzana(2c)/pan(6c), leña 3c, horno 12c+2 leña, pan = 2 trigo + 1 leña.

Stage Summary (final Task 1):
- Contratos congelados. Siguiente: 2-a y 2-b en paralelo, luego 3 (engine+screens), 4 (UI React), 5 (verificación).

---

Task ID: 2-b
Agent: engine-primitives-subagent
Task: Primitivas del engine (InputManager, Renderer, FadeSystem, AudioManager, ScreenManager)

Work Log:
- Leídos worklog.md, types.ts, config.ts, context.ts, assetIndex.ts y gameState.ts antes de escribir código.
- src/game/input/InputManager.ts: teclado en window (ignora e.repeat; preventDefault SIEMPRE para flechas/Space), pointerdown SOLO en el canvas → clicks React no contaminan la cola; clicks convertidos a coords virtuales 1280×720 vía getBoundingClientRect y encolados (persisten hasta consumeClick); endFrame() limpia solo "pressed"; onFirstGesture(cb) registra listeners en window para keydown+pointerdown (cualquier botón React cuenta como gesto) y dispara UNA vez.
- src/game/render/Renderer.ts: canvas 1280×720 × dpr (máx 2) con ctx.scale única; API clear/image (anchors bottom-center/center, flip espejando alrededor de x vía translate+scale(-1,1) preservando el rect)/rect/roundRect (path manual compatible)/ellipse/gradientRect vertical/text (serif Georgia, sans system-ui)/textWidth/dim/vignette (radial hacia esquinas ≈734px); alpha por método con save/restore.
- src/game/core/FadeSystem.ts: máquina idle→toBlack→hold→fromBlack con timer en ms (update recibe SEGUNDOS → dt*1000); transition() dispara onCovered UNA vez al alpha=1 y onDone al revelar; fadeIn=0 cubre inmediato; fadeIn(duration) parte de negro y revela; draw() usa renderer.dim si alpha>0.001.
- src/game/audio/AudioManager.ts: unlock() crea/resume AudioContext + master GainNode (volumen inicial CONFIG.musicVolume); playTrack consulta ASSET_INDEX['audio.music_'+track] — con src usa HTMLAudioElement loop, sin src (nuestro caso) música procedural WebAudio; scheduler setInterval(100ms) con lookahead 0.25s y corcheas (60/bpm/2), compás de 8 corcheas: pad del acorde por compás (triangle, ataque 0.4s, lowpass 900Hz, gain 0.05), bajo root-12 sine en beats 0/2 (gain 0.14), lead pluck triangle pentatónico [60,62,64,67,69,72] por corchea (lowpass 1800Hz, gain 0.08); 4 pistas definidas (title 72bpm maj7, intro 84, village 96 triadas, menu 60 con gain 0.6); stop/dispose cortan interval, osciladores vivos y buses; mute = master gain 0 vía setTargetAtTime (sin chasquidos); pista pedida antes del unlock queda pendiente y arranca sola.
- src/game/core/ScreenManager.ts: registro por ScreenId; requestSwitch guarda pendiente (última intención gana); applyPending solo si !fade.busy — con FadeConfig inicia fade.transition(onCovered→doSwitch con la petición capturada en closure) y sin fade hace doSwitch inmediato; render dibuja pantalla actual + fade encima; isTransitioning expone fade.busy para que el engine congele updates.
- Correcciones de tipos detectadas con tsc --noEmit (solo verificación, sin lint/dev): volumen anotado number (CONFIG `as const` infería literal 0.5) y case 'idle' no alcanzable en el switch de FadeSystem.

Stage Summary:
- 5 archivos nuevos creados, TS estricto sin errores propios (queda pendiente AssetLoader del agente 2-a, requerido por context.ts).
- Contratos respetados: unidades dt=segundos vs duraciones=ms documentado en FadeSystem; clicks del juego solo desde el canvas; primer gesto en window desbloquea audio; música procedural compacta sin archivos, arranca pendiente tras unlock y alterna por pista sin fugas de nodos.
- Listo para Task 3: el engine conecta InputManager+Renderer+AudioManager+ScreenManager vía ScreenContext y llama screens.update/applyPending tras el update de la pantalla.
---
Task ID: 2-a
Agent: assets-subagent
Task: Sistema de assets (AssetLoader + placeholders SVG + drawers procedurales)

Work Log:
- Leídos los contratos de Task 1: worklog.md, src/game/core/types.ts, src/game/data/assetIndex.ts, src/game/core/config.ts.
- Creado src/game/assets/placeholder.ts: makePlaceholder(id, label?, color?) → data URI SVG 160×160 (rect rx=18, borde 3px más oscuro, etiqueta = sufijo del id truncado a 14 chars, texto blanco 0.92 con sombra oscura para legibilidad); colores por categoría (world./characters./ui./audio.) con jitter de tono determinista (FNV-1a hash ±8%); placeholderImage() resuelve en onload / rechaza en onerror.
- Creado src/game/assets/drawers.ts: 30 drawers procedurales Canvas 2D con paleta cozy (verdes/cremas/marrones/terracotas/dorados, sin azules). Helpers privados reutilizables: circle/ellipse/poly/rrect/line, shadowEllipse, gableRoof, windowPane, archedDoor, smoke, grassTuft, flowerDot, bird, miniTree, wheatSpike, skyHouse/skyTallHouse/skyTower/skyAwning/skyGround. Colocaciones aleatorias con PRNG mulberry32 determinista (arte estable entre ejecuciones). background/intro_background opacos (camino y 430..510, plaza (905,480) rx180 ry75, camino vertical 530..600, franja HUD y>615 / amanecer, colinas, arco del pueblo x≈1010, pájaros). player_map_f1/f2 comparten drawPlayerMap con poses A/B de patas para animación de 2 frames.
- Creado src/game/assets/AssetLoader.ts: loadAll() en paralelo con onProgress(loaded,total); loadOne por tipo (procedural→canvas+toDataURL, placeholder→placeholderImage, file/url→Image con crossOrigin solo para 'url'); fallback a placeholder SVG 160×160 en cualquier fallo con console.warn '[assets] No se encontró "id" (src). Usando placeholder.'; loadAll NUNCA rechaza (catch por asset + red de seguridad final con canvas dibujado a mano); has/get/getUrl/getSize con errores descriptivos si el id no existe o no está cargado.
- Verificación (sin ejecutar dev/lint): `tsc --noEmit` limpio para src/game/assets/*; smoke test con ctx stub ejecutó los 30 drawers sin excepciones y validó los data URI de placeholder; archivo temporal eliminado.

Stage Summary:
- 30/30 drawers implementados y registrados en DRAWERS con los nombres exactos de assetIndex.ts (contrato congelado respetado).
- AssetLoader expone {img, url, w, h} por id: canvas procedural sirve via toDataURL, file/url conservan src natural; degradación elegante garantizada (ningún id puede romper la carga total).
- Placeholders SVG deterministas por categoría listos para UI y fallback.
- Siguiente: 2-b (primitivas engine) puede consumir AssetLoader/DRAWERS; Task 3 integra AssetLoader.loadAll() al bootstrap del engine.

---
Task ID: 3
Agent: Z.ai Code (main)
Task: GameEngine + lógica (economía, interacciones) + 6 pantallas

Work Log:
- src/game/logic/EconomySystem.ts: executeTrade/produceBread/gatherResource/canAffordCosts/costLineOf.
- src/game/logic/interactions.ts: registro genérico INTERACTION_HANDLERS (merchant/gather/oven) — sin ifs por tipo en Player.
- Pantallas: TitleScreen (canvas bg + overlay React), IntroScreen (2 frames, movimiento horizontal, saltable), GameScreen (movimiento caballera por ejes, colisión, prompt pill, y-sort, debug F3), InteractionScreen (player izquierda / target derecha, panel React), MenuScreen y RestartScreen (overlays sobre gameplay congelado).
- src/game/core/GameEngine.ts: loop rAF, música por pantalla, syncUI → Zustand, acciones UI (start/resume/restart/trade/volume/mute), UiBridge.
- src/game/core/engineBridge.ts: singleton para que React invoque acciones del engine.

Stage Summary:
- Arquitectura completa del lado engine lista. Falta UI React (Task 4) y verificación (Task 5).

---
Task ID: 4
Agent: Z.ai Code (main)
Task: UI React sobre el engine

Work Log:
- src/app/page.tsx → GameRoot; layout.tsx con metadata es y título del juego.
- GameRoot: montaje/destrucción del engine, escalado letterbox 16:9 (resolución virtual fija), overlays condicionales por pantalla, hook dev window.__game (solo dev).
- Overlays: TitleOverlay (botón + controles + nota del índice), HudOverlay (monedas + inventario + skyline con chip de etapa), InteractionOverlay (diálogo con opciones, disabled states, resultMessage), MenuOverlay (continuar/música slider/reiniciar), RestartOverlay (confirmación), Toasts (auto-dismiss), AssetImg (imgs desde el índice).

Stage Summary:
- UI reactiva al snapshot del engine vía Zustand; sin re-renders por frame.

---
Task ID: 5
Agent: Z.ai Code (main)
Task: Integración, lint y verificación E2E con Agent Browser

Work Log:
- Correcciones: colisión de nombres GameScreen (interfaz vs clase), spawn del jugador tras la intro (PLAYER_START), retratos de interacción reposicionados (encima del panel), watchdog anti-rAF-congelado en GameEngine (slow-motion si la pestaña está oculta).
- Verificación E2E (Agent Browser, con capturas): título → intro (skip) → gameplay; movimiento vectorial (240px/s) verificado por coords debug; colisiones bloqueando y deslizando; prompts [E]; recolección 31 trigo + 11 manzanas; comercio (ventas, compra de leña, disabled states con razones); construcción del horno (12c + 2 leña); producción 7 panes (receta 2 trigo + 1 leña); venta de panes → coinsEarned 81, prosperity 1→4, toasts y skyline 0→4; menú (continuar, mute, slider, reiniciar); reinicio → estado fresco e intro de nuevo; horno frío con gating narrativo.
- bun run lint: 0 problemas. tsc --noEmit: limpio. dev.log: 200 OK sin errores. Consola del navegador: sin errores.

Stage Summary:
- Criterio de éxito técnico del brief (sección 26) verificado de extremo a extremo en el navegador. El sistema de índice de assets permite reemplazar arte sin tocar código (fallback automático a placeholder SVG si falla).

---

Task ID: 6
Agent: Z.ai Code (main)
Task: i18n ENG/SPA + reloj día/noche + flechas en interacción + layout 2 filas + intro de estudio + TODO.md

Work Log:
- TODO.md creado: deuda de features (límite de recolección por cantidad/tiempo; ventana de diálogo estilo novela visual con respuestas predefinidas).
- i18n: src/game/i18n/ (index.ts con t/tOr/setLocale/isLocale + locales/es.json y en.json + useT.ts hook reactivo al store). AGREGAR IDIOMA = 1 JSON + 1 entrada en DICTS/LOCALES. Interpolación {var}. Traducidos: overlays React (Title/Menu/Hud/Interaction/Restart), textos de canvas (Title/Intro/Menu/GameScreen prompt), lógica (EconomySystem, interactions) y datos vía claves (trades.*, world.*, progression.stageN.*, items.*) con fallback a los datos originales.
- Switcher Idioma (Español/English) en menú de pausa; engine.uiSetLocale publica locale en el snapshot (GameUISnapshot.locale); los textos de canvas cambian al vuelo.
- Reloj HUD: DayClock (chip arriba-centro, misma jerarquía que items/skyline) con anillo SVG radial + icono de fase (Sunrise/Sun/Sunset/Moon) + etiqueta i18n. rAF propio actualiza refs del SVG (cero re-renders por frame); React solo re-renderiza al cambiar de fase. CONFIG.day (dayLengthSec 180, fases dawn/day/dusk/night). Engine.getClock(). Toasts movidos a top-16 (bajo el reloj).
- Selección por teclado en InteractionOverlay: ↑/↓ mueven puntero triangular (con wrap), Enter ejecuta, guard para opciones deshabilitadas; mouse intacto (mousemove = hover select, clic = ejecutar). Guard de modalidad (keyNavAt) para que el scrollIntoView bajo cursor quieto no secuestre la selección (bug detectado y corregido en E2E). Enter hace preventDefault para no re-disparar botones con foco; act() hace blur.
- Layout interacción en 2 filas: canvas divide la pantalla — tercio superior personajes a tamaño completo recortados con clipRect/restoreClip (nuevo en Renderer, equivalente overflow:hidden), dos tercios inferiores para el panel (contenedor top-1/3). HUD elevado a z-30 > panel z-20: los contadores (monedas/items/skyline) se ven SIEMPRE encima de la ventana (verificado recolectando manzanas: manzana:3 visible).
- Pantalla de estudio: StudioScreen (id 'studio', primera pantalla en engine.start()) — fondo sólido configurable CONFIG.studio.background (blanco por defecto), logo del índice 'ui.studio_logo' (placeholder por defecto → reemplazable sin tocar código) con envolvente fade in (900ms) → hold (1500ms) → fade out (700ms) → title con fade normal; saltable con Enter/Space/ESC/clic. MUSIC_BY_SCREEN.studio='title'. Solo primera carga: reiniciar partida va a intro directamente (igual que antes).
- TODO.md adicional: migrar textos a JSON si crece, persistencia.
- Verificación E2E (Agent Browser): studio(white+logo placeholder) → title → intro → gameplay; reloj Día→Atardecer→Noche con anillo avanzando; menú EN/ES switch traduce todo (Paused/Continue/Language…); prompt [E] Recolectar trigo; navegación flechas 5 opciones mercader con wrap; Enter no-op en deshabilitadas; venta y recolección por teclado y mouse (coins 0→1, wheat 1→0, apple 3); horno frío (estado vacío); reload → studio de nuevo; viewport 480×700 (HUD sobre panel). bun run lint: 0. tsc: limpio (solo errores pre-existentes en examples/ y skills/). dev.log: GET / 200 sin errores. Consola del navegador: sin errores.

Stage Summary:
- 6 features entregadas y verificadas en navegador. El sistema i18n es solo-textos (cero cambios de lógica/layout) y extensible por JSON. El reloj no añade re-renders por frame. La ventana de interacción ya no tapa el HUD (inverso: HUD encima) y los personajes viven en su propia fila recortada. El logo del estudio se reemplaza editando SOLO el índice de assets.

---
Task ID: 7
Agent: Z.ai Code (main)
Task: 5 ajustes de feedback — inglés por defecto, anclaje superior de la ventana de interacción, sin ciclado en la lista, DEV_MODE, Enter reemplaza a Espacio

Work Log:
- Idioma por defecto INGLÉS: DEFAULT_LOCALE='en' + LOCALES reordenado (English primero) en src/game/i18n/index.ts; store locale inicial 'en'; <html lang="en"> + metadata en inglés en layout.tsx; texto de carga "Preparando el pueblo…" migrado a i18n (common.loading). El juego SIEMPRE arranca en inglés (sin persistencia de locale: tras cambiar a ES y recargar, vuelve a EN — verificado).
- Ventana de interacción anclada ARRIBA del contenedor (según captura de referencia con líneas verdes): InteractionOverlay contenedor pasa de `items-end pb-5` a `items-start pt-4` (top-1/3 → la ventana nace siempre del borde superior sin importar su alto); animación de entrada cambiada a slide-in-from-top-4.
- Selección SIN ciclado: en InteractionOverlay el wrap por módulo se reemplaza por clamp (Math.min/max): ↑ se frena en el primer ítem, ↓ en el último (verificado con 6×ArrowDown y 7×ArrowUp sobre 5 opciones del mercader).
- DEV_MODE: page.tsx (server component) lee process.env.DEV_MODE === 'true' (semántica pedida: "false"/vacío/no definida ⇒ false) y lo pasa como prop devMode → GameRoot → TitleOverlay; la nota "Arte procedural de demostración…" solo se renderiza con devMode. .env con DEV_MODE=true documentado. Verificado: true → nota visible; false (requiere reinicio del dev server para releer .env) → nota oculta; restaurado a true.
- Enter reemplaza a Espacio para interactuar: GameScreen ahora acepta KeyE/Enter/NumpadEnter (Space eliminado); hint del menú actualizado a "E/Enter interactuar" (EN y ES). Título/Intro/Studio siguen aceptando Enter/Space/clic para arrancar/saltar (no es interacción de gameplay). Verificado E2E: Enter abre horno/recolección/mercado, ejecuta opciones y respeta el guard de deshabilitadas; Space NO abre interacción.
- Fix colateral i18n detectado en E2E: el mensaje de resultado de comercio usaba la etiqueta cruda del dato ("Sold: Vender trigo. +1 coin"); ahora usa tOr(`trades.${offer.id}.label`, offer.label) → "Sold: Sell wheat. +1 coin".
- Verificación E2E completa (Agent Browser, 14 capturas): título EN + nota DEV_MODE; juego → prompt [E] en inglés; Enter abre los 3 tipos de interacción; panel anclado arriba (horno y mercader); clamp de puntero en ambos extremos; Enter ejecuta (gather +1 wheat, sell → coins 1); guard en deshabilitadas; Space inerte; menú EN (English activo, hint E/Enter) → Español → recarga → vuelve a EN; viewport 480×700 OK. bun run lint: 0. tsc --noEmit: limpio (solo errores pre-existentes en examples/ y skills/). dev.log: GET / 200 sin errores de runtime (único error de consola: race RSC al recargar durante el reinicio del server, recuperado por fallback de navegación).
- Nota infra: el dev server en este sandbox muere si el proceso padre del shell termina; arranque estable logrado con `(setsid bun run dev > /dev/null 2>&1 &)`.

Stage Summary:
- Los 5 pedidos implementados y verificados en navegador. El juego inicia siempre en inglés; la ventana de interacción nace del borde superior del contenedor inferior; el puntero de teclado ya no cicla; DEV_MODE controla el rótulo de arte de demo; Enter es la tecla de interacción (Espacio fuera).
- PROPUESTA pendiente de aprobación: índice de controles (src/game/data/controlsIndex.ts, ACTION → códigos de tecla), registrada en TODO.md — NO implementada a la espera del visto bueno.

---
Task ID: 8
Agent: Z.ai Code (main)
Task: Preparar deploy en Vercel (limpieza de Prisma, next.config y build script) + TODO índice de controles + archivo de resumen de estructura

Work Log:
- Auditoría de uso de Prisma: grep en src/ — solo src/lib/db.ts importaba @prisma/client; NINGÚN archivo referenciaba '@/lib/db'; la API route es un placeholder sin uso. Conclusión: Prisma NO se usa → limpieza completa.
- package.json: build simplificado a "next build" (eliminado el copiado a .next/standalone); start cambiado a "next start" (el anterior apuntaba a server.js standalone, roto tras quitar output standalone); eliminados scripts db:push/db:generate/db:migrate/db:reset; eliminadas dependencias @prisma/client y prisma; bun install actualizó bun.lock (2 paquetes removidos).
- next.config.ts: eliminado output: "standalone". .env: reemplazado DATABASE_URL por DEV_MODE=true (restaurando el estado documentado en Task 7; el .env actual no tenía DEV_MODE).
- Borrados: src/lib/db.ts, prisma/ (schema.prisma), db/ (custom.db). Verificado con grep: cero referencias a prisma en src/.
- TODO.md: el ítem "Propuesta — índice de controles" YA estaba registrado (Task 7, sección ## Controles); verificado, sin duplicar.
- Creado PROJECT_STRUCTURE.md (raíz): mapa completo del proyecto para futuras iteraciones — comandos, mapa de archivos con responsabilidades, flujo de pantallas, controles actuales, invariantes/decisiones, gotchas de sandbox. Regla establecida: próxima iteración lee SOLO ese archivo antes que explorar código.
- Verificación post-limpieza: bun run lint 0 problemas; dev server reiniciado (setsid) y E2E con Agent Browser: studio (fondo blanco + logo placeholder) → title EN con nota DEV_MODE visible (DEV_MODE=true en .env) → Start adventure → intro saltada con Enter → gameplay con mundo/HUD/reloj renderizados; GET / 200; sin errores de página ni de consola.

Stage Summary:
- Proyecto LISTO PARA VERCEL: build "next build", sin standalone, sin Prisma (deps, scripts, código, schema y db eliminados). Única env opcional: DEV_MODE (documentada para dashboard de Vercel).
- PROJECT_STRUCTURE.md es ahora el punto de entrada del proyecto: leerlo primero en la próxima iteración (después worklog.md y TODO.md).

---
Task ID: 9
Agent: Z.ai Code (main)
Task: Recomposición del modo interacción (contenedor único, personajes bottom/gravedad, panel flotante a mitad de pantalla) + diagnóstico preview de nube + evaluación del método PROJECT_STRUCTURE.md

Work Log:
- Diagnóstico preview nube: el dev server del sandbox estaba MUERTO (sin proceso, dev.log vacío, curl 000). El proyecto está bien (usuario lo confirmó en localhost y en su deploy Vercel). Reiniciado con setsid → HTTP 200. Causa raíz: el sandbox mata procesos entre sesiones.
- Recomposición (spec del usuario): contenedor ÚNICO en lugar de 2 filas.
  - InteractionScreen.ts (canvas): eliminados clipRect del tercio superior, restoreClip y la línea separadora. Personajes anclados ABAJO ("gravedad"): BASE_Y = VIRTUAL_HEIGHT − 120 (margen para que el HUD no tape del todo la base); xPlayer=160 / xTarget=1120 (flanquean el panel); glows y sombras de suelo reubicados. Escalas sin cambio (0.8 / 0.8 / 1.1).
  - InteractionOverlay.tsx (React): wrapper pasa de `inset-x-0 bottom-0 top-1/3` a `inset-0 z-20 pointer-events-none px-4`; panel con el MISMO diseño pero `absolute left-1/2 top-1/2 -translate-x-1/2` (position top, mitad de pantalla, entre los dos personajes) + `flex flex-col max-h-[calc(50%-16px)]`; la lista de opciones usa `min-h-0 shrink overflow-y-auto` (colapsa si falta alto en placeo chico en vez de max-h fijo); `pointer-events-auto` solo en el panel → clics fuera del panel atraviesan al canvas y CIERRAN la interacción (como el clic en el tercio superior antes).
- Hallazgo de geometría (costó tiempo de E2E): los colliders del mundo TAMBIÉN anclan bottom-center (solidToAABB: rect y = obj.y − height) y el box del jugador es 44×26 con base en p.y → el market bloquea desde y=390 y el trigo desde y=535. Navegación E2E re-planificada con esa geometría. Documentado en PROJECT_STRUCTURE.md §6.4.
- Verificación E2E (Agent Browser): prompt [E] Gather apples → Enter abre interacción → composición correcta (jugador abajo-izquierda, manzano abajo-derecha, panel flotando entre ambos a mitad de pantalla, HUD encima, bases visibles) → ArrowDown + Enter ejecuta → inventory.apple 0→1, mensaje "You gathered 1 apple." → clic fuera del panel cierra → ESC ya verificado antes. Sin errores de página/consola. bun run lint: 0 problemas.
- Artefacto sandbox detectado durante E2E: Fast Refresh recarga la página a mitad del test (Turbopack + tee dev.log) — resetea el juego a PLAYER_START/title. No afecta localhost/Vercel. Documentado como gotcha.
- Evaluación del método PROJECT_STRUCTURE.md: ÚTIL — llevó directo a los 2 archivos a editar sin exploración; los únicos reads extra fueron detalle-de-línea permitido por la propia regla del archivo. Brechas detectadas (geometría de colliders, teclado sintético para E2E, recargas Fast Refresh) fueron INCORPORADAS al archivo (§6.4, §8) + nueva §9 que obliga a actualizarlo al final de cada tarea. El método mejora por iteración.

Stage Summary:
- Modo interacción recomputado según spec: 1 contenedor full-screen, personajes con gravedad y base visible sobre el HUD, ventana sin cambios de diseño flotando por encima a mitad de pantalla entre los personajes. Cierres por ESC/clic-fuera intactos. Teclado (clamp sin ciclado + Enter) intacto y verificado.
- La preview de nube fallaba por dev server muerto del sandbox (no del proyecto). Reiniciado.
- Método del archivo resumen VALIDADO y mejorado con feedback de esta iteración (regla §9 de mantenimiento).

---
Task ID: 10
Agent: Z.ai Code (main)
Task: Corrección de geometría de la ventana de interacción (centrado real en el viewport) + fix de robustez stuck-keys en InputManager

Work Log:
- Reporte del usuario con captura: la ventana quedaba colgando por debajo del medio (su borde SUPERIOR anclado a top-1/2), dejando vacía la zona superior-media. Nueva spec: el CENTRO del panel = centro del viewport (X e Y), sin importar el tamaño del contenido; así una ventana chica no queda ni muy arriba ni con vacío asimétrico abajo.
- Fix (InteractionOverlay.tsx): `-translate-y-1/2` añadido + `max-h-[calc(50%-16px)]` → `max-h-[calc(100%-6rem)]` (márgenes simétricos por el centrado). Comentario de cabecera actualizado. 1 línea de clases + doc.
- Verificación E2E (Agent Browser, con sesión fresca): ventana chica (1 ítem, trigo): offX=0 offY=0, 35% alto. Ventana ALTA (5 opciones, mercader): offX=0 offY=0, 78% alto — cruza el centro exacto, personajes flanqueándola abajo, HUD visible encima. Conducta intacta: Enter ejecuta (gather wheat 0→1; sell wheat → coins 0→1, wheat 1→0), clic fuera cierra, sin errores de página/consola. bun run lint: 0.
- BUG REAL descubierto por el E2E: InputManager no limpiaba `down` al perder foco/ocultar pestaña → un keyup perdido (alt-tab, headless) deja la tecla trabada → el jugador deriva sola (parece "congelado"; en el test quedó clamped en la esquina 70,195 detrás del árbol). FIX: listeners `blur` + `visibilitychange` que hacen `down.clear()`. Afecta también a usuarios reales (alt-tab manteniendo flecha).
- Instrumentación E2E: GameRoot YA exponía `window.__game` (dev) → probe de `state.player`, `input.down`, `screens.current.promptObject` convierte la navegación en determinista (sondeo en vez de adivinar por screenshot). Documentado en PROJECT_STRUCTURE.md §8.
- Hallazgo de navegación: encaje (wedge) contra la roca — con la caja del jugador dentro de la banda Y del collider y pegado a su cara X, right/up/down se bloquean a la vez; solo LEFT libera. Documentado.
- Aprendizajes volcados a PROJECT_STRUCTURE.md (§3 InteractionOverlay, §6.4 centrado del panel, §8: probe del engine, stuck keys, wedge, velocidad variable).

Stage Summary:
- Ventana de interacción ahora CENTRADA en el viewport (centro invariante, alto variable por contenido): medido offX=0/offY=0 tanto con 1 ítem (35%) como con 5 (78%).
- Robustez de input mejorada: blur/visibilitychange limpian teclas mantenidas (fix de deriva infinita para usuarios reales).
- Método del archivo resumen: funcionó para ubicar los archivos, pero el E2E exigió leer detalles (InputManager, GameEngine) — el archivo ahora documenta el probe `__game` que evita ese costo la próxima vez.

---
Task ID: 11
Agent: Z.ai Code (main)
Task: Fix botón "Reiniciar juego" (pantalla negra eterna tras confirmar) + reinicio del dev server del sandbox

Work Log:
- Reporte del usuario: en el menú de pausa, al intentar reiniciar, "no pasa nada, solo se pone negro el gameplay".
- Entorno: dev server del sandbox MUERTO al iniciar la sesión (comportamiento conocido §8) → reiniciado con setsid, HTTP 200, Ready 790ms.
- Diagnóstico E2E con Agent Browser + probe `__game`: bug reproducido — menú → Restart game → Yes, restart → pantalla NEGRA con currentId='intro' y la transición nunca termina; sin errores de página/consola (el loop moría silenciosamente en un estado estable pero inútil).
- Causa raíz (FadeSystem.advanceAfterCover): la condición `phase !== 'idle' && holdMs > 0` re-entraba en 'hold' DESDE 'hold', reseteando el timer → bucle infinito. fade.busy quedaba true para siempre → el engine congelaba el update de la pantalla (ni Enter ni clic podían saltar la intro). fade.long (hold 900ms) — la ÚNICA config con hold>0 — solo se usa en uiConfirmRestart(); por eso el bug aparecía SOLO al reiniciar (título/intro/gameplay usan fade.normal/fast con hold=0, o fadeIn() directo sin hold).
- FIX (3 ediciones mínimas en FadeSystem.ts): flag privado `heldOnce` — la fase hold se entra UNA sola vez por transición; `transition()` lo resetea. Comentarios de cabecera actualizados.
- Verificación E2E (Agent Browser, con espía montado sobre requestSwitch para trazar switches con timestamps): menú → Restart game → Yes, restart → fade.long completo (toBlack→hold→fromBlack→idle) → intro revelada → intro auto-completa por llegada → gameplay con estado reseteado (coins=0, prosperity=0, player.x=250=PLAYER_START). Spy: ['5.4s:intro+fade', '14.2s:gameplay+fade'] — timing exacto (0.9s fade entrada + 7.83s intro). Camino Cancelar verificado: vuelve al menú SIN resetear (coins conservadas). Captura final: HUD en 0, ciclo Day, mundo renderizado. Sin errores. bun run lint: 0 problemas.
- Hallazgo E2E (gotcha nuevo en §8): teclas pulsadas DURANTE un fade se pierden (endFrame limpia `pressed` cada frame aunque el update esté congelado por isTransitioning) — los Enter enviados durante la entrada a la intro no llegaron en headless. Para humanos es imperceptible (la intro es saltable cuando ya se ve).
- Falso positivo descartado durante el diagnóstico: un segundo toBlack observado en la 1ra pasada post-fix resultó ser artefacto del click del CLI en headless (doble requestSwitch idempotente al mismo destino); la 2da pasada con espía mostró secuencia 100% limpia.
- Pregunta del usuario sobre el método: confirmado — PROJECT_STRUCTURE.md se actualiza al final de CADA tarea (regla §9, vigente desde Task 9). Esta tarea demostró el ciclo completo: el diagnóstico usó §8 (probe __game, reinicio setsid) y devuelve 3 aprendizajes nuevos (bug hold §6.11, teclas-durante-fade §8, entrada §3 de FadeSystem).

Stage Summary:
- Reiniciar juego funciona de extremo a extremo: confirmación → fade largo → intro (saltable) → gameplay con estado fresco; Cancelar conserva el progreso.
- FadeSystem blindado: la máquina de estados ya no puede quedar atrapada en hold (regresión imposible sin quitar el flag heldOnce).
- Método del archivo resumen: de nuevo útil (diagnóstico sin explorar código); se fortalece con el gotcha de teclas durante fades.

---
Task ID: 12
Agent: Z.ai Code (main)
Task: Feature de motor — animación por deformación ("pandeo" por viento) aplicable a cualquier asset + pasto alto 3x

Work Log:
- Spec del usuario: no animar algo puntual sino construir la FEATURE como motor: (1) función de deformación pura — skew de derecha a izquierda anclado en la base, una sola responsabilidad; (2) función de animación dueña de amplitud/frecuencia/loop; (3) propiedad aplicable a CUALQUIER asset; (4) estructura extensible para futuras animaciones "sin comprometer recursos". El pasto, además, 3x más grande (solo escala).
- Arquitectura en 3 capas (separación estricta, registrada como invariante §6.12):
  - DEFORMACIÓN PURA (Renderer.image): nueva opción `skewX` — cizalla horizontal vía ctx.transform anclada en el PUNTO DE ANCLAJE (la base, con bottom-center): la base no se mueve y el tope se corre skewX × alto. No sabe nada de tiempo ni de viento. Funciona igual para arte procedural (canvas), placeholder SVG, PNG (file) o url externa porque se aplica en el momento del dibujo → UNA sola función cubre bitmap y SVG (respuesta a la duda del usuario: no hacen falta dos).
  - ANIMACIÓN (src/game/render/anim.ts, NUEVO): evaluadores puros kind→Deform en ANIM_EVALUATORS; `pandeo` = oscilador senoidal skewX = amplitude·sin(2π(t/periodSec + phase)). evalAnim(def, t, phaseShift, out) escribe en un buffer compartido (cero allocaciones por frame); phaseFromId(id) (FNV-1a → 0..1) da fase determinista por instancia → campo de viento con instancias desincronizadas sin datos extra.
  - PROPIEDAD DECLARATIVA (índice de assets): AnimDef {kind, amplitude, periodSec, phase?} como contrato en types.ts + campo `anim?` en AssetSourceDef. Cualquier asset del índice puede animarse editando SOLO datos. AssetLoader.getAnim(id) como facade (disponible pre-carga). GameScreen aplica genéricamente: si el asset del objeto tiene anim → evalAnim(anim, ctx.time, phaseFromId(obj.id)).skewX → renderer.image({skewX}). Extender a otra animación = 1 kind en types.ts + 1 evaluator en anim.ts + setear `anim` en el índice. Assets sin `anim`: costo cero (ni siquiera evalúan).
- Pasto: NUEVO drawer `grass_tuft` (canvas 64×48 transparente, 7 briznas curvas en abanico con panza hacia afuera, 2 tonos de verde cozy, césped apretado en la base) + asset `world.grass_tuft` con `anim: { kind: 'pandeo', amplitude: 0.16, periodSec: 2.4 }` (el tope se corre ±16% del alto, ciclo de 2.4s — viento suave). 18 instancias en WORLD_LAYOUT (grass_1..18, clusters en praderas fuera de caminos/plaza/colliders), escalas 2.6–3.2 (≥3x el matita horneado), collision: null (el jugador atraviesa) y y-sort por base (pasa por detrás/delante de forma natural).
- Decisión de arte documentada: el scatter de matitas chicas horneado en drawBackground QUEDA (capa lejana estática = textura de suelo); el pasto alto animado es la capa cercana. El scatter del fondo de intro (drawIntroBackground) no se tocó (otra pantalla).
- Verificación E2E (Agent Browser): gameplay con las 18 matas grandes visibles e integradas a la paleta; dos capturas separadas 1.5s (≈0.6 ciclo) muestran las matas ladeando en sentidos OPUESTOS (oscilación real) y con inclinaciones distintas entre clusters en el mismo frame (desincronización por fase funcionando). Sin errores de página/consola. bun run lint: 0 problemas.
- Nota de diseño heredada: menu/restart renderizan el gameplay congelado → el pandeo sigue ahí (el viento no se pausa); intencional.

Stage Summary:
- El motor tiene su primer sistema de animación por deformación: skew puro anclado a la base (una función para cualquier fuente de imagen) + pandeo por viento (amplitud/loop/fase como datos) + propiedad `anim` declarativa en el índice. Pasto alto 3x oscilando en 18 clusters con viento desincronizado. Estructura lista para nuevas animaciones (squash, flutter, bob...) sin tocar lo existente y sin costo cuando no se usa.
