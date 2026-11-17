# ANEXO DE CORRECCIÓN Y GUION TÉCNICO (DEMO): ACAY

Este documento actualiza las definiciones visuales y mecánicas del Brief Conceptual original, detallando el flujo narrativo de la Demo junto con su traducción técnica para desarrollo.

---

## 1. Actualizaciones de Diseño y Perspectiva (Fe de Erratas)

* **Visualización del Protagonista (Acay):** A diferencia del planteo inicial exclusivamente POV/espaldas, **Acay sí se ve en pantalla tanto de frente como de espaldas**, desplazándose hacia los puntos de interés. Sin embargo, **su rostro nunca es visible**: su sombrero de ala ancha siempre cubre sus facciones mediante sombras o ángulo de cámara.
* **Despliegue Progresivo de UI:** La interfaz de usuario (caja de diálogo, inventario, objetivos) comienza **completamente oculta** y se desbloquea de forma diegética a medida que el jugador interactúa con el entorno y descubre mecánicas.
* **Mecánica de Interacción Espacial:** El flujo estándar de exploración sigue el patrón: `Clic en Hotspot -> Movimiento/Pathfinding de Acay hacia el objeto -> Ejecución de Animación/Diálogo`.
* **Sistema de Combate Rítmico por Turnos:** Los enfrentamientos musicales evolucionan hacia un sistema híbrido de **ataque y defensa por turnos**:
  * **Turno del Jugador (Ataque/Sintonía):** Acay toca notas en la guitarra siguiendo el ritmo.
  * **Turno del Enemigo (Esquive):** El antagonista lanza patrones de notas (*tabs*) en perspectiva que Acay debe esquivar lateralmente.

---

## 2. Guion y Desglose Técnico de la Demo

### Escena 01: La Orilla del Río Calchaquí (Despertar)

#### 1.1. Inicio de Escena y Despertar
* **Guion:** Pantalla en negro que se aclara mostrando la orilla del río Calchaquí. No hay interfaz visible. Acay yace inconsciente en el suelo. Al hacer clic sobre él, se incorpora, se sacude el agua del poncho como quien escurre una toalla y habla por primera vez:
  * **Acay:** *"Debo cruzar el río, esta vez no puedo fallar."*
* **Traducción Técnica:**
  * `OnSceneStart`: Ejecutar *Fade-In* de cámara. Mantener `UI_Canvas` en estado `active = false` (opacidad 0).
  * `Actor_Acay`: Inicia en estado `Idle_Unconscious` (loop de 2 frames respirando en el suelo) con un *Collider2D* interactivo.
  * `OnClick(Actor_Acay)`: Deshabilitar collider inicial -> Disparar animación `Acay_StandUp_DryPoncho` -> Disparar evento `Show_DialogueBox` (Fade-In de la caja de texto inferior izquierda) -> Reproducir efecto *typewriter* con la línea de diálogo.

#### 1.2. Primer Objetivo y la Voz Desconocida
* **Guion:** Al terminar de hablar, Acay gira dando la espalda a la cámara para observar la corriente. Se activa el primer objetivo en pantalla y resuena una voz incorpórea:
  * **Voz desconocida:** *"Encuentra una forma de cruzar el río de forma segura."*
* **Traducción Técnica:**
  * `OnDialogueEnd(Line_01)`: Cambiar estado de animación de Acay a `Idle_Back` (mirando al río).
  * Disparar evento `Unlock_ObjectiveTracker` (aparece HUD de objetivo: *"Cruzar el río"*).
  * Invocar `Dialogue_System` con estilo de fuente/color diferenciado (sin retrato) para *Voz desconocida*.

#### 1.3. Inspección de las Rocas y Límites de Navegación
* **Guion:** En el escenario destacan unas rocas atrapadas en el cauce y dos salidas laterales (izquierda y derecha).
  * **Clic en las rocas:** Acay camina hasta el borde y dice: *"Si pudiera tirar esta roca quizás podría cruzar."* (Actualiza objetivo: *"Encuentra una forma de empujar las rocas"*).
  * **Clic hacia la izquierda (Regresar):** Acay se detiene y responde según el número de intentos:
    * *Intento 1:* *"No puedo volver a casa, no aún, necesito cruzar el río, ahí seguro encontraré algo."*
    * *Intento 2:* *"Sé que es peligroso pero debo intentarlo, no puedo volver con las manos vacías."*
    * *Intentos 3+:* *"Aún no."*
  * **Clic hacia la derecha:** Acay camina hacia el borde derecho y dispara la transición de pantalla hacia el sector del campamento.
* **Traducción Técnica:**
  * `Hotspot_Rocks`: Al recibir clic, ejecuta `MoveTo(Target_Rocks)` -> `OnArrival`: dispara diálogo y llama a `UpdateObjective("Encuentra una forma de empujar las rocas")`.
  * `Trigger_LeftExit`: Implementa un contador entero `leftClickCount`. Usa un `Switch/Case` para servir los strings según el valor (`1`, `2`, `>=3`), bloqueando el cambio de escena.
  * `Trigger_RightExit`: Ejecuta `MoveTo(Edge_Right)` -> `Fade-Out` -> Carga `Escena_02_Campamento`.

---

### Escena 02: El Campamento del Gaucho

#### 2.1. Exploración Inicial y el Río
* **Guion:** Nueva sección de la ribera. Se observa un gaucho dormido bajo la sombra de un cardón, maderas viejas junto a una fogata apagada y una pava.
  * **Clic en el río (1ra vez):** *"El río Calchaquí, proveedor de vida, protector de las montañas, desciende de los cielos hacia nosotros... o al menos eso dice mi seño."*
  * **Clic en el río (2da+ vez):** *"Aún no puedo cruzarlo."*
* **Traducción Técnica:**
  * `Hotspot_River_02`: Variable booleana `hasInspectedRiver`. Si es `false`, muestra el diálogo largo y la cambia a `true`; si es `true`, muestra el diálogo corto.
  * Los objetos `Hotspot_Kettle` (pava), `Hotspot_Wood` (madera) y `Hotspot_Ashes` (cenizas) tienen sus interacciones bloqueadas (`isInteractable = false`) hasta completar el diálogo con el gaucho.

#### 2.2. Diálogo con el Gaucho
* **Guion:** Al hacer clic sobre el gaucho dormido, este despierta y mantiene un intercambio con Acay (cuyas respuestas inferimos por las reacciones del hombre):
  * **Gaucho:** *"¿Cómo pibe? ¿Cruzar el río?"*
  * **Gaucho:** *"Hmmm..."*
  * **Gaucho:** *"¿Y no puedes esperar a mañana a que baje?"*
  * **Gaucho:** *"¡¿QUÉ LA PACHA DIJO QUÉ?!"*
* **Traducción Técnica:**
  * `OnClick(NPC_Gaucho)`: Cambia animación de `Gaucho_Sleep` a `Gaucho_Awake_Talk`.
  * Secuencia de diálogos con pausas dramáticas (`Wait(0.8s)` en el *"Hmmm..."*).
  * `OnDialogueEnd(Gaucho_Intro)`: Setea `isInteractable = true` en `Hotspot_Kettle`, `Hotspot_Wood` y `Hotspot_Ashes`.

#### 2.3. Recolección de Ítems y Desbloqueo del Inventario
* **Guion:**
  * **Clic en la pava:**
    * **Gaucho:** *"Sí, sí, llevala pibe."*
    * **Acay:** *"Capaz sea útil, y si no al menos podré tomar unos mates."*
    * *(Se abre la UI del inventario por primera vez mostrando: la Pava recién obtenida, una Guitarra, un Poncho y unos Lentes. Hacer clic sobre la Guitarra dentro del inventario reproduce una nota musical).*
  * **Clic en las maderas:**
    * **Gaucho:** *"No usé toda, puedes llevártela tranqui, mañana pensaba irme para el pueblo del norte, seguro agarro más en el camino."*
    * **Acay:** *"Son pesadas, pero cuando las meto en mi mochila de repente ya no pesan nada... Gracias Pacha."*
* **Traducción Técnica:**
  * `OnClick(Hotspot_Kettle)`: Destruye/oculta el sprite del escenario -> Añade `Item_Pava` a `Inventory_Array` -> Dispara evento `Unlock_InventoryUI` (Fade-In de la caja inferior derecha).
  * `Inventory_System`: Precargado con `Item_Guitarra`, `Item_Poncho` y `Item_Lentes`. `Item_Guitarra` tiene un evento `OnInventoryClick` vinculado a `AudioSource.PlayOneShot(SFX_GuitarNote_Random)`.
  * `OnClick(Hotspot_Wood)`: Oculta sprite -> Añade `Item_Maderas` al inventario tras finalizar la secuencia de diálogos.

---

### Escena 03: El Duelo Rítmico con el Duende

#### 3.1. La Revelación y el Tutorial Musical
* **Guion:** Al intentar salir de la pantalla (clic a izquierda o derecha), el gaucho detiene a Acay:
  * **Gaucho:** *"Espera pibe, antes de que te vayas, ¿cuál es tu nombre?"*
  * **Acay:** *(Caja de diálogo en blanco / balbuceo).*
  * **Gaucho:** *"¿Acay eh? Qué nombre más piola. Bueno Acay, antes que abandone este pueblo a su suerte, dejame darte una bendición, y toquemos algo juntos."*
  * *(Se despliega la interfaz rítmica en modo práctica/tutorial donde Acay y el gaucho tocan en sintonía).*
* **Traducción Técnica:**
  * `Trigger_SceneExit_02`: Intercepta el clic de salida si `questGauchoCompleted == false`.
  * En la línea de Acay, el `Dialogue_System` renderiza el cuadro vacío (o con caracteres vacíos/sonido de balbuceo neutro) antes de dar paso al gaucho.
  * `TransitionTo_RhythmMode(Mode = Tutorial_Coop)`: Cambia la cámara/escena al modo de pista rítmica sin daño, sincronizando las pistas de audio de ambos personajes.

#### 3.2. La Transformación y Batalla por Turnos
* **Guion:** Al terminar la pieza, el gaucho advierte a Acay y revela su verdadera naturaleza:
  * **Gaucho:** *"Bien pibe, pero adentro verás cosas asombrosas y tenebrosas. Hay muchos como yo, y algunos no serán tan piola."*
  * *(El gaucho se transforma en un Duende del folclore norteño).*
  * **Duende:** *"Ahora sí pibe, pruébame de qué estás hecho."*
  * *(Inicia el combate rítmico por turnos: en el turno de Acay se tocan notas para atacar/armonizar; en el turno del Duende se esquivan sus proyectiles/tabs lateralmente).*
* **Traducción Técnica:**
  * Disparar animación de transformación `VFX_Smoke_Transform` -> Reemplazar `Sprite_Gaucho` por `Sprite_Duende` en el tercer plano de batalla.
  * `RhythmBattle_Manager`: Inicia máquina de estados por turnos (`State.PlayerTurn_PlayNotes` <-> `State.EnemyTurn_DodgeTabs`).
  * **Turno Jugador:** Input de teclado/clic sincronizado con *hit-windows* en el track.
  * **Turno Enemigo:** Acay (de espaldas en primer plano) se desplaza en el eje X (`MoveLeft` / `MoveRight`) para evitar colisiones con los *tabs* enemigos que bajan por la pista en perspectiva.

#### 3.3. Recompensa
* **Guion:** Al derrotar al Duende, este recupera su compostura y entrega una herramienta clave:
  * **Duende:** *"Bien ahí pibe, capaz te ayude antes de irme mañana, si es que logras cruzar el río. Ten."*
  * *(Entrega la **Vara de Hierro**).*
* **Traducción Técnica:**
  * `OnBattleWin`: Añade `Item_VaraHierro` al inventario, marca `questGauchoCompleted = true` y rehabilita los triggers de salida hacia la `Escena_01`.

---

### Escena 04: El Cruce y el Punto de No Retorno (Cierre de Demo)

#### 4.1. Uso de Herramientas (Palanca y Puente)
* **Guion:** De vuelta en la orilla inicial (Escena 01):
  1. **Usar Vara de Hierro en las rocas:** Acay hace palanca y derriba la roca principal hacia el cauce.
     * **Acay:** *"Lo logré, pero es muy inestable, no puedo pisar sobre ella sin caer, pero al menos el río bajó un poco."*
  2. **Usar Placas de Madera sobre la roca/riachuelo:** Acay tiende las tablas sobre el paso estrecho.
     * **Acay:** *"Ahora."*
* **Traducción Técnica:**
  * Sistema de `Drag & Drop` desde el inventario hacia el escenario (`OnItemDrop(Item_VaraHierro, Hotspot_Rocks)`):
    * Consume o desactiva el uso de la vara -> Ejecuta animación `Rock_Fall_Animation` -> Cambia el estado del río a `River_LowTide` -> Habilita el nuevo hotspot `Hotspot_UnstableRock`.
  * `OnItemDrop(Item_Maderas, Hotspot_UnstableRock)`:
    * Consume `Item_Maderas` del inventario -> Instancia `Sprite_WoodBridge` sobre el riachuelo -> Habilita `Trigger_CrossRiver`.

#### 4.2. El Cruce y Fin de la Demo
* **Guion:** Al hacer clic en el puente improvisado, Acay cruza hacia la orilla opuesta. Inmediatamente después de pisar tierra firme, la roca cede ante la fuerza del agua y arrastra las maderas consigo, dejándolo atrapado del otro lado.
  * **Acay:** *"Bueno, no hay vuelta atrás."*
  * **Fin de la Demo.**
* **Traducción Técnica:**
  * `OnClick(Trigger_CrossRiver)`: Bloquea el control del jugador (`Input_Lock = true`) -> Ejecuta secuencia cinemática (`Acay_CrossBridge` -> `VFX_BridgeCollapse` + `SFX_WaterCrash`).
  * Muestra última línea de diálogo -> `Fade-Out` a negro -> Despliega pantalla de título/agradecimiento (*"Acay: Más allá del río - Fin de la Demo"*).