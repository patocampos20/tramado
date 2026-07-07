import React from 'react';

export const HelpDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dlg dlg-lg" onClick={e => e.stopPropagation()}>
        <div className="dlg-header">
          <h2>Manual de Usuario y Acerca de Tramado</h2>
          <button className="dlg-close" onClick={onClose}>✕</button>
        </div>
        <div className="dlg-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, color: 'var(--accent)', fontSize: 20 }}>Tramado — Pattern Studio</h3>
            <p style={{ margin: '5px 0', fontSize: 12, color: 'var(--text-3)' }}>Versión 1.3.2 | Año de Desarrollo: 2026</p>
            <p style={{ margin: '5px 0', fontSize: 13, fontWeight: 'bold' }}>Idea General: Carolina Campos | Desarrollador: Patricio Campos</p>
          </div>

          <div style={{ background: 'var(--surface-2)', padding: 15, borderRadius: 8, marginBottom: 20, fontSize: 13, lineHeight: 1.6, color: 'var(--text)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent)' }}>Nuestra Historia y Propósito</h4>
            <p style={{ margin: '0 0 10px 0' }}>
              Tramado nació de una necesidad real y profunda en el mundo de las manualidades. La idea original de <b>Carolina Campos</b> surgió al notar la falta de herramientas digitales profesionales, accesibles y, sobre todo, <b>en español</b> para la comunidad hispanohablante de tejedoras y artesanas. Gran parte del software existente en el mercado estaba en inglés, era complejo o no se adaptaba a las lógicas reales de quienes tejen día a día con sus manos.
            </p>
            <p style={{ margin: 0 }}>
              Desarrollado íntegramente por <b>Patricio Campos</b>, el fin de esta aplicación es democratizar el patronaje textil. Está pensado para artesanas, diseñadoras de moda, tejedoras de crochet, dos agujas, creadoras de punto de cruz y pixel art. Nuestro objetivo es que la tecnología sea una aliada creativa y matemática, permitiéndote diseñar prendas complejas, calcular materiales exactos y exportar diagramas profesionales sin barreras idiomáticas.
            </p>
          </div>
          
          <h3 style={{ marginTop: 0, color: 'var(--accent)', fontSize: 15 }}>🛠 Herramientas y Funcionamiento</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 20, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            <li><b>Lápiz (D):</b> Pinta cuadros individuales o arrastra para dibujar líneas continuas. Mantiene el color seleccionado en tu paleta.</li>
            <li><b>Goma (E):</b> Borra puntos (vuelve transparente la celda). También puedes borrar rápidamente haciendo clic derecho.</li>
            <li><b>Relleno (F):</b> Rellena un área completa que esté delimitada por el mismo color.</li>
            <li><b>Selección (S):</b> Selecciona un área. Puedes copiarla, cortarla, pegarla, borrarla o aplicarle "Espejo" Horizontal o Vertical desde la barra superior.</li>
            <li><b>Mover (H o Alt+Drag):</b> Arrastra el lienzo para navegar por patrones grandes.</li>
            <li><b>Varita Mágica (W):</b> Sustituye todos los puntos de un color por otro color en el lienzo de forma instantánea.</li>
            <li><b>Línea / Contorno (L):</b> No rellena celdas; traza bordes vectoriales negros y finos (escalonados) que se ajustan perfectamente a la grilla para marcar sisas, escotes o divisiones de tejido.</li>
            <li><b>Ver Contorno:</b> Interruptor en la barra izquierda para ocultar o revelar las líneas vectoriales trazadas con la herramienta Línea.</li>
            <li><b>Cuentagotas (Click Rueda Mouse):</b> Copia el color de un punto ya dibujado en el lienzo.</li>
            <li><b>Deshacer / Rehacer:</b> Control de historial para evitar errores.</li>
          </ul>

          <h3 style={{ color: 'var(--accent)', fontSize: 15 }}>📐 Coordenadas, Ejes y Espejos</h3>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.6 }}>
            Tramado cuenta con un sistema avanzado de reglas para que nunca te pierdas:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 20, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            <li><b>Dirección Dinámica:</b> En ⚙️ Ajustes puedes decidir si tejes en "Circular", "Ida y Vuelta empezando por Frente" o "empezando por Revés". El sistema de reglas reubicará los números y flechas (Derecha/Izquierda) indicando el sentido exacto en el que debes leer el patrón.</li>
            <li><b>Alineación Matemática:</b> Si haces mucho zoom, las reglas se adaptan perfectamente al centro de cada celda; si alejas la vista, omiten números intermedios para mantener la pantalla limpia y legible.</li>
            <li><b>Centrado Automático:</b> El diseño siempre flotará en el medio de la pantalla sin importar su tamaño, evitando esconderse en las esquinas.</li>
          </ul>

          <h3 style={{ color: 'var(--accent)', fontSize: 15 }}>🧵 Tipos de Labor y Generador de Prendas</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 20, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            <li><b>Proporción Visual (Gauge):</b> Al crear el proyecto, el tamaño de las celdas cambia (ej. punto de cruz = cuadrado; crochet = más alto; palillos = más ancho). Así, lo que ves en pantalla no quedará distorsionado al tejerlo.</li>
            <li><b>Generador Paramétrico:</b> En la pantalla inicial, introduce tus medidas (ancho de pecho, sisas, cuello) y tu muestra de tensión. Tramado calculará automáticamente cuántos puntos y filas necesitas y dibujará la curva del suéter por ti, lista para rellenar con color o diseño Jacquard.</li>
          </ul>

          <h3 style={{ color: 'var(--accent)', fontSize: 15 }}>📝 Módulo de Costos e Instrucciones</h3>
          <ul style={{ paddingLeft: 20, marginBottom: 20, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            <li><b>Calculadora de Materiales:</b> Registra en la pestaña de hilos el gramaje, metraje y precio de tus ovillos. Tramado escaneará todo tu diseño y te dirá exactamente cuántos ovillos necesitas comprar y su costo, sumando un margen de seguridad.</li>
            <li><b>Seguidor de Tejido (Tracker):</b> Ubicado en la esquina inferior izquierda. Una barra sombreada cubre la pantalla fila por fila a medida que tejes.</li>
            <li><b>Instrucciones Escritas:</b> Convierte el dibujo en una guía textual ("Fila 1: 5 rojos, 3 blancos, 2 rojos").</li>
            <li><b>Paleta Técnica:</b> Símbolos esenciales (Derecho, Revés, Aumento, Disminución y Lazada) que se aplican encima de los colores para indicar texturas.</li>
          </ul>

        </div>
        <div className="dlg-footer">
          <button className="btn btn-accent" onClick={onClose}>¡Entendido, a diseñar!</button>
        </div>
      </div>
    </div>
  );
};
