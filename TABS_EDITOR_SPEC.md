# TABS EDITOR — Especificación técnica (TO DO)

> Herramienta interna de desarrollo para sincronizar tabs rítmicos con
> archivos de audio. No se implementa ahora — este documento captura las
> especificaciones para no perder las ideas.

---

## 1. Propósito

El editor permite al desarrollador:
- Cargar un archivo de audio (OST de batalla/escena).
- Crear y editar tabs (notas rítmicas) sobre 3 lanes paralelas.
- Sincronizar visualmente los tabs con la waveform del audio.
- Exportar un archivo JSON que el juego consume como datos de tabs.

El juego (`RhythmBattleScreen`) carga este JSON en vez de generar tabs
aleatorios. Esto permite diseñar patrones rítmicos a medida para cada
antagonista/escena.

---

## 2. Arquitectura

### Ubicación
```
src/
  editor/                      ← solo compila si ENABLE_EDITOR=true
    EditorApp.tsx              ← host del editor (Canvas + UI React)
    TabEditorScreen.ts         ← lógica de edición (Canvas 2D)
    TabFile.ts                 ← cargar/guardar/abrir archivos JSON
    components/
      Timeline.tsx             ← timeline con waveform + 3 pistas de tabs
      TransportControls.tsx    ← play/pause/seek/volumen
      TabMarker.tsx            ← marcador individual de tab (draggable)
      FileMenu.tsx             ← abrir/guardar/guardar como/reemplazar audio
  app/
    editor/
      page.tsx                 ← ruta /editor (gateada por ENABLE_EDITOR)
```

### Gateo
```ts
// app/editor/page.tsx
if (process.env.ENABLE_EDITOR !== 'true') return <div>404</div>
return <EditorApp />
```

### Motor reutilizado
- **Renderer** del motor (Canvas 2D) — para dibujar waveform + tabs.
- **AudioManager.playLoop()** del motor — para reproducir el audio en loop.
  No se necesita refactor pesado; `playLoop` ya acepta `src` + `volume`.
- **NO** se usa `PerspectiveTrack` — el editor usa lanes paralelas planas
  (sin perspectiva). Es una herramienta, no gameplay.

### Código separado si es necesario
Si reutilizar el motor agrega complejidad innecesaria, el editor puede tener
su propio código de Canvas + Audio. La regla: **código ligero especializado**
para la herramienta, **código pesado del motor** para el gameplay. No mezclar.

---

## 3. UI — Minimalista, funcional

### Layout
```
┌──────────────────────────────────────────────────┐
│  [Abrir] [Guardar] [Guardar como] [Reemplazar]  │ ← FileMenu
├──────────────────────────────────────────────────┤
│  ▶ Play  ⏸ Pause  ━━━━━●━━━━━ (seek)  Vol: ███ │ ← Transport
├──────────────────────────────────────────────────┤
│  Waveform  ░░▒▒▓▓██▓▓▒▒░░░▒▒▓▓░░  (minimalista)│ ← Waveform
├──────────────────────────────────────────────────┤
│  Lane 0:  ●─────●───────●─────────●──────        │ ← Pista tabs
│  Lane 1:  ──●───────────●───●───────────        │
│  Lane 2:  ──────●───●───────────●───────        │
├──────────────────────────────────────────────────┤
│  Audio: ost_battle.mp3  |  BPM: 96  |  Tabs: 12  │ ← Status bar
└──────────────────────────────────────────────────┘
```

### Waveform (80.1.3 + 80.1.4)
- **No detallada** — barras verticales simples (como un VU meter horizontal).
- Se calcula una vez al cargar el audio (Web Audio API `AnalyserNode` o
  muestreo del buffer). No se recalcula por frame.
- Altura fija (~40px). Color gris/oscuro. Minimalista.

### Lanes (80.1.1)
- 3 pistas horizontales paralelas (NO perspectiva del motor).
- Cada lane es una franja horizontal de ~40px con fondo oscuro.
- Los tabs son círculos/marcadores sobre la línea de tiempo.
- El cursor de reproducción (línea vertical) se mueve de izq a der.

---

## 4. Interacción (80.1.5 + 80.1.6)

### Play/Pause
- Botón ▶/⏸ en la UI.
- Tecla **Espacio** toggle play/pause.
- Al reproducir: el cursor de tiempo avanza. Los tabs se "activan" cuando
  el cursor los cruza (feedback visual: cambian de color).

### Zoom (100.2)
- **Zoom in / zoom out** de las pistas de edición (timeline horizontal).
- Rueda del mouse o botones +/- para ajustar el nivel de zoom.
- El zoom escala la timeline horizontalmente: más zoom = más resolución
  temporal por pixel (útil para tabs cercanos). Menos zoom = vista
  panorámica (útil para audios largos).
- El waveform y las 3 pistas escalan juntas (mismo eje temporal).
- Mínimo: ver toda la duración del audio. Máximo: 1px por milisegundo.

### Crear tabs
- **Click izquierdo** en una lane → crea un tab en esa posición de tiempo.
- El tab se coloca en el `hitTime` = posición del cursor de tiempo en ese
  punto (mapeado desde px a segundos).

### Borrar tabs
- **Click derecho** en un tab existente → lo borra.
- No requiere menú contextual — click derecho directo.

### Mover tabs (opcional, futuro)
- Arrastrar un tab para ajustar su timing.
- Teclas ←/→ con tab seleccionado para ajuste fino.

---

## 5. Archivos (80.1.7)

### Formato del archivo de tabs (JSON)
```json
{
  "audioSrc": "/assets/audio/ost_battle.mp3",
  "bpm": 96,
  "lanes": 3,
  "tabs": [
    { "lane": 0, "hitTime": 1.5 },
    { "lane": 2, "hitTime": 2.3 },
    { "lane": 1, "hitTime": 3.1 },
    { "lane": 0, "hitTime": 3.9 }
  ]
}
```

### Configuración de rutas (tool config)
```
// src/editor/editorConfig.ts
export const EDITOR_CONFIG = {
  // Carpeta donde el motor busca audios (relativa a /public)
  audioOutputDir: '/assets/audio/',
  // Carpeta donde el juego consume los archivos de tabs
  tabsOutputDir: 'src/game-next/data/tabs/',
}
```

### Operaciones
- **Abrir**: cargar un archivo `.tabs.json` existente. Carga los tabs + el
  audio referenciado. Si el audio no se encuentra, alerta.
- **Guardar**: sobrescribe el archivo actual (tabs + referencia de audio).
  Los tabs se guardan en `tabsOutputDir`. Si el archivo de audio está fuera
  de `audioOutputDir`, se copia ahí.
- **Guardar como**: diálogo de nombre → crea un nuevo archivo en `tabsOutputDir`.
- **Reemplazar audio**: cargar un nuevo archivo de audio. Se copia a
  `audioOutputDir`. Los tabs existentes se conservan (puede haber desync).

### Consumo por el juego
El `RhythmBattleScreen` carga el JSON:
```ts
import battleTabs from '@/game-next/data/tabs/battle_duende.tabs.json'
// usa battleTabs.tabs en vez de generateTurnTabs()
```

### Nota sobre filesystem
El editor corre en el browser. Para guardar/copiar archivos, usar:
- **Descarga** del JSON (browser download) → el developer lo mueve a
  `tabsOutputDir` manualmente. O:
- **API de File System Access** (`showSaveFilePicker`) si el browser la
  soporta (Chrome/Edge). Permite guardar directo en el filesystem.

Para la copia de audio a `audioOutputDir`: el developer arrastra el archivo
al editor. El editor lo reproduce via `URL.createObjectURL`. Al guardar,
el developer copia manualmente el archivo a `/public/assets/audio/`. El
JSON referencia la ruta pública (`/assets/audio/ost_battle.mp3`).

---

## 6. Dependencias

### Lo que se reutiliza del motor
- `Renderer` (Canvas 2D) — para dibujar waveform, lanes, tabs.
- `AudioManager.playLoop()` — para reproducir el audio.
- `VIRTUAL_WIDTH/HEIGHT` — resolución del canvas del editor.

### Lo que NO se usa del motor
- `PerspectiveTrack` — el editor usa lanes planas.
- `ScreenManager`, `GameEngine`, `GameModule` — el editor es standalone.
- `FadeSystem`, `InputManager` — el editor maneja su propio input.

### Si el motor es pesado de importar
Si importar `Renderer` o `AudioManager` arrastra dependencias del motor
que complican el editor, crear código ligero propio:
- Canvas 2D directo (sin la clase `Renderer`).
- `Audio` HTML5 + `AnalyserNode` directo (sin `AudioManager`).

**Decidir al implementar**: reutilizar si es limpio, separar si es pesado.

---

## 7. Estimación

- **Scaffold** (ruta, UI básica, canvas, transport): ~2h.
- **Waveform + lanes + crear/borrar tabs**: ~2h.
- **Abrir/guardar/guardar como + formato JSON**: ~2h.
- **Sync tabs con audio playback**: ~1h.
- **Pulido + testing**: ~1h.
- **Total**: ~8h de trabajo.

---

## 8. Cuándo implementar

Recomendado: **cuando haya assets de audio reales**. El editor sincroniza
tabs con audio específico. Por ahora, los tabs procedurales (random) son
suficientes para el mockup.

Si se decide implementar antes, el scaffold se puede crear sin audio real
(usando un audio de prueba).
