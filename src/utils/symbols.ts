import { StructuralSymbolDef, CraftType } from '../types';

export function getTechnicalSymbols(craft: CraftType): StructuralSymbolDef[] {
  // 1. GRUPO CROCHET & C2C
  if (['crochet_colorwork', 'crochet_c2c', 'crochet_filet', 'crochet_mosaic', 'crochet_tunisian'].includes(craft)) {
    return [
      { id: 'ch', name: 'Cadeneta (ch)', w: 1, h: 1, svgPath: '<ellipse cx="5" cy="5" rx="3.5" ry="1.5" stroke="currentColor" stroke-width="1.5" fill="none" transform="rotate(-45 5 5)"/>' },
      { id: 'sc', name: 'Punto Bajo (sc)', w: 1, h: 1, svgPath: '<path d="M2,5 L8,5 M5,2 L5,8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
      { id: 'hdc', name: 'Media Vareta (hdc)', w: 1, h: 1, svgPath: '<path d="M5,2 L5,8 M3,2 L7,2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
      { id: 'dc', name: 'Punto Alto (dc)', w: 1, h: 1, svgPath: '<path d="M5,2 L5,8 M3,2 L7,2 M3,5.5 L7,4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
      { id: 'slst', name: 'Punto Deslizado (sl st)', w: 1, h: 1, svgPath: '<circle cx="5" cy="5" r="2.5" fill="currentColor"/>' },
    ];
  }
  
  // 2. GRUPO DOS AGUJAS / TRICOT
  if (craft === 'knitting') {
    return [
      { id: 'k', name: 'Punto Derecho (k)', w: 1, h: 1, svgPath: '<path d="M5,2 L5,8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
      { id: 'p', name: 'Punto Revés (p)', w: 1, h: 1, svgPath: '<path d="M2,5 L8,5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
      { id: 'yo', name: 'Lazada (yo)', w: 1, h: 1, svgPath: '<circle cx="5" cy="5" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>' },
      { id: 'ssk', name: 'Disminución Izquierda (ssk)', w: 1, h: 1, svgPath: '<path d="M8,2 L2,8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
      { id: 'k2tog', name: 'Disminución Derecha (k2tog)', w: 1, h: 1, svgPath: '<path d="M2,2 L8,8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
      { id: 'm1l', name: 'Aumento Izquierda (M1L)', w: 1, h: 1, svgPath: '<path d="M5,8 L5,5 L2,2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>' },
      { id: 'm1r', name: 'Aumento Derecha (M1R)', w: 1, h: 1, svgPath: '<path d="M5,8 L5,5 L8,2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>' },
    ];
  }

  // 3. GRUPO BORDADO & PUNTO DE CRUZ
  if (['cross_stitch', 'embroidery'].includes(craft)) {
    return [
      { id: 'sym1', name: 'Cuadrado Lleno', w: 1, h: 1, svgPath: '<rect x="2" y="2" width="6" height="6" fill="currentColor"/>' },
      { id: 'sym2', name: 'Triángulo', w: 1, h: 1, svgPath: '<polygon points="5,2 8,8 2,8" fill="currentColor"/>' },
      { id: 'sym3', name: 'Estrella', w: 1, h: 1, svgPath: '<path d="M5,1 L6,4 L9,4 L6.5,6 L7.5,9 L5,7 L2.5,9 L3.5,6 L1,4 L4,4 Z" fill="currentColor"/>' },
      { id: 'sym4', name: 'Rombo', w: 1, h: 1, svgPath: '<polygon points="5,1 9,5 5,9 1,5" fill="currentColor"/>' },
      { id: 'sym5', name: 'Punto / Nudo', w: 1, h: 1, svgPath: '<circle cx="5" cy="5" r="2" fill="currentColor"/>' },
    ];
  }

  // 4. GRUPO ARTESANÍAS EN CUADRÍCULA (PIXEL ART)
  if (['diamond_painting', 'hama_beads', 'latch_hook', 'macrame', 'quilt'].includes(craft)) {
    return []; // Empty, symbols tab should ideally be hidden or just empty
  }

  // 5. MODO PERSONALIZADO
  if (craft === 'custom') {
    return [
      { id: 'k', name: 'Marca Vertical', w: 1, h: 1, svgPath: '<path d="M5,2 L5,8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
      { id: 'p', name: 'Marca Horizontal', w: 1, h: 1, svgPath: '<path d="M2,5 L8,5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
      { id: 'x', name: 'Cruz', w: 1, h: 1, svgPath: '<path d="M2,2 L8,8 M8,2 L2,8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
    ];
  }

  // Fallback
  return [];
}
