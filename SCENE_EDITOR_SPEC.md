# SCENE EDITOR — Especificación técnica

> Editor visual de escenas para el motor ACAY. No se implementa ahora —
> este documento captura las especificaciones para no perder las ideas.

---

## 1. Propósito

El editor permite al diseñador:
- **Posicionar assets** visualmente sobre un canvas (drag & drop).
- **Escalar y rotar** assets con handles visuales.
- **Asignar módulos** (comportamientos) a cada elemento desde una paleta.
- **Linkear condiciones** entre elementos (ej: "si flag X → mostrar Y").
- **Configurar exits, triggers, diálogos** sin tocar código.
- **Exportar un JSON** que el juego consume como datos de escena.

Filosofía: **piezas de Lego**. Cada elemento visual representa un módulo de
código abstracto. El diseñador arma la escena visualmente. El editor
serializa a JSON. El juego lo consume. Cero código nuevo por escena.

---

## 2. Arquitectura

### Ubicación
```
src/
  scene-editor/                   ← solo compila si ENABLE_EDITOR=true
    SceneEditorApp.tsx            ← host del editor
    SceneCanvas.ts                ← canvas de edición (drag & drop)
    SceneExporter.ts              ← serializa a JSON
    SceneImporter.ts              ← carga JSON existente
    components/
      AssetPalette.tsx            ← paleta de assets disponibles
      PropertyPanel.tsx           ← propiedades del elemento seleccionado
      ModulePanel.tsx             ← paleta de módulos (comportamientos)
      ConditionEditor.tsx         ← editor de condiciones visuales
      Toolbar.tsx                 ← abrir/guardar/guardar como/nueva escena
  app/
    scene-editor/
      page.tsx                    ← ruta /scene-editor (gateada por ENABLE_EDITOR)
```

### Gateo
```ts
if (process.env.ENABLE_EDITOR !== 'true') return <div>404</div>
```

### Motor reutilizado
- **Renderer** del motor — para dibujar la escena en el canvas del editor.
- **AssetLoader** — para previsualizar assets reales en el editor.
- **VIRTUAL_WIDTH/HEIGHT** — resolución del canvas (1280×720).
- No se usa ScreenManager, GameEngine, InputManager ni FadeSystem.

---

## 3. UI — Editor visual

### Layout
```
┌────────────┬──────────────────────────────┬────────────┐
│  Paleta    │                              │ Propiedades│
│  Assets    │       Canvas de escena       │  x: 640    │
│  ───────   │       (1280×720 virtual)     │  y: 430    │
│  acay.back │                              │  scale: 1.0│
│  rocks     │   [asset]   [asset]   [→]   │            │
│  gaucho    │                              │  Módulos:  │
│  kettle    │                              │  ☑ pickup  │
│  ...       │                              │  ☑ useItem │
│            │                              │  ☐ exit    │
│  Módulos   │                              │            │
│  ───────   │                              │ Conditions:│
│  character │                              │  flag: ... │
│  pickup    │                              │  notFlag:..│
│  useItem   │                              │            │
│  exit      │                              │  Diálogo:  │
│  trigger   │                              │  [editar]  │
│  condition │                              │            │
├────────────┴──────────────────────────────┴────────────┤
│ [Nueva] [Abrir] [Guardar] [Guardar como]  Escena: ___  │
└────────────────────────────────────────────────────────┘
```

### Canvas de edición
- Canvas 2D a resolución virtual 1280×720 (escalado con letterbox).
- Muestra el fondo de la escena (asset del background).
- Los elementos se dibujan sobre el fondo.
- **Drag & drop**: arrastrar un asset de la paleta al canvas.
- **Selección**: click en un elemento → selected (highlight + handles).
- **Mover**: arrastrar el elemento seleccionado.
- **Escalar**: arrastrar los handles de las esquinas.
- **Eliminar**: tecla Delete con un elemento seleccionado.

### Paleta de assets
- Lista de todos los assets del `ASSET_INDEX` (con preview thumbnail).
- Drag & drop al canvas.
- Filtro por categoría (acay.*, scene.*, narrative.*, prop.*, etc.).

### Paleta de módulos (comportamientos)
Cada módulo es una "pieza de Lego" que se asigna a un elemento:

| Módulo | Parámetros | Código que consume |
|---|---|---|
| `character` | dialogue[], altAsset | interactElement → diálogo |
| `pickup` | itemId, label, icon, desc, pickupText | interactElement → pickup |
| `useItem` | useItem, useItemText, useItemFlag, hideFlag | interactElement → use-item |
| `exit` | conditions[], exitTargetScene | interactElement → exit |
| `trigger` | condition, delay, dialogue, owner | evaluateTriggers |
| `blocked` | blocked, blockedText | interactElement → blocked |
| `appearsAfterFlag` | appearsAfterFlag | render + hover |
| `hideFlag` | hideFlag | render + hover |
| `walkToX` | walkToX | startWalkTo |

El diseñador tilda los módulos que aplica al elemento. Los parámetros
se editan en el PropertyPanel.

### Condition Editor (linkeo visual)
- Las condiciones se editan visualmente: el diseñador selecciona un
  elemento, va a "Conditions", y agrega pares flag/notFlag.
- Las condiciones se pueden "linkear" a otros elementos: ej, seleccionar
  el elemento "rocks", agregar condición `flag: rocksPushed`, y linkearlo
  al elemento "unstable_rock" que `appearsAfterFlag: rocksPushed`.
- Visualmente: una línea conectora entre elementos que comparten un flag.

---

## 4. Formato de export (JSON)

```json
{
  "sceneId": "river_shore",
  "background": "scene.river_shore",
  "acayEnterPos": { "x": 500, "y": 630 },
  "elements": [
    {
      "id": "acay",
      "asset": "acay.unconscious",
      "x": 500, "y": 630, "scale": 1.0,
      "hitW": 140, "hitH": 80,
      "label": "Acay",
      "isCharacter": true,
      "altAsset": { "flag": "gauchoAwake", "asset": "prop.gaucho_awake" }
    },
    {
      "id": "rocks",
      "asset": "scene.rocks_in_river",
      "x": 640, "y": 430, "scale": 1.0,
      "hitW": 180, "hitH": 100,
      "walkToX": 580,
      "useItem": "vara",
      "useItemText": "Lo logré...",
      "useItemFlag": "rocksPushed",
      "hideFlag": "rocksPushed"
    },
    {
      "id": "unstable_rock",
      "asset": "scene.unstable_rock",
      "x": 640, "y": 450,
      "appearsAfterFlag": "rocksPushed",
      "hideFlag": "bridgeBuilt",
      "useItem": "wood",
      "useItemText": "Ahora.",
      "useItemFlag": "bridgeBuilt"
    }
  ],
  "exits": [
    {
      "id": "left_exit",
      "x": 60, "y": 500, "hitW": 120, "hitH": 400,
      "walkToX": 120,
      "conditions": [...]
    }
  ],
  "triggers": [
    {
      "id": "pacha_greeting",
      "condition": { "type": "onFlag", "flag": "acayAwakened" },
      "delaySec": 1.5,
      "dialogue": [...]
    }
  ]
}
```

### Consumo por el juego
El juego carga el JSON en `buildSceneElements()`:
```ts
import riverShore from '@/game-next/data/scenes/river_shore.json'
// buildSceneElements usa el JSON en vez del array hardcoded
```

---

## 5. Operaciones de archivo

- **Nueva escena**: canvas vacío, seleccionar background.
- **Abrir**: cargar un `.scene.json` existente.
- **Guardar**: sobrescribe el archivo actual.
- **Guardar como**: nuevo nombre → crea archivo en `scenes/`.
- **Exportar JSON**: descarga el JSON (browser download).

### Config de rutas
```
// src/scene-editor/sceneEditorConfig.ts
export const SCENE_EDITOR_CONFIG = {
  scenesOutputDir: 'src/game-next/data/scenes/',
  backgroundsPreview: true,
}
```

---

## 6. Interacción

| Acción | Input |
|---|---|
| Seleccionar elemento | Click izquierdo |
| Mover elemento | Drag (con elemento seleccionado) |
| Escalar elemento | Drag handles de esquina |
| Eliminar elemento | Tecla Delete |
| Duplicar elemento | Ctrl+D |
| Zoom canvas | Rueda del mouse |
| Pan canvas | Space + drag (o middle mouse) |
| Agregar asset | Drag desde paleta al canvas |
| Asignar módulo | Tildar en PropertyPanel |
| Editar condición | Click en ConditionEditor |

---

## 7. Estimación

- **Scaffold** (ruta, canvas, paleta, property panel): ~4h.
- **Drag & drop + selección + handles de escala**: ~3h.
- **Módulos + condition editor**: ~4h.
- **Export/import JSON**: ~2h.
- **Pulido + testing**: ~3h.
- **Total**: ~16h de trabajo.

---

## 8. Cuándo implementar

Recomendado: cuando el juego tenga **3+ escenas con elementos complejos**
que justifiquen la inversión. Actualmente `scene.ts` es legible y manejable
a mano. El editor brilla cuando hay muchas escenas con condiciones
intrincadas.

**Dependencia:** el motor ya es data-driven (`scene.ts` es datos). El
editor es una capa de UI sobre los datos existentes. No requiere cambios
al motor.
