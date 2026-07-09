// ─── Craft Types (based on Stitch Fiddle) ────────────────────────────────────
export type CraftType =
  | 'crochet_colorwork'   // Crochet colorwork / graphgan
  | 'crochet_c2c'         // Corner to corner
  | 'crochet_filet'       // Filet crochet
  | 'crochet_mosaic'      // Overlay mosaic
  | 'crochet_tunisian'    // Tunisian colorwork
  | 'cross_stitch'        // Punto cruz
  | 'knitting'            // Tejido con agujas
  | 'diamond_painting'    // Diamond painting
  | 'hama_beads'          // Hama / fuse beads
  | 'macrame'             // Pixel macramé
  | 'latch_hook'          // Latch hook
  | 'quilt'               // Quilt
  | 'embroidery'          // Bordado libre
  | 'custom';             // Personalizado

export type ToolId = 'draw' | 'erase' | 'fill' | 'wand' | 'select' | 'eyedropper' | 'pan' | 'line' | 'rect' | 'ellipse' | 'stamp' | 'text';

export interface StructuralSymbolDef {
  id: string;
  name: string;
  w: number;
  h: number;
  svgPath: string; // SVG path content
}

export interface PlacedSymbol {
  id: string;
  defId: string;
  col: number;
  row: number;
}

// ─── Color + Symbol entry (left panel like Stitch Fiddle) ────────────────────
export interface ColorEntry {
  id: string;
  hex: string;
  name: string;        // e.g. "DMC 321" or "Rojo"
  symbol: string;      // single char shown on cell: 'X', '○', '▲', etc.
  symbolColor: string; // foreground color of symbol
  initials?: string;   // 1 or 2 letters identifier
  count: number;       // how many cells use this color (computed)
}

// ─── Layers ───────────────────────────────────────────────────────────────────
export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  cells: Record<string, string>;
}

// ─── Canvas / Chart settings ─────────────────────────────────────────────────
export interface CanvasConfig {
  cols: number;
  rows: number;
  cellSize: number;
  showGrid: boolean;
  gridColor: string;
  bgColor: string;
  gaugeW: number;    // gauge: stitch width ratio (default 1.0)
  gaugeH: number;    // gauge: stitch height ratio (default 1.2 for crochet)
  cellRenderMode?: 'color' | 'initials' | 'symbols' | 'color+symbols'; // Multi-mode view
  showSymbols: boolean; // Legacy/fallback
  showRowNumbers: boolean;
  showColNumbers: boolean;
  tipo_tejido: 'CIRCULAR' | 'PLANO_RS_FRENTE' | 'PLANO_WS_ESPALDA';
  direccion_filas: 'BOTTOM_TO_TOP' | 'TOP_TO_BOTTOM';
  direccion_columnas: 'RIGHT_TO_LEFT' | 'LEFT_TO_RIGHT';
  startRow: number;
  startCol: number;
  mirrorH: boolean;  // horizontal mirror drawing
  mirrorV: boolean;  // vertical mirror drawing
}

// ─── Selection ───────────────────────────────────────────────────────────────
export interface SelectionRect {
  c1: number; r1: number;
  c2: number; r2: number;
}

// ─── Project ─────────────────────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  craft: CraftType;
  createdAt: number;
  updatedAt: number;
  canvas: CanvasConfig;
  colors: ColorEntry[];           // ordered palette list (left panel)
  cells: Record<string, string>;  // Base design layer
  layers?: Layer[];               // Additional layers (guides, notes)
  placedSymbols: PlacedSymbol[];  // Multi-cell structural symbols
  texts?: { id: string, text: string, col: number, row: number, color: string }[];
  vectorGuides?: { id: string, path: string, color: string, strokeWidth: number }[];
  notes?: string;                 // Manual instructions or notes
  dirty: boolean;
  filePath?: string;
}

// ─── Viewport ────────────────────────────────────────────────────────────────
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}
