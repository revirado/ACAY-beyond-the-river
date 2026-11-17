
# DOCUMENTO DEL JUEGO

## Cozy Trading Village — Proof of Concept

### 1. Concepto

Juego 2D de estilo cozy centrado en la exploración de una red de pequeños pueblos conectados entre sí y en una economía de comercio simple.

El jugador controla a un joven comerciante que viaja entre pueblos acompañado por su burro. Su objetivo inicial es conseguir recursos, comerciar, producir bienes y mejorar progresivamente su situación económica.

El éxito del personaje tiene una consecuencia directa sobre su pueblo natal: cuanto mejor le vaya como comerciante, mayor será la prosperidad del pueblo.

La progresión del pueblo será representada visualmente mediante su skyline: cantidad, tamaño, estado y estilo de sus construcciones.

La propuesta completa está pensada para ser escalable, pero el PoC implementará solamente un recorrido económico predeterminado y una pequeña porción del mundo.

----------

## 2. Fantasía principal del jugador

La fantasía que debe transmitir el juego es:

> "Soy un pequeño comerciante que empieza prácticamente sin nada, recorre pueblos, consigue recursos, hace trueques y pequeños negocios, y poco a poco logra prosperar junto con su pueblo."

El jugador debe sentir progresión aunque las acciones sean sencillas.

El foco no está en el combate ni en la dificultad, sino en:

-   explorar;
    
-   descubrir oportunidades;
    
-   comerciar;
    
-   conseguir recursos;
    
-   producir;
    
-   mejorar;
    
-   ver crecer su pueblo.
    

----------

## 3. Estilo visual

El juego será 2D con estética cozy.

El mundo estará compuesto por:

-   fondos/terrenos ilustrados;
    
-   assets transparentes superpuestos;
    
-   personajes;
    
-   construcciones;
    
-   objetos;
    
-   elementos decorativos;
    
-   UI ilustrada.
    

La perspectiva visual del terreno no será generada matemáticamente por el motor.

El arte será creado y compuesto manualmente por el diseñador.

### Convención de movimiento

La navegación del personaje utilizará una convención inspirada en perspectiva caballera.

Esto afecta exclusivamente al movimiento del jugador.

No es un filtro, transformación ni proyección aplicada al arte.

----------

## 4. Representación visual del jugador

Durante el gameplay el jugador estará representado por un sprite simplificado del personaje montado en su burro.

En una capa visual superior se mostrará una representación más detallada del mismo personaje.

Esta representación detallada podrá aparecer permanentemente como parte de la UI.

Durante una interacción aparecerá además el personaje u objeto con el que se está interactuando.

El personaje del jugador ocupará siempre el lado izquierdo de la escena de interacción.

El personaje u objeto interactuado ocupará el lado derecho.

----------

## 5. Estructura visual de la pantalla

La composición general será:

```
┌──────────────────────────────────────────────┐
│                                              │
│                GAME WORLD                    │
│                                              │
│          pueblo / terreno / objetos         │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│        PERSONAJE DETALLADO / OVERLAY         │
│                                              │
├──────────────────────────────────────────────┤
│        SKYLINE        MONEDAS / HUD          │
└──────────────────────────────────────────────┘
```

La interfaz no deberá presentarse inicialmente como un HUD técnico lleno de números.

La intención es representar el estado del juego de forma visual.

----------

## 6. Economía

El jugador comenzará sin recursos comerciales relevantes.

Inicialmente podrá:

-   recolectar;
    
-   transportar;
    
-   vender;
    
-   intercambiar.
    

A partir de allí podrá obtener recursos que le permitan acceder a nuevas actividades.

Ejemplo conceptual:

```
Recolectar
    ↓
Vender / intercambiar
    ↓
Conseguir recursos
    ↓
Construir horno
    ↓
Producir pan
    ↓
Vender pan
    ↓
Conseguir más recursos/dinero
```

El PoC utilizará solamente un camino económico predeterminado.

La estructura de datos deberá permitir posteriormente múltiples caminos.

----------

## 7. Prosperidad del pueblo

El estado del pueblo estará asociado a la progresión económica del jugador.

La prosperidad se representará visualmente mediante un skyline.

Estados conceptuales:

```
Estado 0
   🛖

Estado 1
   🛖 🛖

Estado 2
   🛖 🏠 🛖

Estado 3
   🏠 🏠 🏡

Estado 4
   🏠 🏡 🏪 🏠
```

La representación exacta queda abierta al diseño artístico.

El PoC solamente necesita demostrar que una acción del jugador puede modificar el estado del pueblo y que ese cambio se refleja visualmente.

----------

## 8. Mundo

El juego completo estará compuesto por una red de pueblos.

Cada pueblo podrá tener:

-   habitantes;
    
-   recursos;
    
-   comercios;
    
-   construcciones;
    
-   oportunidades;
    
-   reputación;
    
-   economía propia.
    

El PoC no necesita implementar toda esta red.

Se utilizará un único recorrido controlado que permita demostrar el concepto.

----------

## 9. Pantallas

El juego deberá contemplar desde el principio una arquitectura que permita separar:

-   pantalla de título;
    
-   secuencia inicial;
    
-   gameplay;
    
-   interacción;
    
-   menú;
    
-   reinicio.
    

La secuencia inicial se reproducirá solamente una vez por partida/progresión.

----------

## 10. Secuencia inicial

La secuencia inicial será deliberadamente simple.

Elementos:

-   fondo estático;
    
-   personaje montado en burro;
    
-   animación de dos frames;
    
-   movimiento horizontal;
    
-   puerta/entrada del pueblo;
    
-   título del videojuego;
    
-   efecto de fade.
    

El personaje se desplazará desde un extremo de la pantalla hasta la puerta.

Al alcanzar la puerta se realizará la transición al juego.

----------

## 11. Audio

Cada pantalla podrá tener una pista de música asociada.

La música:

-   podrá reproducirse en loop;
    
-   tendrá control de volumen;
    
-   podrá cambiar al cambiar de pantalla;
    
-   será gestionada por un sistema de audio independiente.
    

----------

## 12. Alcance del PoC

El PoC debe demostrar:

1.  Inicio del juego.
    
2.  Secuencia inicial.
    
3.  Entrada al pueblo.
    
4.  Movimiento del jugador.
    
5.  Colisiones.
    
6.  Objetos no interactuables.
    
7.  Objetos interactuables.
    
8.  Prompt de interacción.
    
9.  Entrada a una escena de interacción.
    
10.  Personaje detallado del jugador.
    
11.  Personaje/objeto detallado del interlocutor.
    
12.  Una operación comercial.
    
13.  Modificación de recursos/dinero.
    
14.  Modificación visual del skyline.
    
15.  Música por pantalla.
    
16.  Sistema de fade reutilizable.
    
17.  Reinicio.
    
18.  Arquitectura preparada para ampliar contenido.
    

----------

## 13. Principio fundamental del PoC

El objetivo no es construir el juego completo.

El objetivo es construir una **vertical slice pequeña pero estructuralmente escalable** que demuestre que el concepto funciona.

El contenido será pequeño y parcialmente hardcodeado.

La arquitectura, en cambio, deberá estar preparada para que posteriormente el contenido pueda crecer mediante datos.