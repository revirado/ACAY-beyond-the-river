
# BRIEF DE DESARROLLO TÉCNICO

## Cozy Trading Village — Proof of Concept

### 1. Stack

Tecnología principal:

```
Next.js
React
TypeScript
HTML5 Canvas 2D
```

Target inicial:

```
Desktop
```

El diseño deberá evitar decisiones que hagan imposible una futura adaptación a mobile, pero no se optimizará la UI para mobile durante el PoC.

----------

# 2. Principio arquitectónico

Separar estrictamente:

```
GAME DATA
WORLD LAYOUT
GAME LOGIC
RENDERING
UI
AUDIO
SCREEN MANAGEMENT
```

El arte no deberá contener lógica de gameplay.

La lógica no deberá depender de la composición visual del asset.

----------

# 3. Renderer

El gameplay utilizará un Canvas 2D.

El renderer recibe:

```
asset
position
scale
layer
```

y dibuja la imagen.

No deberá aplicar una transformación de perspectiva caballera a los assets.

El arte es considerado una imagen 2D transparente ya preparada por el diseñador.

----------

# 4. Resolución virtual

El juego utilizará una resolución virtual fija.

Valor inicial:

```
1280 × 720
```

Aspect ratio:

```
16:9
```

El Canvas se escalará proporcionalmente para adaptarse al espacio disponible.

No se deberá deformar el contenido para llenar la ventana.

Conceptualmente:

```
WINDOW
   ↓
FIT 16:9
   ↓
1280 × 720 virtual
   ↓
GAME
```

Las coordenadas de gameplay se expresarán en este espacio virtual.

----------

# 5. Layout de assets

Los assets serán posicionados manualmente.

El código no deberá intentar decidir automáticamente dónde colocar:

-   casas;
    
-   árboles;
    
-   piedras;
    
-   NPC;
    
-   mercados;
    
-   construcciones;
    
-   decoración.
    

El layout del mundo será una descripción de posiciones.

Ejemplo conceptual:

```
{
  "id": "market_01",
  "asset": "market_01.png",
  "x": 720,
  "y": 340,
  "scale": 1
}
```

El diseñador podrá modificar:

```
x
y
scale
layer
```

sin modificar la lógica del objeto.

----------

# 6. Assets

Los assets visuales serán imágenes con transparencia.

Convención inicial:

```
assets/
├── characters/
├── world/
├── ui/
└── audio/
```

Ejemplos:

```
characters/
    player_map.png
    player_detail.png
    donkey_map.png
    donkey_detail.png
    merchant_01.png

world/
    village_01.png
    market_01.png
    house_01.png
    rock_01.png
    tree_01.png
    gate_01.png

ui/
    coin.png
    skyline_01.png
    skyline_02.png
    skyline_03.png

audio/
    music_title.mp3
    music_intro.mp3
    music_village_01.mp3
    music_menu.mp3
```

Los nombres son contratos de referencia y pueden modificarse posteriormente.

----------

# 7. Separación Visual / Lógica

Cada objeto deberá poder definirse conceptualmente mediante:

```
OBJECT
│
├── visual
│   ├── asset
│   ├── x
│   ├── y
│   ├── scale
│   └── layer
│
└── logic
    ├── collider
    └── interaction
```

Ejemplo:

```
{
  "id": "market_01",

  "visual": {
    "asset": "market_01.png",
    "x": 720,
    "y": 340,
    "scale": 1,
    "layer": 2
  },

  "logic": {
    "collision": {
      "type": "rectangle",
      "width": 100,
      "height": 70
    },

    "interaction": {
      "type": "market"
    }
  }
}
```

----------

# 8. Sistema de movimiento

El movimiento deberá utilizar un sistema vectorial.

No se deberán hardcodear cuatro comportamientos independientes.

Configuración:

```
{
  "movementAngle": 45
}
```

Los vectores se calculan automáticamente.

Conceptualmente:

```
right = (1, 0)
left = (-1, 0)

down = (
  cos(angle),
  sin(angle)
)

up = (
  -cos(angle),
  -sin(angle)
)
```

Los vectores deberán estar normalizados.

El código de movimiento solamente necesita conocer:

```
input
direction vector
speed
deltaTime
```

La modificación del ángulo no deberá requerir modificar el código del sistema de movimiento.

----------

# 9. Input Manager

El input deberá estar separado del Player.

Conceptualmente:

```
Keyboard
   ↓
InputManager
   ↓
PlayerController
```

Esto permitirá cambiar posteriormente el método de entrada sin reescribir la lógica del jugador.

Controles iniciales:

```
ArrowUp
ArrowDown
ArrowLeft
ArrowRight

E
Space

Escape
```

----------

# 10. Player Controller

El Player Controller deberá encargarse únicamente de:

-   recibir input;
    
-   calcular dirección;
    
-   calcular movimiento;
    
-   solicitar movimiento al mundo;
    
-   actualizar posición;
    
-   disparar interacción.
    

No deberá contener:

-   lógica de economía;
    
-   lógica de comercio;
    
-   lógica de UI;
    
-   lógica de audio;
    
-   lógica de escenas.
    

----------

# 11. Collision System

La colisión será independiente del asset visual.

El sistema deberá poder responder:

```
canMove(player, proposedPosition)
```

y:

```
getCollision(player, proposedPosition)
```

Si la posición propuesta genera una colisión:

```
movement rejected
```

Si no:

```
movement accepted
```

----------

# 12. Interaction System

Los objetos podrán declarar:

```
interaction: null
```

o:

```
interaction: {
    type: "merchant"
}
```

Al detectar una interacción válida:

```
Collision
    ↓
Interactable
    ↓
Interaction Prompt
```

El usuario confirma mediante:

```
E / SPACE
```

Entonces:

```
GameScreen
    ↓
InteractionScreen
```

----------

# 13. Screen Manager

Las pantallas deberán estar desacopladas.

Pantallas iniciales:

```
TitleScreen
IntroScreen
GameScreen
InteractionScreen
MenuScreen
RestartScreen
```

El Screen Manager será responsable de:

-   pantalla actual;
    
-   transición;
    
-   montaje;
    
-   desmontaje;
    
-   actualización;
    
-   render;
    
-   input específico;
    
-   audio asociado.
    

Las pantallas no deberán controlar directamente la lógica interna de otras pantallas.

----------

# 14. Game Loop

El gameplay deberá utilizar un loop independiente de React rendering.

Conceptualmente:

```
requestAnimationFrame
        ↓
input
        ↓
update
        ↓
collision
        ↓
game state
        ↓
render
```

React deberá utilizarse principalmente para la aplicación/UI y no como mecanismo principal para actualizar cada frame del gameplay.

----------

# 15. Estado del juego

El estado persistente del gameplay deberá estar separado del estado visual.

Conceptualmente:

```
{
  "player": {
    "position": {},
    "coins": 0,
    "inventory": []
  },

  "village": {
    "prosperity": 0
  },

  "progression": {
    "introCompleted": false,
    "unlockedRecipes": []
  }
}
```

El PoC puede utilizar un único estado en memoria.

La estructura deberá permitir implementar posteriormente guardado/carga.

----------

# 16. Datos escalables

La progresión no deberá estar completamente codificada dentro de los componentes.

Los contenidos deberán poder migrar posteriormente a archivos de datos.

Ejemplos:

```
data/
├── items.json
├── recipes.json
├── villages.json
├── trades.json
├── progression.json
└── interactions.json
```

El PoC puede contener un único camino.

La estructura debe permitir:

```
Camino A
Camino B
Camino C
Camino D
...
```

sin rediseñar el motor.

----------

# 17. Sistema de interacción

El sistema debe ser genérico.

No crear:

```
if merchant...
if oven...
if farmer...
```

dentro del Player.

En cambio:

```
interaction.type
       ↓
Interaction Handler
       ↓
MerchantInteraction
OvenInteraction
NPCInteraction
MarketInteraction
```

Esto permitirá agregar nuevos tipos de interacción.

----------

# 18. Interaction Screen

La pantalla de interacción tendrá dos slots principales:

```
PLAYER_SLOT
TARGET_SLOT
```

El jugador siempre estará en el lado izquierdo.

El objetivo siempre estará en el lado derecho.

El sistema deberá aceptar:

```
player detail asset
target detail asset
interaction data
```

Esto permitirá reutilizar la pantalla para:

-   comercio;
    
-   conversación;
    
-   crafting;
    
-   compra;
    
-   venta;
    
-   interacción con edificios.
    

----------

# 19. Audio Manager

Sistema independiente de las pantallas.

Funciones mínimas:

```
play()
stop()
pause()
resume()
setVolume()
loop()
```

Cada pantalla podrá declarar su música:

```
TitleScreen
→ music_title.mp3

IntroScreen
→ music_intro.mp3

GameScreen
→ music_village_01.mp3

MenuScreen
→ music_menu.mp3
```

La música deberá reproducirse en loop cuando corresponda.

----------

# 20. Sistema de efectos

Implementar inicialmente un sistema genérico de Fade.

Configuración:

```
{
  "fadeIn": 1000,
  "hold": 2000,
  "fadeOut": 1000
}
```

El sistema deberá poder aplicarse a cualquier elemento visual compatible.

No implementar el fade específicamente dentro del código del título.

Debe existir como efecto reutilizable.

----------

# 21. Intro

La Intro será una implementación concreta de los sistemas generales.

Componentes:

```
IntroScreen
├── Background
├── Title
├── Player
├── Door
├── AnimationController
├── FadeEffect
└── Audio
```

El jugador se moverá horizontalmente.

La animación será:

```
player_frame_01
player_frame_02
```

en loop.

La posición de inicio, posición de la puerta, escala y velocidad deberán poder modificarse mediante configuración.

----------

# 22. HUD / UI

La UI no deberá presentar inicialmente las variables como debug.

En particular:

### Monedas

Representación visual mediante monedas/elementos gráficos.

### Prosperidad

Representación visual mediante skyline.

La lógica puede mantener valores numéricos internamente:

```
coins = 14
prosperity = 2
```

pero la UI decide cómo representarlos.

----------

# 23. Separación entre lógica y representación

Principio obligatorio:

```
GAME STATE
     ↓
UI / RENDERER
```

No:

```
UI
 ↓
modifica directamente
 ↓
game logic
```

Por ejemplo:

```
EconomySystem
    ↓
coins = 15
    ↓
HUD
    ↓
render coins
```

El HUD no deberá ser la fuente de verdad de la economía.

----------

# 24. Prioridades del desarrollo

Orden recomendado:

### Fase 1 — Foundation

-   Next.js;
    
-   Canvas;
    
-   resolución virtual;
    
-   game loop;
    
-   Screen Manager;
    
-   Input Manager.
    

### Fase 2 — Movimiento

-   Player;
    
-   vectores;
    
-   `movementAngle`;
    
-   velocidad;
    
-   colisiones.
    

### Fase 3 — Mundo

-   background;
    
-   assets;
    
-   layout manual;
    
-   colliders;
    
-   objetos interactuables.
    

### Fase 4 — Interacción

-   prompt;
    
-   Interaction Screen;
    
-   player detail;
    
-   target detail.
    

### Fase 5 — PoC económico

-   recursos;
    
-   monedas;
    
-   trueque;
    
-   comercio;
    
-   progresión.
    

### Fase 6 — Pueblo

-   prosperidad;
    
-   skyline;
    
-   actualización visual.
    

### Fase 7 — Presentation

-   Intro;
    
-   Fade;
    
-   audio;
    
-   menú;
    
-   reinicio.
    

----------

# 25. Fuera de alcance del PoC

No implementar inicialmente:

-   mobile UI completa;
    
-   mouse-to-move;
    
-   pathfinding;
    
-   generación procedural del mundo;
    
-   múltiples pueblos completamente funcionales;
    
-   sistema complejo de reputación;
    
-   economía emergente;
    
-   multiplayer;
    
-   guardado en servidor;
    
-   editor visual de mapas;
    
-   collider automático desde PNG;
    
-   perspectiva/renderizado isométrico;
    
-   animaciones complejas;
    
-   sistema completo de crafting;
    
-   árbol de decisiones completo.
    

----------

# 26. Criterio de éxito técnico

El PoC se considera exitoso cuando sea posible ejecutar:

```
START
 ↓
TITLE
 ↓
INTRO
 ↓
PLAYER ENTRA AL PUEBLO
 ↓
MOVIMIENTO
 ↓
COLISIÓN
 ↓
INTERACCIÓN
 ↓
COMERCIO
 ↓
CAMBIO DE RECURSOS
 ↓
CAMBIO DE PROSPERIDAD
 ↓
CAMBIO DEL SKYLINE
 ↓
CONTINUAR EXPLORANDO
```

y cuando un diseñador pueda modificar:

```
movementAngle
asset
x
y
scale
layer
collider
```

sin tener que modificar la lógica central del juego.

----------

# 27. Regla arquitectónica final

El desarrollo debe privilegiar la siguiente relación:

```
                 ┌─────────────┐
                 │ GAME LOGIC  │
                 └──────┬──────┘
                        │
                  GAME STATE
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
      RENDERER         UI           AUDIO
          │
          ↓
       ASSETS
```

Los assets son reemplazables.

El layout es editable.

Los parámetros de presentación son configurables.

La lógica de juego permanece independiente.

La PoC debe demostrar el juego mediante un único camino de contenido, pero su arquitectura debe permitir ampliar posteriormente ese camino mediante datos.