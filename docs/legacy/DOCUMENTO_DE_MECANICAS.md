# DOCUMENTO DE MECÁNICAS

## Cozy Trading Village — Proof of Concept

### 1. Core Loop

El loop principal del juego será:

```
EXPLORAR
   ↓
ENCONTRAR RECURSOS / PERSONAS / COMERCIOS
   ↓
INTERACTUAR
   ↓
COMERCIAR / TRUEQUE / PRODUCIR
   ↓
OBTENER RECURSOS O DINERO
   ↓
MEJORAR CAPACIDAD DE COMERCIO
   ↓
MEJORAR EL PUEBLO
   ↓
EXPLORAR NUEVAMENTE
```

En el PoC este loop estará reducido a un único camino.

----------

## 2. Movimiento

El jugador será controlado mediante teclado.

### Controles

```
↑  Movimiento
↓  Movimiento
←  Movimiento
→  Movimiento

E / SPACE  Interactuar

ESC         Abrir menú
```

No se implementará mouse-to-move en el PoC.

----------

## 3. Convención de movimiento caballera

El mundo visual es 2D plano.

La perspectiva caballera es únicamente una convención para transformar las entradas del teclado en vectores de movimiento.

No afecta a:

-   imágenes;
    
-   fondos;
    
-   sprites;
    
-   escala;
    
-   composición artística;
    
-   renderizado.
    

### Variable configurable

El sistema tendrá una única variable:

```
movementAngle
```

Por defecto:

```
movementAngle = 45°
```

A partir de este valor se calcularán automáticamente los vectores.

Conceptualmente:

```
RIGHT = (1, 0)
LEFT  = (-1, 0)

DOWN  = ( cos(angle),  sin(angle))
UP    = (-cos(angle), -sin(angle))
```

Los vectores deberán normalizarse para garantizar que todas las direcciones tengan la misma velocidad.

Cambiar:

```
movementAngle = 30°
```

o:

```
movementAngle = 60°
```

debe modificar el comportamiento sin modificar la lógica del movimiento.

----------

## 4. Colisión

Los objetos del mundo podrán tener un collider lógico independiente de su imagen.

El PNG no define automáticamente la colisión.

Tipos iniciales:

```
rectangle
circle
```

Para el PoC será suficiente utilizar principalmente rectángulos.

Cuando el jugador intenta desplazarse hacia un objeto con colisión:

```
¿hay colisión?
     │
     ├── NO → movimiento permitido
     │
     └── SÍ → movimiento bloqueado
```

----------

## 5. Objetos no interactuables

Ejemplos:

-   piedras;
    
-   árboles;
    
-   paredes;
    
-   construcciones;
    
-   obstáculos.
    

Cuando el jugador colisiona:

```
PLAYER → OBJECT

Movimiento bloqueado.
No aparece ningún menú.
```

----------

## 6. Objetos interactuables

Ejemplos:

-   comerciantes;
    
-   mercados;
    
-   talleres;
    
-   hornos;
    
-   NPC;
    
-   lugares especiales.
    

Cuando el jugador colisiona:

```
PLAYER → OBJECT

       ↓

¿Interactuar?

[ E ] Interactuar
[ ESC ] Cancelar
```

La interacción solamente comienza cuando el jugador confirma.

----------

## 7. Escena de interacción

Al confirmar una interacción, el gameplay pasa temporalmente a una escena independiente.

Composición:

```
┌──────────────────────────────────────────────┐
│                                              │
│  PLAYER                    NPC / OBJECT      │
│                                              │
│   personaje                  comerciante     │
│   detallado                 detallado        │
│                                              │
│                                              │
│          diálogo / opciones / comercio      │
│                                              │
└──────────────────────────────────────────────┘
```

Regla visual:

```
Jugador → izquierda
Interlocutor → derecha
```

La representación utilizada en esta escena será más detallada que el sprite utilizado durante el desplazamiento por el pueblo.

----------

## 8. Comercio

El PoC implementará una interacción comercial sencilla.

Ejemplo:

```
Jugador
   ↓
recolecta recurso
   ↓
viaja al pueblo vecino
   ↓
encuentra comerciante
   ↓
vende / intercambia
   ↓
obtiene recurso o monedas
```

La interfaz puede utilizar una representación visual de las monedas en lugar de mostrar inicialmente un contador numérico prominente.

----------

## 9. Trueque

El trueque será una mecánica posible desde el comienzo.

Ejemplo:

```
Jugador entrega:
3 trigo

Recibe:
1 recurso necesario
```

Las cantidades y relaciones del PoC podrán estar hardcodeadas.

Sin embargo, deberán estar representadas mediante datos para permitir posteriormente múltiples combinaciones.

----------

## 10. Producción

El PoC podrá incluir una cadena de producción sencilla.

Ejemplo:

```
RECURSO
   ↓
RECURSOS NECESARIOS
   ↓
HORNO
   ↓
PAN
   ↓
VENTA
```

El objetivo es demostrar la progresión y no construir todavía un sistema completo de crafting.

----------

## 11. Progresión

Las decisiones y acciones del jugador modificarán variables de estado.

Variables conceptuales:

```
coins
inventory
reputation
villageProsperity
unlockedBuildings
unlockedRecipes
```

El PoC utilizará únicamente las variables necesarias para demostrar el camino seleccionado.

----------

## 12. Skyline

El skyline representa visualmente el estado de prosperidad del pueblo.

El jugador no necesita ver necesariamente:

```
Prosperity = 43
```

En cambio, observará una modificación visual.

Por ejemplo:

```
PROSPERIDAD 0
🛖

PROSPERIDAD 1
🛖 🛖

PROSPERIDAD 2
🛖 🏠 🛖

PROSPERIDAD 3
🏠 🏠 🏡
```

El sistema deberá permitir asociar diferentes estados de progreso con diferentes assets de skyline.

----------

## 13. Fade

El efecto Fade será una mecánica visual reutilizable.

Parámetros:

```
fadeInDuration
holdDuration
fadeOutDuration
```

Ejemplo:

```
fadeIn = 1000 ms
hold = 2000 ms
fadeOut = 1000 ms
```

El mismo efecto podrá utilizarse para:

-   título;
    
-   aparición de personajes;
    
-   desaparición de personajes;
    
-   transición entre escenas;
    
-   aparición de elementos;
    
-   otros efectos futuros.
    

----------

## 14. Secuencia inicial

La intro contiene:

```
BACKGROUND
+
TITLE
+
PLAYER
+
DOOR
```

El jugador:

1.  aparece fuera de pantalla;
    
2.  comienza una animación de dos frames;
    
3.  se desplaza horizontalmente;
    
4.  llega hasta la puerta;
    
5.  se ejecuta la transición;
    
6.  entra al gameplay.
    

La animación del personaje es independiente del movimiento.

```
Frame 1
   ↓
Frame 2
   ↓
Frame 1
   ↓
Frame 2
```

----------

## 15. Estados de pantalla

La experiencia deberá poder pasar entre estados claramente definidos:

```
TITLE
  ↓
INTRO
  ↓
GAMEPLAY
  ↓
INTERACTION
  ↓
GAMEPLAY
```

Además:

```
GAMEPLAY
   ↓
MENU
   ↓
GAMEPLAY
```

y:

```
MENU
   ↓
RESTART
   ↓
INTRO / GAME
```

La intro deberá poder marcarse como completada para evitar reproducirla nuevamente cuando corresponda.

----------

## 16. Regla de diseño de las mecánicas

El PoC debe privilegiar:

**claridad > cantidad de contenido**

No se implementarán sistemas complejos solamente para demostrar que son posibles.

Cada mecánica deberá responder a la pregunta:

> "¿Esto ayuda a demostrar el concepto central del juego?"

Si no lo hace, queda fuera del PoC.