# Manual y Documentación Técnica: Tramado (Pattern Studio)
**Versión:** 1.3.0  
**Idea General:** Carolina Campos  
**Desarrollador:** Patricio Campos  
**Año de Desarrollo:** 2026  

---

## 1. Nuestra Historia y Propósito

**Tramado** nació de una necesidad real y profunda en el mundo de las manualidades. La idea original de **Carolina Campos** surgió al notar la tremenda falta de herramientas digitales profesionales, accesibles y, sobre todo, **en español** para la inmensa comunidad hispanohablante de tejedoras y artesanas. Históricamente, gran parte del software de calidad existente en el mercado estaba únicamente en inglés, era excesivamente complejo (pensado más para ingenieros que para artesanos) o simplemente no se adaptaba a las lógicas reales y matemáticas de quienes tejen día a día con sus manos.

Desarrollado íntegramente por **Patricio Campos**, el fin de esta aplicación es democratizar el patronaje textil y llevarlo al siglo XXI sin perder la esencia artesanal. Está pensado para artesanas, diseñadoras de moda, tejedoras de crochet, dos agujas, creadoras de punto de cruz y artistas del pixel art. Nuestro objetivo es que la tecnología sea una aliada creativa y matemática, permitiéndote diseñar prendas complejas, calcular materiales exactos y exportar diagramas profesionales sin barreras idiomáticas.

Tramado no es un simple programa de dibujo; es un **CAD Textil** (Diseño Asistido por Computadora) que entiende de puntos, vueltas, proporciones (Gauge) y texturas.

---

## 2. Herramientas y Funcionamiento (El Lienzo)

La barra de herramientas izquierda contiene todo lo necesario para plasmar tu diseño en la cuadrícula. Cada herramienta ha sido optimizada para un flujo de trabajo ágil:

* **Lápiz (D):** Pinta cuadros individuales o arrastra para dibujar líneas continuas. Mantiene el color actualmente seleccionado en tu paleta de Hilos.
* **Goma (E):** Borra puntos (vuelve transparente la celda). También puedes borrar rápidamente haciendo clic derecho con el mouse mientras usas el lápiz.
* **Relleno (F):** La clásica herramienta de bote de pintura. Rellena un área completa que esté delimitada por el mismo color.
* **Línea / Contorno Vectorial (L):** *Herramienta de patronaje avanzado.* Al activarse, ya no rellena celdas con color. En su lugar, traza líneas vectoriales negras finas y precisas (escalonadas) que se ajustan magnéticamente a la grilla (líneas divisorias). Es perfecta para marcar sisas, escotes, disminuciones exactas o separar piezas del tejido dejando el fondo transparente.
* **Ver Contorno (Interruptor):** Un botón debajo de las herramientas de espejo que te permite ocultar o mostrar instantáneamente todas las líneas vectoriales que hayas trazado.
* **Selección (S):** Selecciona un área rectangular. Con el área seleccionada puedes:
  * Copiar (`Ctrl+C`), Cortar (`Ctrl+X`) y Pegar (`Ctrl+V`).
  * Borrar el contenido (`Supr`).
  * **Espejo H / V:** Desde la barra flotante superior, puedes voltear horizontal o verticalmente exclusivamente el área que tienes seleccionada, ideal para hacer mangas o patrones simétricos.
* **Mover (H o Alt+Click Izquierdo):** Arrastra el lienzo completo para navegar por patrones grandes sin pintar por accidente.
* **Varita Mágica / Reemplazo Global (W):** Haz clic en un color del lienzo y automáticamente todos los puntos de ese color en todo el diseño serán reemplazados por tu color activo actual.
* **Cuentagotas (Click Rueda Mouse):** Copia el color de un punto ya dibujado en el lienzo directamente a tu pincel activo.
* **Sellar Símbolo (T):** Exclusivo para la pestaña de **Técnicos**. Permite estampar trenzas, calados o bodoques estructurales sobre las celdas ya pintadas.

---

## 3. Coordenadas, Ejes y Dirección del Tejido

En la sección de **⚙️ Ajustes**, puedes adaptar el lienzo a tu estilo exacto de tejido:

* **Dirección Dinámica de Lectura:** Puedes elegir si tu tejido es `CIRCULAR`, `Ida y Vuelta empezando por el Frente`, o `Ida y Vuelta empezando por la Espalda`. También puedes elegir si tejes de abajo hacia arriba o viceversa. El sistema de reglas reubicará matemáticamente los números y las flechas de lectura (Derecha/Izquierda) indicando el sentido exacto en el que debes leer cada fila.
* **Alineación Matemática de Reglas:** Si haces mucho zoom, las reglas perimetrales numéricas se adaptan milimétricamente al centro exacto de cada celda; si alejas la vista, omiten números intermedios (mostrando de a 5 o 10) para mantener la pantalla limpia, delgada y estilizada sin saturarte visualmente.
* **Franja de Contraste:** Una sólida franja gris en la base asegura que los números inferiores sean legibles sin importar si estás usando colores oscuros o negros en el diseño inferior.
* **Centrado Automático:** Para tamaños pequeños (ej. un Granny Square de 10x10), el diseño siempre flotará anclado en el centro absoluto de la pantalla, evitando quedarse escondido en la esquina superior izquierda.

---

## 4. Tipos de Labor y Generador Paramétrico de Prendas

* **Proporción Visual (Gauge):** Un punto casi nunca es un cuadrado perfecto. Al crear un proyecto, seleccionas el tipo de labor (Punto de Cruz, Crochet, Palillos). El tamaño de las celdas cambia automáticamente (ej. Palillos = más ancho; Crochet = más alto). Así, lo que ves en pantalla no quedará aplastado o estirado al tejerlo en la realidad.
* **Generador de Prendas (Módulo Especial):** En la pantalla inicial, introduce tus medidas reales en centímetros (ancho de pecho, sisas, cuello) y tu muestra de tensión (puntos y filas por 10cm). Tramado calculará automáticamente cuántos puntos y filas totales necesitas y dibujará la curva matemática de tu suéter por ti mediante contornos vectoriales precisos, listo para rellenar con color o con un diseño Jacquard sin que tengas que calcular sisas manualmente.

---

## 5. Módulo de Costos e Instrucciones

* **Calculadora de Materiales (🛒):** Registra en la pestaña de hilos de tu paleta izquierda el gramaje (g), metraje (m) y precio ($) de tus ovillos. Haz clic en el botón del carrito arriba a la derecha. Tramado escaneará todo tu diseño y te dirá exactamente la cantidad de ovillos que necesitas comprar y el costo total de inversión, sumando inteligentemente un 10% de margen de seguridad.
* **Seguidor de Tejido (Tracker):** Empotrado convenientemente en el panel izquierdo inferior, una barra controla un sombreador horizontal que cubre tu pantalla fila por fila, marcando con precisión milimétrica la vuelta que estás tejiendo para que nunca pierdas el hilo en proyectos de intarsia complejos.
* **Instrucciones Escritas (Generador Automático):** Convierte todo el dibujo en texto paso a paso ("Fila 1: 5 rojos, 3 blancos, 2 rojos"). Escanea respetando siempre el sentido de las flechas configuradas en tus Ajustes.
* **Exportar a PDF / PNG:** Genera una imagen de altísima resolución que dibuja no solo la cuadrícula de tu patrón, sino una leyenda profesional limpia en la parte inferior detallando hilos, símbolos técnicos y recuento total para entregar un patrón listo para la venta comercial.

---

## 6. Verificación de Estado: ¿Qué falta por pulir en Tramado? (Roadmap)

A pesar de ser una herramienta altamente funcional en su versión 1.0.0, a nivel de producto profesional existen todavía algunas características "básicas" que requieren pulirse en futuras actualizaciones para competir con el software industrial:

1. **Gestión de la Línea Vectorial (Falta Borrador Vectorial):**
   * *Estado actual:* Puedes dibujar líneas de contorno escalonadas muy bien, pero la única forma de borrarlas es usando "Deshacer" (`Ctrl+Z`).
   * *Mejora necesaria:* Se requiere un sistema de "Selección de Vectores" o una "Goma Vectorial" para poder borrar líneas de contorno antiguas sin deshacer el progreso reciente.
2. **Exportación Fragmentada a PDF (Para patrones gigantes):**
   * *Estado actual:* La aplicación exporta el patrón completo en una sola imagen gigante (PNG/PDF).
   * *Mejora necesaria:* Si un usuario diseña una manta de 300x300 puntos, al imprimirlo en una impresora de casa la imagen se verá microscópica. Falta implementar un algoritmo que "corte" automáticamente el lienzo en hojas tamaño A4/Carta con guías de ensamblaje.
3. **Manejo de Imágenes Importadas (Recorte vs Reducción):**
   * *Estado actual:* Al reducir el tamaño del lienzo general, a veces las imágenes que importaste se cortan por los bordes en lugar de achicarse inteligentemente.
   * *Mejora necesaria:* Implementar un sistema de anclaje o re-cuantización dinámica para que, si el lienzo se encoje, la imagen insertada recalcule sus píxeles para adaptarse sin mutilarse.
4. **Instrucciones Escritas más Humanas:**
   * *Estado actual:* Las instrucciones dicen literalmente lo que hay en pantalla (ej. "3 blancos, 4 negros").
   * *Mejora necesaria:* Un analizador léxico que detecte cuando el borde del tejido va en diagonal para que escriba automáticamente: *"Disminuir 1 punto a cada lado, tejer 10 blancos"*.
5. **Espejo Dinámico "En Vivo" (Kaleidoscope):**
   * *Estado actual:* El espejo solo funciona seleccionando un área y volteándola después de haberla dibujado.
   * *Mejora necesaria:* Poder activar un eje simétrico en el medio de la pantalla de modo que, si dibujas un brazo izquierdo, el brazo derecho se pinte solo y en tiempo real.

---

*Tramado — Hecho por y para creadores.*

---

## 7. Registro de Actualizaciones (Novedades en v1.3.0)

La versión 1.3.0 trae avances sustanciales en el empaquetado del software, la interoperabilidad con Windows y la estabilización de los motores de renderizado y exportación:

* **Instalador Profesional (Inno Setup / NSIS):** Tramado ahora se distribuye con un instalador `Setup.exe` limpio para Windows.
* **Asociación Nativa de Archivos:** Se ha integrado a nivel de sistema operativo la extensión `.tramado`. Ahora, hacer doble clic en cualquier archivo `.tramado` desde el Explorador de Archivos abrirá la aplicación directamente y cargará el proyecto (incluso si la app ya estaba ejecutándose en segundo plano).
* **Motor de Impresión Multi-Capa (Bugfix Crítico):** Se reparó el bug en el que exportar o imprimir un proyecto que usaba capas secundarias resultaba en un PDF en blanco. Ahora, el `PrintView` y el `exportProjectToPng` integran un algoritmo de aplanado de capas que fusiona dinámicamente todo el proyecto visible antes de extraer la leyenda de colores y el gráfico.
* **Vista Previa de Impresión Mejorada:** La vista de impresión ahora se muestra como una pantalla completa dentro de la interfaz, esperando inteligentemente a que el proyecto esté 100% renderizado antes de ofrecer el botón "Imprimir", impidiendo pantallas blancas accidentales por latencias en el almacenamiento.
* **Herramienta de Texto Estampado (Pausada):** La herramienta de texto ha sido deshabilitada temporalmente en esta versión debido a conflictos identificados con las resoluciones de escala de inyección en la cuadrícula de Immer/Zustand. Su reconstrucción queda agendada para parches futuros.
